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
  when 'claude' then 'claude-3-5-haiku-latest'
  when 'runway' then 'gen3a_turbo'
  else ul.tool_slug
end
where ul.model is null;
