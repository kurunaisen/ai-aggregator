import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { DocumentSummary, StoreData, StoredDocument } from "@/lib/rag/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const locks = new Map<string, Promise<void>>();

function fileFor(sessionId: string): string {
  if (!UUID_RE.test(sessionId)) {
    throw new Error("Некорректная сессия хранилища.");
  }
  return path.join(process.cwd(), ".data", "rag", `${sessionId}.json`);
}

export async function readStore(sessionId: string): Promise<StoreData> {
  try {
    const raw = await readFile(fileFor(sessionId), "utf8");
    const parsed = JSON.parse(raw) as StoreData;
    if (!parsed || !Array.isArray(parsed.documents)) return { documents: [] };
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { documents: [] };
    throw error;
  }
}

export async function writeStore(sessionId: string, data: StoreData): Promise<void> {
  const filename = fileFor(sessionId);
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, JSON.stringify(data), "utf8");
}

export async function withStoreLock<T>(sessionId: string, fn: () => Promise<T>): Promise<T> {
  const previous = locks.get(sessionId) ?? Promise.resolve();
  let release: () => void = () => undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = previous.then(
    () => current,
    () => current,
  );
  locks.set(sessionId, tail);

  try {
    await previous;
    return await fn();
  } finally {
    release();
    if (locks.get(sessionId) === tail) locks.delete(sessionId);
  }
}

export function toSummary(document: StoredDocument): DocumentSummary {
  return {
    id: document.id,
    title: document.title,
    filename: document.filename,
    documentNumber: document.documentNumber,
    documentDate: document.documentDate,
    uploadedAt: document.uploadedAt,
    chunkCount: document.chunks.length,
  };
}
