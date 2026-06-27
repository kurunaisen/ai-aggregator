import type { ChatEmbedConfig } from "@/data/embed-tools";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function callOpenAI(
  config: ChatEmbedConfig,
  messages: ChatMessage[],
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OpenAI API не настроен");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: config.systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content.trim() })),
      ],
      temperature: 0.7,
    }),
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Ошибка OpenAI API");
  }

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("Пустой ответ от OpenAI");
  return reply;
}

export async function callAnthropic(
  config: ChatEmbedConfig,
  messages: ChatMessage[],
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
      model: config.model,
      max_tokens: 1024,
      system: config.systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content.trim(),
      })),
    }),
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    content?: { type: string; text?: string }[];
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Ошибка Anthropic API");
  }

  const text = data.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) throw new Error("Пустой ответ от Claude");
  return text;
}

const RUNWAY_BASE = "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";

function runwayHeaders() {
  const apiKey = process.env.RUNWAY_API_KEY?.trim();
  if (!apiKey) throw new Error("Runway API не настроен");
  return {
    Authorization: `Bearer ${apiKey}`,
    "X-Runway-Version": RUNWAY_VERSION,
    "Content-Type": "application/json",
  };
}

export async function startRunwayVideo(
  prompt: string,
  model: string,
  duration: number,
  ratio: string,
): Promise<string> {
  const response = await fetch(`${RUNWAY_BASE}/text_to_video`, {
    method: "POST",
    headers: runwayHeaders(),
    body: JSON.stringify({
      model,
      promptText: prompt.trim(),
      duration,
      ratio,
    }),
  });

  const data = (await response.json()) as {
    error?: string;
    id?: string;
  };

  if (!response.ok || !data.id) {
    throw new Error(data.error ?? "Не удалось запустить генерацию Runway");
  }

  return data.id;
}

export async function pollRunwayTask(taskId: string): Promise<{
  status: string;
  videoUrl?: string;
  error?: string;
}> {
  const response = await fetch(`${RUNWAY_BASE}/tasks/${taskId}`, {
    headers: runwayHeaders(),
  });

  const data = (await response.json()) as {
    status?: string;
    output?: string[];
    failure?: string;
    failureCode?: string;
  };

  if (!response.ok) {
    throw new Error("Ошибка при проверке статуса Runway");
  }

  const status = data.status ?? "UNKNOWN";

  if (status === "SUCCEEDED") {
    const videoUrl = data.output?.[0];
    if (!videoUrl) throw new Error("Runway не вернул URL видео");
    return { status, videoUrl };
  }

  if (status === "FAILED") {
    return {
      status,
      error: data.failure ?? data.failureCode ?? "Генерация не удалась",
    };
  }

  return { status };
}
