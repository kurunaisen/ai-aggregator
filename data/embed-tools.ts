export type ChatEmbedConfig = {
  type: "chat";
  provider: "openai" | "anthropic";
  model: string;
  systemPrompt: string;
  welcomeMessage: string;
  placeholder?: string;
};

export type CodeEmbedConfig = {
  type: "code";
  provider: "openai";
  model: string;
  defaultLanguage: string;
  systemPrompt: string;
  welcomeMessage: string;
  placeholder?: string;
};

export type VideoEmbedConfig = {
  type: "video";
  provider: "runway" | "google-veo";
  model: string;
  welcomeMessage: string;
  placeholder?: string;
  duration?: number;
  ratio?: string;
};

export type EmbedConfig = ChatEmbedConfig | CodeEmbedConfig | VideoEmbedConfig;

/** Встроенные инструменты агрегатора DeltaplanAI */
export const EMBED_TOOLS: Record<string, EmbedConfig> = {
  chatgpt: {
    type: "chat",
    provider: "openai",
    model: "gpt-4o-mini",
    systemPrompt:
      "Ты полезный AI-ассистент. Отвечай на русском языке, если пользователь пишет по-русски. Будь кратким и понятным.",
    welcomeMessage:
      "Пробуй, стирай все и заново пробуй. Нет плохих идей, есть не раскрытый потенциал. Знай все получиться!!!",
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
  monaco: {
    type: "code",
    provider: "openai",
    model: "gpt-4o-mini",
    defaultLanguage: "typescript",
    systemPrompt:
      "Ты опытный инженер-программист на DeltaplanAI. Помогай писать, объяснять, отлаживать и рефакторить код. Отвечай на русском, если пользователь пишет по-русски. Когда даёшь код — используй markdown-блоки с языком. Учитывай текущий код редактора из контекста.",
    welcomeMessage:
      "Monaco Editor — пишите код и спрашивайте AI: объяснение, исправление, рефакторинг, тесты.",
    placeholder: "Например: объясни этот код / найди ошибку / добавь типизацию...",
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
  veo: {
    type: "video",
    provider: "google-veo",
    model: "veo-3.1-generate-preview",
    welcomeMessage:
      "Google Veo на DeltaplanAI. Выберите модель и режим: текст, изображение или Ingredients to Video.",
    placeholder: "Например: дрон летит над горами на рассвете, кинематографичный кадр...",
    duration: 8,
    ratio: "16:9",
  },
};
