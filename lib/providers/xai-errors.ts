type XaiErrorPayload = {
  error?: { message?: string; code?: string; type?: string } | string;
  detail?: string;
  message?: string;
  code?: string;
};

export function extractXaiErrorBody(data: unknown, status: number, statusText: string): string {
  if (typeof data === "string" && data.trim()) {
    return data.trim().slice(0, 300);
  }

  if (typeof data === "object" && data !== null) {
    const obj = data as XaiErrorPayload;
    const parts: string[] = [];

    if (typeof obj.error === "string" && obj.error.trim()) {
      parts.push(obj.error.trim());
    } else if (typeof obj.error === "object" && obj.error !== null) {
      parts.push(
        ...[obj.error.message, obj.error.code, obj.error.type].filter(
          (value): value is string => Boolean(value),
        ),
      );
    }

    if (typeof obj.detail === "string" && obj.detail.trim()) {
      parts.push(obj.detail.trim());
    }

    if (typeof obj.message === "string" && obj.message.trim()) {
      parts.push(obj.message.trim());
    }

    if (typeof obj.code === "string" && obj.code.trim() && !parts.some((part) => part.includes(obj.code!))) {
      parts.push(obj.code.trim());
    }

    if (parts.length > 0) {
      return parts.join(" · ");
    }
  }

  const suffix = statusText ? ` ${statusText}` : "";
  return `HTTP ${status}${suffix}`;
}

const PRODUCT_PREFIX: Record<"chat" | "imagine" | "video", string> = {
  chat: "xAI",
  imagine: "Grok Imagine",
  video: "Grok Video",
};

function withApiDetail(friendly: string, raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || friendly.includes(trimmed)) return friendly;
  return `${friendly} Ответ API: ${trimmed}`;
}

function isInsufficientCreditsMessage(lower: string): boolean {
  return (
    lower.includes("insufficient") ||
    lower.includes("exhausted") ||
    lower.includes("out of credits") ||
    lower.includes("prepaid credit") ||
    lower.includes("not enough credit") ||
    lower.includes("balance") && lower.includes("low")
  );
}

export function formatXaiApiError(
  message: string,
  product: "chat" | "imagine" | "video" = "chat",
): string {
  const lower = message.toLowerCase();
  const prefix = PRODUCT_PREFIX[product];

  if (lower.includes("invalid api key") || lower.includes("incorrect api key")) {
    return withApiDetail(
      "xAI: неверный API-ключ. Создайте ключ на console.x.ai и добавьте XAI_API_KEY на Vercel.",
      message,
    );
  }

  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return withApiDetail("xAI: слишком много запросов. Подождите минуту.", message);
  }

  if (isInsufficientCreditsMessage(lower)) {
    if (product === "video") {
      return withApiDetail(
        "xAI: на балансе не хватает средств для Grok Video. " +
          "Картинки (Grok Imagine) и видео списываются с одного счёта xAI, " +
          "но видео дороже: ~$0.05/сек (~$0.40 за 8 с в 720p против ~$0.02 за картинку). " +
          "Пополните console.x.ai → Billing.",
        message,
      );
    }

    return withApiDetail(
      "xAI: недостаточно кредитов на счёте xAI. Пополните console.x.ai → Billing.",
      message,
    );
  }

  if (
    lower.includes("does not exist") ||
    lower.includes("not found") ||
    lower.includes("not available") ||
    lower.includes("access") ||
    lower.includes("permission") ||
    lower.includes("not enabled") ||
    lower.includes("unsupported")
  ) {
    if (product === "imagine") {
      return withApiDetail(
        "xAI: модель Grok Imagine недоступна для вашего API-ключа. " +
          "Проверьте доступ и биллинг в console.x.ai.",
        message,
      );
    }

    if (product === "video") {
      return withApiDetail(
        "xAI: Grok Video недоступен для этого API-ключа или модели. " +
          "Для text-to-video используйте grok-imagine-video. Проверьте console.x.ai → Billing.",
        message,
      );
    }

    return withApiDetail(
      "xAI: модель Grok недоступна для вашего API-ключа. " +
        "Проверьте доступ к grok-4.3 в console.x.ai и биллинг.",
      message,
    );
  }

  if (lower.includes("moderation") || lower.includes("content policy")) {
    return `${prefix}: запрос отклонён модерацией. Измените сообщение.`;
  }

  return `${prefix}: ${message}`;
}

export async function parseXaiJsonResponse<T extends Record<string, unknown>>(
  response: Response,
  product: "chat" | "imagine" | "video" = "chat",
): Promise<T> {
  const raw = await response.text();

  if (!raw.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(formatXaiApiError(raw.slice(0, 300), product));
  }
}
