type EmbedPageHeader = {
  /** Описание в шапке страницы инструмента */
  headerDescription?: string;
  headerHighlights?: string[];
  /** URL короткого видео-превью (справа в шапке) */
  previewVideoUrl?: string;
};

export type ChatEmbedConfig = EmbedPageHeader & {
  type: "chat";
  provider: "openai" | "anthropic" | "xai";
  model: string;
  systemPrompt: string;
  welcomeMessage: string;
  placeholder?: string;
};

export type CodeEmbedConfig = EmbedPageHeader & {
  type: "code";
  provider: "openai";
  model: string;
  defaultLanguage: string;
  systemPrompt: string;
  welcomeMessage: string;
  placeholder?: string;
};

export type ImageEmbedConfig = EmbedPageHeader & {
  type: "image";
  provider: "google-imagen" | "bfl-flux" | "xai-imagine";
  model: string;
  welcomeMessage: string;
  placeholder?: string;
};

export type VideoEmbedConfig = EmbedPageHeader & {
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
    headerDescription:
      "Универсальный чат-ассистент OpenAI на DeltaplanAI: генерация и правка текстов, написание и отладка кода, анализ информации, структурированные ответы и задачи с пошаговым рассуждением — прямо на сайте, без перехода в сторонние сервисы.",
    headerHighlights: [
      "11 моделей на выбор: GPT-4.1, GPT-4o, GPT-5, o3, o4-mini и другие",
      "Формат ответа: обычный текст, JSON-объект или JSON по вашей схеме",
      "Reasoning для GPT-5 и o-series — сложная логика, код и математика",
      "Диалоги на русском; списание Deai зависит от модели и объёма запроса",
    ],
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
    headerDescription:
      "AI-ассистент Anthropic на DeltaplanAI: длинные тексты, код, анализ документов и vision — распознавание диаграмм, графиков и скриншотов прямо в чате, без перехода на claude.ai.",
    headerHighlights: [
      "Три модели: Haiku 4.5, Sonnet 4.6 и Opus 4.8 — от скорости до максимального качества",
      "Vision: прикрепите изображение или вставьте Ctrl+V — до 5 файлов по 5 МБ",
      "Haiku — быстрый разбор диаграмм; Sonnet — тексты и код; Opus — сложные задачи",
      "Диалоги на русском; списание Deai по выбранной модели",
    ],
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
    headerDescription:
      "Чат-ассистент xAI на DeltaplanAI — прямые ответы, рассуждения и помощь в повседневных и рабочих задачах: тексты, идеи, код и анализ в одном диалоговом окне на сайте.",
    headerHighlights: [
      "Модель Grok 3 через официальный API xAI",
      "Тексты, идеи, код и анализ без лишних формальностей",
      "Генерация изображений — отдельный инструмент Grok Imagine",
      "Списание Deai по объёму запроса; нужен XAI_API_KEY",
    ],
    welcomeMessage:
      "Grok на DeltaplanAI — чат с моделями xAI прямо на сайте.",
    placeholder: "Сообщение для Grok...",
  },
  "grok-imagine": {
    type: "image",
    provider: "xai-imagine",
    model: "grok-imagine-image",
    headerDescription:
      "Grok Imagine на DeltaplanAI — генерация изображений через официальный API xAI: иллюстрации, постеры, продуктовые кадры и концепт-арт по текстовому описанию, с выбором модели и формата кадра.",
    headerHighlights: [
      "Две модели: Grok Imagine (2 Deai) и Imagine Quality (4.5 Deai) за картинку",
      "Разрешение 1K или 2K; соотношение сторон auto, 1:1, 16:9, 9:16 и другие",
      "Тот же XAI_API_KEY, что и для чата Grok",
      "FLAT-цена за изображение; списание Deai с наценкой платформы",
    ],
    welcomeMessage:
      "Grok Imagine — опишите сцену текстом. Для чата с Grok перейдите в /tool/grok.",
    placeholder: "Например: фотореалистичный портрет кота-астронавта в неоновом городе...",
  },
  monaco: {
    type: "code",
    provider: "openai",
    model: "gpt-4o-mini",
    defaultLanguage: "typescript",
    systemPrompt:
      "Ты опытный инженер-программист на DeltaplanAI. Помогай писать, объяснять, отлаживать и рефакторить код. Отвечай на русском, если пользователь пишет по-русски. Когда даёшь код — используй markdown-блоки с языком. Учитывай текущий код редактора из контекста.",
    headerDescription:
      "Monaco Editor на DeltaplanAI — полноценный редактор кода в браузере с AI-помощником: пишите, объясняйте, исправляйте и рефакторите код в одном окне, как в VS Code.",
    headerHighlights: [
      "Движок VS Code: подсветка синтаксиса и десятки языков программирования",
      "AI видит код из редактора — объяснение, отладка, рефакторинг, тесты",
      "Модели OpenAI на выбор — те же возможности, что в ChatGPT",
      "Редактор бесплатен; Deai списывается только за AI-запросы",
    ],
    welcomeMessage:
      "Monaco Editor — пишите код и спрашивайте AI: объяснение, исправление, рефакторинг, тесты.",
    placeholder: "Например: объясни этот код / найди ошибку / добавь типизацию...",
  },
  nanobanana: {
    type: "image",
    provider: "google-imagen",
    model: "gemini-2.5-flash-image",
    headerDescription:
      "Nano Banana — генерация изображений через Gemini API на DeltaplanAI. Опишите сцену текстом и получите картинку в нужном формате и разрешении — постеры, иллюстрации, концепт-арт и предметная съёмка.",
    headerHighlights: [
      "Три модели: 2.5 Flash, 3.1 Flash и 3 Pro Image",
      "Качество 1K / 2K / 4K и соотношения 1:1, 16:9, 9:16, 4:3, 3:4",
      "Нужен платный GOOGLE_API_KEY — image-модели не входят в free tier",
      "Альтернатива на сайте: FLUX от Black Forest Labs",
    ],
    welcomeMessage:
      "Nano Banana на DeltaplanAI — генерация изображений через Gemini API. Требуется платный API-ключ Google (image-модели не входят в free tier). Альтернатива: FLUX.",
    placeholder: "Например: минималистичный постер с космонавтом на фоне заката...",
  },
  flux: {
    type: "image",
    provider: "bfl-flux",
    model: "flux-2-klein-4b",
    headerDescription:
      "FLUX на DeltaplanAI — фотореалистичная генерация изображений через Black Forest Labs: портреты, предметка, иллюстрации и концепт-арт по текстовому описанию, с выбором модели под бюджет и качество.",
    headerHighlights: [
      "Пять моделей: Klein 4B/9B, Pro 1.1 и FLUX.2 Pro — от дешёвых до max quality",
      "Настройка качества и формата кадра перед генерацией",
      "API-ключ BFL — пополнение кредитов на api.bfl.ai",
      "Списание Deai зависит от модели и разрешения",
    ],
    welcomeMessage:
      "FLUX на DeltaplanAI — фотореалистичные изображения через Black Forest Labs. Нужен API-ключ BFL (пополнение кредитов на api.bfl.ai).",
    placeholder: "Например: студийный портрет, мягкий свет, 85mm, ultra detailed...",
  },
  runway: {
    type: "video",
    provider: "runway",
    model: "gen3a_turbo",
    headerDescription:
      "Runway Gen-3 Turbo на DeltaplanAI — генерация короткого видео из текстового описания. Опишите сцену, движение камеры и атмосферу — получите ролик прямо на сайте.",
    headerHighlights: [
      "Text-to-video через Runway API",
      "Длительность до 5 секунд, формат 16:9",
      "Кинематографичные сцены по промпту на русском или английском",
      "Списание Deai за секунду сгенерированного видео; нужен RUNWAY_API_KEY",
    ],
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
    headerDescription:
      "Google Veo 3.1 на DeltaplanAI — генерация видео через Gemini API: из текста, по стартовому кадру или из набора «ингредиентов» (Ingredients to Video) с настройкой разрешения и длительности.",
    headerHighlights: [
      "Три модели: Veo 3.1, Fast и Lite — максимум качества или скорость",
      "Режимы: текст → видео, фото → видео, Ingredients to Video",
      "Разрешение 720p–4K, длительность 4–8 сек, форматы 16:9 и 9:16",
      "Требуется GOOGLE_API_KEY с доступом к Veo",
    ],
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
    headerDescription:
      "Kling AI на DeltaplanAI — text-to-video через официальный API: реалистичные короткие ролики с настройкой длительности, формата кадра и режима качества Std / Pro.",
    headerHighlights: [
      "Модели Kling 2.6, 2.5 Turbo и 2.1 Master",
      "Длительность 5 или 10 сек; форматы 16:9, 9:16 и 1:1",
      "Режимы Std и Pro; опциональный звук в Kling 2.6",
      "KLING_ACCESS_KEY и KLING_SECRET_KEY на Vercel",
    ],
    welcomeMessage:
      "Kling на DeltaplanAI — text-to-video через официальный API Kling AI.",
    placeholder: "Например: кинематографичный кадр: город в дождливую ночь, неоновые отражения...",
    duration: 5,
    ratio: "16:9",
  },
};

/** Slugs инструментов с встроенным виджетом на сайте */
export const EMBED_TOOL_SLUGS = Object.keys(EMBED_TOOLS);

export type EmbedHeaderContent = {
  description: string;
  highlights?: string[];
  previewVideoUrl?: string;
};

export function getEmbedHeaderContent(config: EmbedConfig): EmbedHeaderContent | undefined {
  if (!config.headerDescription) {
    return undefined;
  }

  return {
    description: config.headerDescription,
    highlights: config.headerHighlights,
    previewVideoUrl: config.previewVideoUrl,
  };
}
