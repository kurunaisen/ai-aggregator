import type { KlingGenerationRequest } from "@/data/kling-options";
import {
  createKlingJwt,
  getKlingBaseUrl,
  getKlingCredentials,
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

function klingHeaders(accessKey: string, secretKey: string): HeadersInit {
  const token = createKlingJwt(accessKey, secretKey);
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function parseKlingError(message?: string): string {
  return message?.trim() || "Ошибка Kling API";
}

export async function startKlingVideo(
  prompt: string,
  options: KlingGenerationRequest,
): Promise<string> {
  const { accessKey, secretKey } = getKlingCredentials();
  const response = await fetch(`${getKlingBaseUrl()}/v1/videos/text2video`, {
    method: "POST",
    headers: klingHeaders(accessKey, secretKey),
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

  const data = (await response.json()) as KlingApiResponse<KlingTaskData>;

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
  const { accessKey, secretKey } = getKlingCredentials();
  const response = await fetch(
    `${getKlingBaseUrl()}/v1/videos/text2video/${encodeURIComponent(taskId)}`,
    {
      headers: klingHeaders(accessKey, secretKey),
    },
  );

  const data = (await response.json()) as KlingApiResponse<KlingTaskData>;

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
