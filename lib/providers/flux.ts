import type { FluxGenerationRequest, ImageAspectRatio } from "@/data/image-options";

const BFL_BASE = process.env.BFL_API_BASE?.trim() || "https://api.bfl.ai/v1";

type BflCreateResponse = {
  id?: string;
  polling_url?: string;
  error?: string;
  detail?: string;
};

type BflPollResponse = {
  status?: string;
  result?: { sample?: string };
  error?: string;
  detail?: string;
};

function getBflApiKey(): string {
  const apiKey = process.env.BFL_API_KEY?.trim();
  if (!apiKey) throw new Error("FLUX API не настроен");
  return apiKey;
}

export function isFluxConfigured(): boolean {
  return Boolean(process.env.BFL_API_KEY?.trim());
}

function formatBflError(status: number, message: string): string {
  const lower = message.toLowerCase();

  if (status === 401 || (lower.includes("invalid") && lower.includes("key"))) {
    return "Неверный BFL_API_KEY. Проверьте ключ на https://api.bfl.ai и переменную на Vercel.";
  }

  if (status === 402 || lower.includes("credit") || lower.includes("payment")) {
    return (
      "На счёте BFL закончились кредиты. Пополните баланс на https://api.bfl.ai (Credits → Add)."
    );
  }

  if (status === 429 || lower.includes("rate limit") || lower.includes("active tasks")) {
    return "Слишком много одновременных запросов к FLUX. Подождите минуту и попробуйте снова.";
  }

  return message;
}

function dimensionsFromQualityAndRatio(
  quality: "1k" | "2k" | "4k",
  aspectRatio: ImageAspectRatio,
): { width: number; height: number } {
  const base = quality === "4k" ? 2048 : quality === "2k" ? 1536 : 1024;
  const [ratioW, ratioH] = aspectRatio.split(":").map(Number);

  if (!ratioW || !ratioH) {
    return { width: base, height: base };
  }

  if (ratioW >= ratioH) {
    return { width: base, height: Math.round((base * ratioH) / ratioW) };
  }

  return { width: Math.round((base * ratioW) / ratioH), height: base };
}

export async function startFluxImage(
  prompt: string,
  options: FluxGenerationRequest,
): Promise<string> {
  const apiKey = getBflApiKey();
  const { width, height } = dimensionsFromQualityAndRatio(options.quality, options.aspectRatio);

  const response = await fetch(`${BFL_BASE}/${options.model}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "x-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: prompt.trim(),
      width,
      height,
    }),
  });

  const data = (await response.json()) as BflCreateResponse;

  if (!response.ok || !data.id) {
    const message = data.detail ?? data.error ?? "Не удалось запустить FLUX";
    throw new Error(formatBflError(response.status, message));
  }

  return JSON.stringify({ id: data.id, pollingUrl: data.polling_url });
}

export async function pollFluxTask(taskPayload: string): Promise<{
  status: string;
  imageUrl?: string;
  error?: string;
}> {
  const apiKey = getBflApiKey();
  const parsed = JSON.parse(taskPayload) as { id?: string; pollingUrl?: string };

  const pollUrl =
    parsed.pollingUrl ?? `${BFL_BASE}/get_result?id=${encodeURIComponent(parsed.id ?? "")}`;

  const response = await fetch(pollUrl, {
    headers: {
      accept: "application/json",
      "x-key": apiKey,
    },
  });

  const data = (await response.json()) as BflPollResponse;

  if (!response.ok) {
    const message = data.detail ?? data.error ?? "Ошибка опроса FLUX";
    throw new Error(formatBflError(response.status, message));
  }

  if (data.status === "Ready") {
    const imageUrl = data.result?.sample;
    if (!imageUrl) throw new Error("FLUX не вернул URL изображения");
    return { status: "SUCCEEDED", imageUrl };
  }

  if (data.status === "Error" || data.status === "Failed") {
    return {
      status: "FAILED",
      error: data.detail ?? data.error ?? "Генерация не удалась",
    };
  }

  return { status: data.status ?? "PENDING" };
}
