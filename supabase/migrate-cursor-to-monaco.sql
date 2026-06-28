-- Замена Cursor на встроенный Monaco Editor
-- Выполните в Supabase SQL Editor

update public.tools
set
  slug = 'monaco',
  name = 'Monaco Editor',
  short_description = 'Редактор кода в браузере с AI-помощником',
  description = 'Monaco Editor на DeltaplanAI — тот же движок, что в VS Code. Пишите код в браузере, выбирайте язык (TypeScript, Python, Go и др.) и спрашивайте AI: объяснение, отладка, рефакторинг. Оплата токенами Deai.',
  website_url = 'https://microsoft.github.io/monaco-editor/',
  featured = true,
  is_published = true
where slug = 'cursor';

-- Если cursor не было — добавить Monaco
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
) values (
  'monaco',
  'Monaco Editor',
  'Редактор кода в браузере с AI-помощником',
  'Monaco Editor на DeltaplanAI — движок VS Code в браузере. Языки: TypeScript, JavaScript, Python, Rust, Go и другие. AI помогает объяснять, исправлять и улучшать код. Списание Deai (токены).',
  'Код',
  'code',
  'freemium',
  'https://microsoft.github.io/monaco-editor/',
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

update public.usage_logs set tool_slug = 'monaco' where tool_slug = 'cursor';
