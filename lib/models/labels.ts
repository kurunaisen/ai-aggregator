import { getOpenAIModel } from "@/data/openai-models";

export function formatModelLabel(model: string | null, toolSlug: string): string {
  if (!model) {
    return toolSlugLabel(toolSlug);
  }

  const openai = getOpenAIModel(model);
  if (openai) return openai.label;

  if (model.includes("claude")) {
    if (model.includes("opus")) return "Claude Opus 4.8";
    if (model.includes("sonnet")) return "Claude Sonnet 4.6";
    if (model.includes("haiku")) return "Claude Haiku 4.5";
    return model
      .replace(/^claude-/, "Claude ")
      .replace(/-/g, " ")
      .replace(/\blatest\b/i, "")
      .trim();
  }

  if (model.includes("grok")) return model.replace(/^grok-/i, "Grok ").replace(/-/g, " ");
  if (model.includes("kling")) return model.replace(/^kling-/i, "Kling ").replace(/-/g, " ");
  if (model.includes("flux")) {
    if (model.includes("klein-4b")) return "FLUX.2 Klein 4B";
    if (model.includes("klein")) return "FLUX.2 Klein 9B";
    if (model.includes("pro-1.1")) return "FLUX 1.1 Pro";
    if (model.includes("pro-preview")) return "FLUX.2 Pro Preview";
    if (model.includes("pro")) return "FLUX.2 Pro";
    return "FLUX";
  }
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
