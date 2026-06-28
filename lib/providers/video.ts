import type { VideoEmbedConfig } from "@/data/embed-tools";
import { pollRunwayTask, startRunwayVideo } from "@/lib/providers/ai";
import { pollVeoOperation, startVeoVideo } from "@/lib/providers/veo";

export async function startVideoGeneration(
  config: VideoEmbedConfig,
  prompt: string,
  duration: number,
  ratio: string,
): Promise<string> {
  if (config.provider === "runway") {
    return startRunwayVideo(prompt, config.model, duration, ratio);
  }

  if (config.provider === "google-veo") {
    return startVeoVideo(prompt, config.model);
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

  throw new Error("Неподдерживаемый видео-провайдер");
}
