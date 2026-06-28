export type GrokVideoModelId = "grok-imagine-video";

export type GrokVideoAspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "3:2" | "2:3";

export type GrokVideoResolution = "480p" | "720p";

export type GrokVideoDurationSeconds = 5 | 8 | 10 | 15;

export type GrokVideoGenerationRequest = {
  model: GrokVideoModelId;
  durationSeconds: GrokVideoDurationSeconds;
  aspectRatio: GrokVideoAspectRatio;
  resolution: GrokVideoResolution;
};

export const GROK_VIDEO_MODEL_OPTIONS: { value: GrokVideoModelId; label: string }[] = [
  { value: "grok-imagine-video", label: "Grok Video (text-to-video)" },
];

export const GROK_VIDEO_DURATION_OPTIONS: GrokVideoDurationSeconds[] = [5, 8, 10, 15];

export const GROK_VIDEO_ASPECT_RATIO_OPTIONS: { value: GrokVideoAspectRatio; label: string }[] = [
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
];

export const GROK_VIDEO_RESOLUTION_OPTIONS: {
  value: GrokVideoResolution;
  label: string;
}[] = [
  { value: "480p", label: "480p · быстрее и дешевле" },
  { value: "720p", label: "720p · HD" },
];

export function grokVideoResolutionToQuality(
  resolution: GrokVideoResolution,
): "1k" | "2k" {
  if (resolution === "720p") return "2k";
  return "1k";
}

export function createDefaultGrokVideoRequest(): GrokVideoGenerationRequest {
  return {
    model: "grok-imagine-video",
    durationSeconds: 8,
    aspectRatio: "16:9",
    resolution: "720p",
  };
}

export function validateGrokVideoPrompt(prompt: string): string | null {
  const text = prompt.trim();
  if (!text) return "Опишите сцену для видео.";
  if (text.length > 2000) return "Макс. 2000 символов.";
  return null;
}

export function validateGrokVideoGenerationRequest(
  prompt: string,
  raw?: Partial<GrokVideoGenerationRequest>,
): GrokVideoGenerationRequest | string {
  const promptError = validateGrokVideoPrompt(prompt);
  if (promptError) return promptError;

  const model =
    GROK_VIDEO_MODEL_OPTIONS.find((option) => option.value === raw?.model)?.value ??
    "grok-imagine-video";

  const durationRaw = raw?.durationSeconds;
  const durationSeconds: GrokVideoDurationSeconds =
    durationRaw === 5 || durationRaw === 8 || durationRaw === 10 || durationRaw === 15
      ? durationRaw
      : 8;

  const aspectRatio =
    GROK_VIDEO_ASPECT_RATIO_OPTIONS.find((option) => option.value === raw?.aspectRatio)?.value ??
    "16:9";

  let resolution =
    GROK_VIDEO_RESOLUTION_OPTIONS.find((option) => option.value === raw?.resolution)?.value ??
    "720p";

  return {
    model,
    durationSeconds,
    aspectRatio,
    resolution,
  };
}
