import type { RunwayGenerationRequest, RunwayImagePayload } from "@/data/runway-options";

const RUNWAY_BASE = "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";

function runwayHeaders(): HeadersInit {
  const apiKey = process.env.RUNWAY_API_KEY?.trim();
  if (!apiKey) throw new Error("Runway API не настроен");
  return {
    Authorization: `Bearer ${apiKey}`,
    "X-Runway-Version": RUNWAY_VERSION,
    "Content-Type": "application/json",
  };
}

function runwayPromptImageUri(image: RunwayImagePayload): string {
  return `data:${image.mimeType};base64,${image.data}`;
}

function formatRunwayError(message?: string): string {
  const text = message?.trim();
  if (!text) return "Ошибка Runway API";

  const lower = text.toLowerCase();
  if (lower.includes("model") && lower.includes("not")) {
    return `${text} Проверьте, что модель подходит для выбранного режима.`;
  }

  return text;
}

export function isRunwayConfigured(): boolean {
  return Boolean(process.env.RUNWAY_API_KEY?.trim());
}

export async function startRunwayVideo(
  prompt: string,
  options: RunwayGenerationRequest,
): Promise<string> {
  const endpoint =
    options.mode === "image-to-video" ? "/image_to_video" : "/text_to_video";

  const body: Record<string, unknown> = {
    model: options.model,
    ratio: options.ratio,
    duration: options.durationSeconds,
  };

  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt) {
    body.promptText = trimmedPrompt;
  }

  if (options.mode === "image-to-video") {
    if (!options.promptImage) {
      throw new Error("Не передано изображение для image-to-video");
    }
    body.promptImage = runwayPromptImageUri(options.promptImage);
  }

  const response = await fetch(`${RUNWAY_BASE}${endpoint}`, {
    method: "POST",
    headers: runwayHeaders(),
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as {
    error?: string;
    id?: string;
    message?: string;
  };

  if (!response.ok || !data.id) {
    throw new Error(formatRunwayError(data.error ?? data.message));
  }

  return data.id;
}

export async function pollRunwayTask(taskId: string): Promise<{
  status: string;
  videoUrl?: string;
  error?: string;
}> {
  const response = await fetch(`${RUNWAY_BASE}/tasks/${taskId}`, {
    headers: runwayHeaders(),
  });

  const data = (await response.json()) as {
    status?: string;
    output?: string[];
    failure?: string;
    failureCode?: string;
  };

  if (!response.ok) {
    throw new Error("Ошибка при проверке статуса Runway");
  }

  const status = data.status ?? "UNKNOWN";

  if (status === "SUCCEEDED") {
    const videoUrl = data.output?.[0];
    if (!videoUrl) throw new Error("Runway не вернул URL видео");
    return { status, videoUrl };
  }

  if (status === "FAILED") {
    return {
      status,
      error: data.failure ?? data.failureCode ?? "Генерация не удалась",
    };
  }

  return { status };
}
