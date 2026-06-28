import { EMBED_TOOLS, type EmbedConfig } from "@/data/embed-tools";

export function getEmbedConfig(slug: string): EmbedConfig | null {
  if (slug in EMBED_TOOLS) {
    return EMBED_TOOLS[slug];
  }

  // Старые ссылки /tool/cursor → Monaco
  if (slug === "cursor") {
    return EMBED_TOOLS.monaco;
  }

  return null;
}

export function isEmbedEnabled(slug: string): boolean {
  return slug in EMBED_TOOLS || slug === "cursor";
}

export function isProviderConfigured(config: EmbedConfig): boolean {
  if (config.type === "chat" || config.type === "code") {
    if (config.provider === "openai") {
      return Boolean(process.env.OPENAI_API_KEY?.trim());
    }
    if (config.provider === "anthropic") {
      return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
    }
  }

  if (config.type === "video") {
    if (config.provider === "runway") {
      return Boolean(process.env.RUNWAY_API_KEY?.trim());
    }
    if (config.provider === "google-veo") {
      return Boolean(
        process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim(),
      );
    }
  }

  return false;
}

export function getProviderEnvVar(config: EmbedConfig): string | null {
  if (config.type === "chat" || config.type === "code") {
    if (config.provider === "openai") return "OPENAI_API_KEY";
    if (config.provider === "anthropic") return "ANTHROPIC_API_KEY";
  }
  if (config.type === "video" && config.provider === "runway") return "RUNWAY_API_KEY";
  if (config.type === "video" && config.provider === "google-veo") {
    return "GOOGLE_API_KEY";
  }
  return null;
}

/** @deprecated use isProviderConfigured */
export function isChatApiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
