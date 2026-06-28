import {
  createDefaultGrokImagineRequest,
  GROK_IMAGINE_MODEL_OPTIONS,
  isAllowedGrokImagineAspectRatio,
  isAllowedGrokImagineModel,
  isAllowedGrokImagineResolution,
  type GrokImagineGenerationRequest,
} from "@/data/image-options";

export function getDefaultGrokImagineOptions(): GrokImagineGenerationRequest {
  return createDefaultGrokImagineRequest();
}

export function validateGrokImagineOptions(
  raw: unknown,
): GrokImagineGenerationRequest | string {
  const fallback = getDefaultGrokImagineOptions();
  const input = (raw ?? {}) as Partial<GrokImagineGenerationRequest>;

  const model = input.model ?? fallback.model;
  if (!isAllowedGrokImagineModel(model)) {
    return `Неизвестная модель Grok Imagine. Доступны: ${GROK_IMAGINE_MODEL_OPTIONS.map((option) => option.label).join(", ")}.`;
  }

  const resolution = input.resolution ?? fallback.resolution;
  if (!isAllowedGrokImagineResolution(resolution)) {
    return "Разрешение Grok Imagine: только 1k или 2k.";
  }

  const aspectRatio = input.aspectRatio ?? fallback.aspectRatio;
  if (!isAllowedGrokImagineAspectRatio(aspectRatio)) {
    return "Недопустимое соотношение сторон для Grok Imagine.";
  }

  return { model, resolution, aspectRatio };
}
