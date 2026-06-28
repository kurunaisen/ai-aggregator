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
    previewVideoUrl: "/videos/chatgpt-preview.mp4",
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
      "Выберите модель под задачу. Haiku 4.5 быстро анализирует диаграммы и графики; Sonnet и Opus — для сложных текстов и кода. Прикрепите изображение кнопкой «Изображение» или вставкой Ctrl+V.",
    placeholder: "Сообщение или опишите прикреплённую диаграмму...",
  },
  grok: {
    type: "chat",
    provider: "xai",
    model: "grok-4.3",
    systemPrompt:
      "Ты Grok — AI-ассистент от xAI. Отвечай на русском, если пользователь пишет по-русски. Будь прямым и полезным.",
    headerDescription:
      "Чат-ассистент xAI на DeltaplanAI — прямые ответы, рассуждения и помощь в повседневных и рабочих задачах: тексты, идеи, код и анализ в одном диалоговом окне на сайте.",
    headerHighlights: [
      "Модель Grok 4.3 от xAI",
      "Тексты, идеи, код и анализ без лишних формальностей",
      "Генерация изображений — отдельный инструмент Grok Imagine",
      "Списание Deai по объёму запроса",
    ],
    welcomeMessage:
      "Задайте вопрос или опишите задачу — Grok ответит прямо в этом окне.",
    placeholder: "Сообщение для Grok...",
  },
  "grok-imagine": {
    type: "image",
    provider: "xai-imagine",
    model: "grok-imagine-image",
    headerDescription:
      "Grok Imagine на DeltaplanAI — генерация изображений от xAI: иллюстрации, постеры, продуктовые кадры и концепт-арт по текстовому описанию, с выбором модели и формата кадра.",
    headerHighlights: [
      "Две модели: Grok Imagine (2 Deai) и Imagine Quality (4.5 Deai) за картинку",
      "Разрешение 1K или 2K; соотношение сторон auto, 1:1, 16:9, 9:16 и другие",
      "Чат Grok — отдельный инструмент на сайте",
      "Фиксированная цена за картинку в Deai",
    ],
    welcomeMessage:
      "Опишите сцену текстом — Grok Imagine сгенерирует изображение. Для чата откройте инструмент Grok.",
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
      "Deai списывается только за AI-запросы",
    ],
    welcomeMessage:
      "Пишите код и спрашивайте AI: объяснение, исправление, рефакторинг, тесты.",
    placeholder: "Например: объясни этот код / найди ошибку / добавь типизацию...",
  },
  nanobanana: {
    type: "image",
    provider: "google-imagen",
    model: "gemini-2.5-flash-image",
    headerDescription:
      "Nano Banana — генерация изображений Google Gemini на DeltaplanAI. Опишите сцену текстом и получите картинку в нужном формате и разрешении — постеры, иллюстрации, концепт-арт и предметная съёмка.",
    headerHighlights: [
      "Три модели: 2.5 Flash, 3.1 Flash и 3 Pro Image",
      "Качество 1K / 2K / 4K и соотношения 1:1, 16:9, 9:16, 4:3, 3:4",
      "Быстрые Flash-модели и Pro Image для детализированных кадров",
      "Альтернатива на сайте: FLUX от Black Forest Labs",
    ],
    welcomeMessage:
      "Опишите изображение текстом — Nano Banana сгенерирует картинку. Также попробуйте FLUX для фотореализма.",
    placeholder: "Например: минималистичный постер с космонавтом на фоне заката...",
  },
  flux: {
    type: "image",
    provider: "bfl-flux",
    model: "flux-2-klein-4b",
    headerDescription:
      "FLUX на DeltaplanAI — фотореалистичная генерация изображений от Black Forest Labs: портреты, предметка, иллюстрации и концепт-арт по текстовому описанию, с выбором модели под задачу.",
    headerHighlights: [
      "Пять моделей: Klein 4B/9B, Pro 1.1 и FLUX.2 Pro — от быстрых до max quality",
      "Настройка качества и формата кадра перед генерацией",
      "Фотореализм и детализация от Black Forest Labs",
      "Списание Deai зависит от модели и разрешения",
    ],
    welcomeMessage:
      "Опишите кадр — FLUX сгенерирует фотореалистичное изображение.",
    placeholder: "Например: студийный портрет, мягкий свет, 85mm, ultra detailed...",
  },
  runway: {
    type: "video",
    provider: "runway",
    model: "gen4.5",
    headerDescription:
      "Runway на DeltaplanAI — генерация видео из текста (Gen-4.5) или анимация стартового кадра (image-to-video). Выберите режим, модель, формат и длительность ролика.",
    headerHighlights: [
      "Text-to-video: Gen-4.5 по текстовому промпту",
      "Image-to-video: Gen-4.5, Gen-4 Turbo или Gen-3 Alpha Turbo",
      "Форматы 16:9, 9:16, 1:1 и другие; длительность 5 или 10 секунд",
      "Списание Deai зависит от модели и длительности",
    ],
    welcomeMessage:
      "Выберите режим: видео по тексту или анимация загруженного кадра.",
    placeholder: "Например: закат над океаном, камера медленно приближается...",
    duration: 5,
    ratio: "1280:720",
  },
  veo: {
    type: "video",
    provider: "google-veo",
    model: "veo-3.1-generate-preview",
    headerDescription:
      "Google Veo 3.1 на DeltaplanAI — генерация видео от Google DeepMind: из текста, по стартовому кадру или из набора «ингредиентов» (Ingredients to Video) с настройкой разрешения и длительности.",
    headerHighlights: [
      "Три модели: Veo 3.1, Fast и Lite — максимум качества или скорость",
      "Режимы: текст → видео, фото → видео, Ingredients to Video",
      "Разрешение 720p–4K, длительность 4–8 сек, форматы 16:9 и 9:16",
      "Списание Deai зависит от модели, длительности и разрешения",
    ],
    welcomeMessage:
      "Выберите модель и режим: текст, изображение или Ingredients to Video.",
    placeholder: "Например: дрон летит над горами на рассвете, кинематографичный кадр...",
    duration: 8,
    ratio: "16:9",
  },
  kling: {
    type: "video",
    provider: "kling",
    model: "kling-v2-6",
    headerDescription:
      "Kling AI на DeltaplanAI — генерация коротких роликов из текста: реалистичные сцены с настройкой длительности, формата кадра и режима качества Std / Pro.",
    headerHighlights: [
      "Модели Kling 2.6, 2.5 Turbo и 2.1 Master",
      "Длительность 5 или 10 сек; форматы 16:9, 9:16 и 1:1",
      "Режимы Std и Pro; опциональный звук в Kling 2.6",
      "Списание Deai зависит от модели и длительности",
    ],
    welcomeMessage:
      "Опишите сцену — Kling сгенерирует короткое видео.",
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
