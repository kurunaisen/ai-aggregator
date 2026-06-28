export type KlingModelId = "kling-v2-6" | "kling-v2-5-turbo" | "kling-v2-1-master";

export type KlingAspectRatio = "16:9" | "9:16" | "1:1";

export type KlingMode = "std" | "pro";

export type KlingDurationSeconds = 5 | 10;

export type KlingGenerationRequest = {
  model: KlingModelId;
  durationSeconds: KlingDurationSeconds;
  aspectRatio: KlingAspectRatio;
  mode: KlingMode;
  sound: boolean;
  negativePrompt?: string;
};

export const KLING_MODEL_OPTIONS: { value: KlingModelId; label: string }[] = [
  { value: "kling-v2-6", label: "Kling 2.6" },
  { value: "kling-v2-5-turbo", label: "Kling 2.5 Turbo" },
  { value: "kling-v2-1-master", label: "Kling 2.1 Master" },
];

export const KLING_ASPECT_RATIO_OPTIONS: { value: KlingAspectRatio; label: string }[] = [
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "1:1", label: "1:1" },
];

export const KLING_DURATION_OPTIONS: KlingDurationSeconds[] = [5, 10];

export const KLING_MODE_OPTIONS: { value: KlingMode; label: string }[] = [
  { value: "std", label: "Standard (720p)" },
  { value: "pro", label: "Pro (1080p)" },
];

export function createDefaultKlingRequest(): KlingGenerationRequest {
  return {
    model: "kling-v2-6",
    durationSeconds: 5,
    aspectRatio: "16:9",
    mode: "pro",
    sound: false,
  };
}

export function validateKlingPrompt(prompt: string): string | null {
  const text = prompt.trim();
  if (!text) return "Опишите сцену для видео.";
  if (text.length > 2500) return "Макс. 2500 символов.";
  return null;
}

export function validateKlingGenerationRequest(
  prompt: string,
  raw?: Partial<KlingGenerationRequest>,
): KlingGenerationRequest | string {
  const promptError = validateKlingPrompt(prompt);
  if (promptError) return promptError;

  const model =
    KLING_MODEL_OPTIONS.find((option) => option.value === raw?.model)?.value ?? "kling-v2-6";
  const durationSeconds: KlingDurationSeconds =
    raw?.durationSeconds === 10 ? 10 : 5;
  const aspectRatio =
    KLING_ASPECT_RATIO_OPTIONS.find((option) => option.value === raw?.aspectRatio)?.value ??
    "16:9";
  const mode =
    KLING_MODE_OPTIONS.find((option) => option.value === raw?.mode)?.value ?? "pro";

  return {
    model,
    durationSeconds,
    aspectRatio,
    mode,
    sound: Boolean(raw?.sound),
    negativePrompt: raw?.negativePrompt?.slice(0, 2500),
  };
}
