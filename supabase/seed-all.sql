-- Все дополнительные инструменты: «Код» + «Видео»
-- Supabase → SQL Editor → вставьте и выполните весь файл

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
  -- Код
  (
    'cursor',
    'Cursor',
    'AI-редактор кода на базе VS Code',
    'Cursor — IDE с встроенным AI-агентом: автодополнение, рефакторинг, объяснение кода и правки по описанию на естественном языке. Подходит для веб-разработки, скриптов и быстрого прототипирования.',
    'Код',
    'code',
    'freemium',
    'https://cursor.com',
    true,
    true
  ),
  (
    'github-copilot',
    'GitHub Copilot',
    'AI-помощник для автодополнения кода в IDE',
    'GitHub Copilot интегрируется в VS Code, JetBrains, Neovim и другие редакторы. Предлагает строки и функции по контексту проекта, помогает писать тесты и документацию.',
    'Код',
    'code',
    'paid',
    'https://github.com/features/copilot',
    false,
    true
  ),
  (
    'codeium',
    'Codeium',
    'Бесплатное AI-автодополнение для кода',
    'Codeium — помощник для разработчиков с автодополнением, чатом по кодовой базе и поддержкой множества языков. Есть бесплатный тариф для индивидуальных разработчиков и расширения для популярных IDE.',
    'Код',
    'code',
    'freemium',
    'https://codeium.com',
    false,
    true
  ),
  (
    'tabnine',
    'Tabnine',
    'AI-автодополнение с поддержкой локальных моделей',
    'Tabnine ускоряет написание кода за счёт контекстных подсказок в IDE. Поддерживает облачные и локальные модели, что удобно для команд с требованиями к приватности кода.',
    'Код',
    'code',
    'freemium',
    'https://www.tabnine.com',
    false,
    true
  ),
  -- Видео
  (
    'runway',
    'Runway',
    'Генерация и редактирование видео с помощью AI',
    'Runway — платформа для создания видео из текста, редактирования кадров и работы с AI-моделями Gen-3. Подходит для креативных проектов, рекламы и прототипирования роликов.',
    'Видео',
    'video',
    'freemium',
    'https://runwayml.com',
    false,
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
