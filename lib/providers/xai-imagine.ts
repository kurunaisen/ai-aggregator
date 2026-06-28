import type { GrokImagineGenerationRequest } from "@/data/image-options";
import { isXaiConfigured } from "@/lib/providers/xai-chat";

type XaiImageResponse = {
  error?: { message?: string };
  data?: { b64_json?: string; url?: string }[];
};

function formatXaiImagineError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid api key") || lower.includes("incorrect api key")) {
    return "xAI: неверный API-ключ. Проверьте XAI_API_KEY.";
  }

  if (lower.includes("rate limit")) {
    return "xAI: слишком много запросов. Подождите минуту.";
  }

  if (lower.includes("insufficient") || lower.includes("credit")) {
    return "xAI: недостаточно кредитов на аккаунте. Пополните баланс на console.x.ai.";
  }

  return `Grok Imagine: ${message}`;
}

export function isXaiImagineConfigured(): boolean {
  return isXaiConfigured();
}

export async function generateGrokImagineImage(
  prompt: string,
  options: GrokImagineGenerationRequest,
): Promise<{ dataUrl: string }> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) throw new Error("xAI API не настроен");

  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      prompt: prompt.trim(),
      aspect_ratio: options.aspectRatio,
      resolution: options.resolution,
      response_format: "b64_json",
      n: 1,
    }),
  });

  const data = (await response.json()) as XaiImageResponse;

  if (!response.ok) {
    throw new Error(formatXaiImagineError(data.error?.message ?? "Ошибка Grok Imagine API"));
  }

  const image = data.data?.[0];
  const b64 = image?.b64_json;

  if (b64) {
    return { dataUrl: `data:image/jpeg;base64,${b64}` };
  }

  if (image?.url) {
    return { dataUrl: image.url };
  }

  throw new Error("Grok Imagine не вернул изображение");
}
