import type { ClaudeChatAttachment, ClaudeImageMediaType } from "@/data/claude-models";

export const MAX_CLAUDE_ATTACHMENTS = 5;
export const MAX_CLAUDE_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_CLAUDE_ATTACHMENT_NAME = 120;

const ALLOWED_MEDIA_TYPES = new Set<ClaudeImageMediaType>([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export function isAllowedClaudeMediaType(value: string): value is ClaudeImageMediaType {
  return ALLOWED_MEDIA_TYPES.has(value as ClaudeImageMediaType);
}

export function parseClaudeDataUrl(
  dataUrl: string,
): { mediaType: ClaudeImageMediaType; base64: string } | { error: string } {
  const match = /^data:(image\/(?:jpeg|png|gif|webp));base64,([a-zA-Z0-9+/=]+)$/.exec(dataUrl);

  if (!match) {
    return { error: "Некорректный формат изображения." };
  }

  const mediaType = match[1] as ClaudeImageMediaType;
  const base64 = match[2];

  if (!isAllowedClaudeMediaType(mediaType)) {
    return { error: "Поддерживаются JPEG, PNG, GIF и WebP." };
  }

  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes > MAX_CLAUDE_ATTACHMENT_BYTES) {
    return { error: `Изображение больше ${Math.round(MAX_CLAUDE_ATTACHMENT_BYTES / (1024 * 1024))} МБ.` };
  }

  return { mediaType, base64 };
}

export function validateClaudeAttachments(
  attachments: unknown,
): ClaudeChatAttachment[] | { error: string } {
  if (attachments === undefined || attachments === null) {
    return [];
  }

  if (!Array.isArray(attachments)) {
    return { error: "Некорректные вложения." };
  }

  if (attachments.length > MAX_CLAUDE_ATTACHMENTS) {
    return { error: `Максимум ${MAX_CLAUDE_ATTACHMENTS} изображений за сообщение.` };
  }

  const parsed: ClaudeChatAttachment[] = [];

  for (const item of attachments) {
    if (!item || typeof item !== "object") {
      return { error: "Некорректные вложения." };
    }

    const { id, name, mediaType, dataUrl } = item as Record<string, unknown>;

    if (typeof id !== "string" || !id.trim()) {
      return { error: "Некорректные вложения." };
    }

    if (typeof name !== "string" || !name.trim() || name.length > MAX_CLAUDE_ATTACHMENT_NAME) {
      return { error: "Некорректное имя файла." };
    }

    if (typeof mediaType !== "string" || !isAllowedClaudeMediaType(mediaType)) {
      return { error: "Поддерживаются только изображения JPEG, PNG, GIF и WebP." };
    }

    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
      return { error: "Некорректные данные изображения." };
    }

    const data = parseClaudeDataUrl(dataUrl);
    if ("error" in data) {
      return { error: data.error };
    }

    if (data.mediaType !== mediaType) {
      return { error: "Тип файла не совпадает с содержимым." };
    }

    parsed.push({
      id: id.trim(),
      name: name.trim(),
      mediaType,
      dataUrl,
    });
  }

  return parsed;
}

export function estimateAttachmentChars(attachmentCount: number): number {
  if (attachmentCount <= 0) return 0;
  return attachmentCount * 6000;
}

export async function readImageFileAsAttachment(file: File): Promise<ClaudeChatAttachment | string> {
  if (!isAllowedClaudeMediaType(file.type)) {
    return "Поддерживаются JPEG, PNG, GIF и WebP.";
  }

  if (file.size > MAX_CLAUDE_ATTACHMENT_BYTES) {
    return `Файл «${file.name}» больше 5 МБ.`;
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Не удалось прочитать файл."));
    reader.readAsDataURL(file);
  });

  const parsed = parseClaudeDataUrl(dataUrl);
  if ("error" in parsed) {
    return parsed.error;
  }

  return {
    id: crypto.randomUUID(),
    name: file.name.slice(0, MAX_CLAUDE_ATTACHMENT_NAME),
    mediaType: parsed.mediaType,
    dataUrl,
  };
}
