import type { GrokImagineGenerationRequest } from "@/data/image-options";
import {
  extractXaiErrorBody,
  formatXaiApiError,
  parseXaiJsonResponse,
} from "@/lib/providers/xai-errors";
import { isXaiConfigured } from "@/lib/providers/xai-chat";

type XaiImageItem = {
  b64_json?: string;
  url?: string;
  mime_type?: string;
  file_output?: {
    public_url?: string | null;
    file_id?: string;
  };
};

type XaiImageResponse = {
  error?: { message?: string; code?: string; type?: string } | string;
  code?: string;
  detail?: string;
  message?: string;
  respect_moderation?: boolean;
  data?: XaiImageItem[];
};

function buildXaiImageRequestBody(
  prompt: string,
  options: GrokImagineGenerationRequest,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: options.model,
    prompt: prompt.trim(),
    n: 1,
  };

  if (options.aspectRatio && options.aspectRatio !== "auto") {
    body.aspect_ratio = options.aspectRatio;
  }

  if (options.resolution) {
    body.resolution = options.resolution;
  }

  return body;
}

async function imageItemToDataUrl(item: XaiImageItem): Promise<string | null> {
  if (item.b64_json) {
    const mime = item.mime_type ?? "image/jpeg";
    return `data:${mime};base64,${item.b64_json}`;
  }

  const publicUrl = item.file_output?.public_url;
  const directUrl = item.url ?? (typeof publicUrl === "string" ? publicUrl : null);
  if (!directUrl) return null;

  const imageResponse = await fetch(directUrl);
  if (!imageResponse.ok) {
    throw new Error(
      formatXaiApiError(`Не удалось загрузить изображение (${imageResponse.status})`, "imagine"),
    );
  }

  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  const mime =
    imageResponse.headers.get("content-type")?.split(";")[0]?.trim() ??
    item.mime_type ??
    "image/jpeg";

  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export function isXaiImagineConfigured(): boolean {
  return isXaiConfigured();
}

export async function generateGrokImagineImage(
  prompt: string,
  options: GrokImagineGenerationRequest,
): Promise<{ dataUrl: string }> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) throw new Error("xAI API не настроен. Добавьте XAI_API_KEY на Vercel.");

  const requestAttempts: { label: string; body: Record<string, unknown> }[] = [
    {
      label: "url",
      body: buildXaiImageRequestBody(prompt, options),
    },
    {
      label: "b64_json",
      body: {
        ...buildXaiImageRequestBody(prompt, options),
        response_format: "b64_json",
      },
    },
  ];

  let lastError = "Не удалось сгенерировать изображение";

  for (const attempt of requestAttempts) {
    const response = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attempt.body),
    });

    const data = await parseXaiJsonResponse<XaiImageResponse>(response, "imagine");

    if (!response.ok) {
      const detail = extractXaiErrorBody(data, response.status, response.statusText);
      console.error("Grok Imagine API error:", response.status, detail);
      lastError = formatXaiApiError(detail, "imagine");
      continue;
    }

    if (data.respect_moderation === false) {
      lastError = "Grok Imagine: запрос отклонён модерацией. Измените описание.";
      continue;
    }

    const image = data.data?.[0];
    if (!image) {
      lastError = "Grok Imagine не вернул изображение (пустой ответ).";
      continue;
    }

    const dataUrl = await imageItemToDataUrl(image);
    if (dataUrl) {
      return { dataUrl };
    }

    lastError = "Grok Imagine не вернул URL или base64 изображения.";
  }

  throw new Error(lastError);
}
