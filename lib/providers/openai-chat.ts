import type { ChatEmbedConfig } from "@/data/embed-tools";
import type {
  OpenAIChatRequestOptions,
  ResponseFormatType,
} from "@/data/openai-models";
import { modelSupportsReasoning } from "@/data/openai-models";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function formatProviderError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("exceeded your current quota") || lower.includes("insufficient_quota")) {
    return "OpenAI: исчерпана квота или не подключена оплата. Пополните баланс на platform.openai.com → Billing.";
  }

  if (lower.includes("invalid api key") || lower.includes("incorrect api key")) {
    return "OpenAI: неверный API-ключ. Проверьте OPENAI_API_KEY в настройках сервера.";
  }

  if (lower.includes("rate limit")) {
    return "OpenAI: слишком много запросов. Подождите минуту и попробуйте снова.";
  }

  return `OpenAI: ${message}`;
}

function isReasoningModel(model: string): boolean {
  return modelSupportsReasoning(model);
}

function buildResponseFormat(
  responseFormat: ResponseFormatType,
  schema?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (responseFormat === "text") return undefined;

  if (responseFormat === "json_object") {
    return { type: "json_object" };
  }

  return {
    type: "json_schema",
    json_schema: {
      name: "response",
      strict: true,
      schema,
    },
  };
}

function buildSystemPrompt(
  basePrompt: string,
  responseFormat: ResponseFormatType,
): string {
  if (responseFormat === "json_object") {
    return `${basePrompt}\n\nОтвечай только валидным JSON без markdown и пояснений вне JSON.`;
  }

  return basePrompt;
}

export async function callOpenAI(
  config: ChatEmbedConfig,
  messages: ChatMessage[],
  options: OpenAIChatRequestOptions,
  parsedSchema?: Record<string, unknown>,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OpenAI API не настроен");

  const model = options.model;
  const reasoning = isReasoningModel(model);
  const responseFormat = buildResponseFormat(options.responseFormat, parsedSchema);

  const body: Record<string, unknown> = {
    model,
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(config.systemPrompt, options.responseFormat),
      },
      ...messages.map((message) => ({
        role: message.role,
        content: message.content.trim(),
      })),
    ],
  };

  if (reasoning) {
    body.max_completion_tokens = 4096;
    const effort = options.reasoningEffort ?? "medium";
    body.reasoning_effort = effort;
  } else {
    body.temperature = 0.7;
    body.max_tokens = 4096;
  }

  if (responseFormat) {
    body.response_format = responseFormat;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };

  if (!response.ok) {
    throw new Error(formatProviderError(data.error?.message ?? "Ошибка OpenAI API"));
  }

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("Пустой ответ от OpenAI");
  return reply;
}
