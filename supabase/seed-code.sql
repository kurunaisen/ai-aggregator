-- Категория «Код» — вставьте этот SQL в Supabase → SQL Editor → Run
-- (не путь к файлу, а содержимое запроса ниже)

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
    'monaco',
    'Monaco Editor',
    'Редактор кода в браузере с AI-помощником',
    'Monaco Editor на DeltaplanAI — движок VS Code в браузере. Пишите код, выбирайте язык и спрашивайте AI об объяснении, отладке и рефакторинге. Оплата токенами Deai.',
    'Код',
    'code',
    'freemium',
    'https://microsoft.github.io/monaco-editor/',
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
