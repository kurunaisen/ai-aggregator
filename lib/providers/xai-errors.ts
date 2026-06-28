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
    (lower.includes("balance") && lower.includes("low")) ||
    lower.includes("doesn't have any credits") ||
    lower.includes("does not have any credits") ||
    lower.includes("no credits or licenses") ||
    lower.includes("newly created team")
  );
}

function extractXaiTeamBillingUrl(message: string): string | null {
  const match = message.match(/https:\/\/console\.x\.ai\/team\/[^\s·]+/);
  return match?.[0] ?? null;
}

function formatXaiBillingMessage(
  message: string,
  product: "chat" | "imagine" | "video",
): string {
  const teamUrl = extractXaiTeamBillingUrl(message);
  const isNewTeam = message.toLowerCase().includes("newly created team");

  let friendly =
    isNewTeam
      ? "xAI: API-ключ привязан к новой команде без кредитов и лицензий. "
      : "xAI: на счёте команды xAI не хватает кредитов. ";

  if (teamUrl) {
    friendly += `Пополните баланс: ${teamUrl} `;
  } else {
    friendly += "Пополните console.x.ai → Billing. ";
  }

  friendly +=
    "Если вы уже оплатили другую команду — создайте API-ключ в той команде и обновите XAI_API_KEY на Vercel.";

  if (product === "video") {
    friendly += " Видео списывается посекундно (~$0.05/с), картинки ~$0.02/кадр.";
  }

  return withApiDetail(friendly, message);
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
    return formatXaiBillingMessage(message, product);
  }

  if (
    lower.includes("does not exist") ||
    lower.includes("not found") ||
    lower.includes("not available") ||
    lower.includes("not enabled") ||
    lower.includes("unsupported") ||
    (lower.includes("permission") && !lower.includes("permission-denied")) ||
    (lower.includes("access") && !lower.includes("console.x.ai"))
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
