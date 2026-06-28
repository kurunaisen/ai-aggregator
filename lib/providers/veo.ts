import type {
  VeoGenerationRequest,
  VeoImagePayload,
} from "@/data/veo-options";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export function getGoogleApiKey(): string {
  const apiKey =
    process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("Google API не настроен");
  return apiKey;
}

export function isGoogleApiConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim(),
  );
}

type VeoOperationResponse = {
  name?: string;
  done?: boolean;
  error?: { message?: string };
  response?: {
    generateVideoResponse?: {
      generatedSamples?: { video?: { uri?: string } }[];
    };
  };
};

function inlineImage(image: VeoImagePayload) {
  return {
    inlineData: {
      mimeType: image.mimeType,
      data: image.data,
    },
  };
}

function buildVeoInstance(prompt: string, options: VeoGenerationRequest) {
  const instance: Record<string, unknown> = {
    prompt: prompt.trim(),
  };

  if (options.mode === "image-to-video" && options.image) {
    instance.image = inlineImage(options.image);
  }

  if (options.mode === "ingredients-to-video" && options.referenceImages?.length) {
    instance.referenceImages = options.referenceImages.map((image) => ({
      image: inlineImage(image),
      referenceType: "asset",
    }));
  }

  return instance;
}

export async function startVeoVideo(
  prompt: string,
  options: VeoGenerationRequest,
): Promise<string> {
  const body = {
    instances: [buildVeoInstance(prompt, options)],
    parameters: {
      aspectRatio: options.aspectRatio,
      durationSeconds: String(options.durationSeconds),
      resolution: options.resolution,
    },
  };

  const response = await fetch(
    `${GEMINI_BASE}/models/${options.model}:predictLongRunning`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": getGoogleApiKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = (await response.json()) as VeoOperationResponse & {
    error?: { message?: string };
  };

  if (!response.ok || !data.name) {
    throw new Error(data.error?.message ?? "Не удалось запустить генерацию Veo");
  }

  return data.name;
}

export async function pollVeoOperation(operationName: string): Promise<{
  status: string;
  videoUrl?: string;
  error?: string;
}> {
  const response = await fetch(`${GEMINI_BASE}/${operationName}`, {
    headers: { "x-goog-api-key": getGoogleApiKey() },
  });

  const data = (await response.json()) as VeoOperationResponse;

  if (!response.ok) {
    throw new Error("Ошибка при проверке статуса Veo");
  }

  if (data.done) {
    if (data.error?.message) {
      return { status: "FAILED", error: data.error.message };
    }

    const uri =
      data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;

    if (!uri) {
      return { status: "FAILED", error: "Veo не вернул URL видео" };
    }

    return {
      status: "SUCCEEDED",
      videoUrl: `/api/media/google-video?uri=${encodeURIComponent(uri)}`,
    };
  }

  return { status: "RUNNING" };
}
