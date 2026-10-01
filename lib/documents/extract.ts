import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

const TEXT_EXTENSIONS = new Set(["txt", "md", "csv", "json", "log"]);

export function fileExtension(filename: string): string {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

export function safeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop()?.trim() || "document";
  const cleaned = base.replace(/[^\w.\- ()а-яА-ЯёЁ]+/g, "_").slice(0, 180);
  return cleaned || "document";
}

export function isSupportedDocument(filename: string): boolean {
  const extension = fileExtension(filename);
  return TEXT_EXTENSIONS.has(extension) || extension === "pdf" || extension === "docx";
}

export function unsupportedDocumentMessage(filename: string): string {
  const extension = fileExtension(filename);
  if (extension === "doc") {
    return "Старый формат DOC не читается. Сохраните файл как DOCX и загрузите снова.";
  }
  if (extension === "xls" || extension === "xlsx") {
    return "Таблицы Excel загрузите как CSV: Файл → Сохранить как → CSV.";
  }
  return "Поддерживаются PDF, DOCX, TXT, MD, CSV и JSON.";
}

function cleanup(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodePlainText(data: Uint8Array): string {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(data);
  const broken = utf8.match(/\uFFFD/g)?.length ?? 0;
  if (broken > 4) {
    return cleanup(new TextDecoder("windows-1251").decode(data));
  }
  return cleanup(utf8.replace(/^\uFEFF/, ""));
}

export async function extractDocumentText(
  filename: string,
  data: Uint8Array,
): Promise<string> {
  const extension = fileExtension(filename);

  if (TEXT_EXTENSIONS.has(extension)) {
    return decodePlainText(data);
  }

  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(data) });
    return cleanup(result.value);
  }

  if (extension === "pdf") {
    const pdf = await getDocumentProxy(data);
    const extracted = await extractText(pdf, { mergePages: true });
    const text = Array.isArray(extracted.text) ? extracted.text.join("\n\n") : extracted.text;
    return cleanup(text ?? "");
  }

  throw new Error(unsupportedDocumentMessage(filename));
}

export function emptyDocumentMessage(filename: string): string {
  const extension = fileExtension(filename);
  if (extension === "pdf") {
    return "В PDF нет текстового слоя. Если это скан, сохраните документ как DOCX или PDF с распознанным текстом.";
  }
  return "В файле нет текста, который можно прочитать.";
}
