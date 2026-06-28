"use client";

import type { EmbedConfig } from "@/data/embed-tools";
import { EmbeddedCanva } from "@/components/tools/embedded/EmbeddedCanva";
import { EmbeddedChat } from "@/components/tools/embedded/EmbeddedChat";
import { EmbeddedImage } from "@/components/tools/embedded/EmbeddedImage";
import { EmbeddedKlingVideo } from "@/components/tools/embedded/EmbeddedKlingVideo";
import { EmbeddedMonacoCode } from "@/components/tools/embedded/EmbeddedMonacoCode";
import { EmbeddedOpenAIChat } from "@/components/tools/embedded/EmbeddedOpenAIChat";
import { EmbeddedVeoVideo } from "@/components/tools/embedded/EmbeddedVeoVideo";
import { EmbeddedVideo } from "@/components/tools/embedded/EmbeddedVideo";
import type { DeaiSummary } from "@/lib/subscription/deai";

type EmbeddedToolProps = {
  slug: string;
  toolName: string;
  config: EmbedConfig;
  deai: DeaiSummary;
};

export function EmbeddedTool({ slug, toolName, config, deai }: EmbeddedToolProps) {
  if (config.type === "design") {
    return (
      <EmbeddedCanva
        slug={slug}
        toolName={toolName}
        config={config}
        initialDeai={deai}
      />
    );
  }

  if (config.type === "image") {
    return (
      <EmbeddedImage
        slug={slug}
        toolName={toolName}
        config={config}
        initialDeai={deai}
      />
    );
  }

  if (config.type === "video") {
    if (config.provider === "google-veo") {
      return (
        <EmbeddedVeoVideo
          slug={slug}
          toolName={toolName}
          config={config}
          initialDeai={deai}
        />
      );
    }

    if (config.provider === "kling") {
      return (
        <EmbeddedKlingVideo
          slug={slug}
          toolName={toolName}
          config={config}
          initialDeai={deai}
        />
      );
    }

    return (
      <EmbeddedVideo
        slug={slug}
        toolName={toolName}
        config={config}
        initialDeai={deai}
      />
    );
  }

  if (config.type === "code") {
    return (
      <EmbeddedMonacoCode
        slug={slug}
        toolName={toolName}
        config={config}
        initialDeai={deai}
      />
    );
  }

  if (config.type === "chat" && config.provider === "openai" && slug === "chatgpt") {
    return (
      <EmbeddedOpenAIChat
        slug={slug}
        toolName={toolName}
        config={config}
        initialDeai={deai}
      />
    );
  }

  return (
    <EmbeddedChat
      slug={slug}
      toolName={toolName}
      config={config}
      initialDeai={deai}
    />
  );
}
