export type ChatEmbedConfig = {
  type: "chat";
  provider: "openai" | "anthropic" | "xai";
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

export type ImageEmbedConfig = {
  type: "image";
  provider: "google-imagen" | "bfl-flux";
  model: string;
  welcomeMessage: string;
  placeholder?: string;
};

export type VideoEmbedConfig = {
  type: "video";
  provider: "runway" | "google-veo" | "kling";
  model: string;
  welcomeMessage: string;
  placeholder?: string;
  duration?: number;
  ratio?: string;
};

export type EmbedConfig =
  | ChatEmbedConfig
  | CodeEmbedConfig
  | ImageEmbedConfig
  | VideoEmbedConfig;

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
    model: "claude-haiku-4-5-20251001",
    systemPrompt:
      "Ты Claude — полезный AI-ассистент от Anthropic. Отвечай на русском, если пользователь пишет по-русски. Если пользователь прислал изображение — внимательно проанализируй диаграмму, график или скриншот и отвечай по существу.",
    welcomeMessage:
      "Claude на DeltaplanAI — выберите модель под задачу. Haiku 4.5 быстро анализирует диаграммы и графики; Sonnet и Opus — для сложных текстов и кода. Прикрепите изображение кнопкой «Изображение» или вставкой Ctrl+V.",
    placeholder: "Сообщение или опишите прикреплённую диаграмму...",
  },
  grok: {
    type: "chat",
    provider: "xai",
    model: "grok-3",
    systemPrompt:
      "Ты Grok — AI-ассистент от xAI. Отвечай на русском, если пользователь пишет по-русски. Будь прямым и полезным.",
    welcomeMessage:
      "Grok на DeltaplanAI — чат с моделями xAI прямо на сайте.",
    placeholder: "Сообщение для Grok...",
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
  nanobanana: {
    type: "image",
    provider: "google-imagen",
    model: "gemini-2.5-flash-image",
    welcomeMessage:
      "Nano Banana на DeltaplanAI — генерация изображений через Gemini API. Требуется платный API-ключ Google (image-модели не входят в free tier). Альтернатива: FLUX.",
    placeholder: "Например: минималистичный постер с космонавтом на фоне заката...",
  },
  flux: {
    type: "image",
    provider: "bfl-flux",
    model: "flux-2-klein-4b",
    welcomeMessage:
      "FLUX на DeltaplanAI — фотореалистичные изображения через Black Forest Labs. Нужен API-ключ BFL (пополнение кредитов на api.bfl.ai).",
    placeholder: "Например: студийный портрет, мягкий свет, 85mm, ultra detailed...",
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
  kling: {
    type: "video",
    provider: "kling",
    model: "kling-v2-6",
    welcomeMessage:
      "Kling на DeltaplanAI — text-to-video через официальный API Kling AI.",
    placeholder: "Например: кинематографичный кадр: город в дождливую ночь, неоновые отражения...",
    duration: 5,
    ratio: "16:9",
  },
};

/** Slugs инструментов с встроенным виджетом на сайте */
export const EMBED_TOOL_SLUGS = Object.keys(EMBED_TOOLS);
