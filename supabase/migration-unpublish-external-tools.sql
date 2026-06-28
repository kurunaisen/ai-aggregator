-- Скрыть в каталоге инструменты без встроенного виджета
-- Supabase → SQL Editor → Run (после seed-embed-tools.sql)

update public.tools
set is_published = false
where slug not in (
  'chatgpt', 'claude', 'grok', 'grok-imagine', 'monaco', 'nanobanana', 'flux', 'runway', 'veo', 'kling'
);
