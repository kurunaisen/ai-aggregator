import type { KlingGenerationRequest } from "@/data/kling-options";
import {
  getKlingAuthAttempts,
  getKlingBaseUrl,
  resolveKlingAuth,
} from "@/lib/providers/kling-jwt";

type KlingApiResponse<T> = {
  code?: number;
  message?: string;
  data?: T;
};

type KlingTaskData = {
  task_id?: string;
  task_status?: string;
  task_status_msg?: string;
  task_result?: {
    videos?: { url?: string; duration?: string }[];
  };
};

const KLING_AUTH_ERROR_CODES = new Set([1000, 1001, 1002, 1003, 1004]);

function parseKlingError(message?: string): string {
  return message?.trim() || "Ошибка Kling API";
}

function isKlingAuthFailure(response: Response, data: KlingApiResponse<unknown>): boolean {
  if (response.status === 401 || response.status === 403) return true;
  return typeof data.code === "number" && KLING_AUTH_ERROR_CODES.has(data.code);
}

function klingAuthSetupHint(): string {
  return (
    "Проверьте KLING_API_KEY на Vercel. Если один ключ не подходит — добавьте KLING_ACCESS_KEY " +
    "(из таблицы Kling) и ключ из окна Create как KLING_API_KEY или KLING_SECRET_KEY."
  );
}

async function klingFetch(
  path: string,
  init: RequestInit = {},
): Promise<{ response: Response; data: KlingApiResponse<KlingTaskData> }> {
  const tokens = getKlingAuthAttempts();
  if (tokens.length === 0) {
    throw new Error("Kling API не настроен");
  }

  const url = `${getKlingBaseUrl()}${path}`;
  let lastAuthError: string | null = null;

  for (const token of tokens) {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    });

    const data = (await response.json()) as KlingApiResponse<KlingTaskData>;

    if (!isKlingAuthFailure(response, data)) {
      return { response, data };
    }

    lastAuthError = parseKlingError(data.message) || `HTTP ${response.status}`;
  }

  if (resolveKlingAuth()?.mode === "bearer") {
    throw new Error(`${lastAuthError ?? "Ошибка авторизации Kling"}. ${klingAuthSetupHint()}`);
  }

  throw new Error(lastAuthError ?? "Ошибка авторизации Kling");
}

export async function startKlingVideo(
  prompt: string,
  options: KlingGenerationRequest,
): Promise<string> {
  const { response, data } = await klingFetch("/v1/videos/text2video", {
    method: "POST",
    body: JSON.stringify({
      model_name: options.model,
      prompt: prompt.trim(),
      negative_prompt: options.negativePrompt ?? "",
      duration: String(options.durationSeconds),
      aspect_ratio: options.aspectRatio,
      mode: options.mode,
      sound: options.sound ? "on" : "off",
    }),
  });

  if (!response.ok || data.code !== 0 || !data.data?.task_id) {
    throw new Error(parseKlingError(data.message));
  }

  return data.data.task_id;
}

export async function pollKlingTask(taskId: string): Promise<{
  status: string;
  videoUrl?: string;
  error?: string;
}> {
  const { response, data } = await klingFetch(
    `/v1/videos/text2video/${encodeURIComponent(taskId)}`,
  );

  if (!response.ok || data.code !== 0) {
    throw new Error(parseKlingError(data.message));
  }

  const taskStatus = data.data?.task_status ?? "unknown";

  if (taskStatus === "succeed") {
    const videoUrl = data.data?.task_result?.videos?.[0]?.url;
    if (!videoUrl) throw new Error("Kling не вернул URL видео");
    return { status: "SUCCEEDED", videoUrl };
  }

  if (taskStatus === "failed") {
    return {
      status: "FAILED",
      error: data.data?.task_status_msg ?? "Генерация не удалась",
    };
  }

  return { status: taskStatus.toUpperCase() };
}
