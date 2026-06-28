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

export function formatXaiApiError(
  message: string,
  product: "chat" | "imagine" = "chat",
): string {
  const lower = message.toLowerCase();
  const prefix = product === "imagine" ? "Grok Imagine" : "xAI";

  if (lower.includes("invalid api key") || lower.includes("incorrect api key")) {
    return "xAI: неверный API-ключ. Создайте ключ на console.x.ai и добавьте XAI_API_KEY на Vercel.";
  }

  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "xAI: слишком много запросов. Подождите минуту.";
  }

  if (
    lower.includes("insufficient") ||
    lower.includes("credit") ||
    lower.includes("billing") ||
    lower.includes("payment")
  ) {
    return "xAI: недостаточно кредитов. Пополните баланс на console.x.ai → Billing.";
  }

  if (
    lower.includes("does not exist") ||
    lower.includes("not found") ||
    lower.includes("not available") ||
    lower.includes("access") ||
    lower.includes("permission")
  ) {
    if (product === "imagine") {
      return (
        "xAI: модель Grok Imagine недоступна для вашего API-ключа. " +
        "Включите Imagine в console.x.ai и проверьте биллинг."
      );
    }

    return (
      "xAI: модель Grok недоступна для вашего API-ключа. " +
      "Проверьте доступ к grok-4.3 в console.x.ai и биллинг."
    );
  }

  if (lower.includes("moderation") || lower.includes("content policy")) {
    return `${prefix}: запрос отклонён модерацией. Измените сообщение.`;
  }

  return `${prefix}: ${message}`;
}

export async function parseXaiJsonResponse<T extends Record<string, unknown>>(
  response: Response,
  product: "chat" | "imagine" = "chat",
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
