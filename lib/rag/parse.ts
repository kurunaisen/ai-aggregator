import mammoth from "mammoth";
import { extractText, extractTextItems, type StructuredTextItem } from "unpdf";
import { chunkPages, type PageText } from "@/lib/rag/chunk";
import { extractDocumentDate, extractDocumentNumber, extractTitle } from "@/lib/rag/metadata";

export class IngestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngestError";
  }
}

type MarkdownApi = {
  convertToMarkdown: (input: { buffer: Buffer }) => Promise<{ value: string }>;
};

const MAX_TEXT = 500_000;

function decodePlainText(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString("utf8");
  }

  const utf8 = buffer.toString("utf8");
  const replacements = utf8.match(/\uFFFD/g)?.length ?? 0;
  if (replacements > 0 && replacements / Math.max(utf8.length, 1) > 0.005) {
    return new TextDecoder("windows-1251").decode(buffer);
  }
  return utf8;
}

function pageFromItems(items: StructuredTextItem[]): string {
  const rows: { y: number; items: StructuredTextItem[] }[] = [];

  for (const item of items) {
    if (!item.str?.trim()) continue;
    const row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 2);
    if (row) {
      row.items.push(item);
      continue;
    }
    rows.push({ y: item.y, items: [item] });
  }

  rows.sort((a, b) => b.y - a.y);

  return rows
    .map((row) => {
      const parts = row.items.slice().sort((a, b) => a.x - b.x);
      let line = "";
      let cursor = Number.NEGATIVE_INFINITY;
      for (const part of parts) {
        const gap = part.x - cursor;
        if (line) line += gap > 14 ? "  " : " ";
        line += part.str;
        cursor = part.x + (part.width || 0);
      }
      return line.trimEnd();
    })
    .join("\n");
}

async function parsePdf(buffer: Buffer): Promise<PageText[]> {
  const bytes = new Uint8Array(buffer);
  try {
    const structured = await extractTextItems(bytes);
    const pages = structured.items.map((items, index) => ({
      page: index + 1,
      text: pageFromItems(items),
    }));
    if (pages.some((page) => page.text.trim())) return pages;
  } catch {
    // Fall back to plain text extraction below.
  }

  try {
    const extracted = await extractText(bytes, { mergePages: false });
    const texts = Array.isArray(extracted.text) ? extracted.text : [extracted.text];
    return texts.map((text, index) => ({ page: index + 1, text }));
  } catch {
    throw new IngestError("Не удалось прочитать PDF. Файл может быть повреждён или защищён паролем.");
  }
}

function unescapeMarkdown(text: string): string {
  return text.replace(/\\([\\`*_{}[\]()#+\-.!|])/g, "$1");
}

async function parseDocx(buffer: Buffer): Promise<PageText[]> {
  try {
    const markdown = await (mammoth as typeof mammoth & MarkdownApi).convertToMarkdown({ buffer });
    const text = markdown.value.trim()
      ? unescapeMarkdown(markdown.value)
      : (await mammoth.extractRawText({ buffer })).value;
    return [{ page: null, text }];
  } catch {
    throw new IngestError("Не удалось прочитать DOCX. Проверьте, что файл не повреждён.");
  }
}

export function extensionOf(filename: string, mime: string): "pdf" | "docx" | "txt" | null {
  const fromName = filename.split(".").pop()?.toLowerCase() ?? "";
  if (fromName === "pdf" || fromName === "docx" || fromName === "txt") return fromName;
  if (mime === "application/pdf") return "pdf";
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  if (mime === "text/plain") return "txt";
  return null;
}

export async function parseDocument(filename: string, mime: string, buffer: Buffer) {
  const extension = extensionOf(filename, mime);
  if (!extension) {
    throw new IngestError("Поддерживаются только файлы PDF, DOCX и TXT.");
  }
  if (buffer.length === 0) {
    throw new IngestError("Файл пустой.");
  }

  const pages =
    extension === "pdf"
      ? await parsePdf(buffer)
      : extension === "docx"
        ? await parseDocx(buffer)
        : [{ page: null, text: decodePlainText(buffer) }];

  const fullText = pages.map((page) => page.text).join("\n").trim();
  if (!fullText) {
    throw new IngestError(
      "Не удалось извлечь текст. Сканы без текстового слоя в этой версии не читаются.",
    );
  }
  if (fullText.length > MAX_TEXT) {
    throw new IngestError("Документ слишком большой для этой версии. Сократите файл.");
  }

  const chunks = chunkPages(pages).filter((chunk) => chunk.text.trim().length > 0);
  if (chunks.length === 0) {
    throw new IngestError("В файле не нашлось текста, который можно разбить на фрагменты.");
  }

  return {
    title: extractTitle(fullText, filename),
    documentNumber: extractDocumentNumber(fullText),
    documentDate: extractDocumentDate(fullText),
    chunks,
  };
}
