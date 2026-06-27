import type { EmbedConfig } from "@/data/embed-tools";
import type { UsageSummary } from "@/lib/subscription/usage";
import { EmbeddedChat } from "@/components/tools/embedded/EmbeddedChat";
import { EmbeddedOpenAIChat } from "@/components/tools/embedded/EmbeddedOpenAIChat";
import { EmbeddedVideo } from "@/components/tools/embedded/EmbeddedVideo";

type EmbeddedToolProps = {
  slug: string;
  toolName: string;
  config: EmbedConfig;
  usage: UsageSummary;
};

export function EmbeddedTool({
  slug,
  toolName,
  config,
  usage,
}: EmbeddedToolProps) {
  if (config.type === "video") {
    return (
      <EmbeddedVideo
        slug={slug}
        toolName={toolName}
        config={config}
        initialUsage={usage}
      />
    );
  }

  if (config.type === "chat" && config.provider === "openai" && slug === "chatgpt") {
    return (
      <EmbeddedOpenAIChat
        slug={slug}
        toolName={toolName}
        config={config}
        initialUsage={usage}
      />
    );
  }

  return (
    <EmbeddedChat
      slug={slug}
      toolName={toolName}
      config={config}
      initialUsage={usage}
    />
  );
}
