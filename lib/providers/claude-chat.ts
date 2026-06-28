import type { ChatEmbedConfig } from "@/data/embed-tools";
import type { ClaudeChatAttachment, ClaudeChatMessage } from "@/data/claude-models";
import { parseClaudeDataUrl } from "@/lib/chat/claude-attachments";

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: ClaudeChatAttachment["mediaType"];
        data: string;
      };
    };

function formatProviderError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("credit balance") ||
    lower.includes("billing") ||
    lower.includes("purchase credits")
  ) {
    return (
      "Anthropic: пополните кредиты или привяжите карту на console.anthropic.com → Billing."
    );
  }

  if (lower.includes("invalid") && lower.includes("key")) {
    return "Anthropic: неверный ANTHROPIC_API_KEY. Проверьте ключ на console.anthropic.com.";
  }

  if (lower.includes("rate limit")) {
    return "Anthropic: слишком много запросов. Подождите минуту.";
  }

  return `Anthropic: ${message}`;
}

function buildUserContent(message: ClaudeChatMessage): AnthropicContentBlock[] {
  const blocks: AnthropicContentBlock[] = [];

  for (const attachment of message.attachments ?? []) {
    const parsed = parseClaudeDataUrl(attachment.dataUrl);
    if ("error" in parsed) continue;

    blocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: parsed.mediaType,
        data: parsed.base64,
      },
    });
  }

  const text = message.content.trim();
  if (text) {
    blocks.push({ type: "text", text });
  }

  if (blocks.length === 0) {
    blocks.push({ type: "text", text: "Опишите вложение." });
  }

  return blocks;
}

export async function callClaude(
  config: ChatEmbedConfig,
  model: string,
  messages: ClaudeChatMessage[],
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("Anthropic API не настроен");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: config.systemPrompt,
      messages: messages.map((message) => {
        if (message.role === "assistant") {
          return {
            role: "assistant",
            content: message.content.trim(),
          };
        }

        const hasImages = (message.attachments?.length ?? 0) > 0;
        if (!hasImages) {
          return {
            role: "user",
            content: message.content.trim(),
          };
        }

        return {
          role: "user",
          content: buildUserContent(message),
        };
      }),
    }),
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    content?: { type: string; text?: string }[];
  };

  if (!response.ok) {
    throw new Error(formatProviderError(data.error?.message ?? "Ошибка Anthropic API"));
  }

  const text = data.content?.find((block) => block.type === "text")?.text?.trim();
  if (!text) throw new Error("Пустой ответ от Claude");
  return text;
}

/** @deprecated use callClaude */
export async function callAnthropic(
  config: ChatEmbedConfig,
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  return callClaude(
    config,
    config.model,
    messages.map((message) => ({ ...message })),
  );
}
