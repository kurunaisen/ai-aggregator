import { EMBED_TOOLS, type EmbedConfig } from "@/data/embed-tools";
import { isCanvaConfigured } from "@/lib/providers/canva-config";
import { isFluxConfigured } from "@/lib/providers/flux";
import { isKlingConfigured } from "@/lib/providers/kling-jwt";
import { isGoogleApiConfigured } from "@/lib/providers/veo";
import { isXaiConfigured } from "@/lib/providers/xai-chat";

export const EMBEDDABLE_TOOL_SLUGS = Object.keys(EMBED_TOOLS);

export function isEmbeddableCatalogSlug(slug: string): boolean {
  return slug in EMBED_TOOLS;
}

export function getEmbedConfig(slug: string): EmbedConfig | null {
  if (slug in EMBED_TOOLS) {
    return EMBED_TOOLS[slug];
  }

  if (slug === "cursor") {
    return EMBED_TOOLS.monaco;
  }

  return null;
}

export function isEmbedEnabled(slug: string): boolean {
  return isEmbeddableCatalogSlug(slug) || slug === "cursor";
}

export function isProviderConfigured(config: EmbedConfig): boolean {
  if (config.type === "chat" || config.type === "code") {
    if (config.provider === "openai") {
      return Boolean(process.env.OPENAI_API_KEY?.trim());
    }
    if (config.provider === "anthropic") {
      return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
    }
    if (config.provider === "xai") {
      return isXaiConfigured();
    }
  }

  if (config.type === "image") {
    if (config.provider === "google-imagen") {
      return isGoogleApiConfigured();
    }
    if (config.provider === "bfl-flux") {
      return isFluxConfigured();
    }
  }

  if (config.type === "video") {
    if (config.provider === "runway") {
      return Boolean(process.env.RUNWAY_API_KEY?.trim());
    }
    if (config.provider === "google-veo") {
      return isGoogleApiConfigured();
    }
    if (config.provider === "kling") {
      return isKlingConfigured();
    }
  }

  if (config.type === "design") {
    if (config.provider === "canva-connect") {
      return isCanvaConfigured();
    }
  }

  return false;
}

export function getProviderEnvVar(config: EmbedConfig): string | null {
  if (config.type === "chat" || config.type === "code") {
    if (config.provider === "openai") return "OPENAI_API_KEY";
    if (config.provider === "anthropic") return "ANTHROPIC_API_KEY";
    if (config.provider === "xai") return "XAI_API_KEY";
  }

  if (config.type === "image") {
    if (config.provider === "google-imagen") return "GOOGLE_API_KEY";
    if (config.provider === "bfl-flux") return "BFL_API_KEY";
  }

  if (config.type === "video") {
    if (config.provider === "runway") return "RUNWAY_API_KEY";
    if (config.provider === "google-veo") return "GOOGLE_API_KEY";
    if (config.provider === "kling") return "KLING_ACCESS_KEY";
  }

  if (config.type === "design") {
    if (config.provider === "canva-connect") return "CANVA_CLIENT_ID";
  }

  return null;
}

/** @deprecated use isProviderConfigured */
export function isChatApiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
