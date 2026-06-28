import type { NanobananaGenerationRequest } from "@/data/image-options";
import { getGoogleApiKey } from "@/lib/providers/veo";

type GeminiPart = {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
};

type GeminiResponse = {
  error?: { message?: string };
  candidates?: { content?: { parts?: GeminiPart[] } }[];
};

function formatGeminiImageError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("quota exceeded") ||
    lower.includes("free_tier") ||
    lower.includes("limit: 0")
  ) {
    return (
      "Gemini Image API недоступен на бесплатном тарифе Google (лимит 0 для image-моделей). " +
      "Подключите биллинг в Google AI Studio и используйте платный API-ключ, " +
      "или переключитесь на FLUX (/tool/flux) с ключом BFL_API_KEY."
    );
  }

  return message;
}

function qualityToImageSize(quality: "1k" | "2k" | "4k"): string | undefined {
  if (quality === "4k") return "4K";
  if (quality === "2k") return "2K";
  return "1K";
}

export async function generateNanobananaImage(
  prompt: string,
  options: NanobananaGenerationRequest,
): Promise<{ mimeType: string; dataUrl: string }> {
  const apiKey = getGoogleApiKey();
  const imageSize = qualityToImageSize(options.quality);

  const generationConfig: Record<string, unknown> = {
    responseModalities: ["TEXT", "IMAGE"],
  };

  if (options.aspectRatio) {
    generationConfig.imageConfig = {
      aspectRatio: options.aspectRatio,
      ...(imageSize ? { imageSize } : {}),
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt.trim() }] }],
        generationConfig,
      }),
    },
  );

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(formatGeminiImageError(data.error?.message ?? "Ошибка Gemini Image API"));
  }

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data);

  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini не вернул изображение");
  }

  const mimeType = imagePart.inlineData.mimeType ?? "image/png";
  return {
    mimeType,
    dataUrl: `data:${mimeType};base64,${imagePart.inlineData.data}`,
  };
}
