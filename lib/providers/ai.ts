export { callAnthropic, callClaude } from "@/lib/providers/claude-chat";

import {
  RUNWAY_DEFAULT_RATIO,
  RUNWAY_TEXT_TO_VIDEO_MODEL,
} from "@/data/runway-options";

const RUNWAY_BASE = "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";

export function isRunwayConfigured(): boolean {
  return Boolean(process.env.RUNWAY_API_KEY?.trim());
}

function runwayHeaders() {
  const apiKey = process.env.RUNWAY_API_KEY?.trim();
  if (!apiKey) throw new Error("Runway API не настроен");
  return {
    Authorization: `Bearer ${apiKey}`,
    "X-Runway-Version": RUNWAY_VERSION,
    "Content-Type": "application/json",
  };
}

export async function startRunwayVideo(
  prompt: string,
  model: string,
  duration: number,
  ratio: string,
): Promise<string> {
  const runwayModel = model || RUNWAY_TEXT_TO_VIDEO_MODEL;
  const runwayRatio = ratio.includes(":") && !ratio.includes("/") ? ratio : RUNWAY_DEFAULT_RATIO;

  const response = await fetch(`${RUNWAY_BASE}/text_to_video`, {
    method: "POST",
    headers: runwayHeaders(),
    body: JSON.stringify({
      model: runwayModel,
      promptText: prompt.trim(),
      duration,
      ratio: runwayRatio,
    }),
  });

  const data = (await response.json()) as {
    error?: string;
    id?: string;
  };

  if (!response.ok || !data.id) {
    throw new Error(data.error ?? "Не удалось запустить генерацию Runway");
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
