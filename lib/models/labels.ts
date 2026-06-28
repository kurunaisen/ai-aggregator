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

  if (model.includes("grok")) return model.replace(/^grok-/i, "Grok ").replace(/-/g, " ");
  if (model.includes("kling")) return model.replace(/^kling-/i, "Kling ").replace(/-/g, " ");
  if (model.includes("flux")) return model.includes("klein") ? "FLUX.2 Klein" : "FLUX.2 Pro";
  if (model.includes("gemini") && model.includes("image")) {
    if (model.includes("3-pro")) return "Nano Banana Pro";
    if (model.includes("3.1-flash")) return "Nano Banana 2";
    return "Nano Banana";
  }

  if (model.includes("gen3")) return "Runway Gen-3 Turbo";
  if (model.includes("gen4")) return "Runway Gen-4";
  if (model.includes("veo-3.1-fast")) return "Veo 3.1 Fast";
  if (model.includes("veo-3.1-lite")) return "Veo 3.1 Lite";
  if (model.includes("veo-3.1")) return "Veo 3.1";
  if (model.includes("veo")) return "Google Veo";

  return model;
}

export function toolSlugLabel(slug: string): string {
  const labels: Record<string, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    grok: "Grok",
    nanobanana: "Nano Banana",
    flux: "FLUX",
    runway: "Runway",
    veo: "Google Veo",
    kling: "Kling",
    monaco: "Monaco Editor",
  };

  return labels[slug] ?? slug;
}
