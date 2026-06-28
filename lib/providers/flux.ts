import type { FluxGenerationRequest } from "@/data/image-options";

const BFL_BASE = "https://api.bfl.ai/v1";

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

function qualityToDimensions(quality: "1k" | "2k" | "4k"): { width: number; height: number } {
  if (quality === "4k") return { width: 2048, height: 2048 };
  if (quality === "2k") return { width: 1536, height: 1536 };
  return { width: 1024, height: 1024 };
}

export async function startFluxImage(
  prompt: string,
  options: FluxGenerationRequest,
): Promise<string> {
  const apiKey = getBflApiKey();
  const { width, height } = qualityToDimensions(options.quality);

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
    throw new Error(data.detail ?? data.error ?? "Не удалось запустить FLUX");
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
    throw new Error(data.detail ?? data.error ?? "Ошибка опроса FLUX");
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
