-- Только встроенные инструменты DeltaplanAI (Supabase → SQL Editor → Run)

insert into public.tools (
  slug,
  name,
  short_description,
  description,
  category,
  tool_type,
  pricing,
  website_url,
  featured,
  is_published
) values
  (
    'chatgpt',
    'ChatGPT',
    'Универсальный AI-ассистент от OpenAI',
    'ChatGPT на DeltaplanAI — чат с моделями OpenAI прямо на сайте. Тексты, код, анализ и рассуждения. Списание токенами Deai.',
    'Текст',
    'text',
    'freemium',
    'https://chat.openai.com',
    true,
    true
  ),
  (
    'claude',
    'Claude',
    'AI-ассистент от Anthropic',
    'Claude на DeltaplanAI — надёжный помощник для длинных текстов, анализа и кода. Работает через API Anthropic на сайте.',
    'Текст',
    'text',
    'freemium',
    'https://claude.ai',
    true,
    true
  ),
  (
    'grok',
    'Grok',
    'AI-ассистент от xAI',
    'Grok на DeltaplanAI — чат с моделями xAI через официальный API.',
    'Текст',
    'text',
    'freemium',
    'https://x.ai',
    true,
    true
  ),
  (
    'monaco',
    'Monaco Editor',
    'Редактор кода в браузере с AI-помощником',
    'Monaco Editor на DeltaplanAI — движок VS Code в браузере. Пишите код, выбирайте язык и спрашивайте AI об объяснении, отладке и рефакторинге.',
    'Код',
    'code',
    'freemium',
    'https://microsoft.github.io/monaco-editor/',
    true,
    true
  ),
  (
    'nanobanana',
    'Nano Banana',
    'Генерация изображений Google Gemini',
    'Nano Banana на DeltaplanAI — модели Gemini Image: 2.5 Flash, 3.1 Flash и 3 Pro. Text-to-image через Gemini API.',
    'Изображения',
    'image',
    'freemium',
    'https://ai.google.dev/gemini-api/docs/image-generation',
    true,
    true
  ),
  (
    'flux',
    'FLUX',
    'Генерация изображений Black Forest Labs',
    'FLUX на DeltaplanAI — модели FLUX.2 Pro и Klein через официальный BFL API.',
    'Изображения',
    'image',
    'freemium',
    'https://bfl.ai/models/flux-2',
    false,
    true
  ),
  (
    'runway',
    'Runway',
    'Генерация видео с помощью AI',
    'Runway на DeltaplanAI — создайте короткое видео из текстового описания через Gen-3 Turbo. Списание кредитами Deai.',
    'Видео',
    'video',
    'freemium',
    'https://runwayml.com',
    false,
    true
  ),
  (
    'veo',
    'Google Veo',
    'Генерация видео от Google DeepMind',
    'Google Veo на DeltaplanAI — модели Veo 3.1, Fast и Lite. Текст, изображение или Ingredients to Video через Gemini API.',
    'Видео',
    'video',
    'freemium',
    'https://deepmind.google/models/veo/',
    true,
    true
  ),
  (
    'kling',
    'Kling',
    'Генерация видео Kling AI',
    'Kling на DeltaplanAI — text-to-video через официальный API Kling: модели 2.6, 2.5 Turbo и 2.1 Master.',
    'Видео',
    'video',
    'freemium',
    'https://klingai.com',
    true,
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  category = excluded.category,
  tool_type = excluded.tool_type,
  pricing = excluded.pricing,
  website_url = excluded.website_url,
  featured = excluded.featured,
  is_published = excluded.is_published;

-- Скрыть инструменты без встроенного виджета
update public.tools
set is_published = false
where slug not in (
  'chatgpt', 'claude', 'grok', 'monaco', 'nanobanana', 'flux', 'runway', 'veo', 'kling'
);
