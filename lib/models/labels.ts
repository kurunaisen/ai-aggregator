import { getOpenAIModel } from "@/data/openai-models";

export function formatModelLabel(model: string | null, toolSlug: string): string {
  if (!model) {
    return toolSlugLabel(toolSlug);
  }

  const openai = getOpenAIModel(model);
  if (openai) return openai.label;

  if (model.includes("claude")) {
    return model
      .replace(/^claude-/, "Claude ")
      .replace(/-/g, " ")
      .replace(/\blatest\b/i, "")
      .trim();
  }

  if (model.includes("gen3")) return "Runway Gen-3 Turbo";
  if (model.includes("gen4")) return "Runway Gen-4";
  if (model.includes("veo-3.1")) return "Veo 3.1";
  if (model.includes("veo")) return "Google Veo";

  return model;
}

export function toolSlugLabel(slug: string): string {
  const labels: Record<string, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    runway: "Runway",
    veo: "Google Veo",
    midjourney: "Midjourney",
  };

  return labels[slug] ?? slug;
}
