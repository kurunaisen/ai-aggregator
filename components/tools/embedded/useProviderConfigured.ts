"use client";

import { useEffect, useState } from "react";
import type { EmbedConfig } from "@/data/embed-tools";

type ProviderStatus = {
  openai: boolean;
  anthropic: boolean;
  runway: boolean;
};

function isConfigured(config: EmbedConfig, status: ProviderStatus): boolean {
  if (config.type === "chat") return status[config.provider];
  if (config.type === "video") return status.runway;
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
