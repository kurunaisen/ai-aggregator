import type { EmbedConfig } from "@/data/embed-tools";
import type { UsageSummary } from "@/lib/subscription/usage";
import { EmbeddedChat } from "@/components/tools/embedded/EmbeddedChat";
import { EmbeddedVideo } from "@/components/tools/embedded/EmbeddedVideo";

type EmbeddedToolProps = {
  slug: string;
  toolName: string;
  config: EmbedConfig;
  providerConfigured: boolean;
  usage: UsageSummary;
};

export function EmbeddedTool({
  slug,
  toolName,
  config,
  providerConfigured,
  usage,
}: EmbeddedToolProps) {
  if (config.type === "video") {
    return (
      <EmbeddedVideo
        slug={slug}
        toolName={toolName}
        config={config}
        providerConfigured={providerConfigured}
        initialUsage={usage}
      />
    );
  }

  return (
    <EmbeddedChat
      slug={slug}
      toolName={toolName}
      config={config}
      providerConfigured={providerConfigured}
      initialUsage={usage}
    />
  );
}
