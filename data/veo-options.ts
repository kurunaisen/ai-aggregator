export type VeoModelId =
  | "veo-3.1-generate-preview"
  | "veo-3.1-fast-generate-preview"
  | "veo-3.1-lite-generate-preview";

export type VeoGenerationMode =
  | "text-to-video"
  | "image-to-video"
  | "ingredients-to-video";

export type VeoAspectRatio = "16:9" | "9:16";

export type VeoDurationSeconds = 4 | 6 | 8;

export type VeoResolution = "720p" | "1080p" | "4k";

export type VeoImagePayload = {
  mimeType: string;
  data: string;
};

export type VeoGenerationRequest = {
  model: VeoModelId;
  mode: VeoGenerationMode;
  durationSeconds: VeoDurationSeconds;
  aspectRatio: VeoAspectRatio;
  resolution: VeoResolution;
  image?: VeoImagePayload;
  referenceImages?: VeoImagePayload[];
};

export const VEO_MODEL_OPTIONS: {
  value: VeoModelId;
  label: string;
  description: string;
}[] = [
  {
    value: "veo-3.1-generate-preview",
    label: "Veo 3.1",
    description: "Максимальное качество, все режимы",
  },
  {
    value: "veo-3.1-fast-generate-preview",
    label: "Veo 3.1 Fast",
    description: "Быстрее, все режимы",
  },
  {
    value: "veo-3.1-lite-generate-preview",
    label: "Veo 3.1 Lite",
    description: "Легче и быстрее · текст и фото",
  },
];

export const VEO_MODE_OPTIONS: {
  value: VeoGenerationMode;
  label: string;
  description: string;
}[] = [
  {
    value: "text-to-video",
    label: "Видео по тексту",
    description: "Text-to-Video",
  },
  {
    value: "image-to-video",
    label: "Видео по изображению",
    description: "Image-to-Video",
  },
  {
    value: "ingredients-to-video",
    label: "Ingredients to Video",
    description: "До 3 референсов + промпт",
  },
];

export const VEO_DURATION_OPTIONS: VeoDurationSeconds[] = [4, 6, 8];

export const VEO_ASPECT_RATIO_OPTIONS: { value: VeoAspectRatio; label: string }[] = [
  { value: "16:9", label: "16:9 (горизонт)" },
  { value: "9:16", label: "9:16 (вертикаль)" },
];

export const VEO_RESOLUTION_OPTIONS: {
  value: VeoResolution;
  label: string;
  liteSupported: boolean;
}[] = [
  { value: "720p", label: "720p (1K)", liteSupported: true },
  { value: "1080p", label: "1080p (2K)", liteSupported: true },
  { value: "4k", label: "4K", liteSupported: false },
];

export function veoModelSupportsIngredients(model: VeoModelId): boolean {
  return model !== "veo-3.1-lite-generate-preview";
}

export function resolveVeoDurationForRequest(
  durationSeconds: VeoDurationSeconds,
  mode: VeoGenerationMode,
  resolution: VeoResolution,
): VeoDurationSeconds {
  if (
    mode === "ingredients-to-video" ||
    resolution === "1080p" ||
    resolution === "4k"
  ) {
    return 8;
  }
  return durationSeconds;
}

export function mediaQualityToVeoResolution(quality: "1k" | "2k" | "4k"): VeoResolution {
  if (quality === "4k") return "4k";
  if (quality === "2k") return "1080p";
  return "720p";
}

export function veoResolutionToMediaQuality(resolution: VeoResolution): "1k" | "2k" | "4k" {
  if (resolution === "4k") return "4k";
  if (resolution === "1080p") return "2k";
  return "1k";
}
