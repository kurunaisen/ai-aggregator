import { getRagConfig } from "@/lib/rag/config";

export class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderError";
  }
}

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

function scrub(detail: string): string {
  return detail.replace(/sk-[a-zA-Z0-9_-]+/g, "sk-…").slice(0, 240);
}

function messageFromStatus(status: number, body: string): string {
  let detail = "";
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    detail = parsed.error?.message ?? "";
  } catch {
    detail = "";
  }
  const safe = scrub(detail);

  if (status === 401 || status === 403) {
    return "Ключ модели отклонён. Проверьте OPENAI_API_KEY.";
  }
  if (status === 404) {
    return safe
      ? `Модель или адрес API не найдены. ${safe}`
      : "Модель или адрес API не найдены. Проверьте OPENAI_BASE_URL, RAG_CHAT_MODEL и RAG_EMBEDDING_MODEL.";
  }
  if (status === 429) {
    return "Сервис модели ограничил частоту запросов. Подождите немного и повторите.";
  }
  return safe
    ? `Не удалось обратиться к сервису модели. ${safe}`
    : "Не удалось обратиться к сервису модели.";
}

async function postJson(path: string, body: Record<string, unknown>): Promise<unknown> {
  const config = getRagConfig();
  if (!config.apiKey) {
    throw new ProviderError("Ключ модели не задан.");
  }

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ProviderError("Нет соединения с сервисом модели. Проверьте OPENAI_BASE_URL.");
  }

  const raw = await response.text();
  if (!response.ok) {
    throw new ProviderError(messageFromStatus(response.status, raw));
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new ProviderError("Сервис модели вернул не JSON.");
  }
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const config = getRagConfig();
  const vectors: number[][] = [];

  for (let index = 0; index < texts.length; index += 32) {
    const batch = texts.slice(index, index + 32).map((text) => text.slice(0, 6000));
    const payload = (await postJson("/embeddings", {
      model: config.embeddingModel,
      input: batch,
    })) as { data?: { index?: number; embedding?: number[] }[] };

    const rows = payload.data ?? [];
    if (rows.length !== batch.length) {
      throw new ProviderError("Сервис эмбеддингов вернул неполный ответ.");
    }

    rows.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    for (const row of rows) {
      if (!row.embedding?.length) {
        throw new ProviderError("Сервис эмбеддингов вернул пустой вектор.");
      }
      vectors.push(row.embedding);
    }
  }

  return vectors;
}

function readContent(payload: unknown): string {
  const content = (payload as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]
    ?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .join("");
  }
  return "";
}

async function chatOnce(messages: ChatMessage[], jsonMode: boolean): Promise<string> {
  const config = getRagConfig();
  const body: Record<string, unknown> = {
    model: config.chatModel,
    temperature: 0,
    messages,
  };
  if (jsonMode) body.response_format = { type: "json_object" };

  try {
    const payload = await postJson("/chat/completions", body);
    return readContent(payload);
  } catch (error) {
    if (!(error instanceof ProviderError)) throw error;
    const lower = error.message.toLowerCase();
    if (lower.includes("temperature")) {
      delete body.temperature;
      const payload = await postJson("/chat/completions", body);
      return readContent(payload);
    }
    throw error;
  }
}

export async function completeChat(messages: ChatMessage[]): Promise<string> {
  try {
    return await chatOnce(messages, true);
  } catch (error) {
    if (!(error instanceof ProviderError)) throw error;
    const lower = error.message.toLowerCase();
    if (lower.includes("response_format") || lower.includes("json_object") || lower.includes("json mode")) {
      return chatOnce(messages, false);
    }
    throw error;
  }
}
