import type { ChatEmbedConfig } from "@/data/embed-tools";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function formatProviderError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid api key") || lower.includes("incorrect api key")) {
    return `xAI: неверный API-ключ. Проверьте XAI_API_KEY.`;
  }

  if (lower.includes("rate limit")) {
    return "xAI: слишком много запросов. Подождите минуту.";
  }

  return `xAI: ${message}`;
}

export function isXaiConfigured(): boolean {
  return Boolean(process.env.XAI_API_KEY?.trim());
}

export async function callXai(
  config: ChatEmbedConfig,
  messages: ChatMessage[],
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) throw new Error("xAI API не настроен");

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: config.systemPrompt },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content.trim(),
        })),
      ],
      max_tokens: 2048,
    }),
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };

  if (!response.ok) {
    throw new Error(formatProviderError(data.error?.message ?? "Ошибка xAI API"));
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Пустой ответ от Grok");
  return text;
}
