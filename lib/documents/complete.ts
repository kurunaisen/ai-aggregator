import { DOCUMENTS_MODEL } from "@/lib/documents/constants";
import { documentsSystemPrompt } from "@/lib/documents/prompt";

type ChatTurn = {
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

export async function completeDocuments(messages: ChatTurn[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OpenAI API не настроен");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DOCUMENTS_MODEL,
      temperature: 0.2,
      max_tokens: 6000,
      messages: [
        { role: "system", content: documentsSystemPrompt() },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content.trim(),
        })),
      ],
    }),
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };

  if (!response.ok) {
    throw new Error(formatProviderError(data.error?.message ?? "Ошибка OpenAI API"));
  }

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("Пустой ответ от модели");
  return reply;
}
