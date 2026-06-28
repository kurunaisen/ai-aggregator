"use client";

import { useEffect, useState } from "react";
import type { EmbedConfig } from "@/data/embed-tools";

type ProviderStatus = {
  openai: boolean;
  anthropic: boolean;
  xai: boolean;
  runway: boolean;
  google: boolean;
  bfl: boolean;
  kling: boolean;
};

function isConfigured(config: EmbedConfig, status: ProviderStatus): boolean {
  if (config.type === "chat" || config.type === "code") {
    if (config.provider === "openai") return status.openai;
    if (config.provider === "anthropic") return status.anthropic;
    if (config.provider === "xai") return status.xai;
  }

  if (config.type === "image") {
    if (config.provider === "google-imagen") return status.google;
    if (config.provider === "bfl-flux") return status.bfl;
    if (config.provider === "xai-imagine") return status.xai;
  }

  if (config.type === "video") {
    if (config.provider === "runway") return status.runway;
    if (config.provider === "google-veo") return status.google;
    if (config.provider === "kling") return status.kling;
  }

  return false;
}

export function useProviderConfigured(config: EmbedConfig) {
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/providers/status")
      .then((response) => response.json())
      .then((status: ProviderStatus) => {
        if (!cancelled) setConfigured(isConfigured(config, status));
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
      });

    return () => {
      cancelled = true;
    };
  }, [config]);

  return configured;
}
