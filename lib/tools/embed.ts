import { EMBED_TOOLS, type EmbedConfig } from "@/data/embed-tools";

export function getEmbedConfig(slug: string): EmbedConfig | null {
  return EMBED_TOOLS[slug] ?? null;
}

export function isEmbedEnabled(slug: string): boolean {
  return slug in EMBED_TOOLS;
}

export function isProviderConfigured(config: EmbedConfig): boolean {
  if (config.type === "chat") {
    if (config.provider === "openai") {
      return Boolean(process.env.OPENAI_API_KEY?.trim());
    }
    if (config.provider === "anthropic") {
      return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
    }
  }

  if (config.type === "video" && config.provider === "runway") {
    return Boolean(process.env.RUNWAY_API_KEY?.trim());
  }

  return false;
}

/** @deprecated use isProviderConfigured */
export function isChatApiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
