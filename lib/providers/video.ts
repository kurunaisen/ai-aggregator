import type { VideoEmbedConfig } from "@/data/embed-tools";
import type { KlingGenerationRequest } from "@/data/kling-options";
import type { RunwayGenerationRequest } from "@/data/runway-options";
import type { VeoGenerationRequest } from "@/data/veo-options";
import { pollKlingTask, startKlingVideo } from "@/lib/providers/kling";
import { pollRunwayTask, startRunwayVideo } from "@/lib/providers/runway";
import { pollVeoOperation, startVeoVideo } from "@/lib/providers/veo";

export async function startVideoGeneration(
  config: VideoEmbedConfig,
  prompt: string,
  duration: number,
  ratio: string,
  veo?: VeoGenerationRequest,
  kling?: KlingGenerationRequest,
  runway?: RunwayGenerationRequest,
): Promise<string> {
  if (config.provider === "runway") {
    if (!runway) {
      throw new Error("Не переданы параметры Runway");
    }
    return startRunwayVideo(prompt, runway);
  }

  if (config.provider === "google-veo") {
    if (!veo) {
      throw new Error("Не переданы параметры Veo");
    }
    return startVeoVideo(prompt, veo);
  }

  if (config.provider === "kling") {
    if (!kling) {
      throw new Error("Не переданы параметры Kling");
    }
    return startKlingVideo(prompt, kling);
  }

  throw new Error("Неподдерживаемый видео-провайдер");
}

export async function pollVideoGeneration(
  config: VideoEmbedConfig,
  taskId: string,
): Promise<{ status: string; videoUrl?: string; error?: string }> {
  if (config.provider === "runway") {
    return pollRunwayTask(taskId);
  }

  if (config.provider === "google-veo") {
    return pollVeoOperation(taskId);
  }

  if (config.provider === "kling") {
    return pollKlingTask(taskId);
  }

  throw new Error("Неподдерживаемый видео-провайдер");
}
