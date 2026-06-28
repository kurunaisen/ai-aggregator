import type { ImageEmbedConfig } from "@/data/embed-tools";
import type { FluxGenerationRequest, NanobananaGenerationRequest } from "@/data/image-options";
import { generateNanobananaImage } from "@/lib/providers/google-imagen";
import { pollFluxTask, startFluxImage } from "@/lib/providers/flux";

export async function generateImage(
  config: ImageEmbedConfig,
  prompt: string,
  options: NanobananaGenerationRequest | FluxGenerationRequest,
): Promise<{ imageUrl: string; taskId?: string }> {
  if (config.provider === "google-imagen") {
    const result = await generateNanobananaImage(prompt, options as NanobananaGenerationRequest);
    return { imageUrl: result.dataUrl };
  }

  if (config.provider === "bfl-flux") {
    const taskId = await startFluxImage(prompt, options as FluxGenerationRequest);
    return { imageUrl: "", taskId };
  }

  throw new Error("Неподдерживаемый image-провайдер");
}

export async function pollImageGeneration(
  config: ImageEmbedConfig,
  taskId: string,
): Promise<{ status: string; imageUrl?: string; error?: string }> {
  if (config.provider === "bfl-flux") {
    return pollFluxTask(taskId);
  }

  throw new Error("Опрос недоступен для этого image-провайдера");
}

export async function startImageGeneration(
  config: ImageEmbedConfig,
  prompt: string,
  options: NanobananaGenerationRequest | FluxGenerationRequest,
): Promise<{ imageUrl?: string; taskId?: string }> {
  const result = await generateImage(config, prompt, options);
  return result;
}
