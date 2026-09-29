import { getRagConfig } from "@/lib/rag/config";
import { MISSING_KEY } from "@/lib/rag/messages";
import { IngestError, parseDocument } from "@/lib/rag/parse";
import { readStore, toSummary, withStoreLock, writeStore } from "@/lib/rag/store";
import type { DocumentSummary } from "@/lib/rag/types";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_DOCUMENTS = 20;

export function safeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop()?.trim() || "document.txt";
  const cleaned = base.replace(/[\u0000-\u001f]/g, "").slice(0, 180);
  return cleaned || "document.txt";
}

export async function listDocuments(sessionId: string): Promise<{
  configured: boolean;
  setupMessage: string | null;
  documents: DocumentSummary[];
}> {
  const store = await readStore(sessionId);
  const configured = getRagConfig().configured;
  return {
    configured,
    setupMessage: configured ? null : MISSING_KEY,
    documents: store.documents.map(toSummary),
  };
}

export async function addDocument(
  sessionId: string,
  file: { filename: string; mime: string; bytes: Buffer },
): Promise<DocumentSummary> {
  if (file.bytes.length > MAX_BYTES) {
    throw new IngestError("Файл больше 8 МБ. Загрузите документ короче.");
  }

  const filename = safeFilename(file.filename);
  const parsed = await parseDocument(filename, file.mime, file.bytes);

  return withStoreLock(sessionId, async () => {
    const store = await readStore(sessionId);
    if (store.documents.length >= MAX_DOCUMENTS) {
      throw new IngestError("Можно хранить не больше 20 документов. Удалите лишние.");
    }

    const id = crypto.randomUUID();
    const document = {
      id,
      title: parsed.title,
      filename,
      documentNumber: parsed.documentNumber,
      documentDate: parsed.documentDate,
      uploadedAt: new Date().toISOString(),
      chunks: parsed.chunks.map((chunk, index) => ({
        id: `${id.slice(0, 8)}-${index + 1}`,
        text: chunk.text,
        clause: chunk.clause,
        section: chunk.section,
        page: chunk.page,
        embedding: null,
      })),
    };

    store.documents.unshift(document);
    await writeStore(sessionId, store);
    return toSummary(document);
  });
}

export async function removeDocument(sessionId: string, documentId: string): Promise<boolean> {
  return withStoreLock(sessionId, async () => {
    const store = await readStore(sessionId);
    const documents = store.documents.filter((document) => document.id !== documentId);
    if (documents.length === store.documents.length) return false;
    await writeStore(sessionId, { documents });
    return true;
  });
}
