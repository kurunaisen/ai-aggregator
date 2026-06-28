export type RunwayGenerationMode = "text-to-video" | "image-to-video";

export type RunwayTextToVideoModel = "gen4.5";

export type RunwayImageToVideoModel = "gen4.5" | "gen4_turbo" | "gen3a_turbo";

export type RunwayModelId = RunwayTextToVideoModel | RunwayImageToVideoModel;

export type RunwayRatio =
  | "1280:720"
  | "720:1280"
  | "960:960"
  | "1104:832"
  | "832:1104";

export type RunwayDurationSeconds = 5 | 10;

export type RunwayImagePayload = {
  mimeType: string;
  data: string;
};

export type RunwayGenerationRequest = {
  mode: RunwayGenerationMode;
  model: RunwayModelId;
  durationSeconds: RunwayDurationSeconds;
  ratio: RunwayRatio;
  promptImage?: RunwayImagePayload;
};

export const RUNWAY_DEFAULT_RATIO: RunwayRatio = "1280:720";

export const RUNWAY_TEXT_TO_VIDEO_MODELS: {
  value: RunwayTextToVideoModel;
  label: string;
  description: string;
}[] = [
  {
    value: "gen4.5",
    label: "Gen-4.5",
    description: "Флагман Runway — text-to-video",
  },
];

export const RUNWAY_IMAGE_TO_VIDEO_MODELS: {
  value: RunwayImageToVideoModel;
  label: string;
  description: string;
}[] = [
  {
    value: "gen4.5",
    label: "Gen-4.5",
    description: "Максимальное качество, текст опционален",
  },
  {
    value: "gen4_turbo",
    label: "Gen-4 Turbo",
    description: "Быстрее и дешевле, нужен промпт",
  },
  {
    value: "gen3a_turbo",
    label: "Gen-3 Alpha Turbo",
    description: "Классическая image-to-video модель",
  },
];

export const RUNWAY_MODE_OPTIONS: {
  value: RunwayGenerationMode;
  label: string;
  description: string;
}[] = [
  {
    value: "text-to-video",
    label: "Видео по тексту",
    description: "Text-to-Video · Gen-4.5",
  },
  {
    value: "image-to-video",
    label: "Видео по изображению",
    description: "Image-to-Video · Gen-4.5 / Turbo / Gen-3",
  },
];

export const RUNWAY_RATIO_OPTIONS: { value: RunwayRatio; label: string }[] = [
  { value: "1280:720", label: "16:9 (1280×720)" },
  { value: "720:1280", label: "9:16 (720×1280)" },
  { value: "960:960", label: "1:1 (960×960)" },
  { value: "1104:832", label: "4:3 (1104×832)" },
  { value: "832:1104", label: "3:4 (832×1104)" },
];

export const RUNWAY_DURATION_OPTIONS: RunwayDurationSeconds[] = [5, 10];

export function runwayModelsForMode(mode: RunwayGenerationMode) {
  return mode === "text-to-video"
    ? RUNWAY_TEXT_TO_VIDEO_MODELS
    : RUNWAY_IMAGE_TO_VIDEO_MODELS;
}

export function defaultRunwayModelForMode(mode: RunwayGenerationMode): RunwayModelId {
  return "gen4.5";
}

export function createDefaultRunwayRequest(): RunwayGenerationRequest {
  return {
    mode: "text-to-video",
    model: "gen4.5",
    durationSeconds: 5,
    ratio: RUNWAY_DEFAULT_RATIO,
  };
}

export function validateRunwayPrompt(
  prompt: string,
  options: Pick<RunwayGenerationRequest, "mode" | "model">,
): string | null {
  const text = prompt.trim();

  if (options.mode === "text-to-video") {
    if (!text) return "Опишите сцену для видео.";
    if (text.length > 1000) return "Макс. 1000 символов для Runway.";
    return null;
  }

  if (options.model === "gen4_turbo" || options.model === "gen3a_turbo") {
    if (!text) return "Для этой модели нужен промпт с описанием движения.";
  }

  if (text.length > 1000) return "Макс. 1000 символов для Runway.";
  return null;
}

export function validateRunwayGenerationRequest(
  prompt: string,
  raw?: Partial<RunwayGenerationRequest>,
): RunwayGenerationRequest | string {
  const mode =
    RUNWAY_MODE_OPTIONS.find((option) => option.value === raw?.mode)?.value ??
    "text-to-video";

  const modelOptions = runwayModelsForMode(mode);
  const model =
    modelOptions.find((option) => option.value === raw?.model)?.value ??
    defaultRunwayModelForMode(mode);

  const request: RunwayGenerationRequest = {
    mode,
    model,
    durationSeconds: raw?.durationSeconds === 10 ? 10 : 5,
    ratio:
      RUNWAY_RATIO_OPTIONS.find((option) => option.value === raw?.ratio)?.value ??
      RUNWAY_DEFAULT_RATIO,
    promptImage: raw?.promptImage,
  };

  const promptError = validateRunwayPrompt(prompt, request);
  if (promptError) return promptError;

  if (mode === "image-to-video" && !request.promptImage) {
    return "Загрузите стартовое изображение для image-to-video.";
  }

  if (mode === "text-to-video" && request.promptImage) {
    delete request.promptImage;
  }

  return request;
}
