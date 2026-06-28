import type {
  VeoGenerationMode,
  VeoGenerationRequest,
  VeoImagePayload,
  VeoModelId,
} from "@/data/veo-options";
import {
  resolveVeoDurationForRequest,
  veoModelSupportsIngredients,
} from "@/data/veo-options";

const MAX_PROMPT = 1000;
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

type RawVeoInput = {
  model?: string;
  mode?: string;
  durationSeconds?: number;
  aspectRatio?: string;
  resolution?: string;
  image?: VeoImagePayload;
  referenceImages?: VeoImagePayload[];
};

function isVeoModel(value: string): value is VeoModelId {
  return (
    value === "veo-3.1-generate-preview" ||
    value === "veo-3.1-fast-generate-preview" ||
    value === "veo-3.1-lite-generate-preview"
  );
}

function isVeoMode(value: string): value is VeoGenerationMode {
  return (
    value === "text-to-video" ||
    value === "image-to-video" ||
    value === "ingredients-to-video"
  );
}

function validateImage(image: VeoImagePayload | undefined, label: string): string | null {
  if (!image?.data || !image.mimeType) {
    return `${label}: загрузите изображение`;
  }
  if (!image.mimeType.startsWith("image/")) {
    return `${label}: допустимы только изображения`;
  }
  const approxBytes = Math.floor((image.data.length * 3) / 4);
  if (approxBytes > MAX_IMAGE_BYTES) {
    return `${label}: файл слишком большой (макс. 10 МБ)`;
  }
  return null;
}

export function validateVeoGenerationRequest(
  prompt: string,
  raw: RawVeoInput | undefined,
): VeoGenerationRequest | string {
  if (!raw?.model || !isVeoModel(raw.model)) {
    return "Выберите модель Veo";
  }

  if (!raw.mode || !isVeoMode(raw.mode)) {
    return "Выберите режим генерации";
  }

  const durationRaw = raw.durationSeconds ?? 8;
  if (durationRaw !== 4 && durationRaw !== 6 && durationRaw !== 8) {
    return "Длительность Veo: 4, 6 или 8 секунд";
  }

  if (raw.aspectRatio !== "16:9" && raw.aspectRatio !== "9:16") {
    return "Выберите соотношение сторон";
  }

  if (raw.resolution !== "720p" && raw.resolution !== "1080p" && raw.resolution !== "4k") {
    return "Выберите разрешение";
  }

  if (raw.model === "veo-3.1-lite-generate-preview") {
    if (raw.mode === "ingredients-to-video") {
      return "Ingredients to Video недоступен для Veo 3.1 Lite";
    }
    if (raw.resolution === "4k") {
      return "4K недоступен для Veo 3.1 Lite";
    }
  }

  if (raw.mode === "image-to-video") {
    const imageError = validateImage(raw.image, "Стартовый кадр");
    if (imageError) return imageError;
  }

  if (raw.mode === "ingredients-to-video") {
    if (!veoModelSupportsIngredients(raw.model)) {
      return "Ingredients to Video недоступен для этой модели";
    }
    const refs = raw.referenceImages ?? [];
    if (refs.length < 1 || refs.length > MAX_IMAGES) {
      return `Ingredients to Video: загрузите от 1 до ${MAX_IMAGES} изображений`;
    }
    for (let i = 0; i < refs.length; i++) {
      const imageError = validateImage(refs[i], `Референс ${i + 1}`);
      if (imageError) return imageError;
    }
  }

  const durationSeconds = resolveVeoDurationForRequest(
    durationRaw,
    raw.mode,
    raw.resolution,
  );

  return {
    model: raw.model,
    mode: raw.mode,
    durationSeconds,
    aspectRatio: raw.aspectRatio,
    resolution: raw.resolution,
    image: raw.mode === "image-to-video" ? raw.image : undefined,
    referenceImages:
      raw.mode === "ingredients-to-video" ? raw.referenceImages : undefined,
  };
}

export function validateVeoPrompt(prompt: string): string | null {
  const text = prompt.trim();
  if (!text) return "Опишите сцену для видео";
  if (text.length > MAX_PROMPT) return `Макс. ${MAX_PROMPT} символов`;
  return null;
}
