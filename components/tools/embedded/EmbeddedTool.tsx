"use client";

import type { EmbedConfig } from "@/data/embed-tools";
import { EmbeddedClaudeChat } from "@/components/tools/embedded/EmbeddedClaudeChat";
import { EmbeddedChat } from "@/components/tools/embedded/EmbeddedChat";
import { EmbeddedImage } from "@/components/tools/embedded/EmbeddedImage";
import { EmbeddedKlingVideo } from "@/components/tools/embedded/EmbeddedKlingVideo";
import { EmbeddedMonacoCode } from "@/components/tools/embedded/EmbeddedMonacoCode";
import { EmbeddedOpenAIChat } from "@/components/tools/embedded/EmbeddedOpenAIChat";
import { EmbeddedRunwayVideo } from "@/components/tools/embedded/EmbeddedRunwayVideo";
import { EmbeddedVeoVideo } from "@/components/tools/embedded/EmbeddedVeoVideo";
import { EmbeddedToolHeader } from "@/components/tools/embedded/EmbeddedToolHeader";
import { ToolAccessGateMessage } from "@/components/tools/embedded/BaseTrialGateMessage";
import type { DeaiSummary } from "@/lib/subscription/deai";
import type { ToolAccessStatus } from "@/lib/subscription/tool-access";

type EmbeddedToolProps = {
  slug: string;
  toolName: string;
  config: EmbedConfig;
  deai: DeaiSummary;
  toolAccess?: ToolAccessStatus;
};

export function EmbeddedTool({ slug, toolName, config, deai, toolAccess }: EmbeddedToolProps) {
  if (toolAccess && !toolAccess.allowed) {
    return (
      <div className="carbon-panel flex min-h-[520px] flex-col overflow-hidden rounded-2xl">
        <EmbeddedToolHeader toolName={toolName} deai={deai} />
        <ToolAccessGateMessage toolName={toolName} access={toolAccess} />
      </div>
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
          toolAccess={toolAccess}
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
      <EmbeddedRunwayVideo
        slug={slug}
        toolName={toolName}
        config={config}
        initialDeai={deai}
        toolAccess={toolAccess}
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

  if (config.type === "chat" && config.provider === "anthropic") {
    return (
      <EmbeddedClaudeChat
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
