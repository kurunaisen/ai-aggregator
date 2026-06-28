-- Встроенные инструменты: Monaco + Runway
-- Supabase → SQL Editor → Run

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
    'runway',
    'Runway',
    'Генерация и редактирование видео с помощью AI',
    'Runway на DeltaplanAI — создайте короткое видео из текстового описания через Gen-3 Turbo.',
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

update public.tools
set is_published = false
where slug in ('github-copilot', 'codeium', 'tabnine', 'cursor');
