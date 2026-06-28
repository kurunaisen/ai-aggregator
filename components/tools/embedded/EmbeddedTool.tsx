import type { EmbedConfig } from "@/data/embed-tools";
import type { DeaiSummary } from "@/lib/subscription/deai";
import { EmbeddedChat } from "@/components/tools/embedded/EmbeddedChat";
import { EmbeddedMonacoCode } from "@/components/tools/embedded/EmbeddedMonacoCode";
import { EmbeddedOpenAIChat } from "@/components/tools/embedded/EmbeddedOpenAIChat";
import { EmbeddedVideo } from "@/components/tools/embedded/EmbeddedVideo";

type EmbeddedToolProps = {
  slug: string;
  toolName: string;
  config: EmbedConfig;
  deai: DeaiSummary;
};

export function EmbeddedTool({ slug, toolName, config, deai }: EmbeddedToolProps) {
  if (config.type === "video") {
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
