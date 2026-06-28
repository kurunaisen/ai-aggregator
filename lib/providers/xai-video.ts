import type { GrokVideoGenerationRequest } from "@/data/grok-video-options";
import {
  extractXaiErrorBody,
  formatXaiApiError,
  parseXaiJsonResponse,
} from "@/lib/providers/xai-errors";
import { isXaiConfigured } from "@/lib/providers/xai-chat";

type GrokVideoStartResponse = {
  request_id?: string;
  error?: { message?: string; code?: string; type?: string } | string;
  code?: string;
  detail?: string;
  message?: string;
};

type GrokVideoPollResponse = {
  status?: string;
  video?: {
    url?: string;
    duration?: number;
    respect_moderation?: boolean;
  };
  error?: { message?: string; code?: string; type?: string } | string;
  code?: string;
  detail?: string;
  message?: string;
};

function getXaiApiKey(): string {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("xAI API не настроен. Добавьте XAI_API_KEY на Vercel.");
  }
  return apiKey;
}

export function isGrokVideoConfigured(): boolean {
  return isXaiConfigured();
}

export async function startGrokVideo(
  prompt: string,
  options: GrokVideoGenerationRequest,
): Promise<string> {
  const apiKey = getXaiApiKey();

  const response = await fetch("https://api.x.ai/v1/videos/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      prompt: prompt.trim(),
      duration: options.durationSeconds,
      aspect_ratio: options.aspectRatio,
      resolution: options.resolution,
    }),
  });

  const data = await parseXaiJsonResponse<GrokVideoStartResponse>(response, "video");

  if (!response.ok) {
    throw new Error(
      formatXaiApiError(extractXaiErrorBody(data, response.status, response.statusText), "video"),
    );
  }

  if (!data.request_id) {
    throw new Error("Grok Video не вернул request_id");
  }

  return data.request_id;
}

export async function pollGrokVideo(requestId: string): Promise<{
  status: string;
  videoUrl?: string;
  error?: string;
}> {
  const apiKey = getXaiApiKey();

  const response = await fetch(
    `https://api.x.ai/v1/videos/${encodeURIComponent(requestId)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  const data = await parseXaiJsonResponse<GrokVideoPollResponse>(response, "video");

  if (!response.ok) {
    throw new Error(
      formatXaiApiError(extractXaiErrorBody(data, response.status, response.statusText), "video"),
    );
  }

  const status = data.status ?? "pending";

  if (status === "done") {
    if (data.video?.respect_moderation === false) {
      return {
        status: "FAILED",
        error: "Grok Video: запрос отклонён модерацией. Измените описание.",
      };
    }

    const videoUrl = data.video?.url;
    if (!videoUrl) throw new Error("Grok Video не вернул URL видео");
    return { status: "SUCCEEDED", videoUrl };
  }

  if (status === "failed" || status === "expired") {
    return {
      status: "FAILED",
      error: formatXaiApiError(
        extractXaiErrorBody(data, response.status, response.statusText) ||
          (status === "expired" ? "Время ожидания истекло" : "Генерация не удалась"),
        "video",
      ),
    };
  }

  return { status: status.toUpperCase() };
}
