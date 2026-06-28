import type { MediaQuality } from "@/lib/subscription/deai-cost";

export type NanobananaModelId =
  | "gemini-2.5-flash-image"
  | "gemini-3.1-flash-image-preview"
  | "gemini-3-pro-image-preview";

export type FluxModelId =
  | "flux-2-klein-4b"
  | "flux-2-klein-9b-preview"
  | "flux-2-pro"
  | "flux-pro-1.1"
  | "flux-2-pro-preview";

export type ImageAspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export type NanobananaGenerationRequest = {
  model: NanobananaModelId;
  quality: MediaQuality;
  aspectRatio: ImageAspectRatio;
};

export type FluxGenerationRequest = {
  model: FluxModelId;
  quality: MediaQuality;
  aspectRatio: ImageAspectRatio;
};

export const NANOBANANA_MODEL_OPTIONS: {
  value: NanobananaModelId;
  label: string;
}[] = [
  { value: "gemini-2.5-flash-image", label: "Nano Banana (2.5 Flash)" },
  { value: "gemini-3.1-flash-image-preview", label: "Nano Banana 2 (3.1 Flash)" },
  { value: "gemini-3-pro-image-preview", label: "Nano Banana Pro (3 Pro)" },
];

export const FLUX_MODEL_OPTIONS: { value: FluxModelId; label: string }[] = [
  { value: "flux-2-klein-4b", label: "FLUX.2 Klein 4B · самая дешёвая" },
  { value: "flux-2-klein-9b-preview", label: "FLUX.2 Klein 9B · быстрая" },
  { value: "flux-pro-1.1", label: "FLUX 1.1 Pro · бюджет" },
  { value: "flux-2-pro", label: "FLUX.2 Pro · stable" },
  { value: "flux-2-pro-preview", label: "FLUX.2 Pro Preview · макс. качество" },
];

export const IMAGE_ASPECT_RATIO_OPTIONS: { value: ImageAspectRatio; label: string }[] = [
  { value: "1:1", label: "1:1" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
];

export function createDefaultNanobananaRequest(): NanobananaGenerationRequest {
  return {
    model: "gemini-2.5-flash-image",
    quality: "1k",
    aspectRatio: "1:1",
  };
}

export function createDefaultFluxRequest(): FluxGenerationRequest {
  return {
    model: "flux-2-klein-4b",
    quality: "1k",
    aspectRatio: "1:1",
  };
}

export function validateImagePrompt(prompt: string): string | null {
  const text = prompt.trim();
  if (!text) return "Опишите изображение.";
  if (text.length > 2000) return "Макс. 2000 символов.";
  return null;
}
