import type { ChatEmbedConfig } from "@/data/embed-tools";
import {
  extractXaiErrorBody,
  formatXaiApiError,
  parseXaiJsonResponse,
} from "@/lib/providers/xai-errors";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type XaiChatResponse = {
  error?: { message?: string; code?: string; type?: string } | string;
  detail?: string;
  message?: string;
  choices?: { message?: { content?: string } }[];
};

export function isXaiConfigured(): boolean {
  return Boolean(process.env.XAI_API_KEY?.trim());
}

export async function callXai(
  config: ChatEmbedConfig,
  messages: ChatMessage[],
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("xAI API не настроен. Добавьте XAI_API_KEY на Vercel.");
  }

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
      stream: false,
    }),
  });

  const data = await parseXaiJsonResponse<XaiChatResponse>(response, "chat");

  if (!response.ok) {
    throw new Error(
      formatXaiApiError(extractXaiErrorBody(data, response.status, response.statusText), "chat"),
    );
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Пустой ответ от Grok");
  return text;
}
