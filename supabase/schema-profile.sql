-- Профиль: имя аккаунта и аналитика Deai по моделям
-- Выполните в Supabase SQL Editor после schema-deai.sql

alter table public.profiles
  add column if not exists display_name text;

alter table public.usage_logs
  add column if not exists model text;

create index if not exists usage_logs_user_model_day_idx
  on public.usage_logs (user_id, created_at desc, model);

-- Заполнить model для старых записей из tool_slug
update public.usage_logs ul
set model = case ul.tool_slug
  when 'chatgpt' then 'gpt-4o-mini'
  when 'claude' then 'claude-haiku-4-5-20251001'
  when 'grok' then 'grok-3'
  when 'nanobanana' then 'gemini-2.5-flash-image'
  when 'flux' then 'flux-2-klein-4b'
  when 'kling' then 'kling-v2-6'
  when 'runway' then 'gen3a_turbo'
  else ul.tool_slug
end
where ul.model is null;
