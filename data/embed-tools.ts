export type ChatEmbedConfig = {
  type: "chat";
  provider: "openai" | "anthropic";
  model: string;
  systemPrompt: string;
  welcomeMessage: string;
  placeholder?: string;
};

export type VideoEmbedConfig = {
  type: "video";
  provider: "runway";
  model: string;
  welcomeMessage: string;
  placeholder?: string;
  duration?: number;
  ratio?: string;
};

export type EmbedConfig = ChatEmbedConfig | VideoEmbedConfig;

/** Встроенные инструменты агрегатора DeltaplanAI */
export const EMBED_TOOLS: Record<string, EmbedConfig> = {
  chatgpt: {
    type: "chat",
    provider: "openai",
    model: "gpt-4o-mini",
    systemPrompt:
      "Ты полезный AI-ассистент. Отвечай на русском языке, если пользователь пишет по-русски. Будь кратким и понятным.",
    welcomeMessage:
      "ChatGPT на DeltaplanAI. Задайте вопрос — текст, код, идеи, перевод.",
    placeholder: "Напишите сообщение...",
  },
  claude: {
    type: "chat",
    provider: "anthropic",
    model: "claude-3-5-haiku-latest",
    systemPrompt:
      "Ты Claude — полезный AI-ассистент от Anthropic. Отвечай на русском, если пользователь пишет по-русски.",
    welcomeMessage:
      "Claude на DeltaplanAI. Анализ, тексты, код и рассуждения — прямо здесь.",
    placeholder: "Сообщение для Claude...",
  },
  runway: {
    type: "video",
    provider: "runway",
    model: "gen3a_turbo",
    welcomeMessage:
      "Runway на DeltaplanAI. Опишите сцену — мы сгенерируем короткое видео.",
    placeholder: "Например: закат над океаном, камера медленно приближается...",
    duration: 5,
    ratio: "16:9",
  },
};
