-- Стартовый баланс для новых пользователей: 50 Deai
-- Выполните в Supabase SQL Editor на уже развёрнутой БД
--
-- Важно: migration-deai-starter-50.sql НЕ меняет уже созданные профили.
-- Если баланс остался 25 — выполните migration-deai-starter-50-fix.sql

alter table public.profiles
  alter column deai_balance set default 50;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, plan, deai_balance)
  values (new.id, new.email, 'free', 50)
  on conflict (id) do nothing;
  return new;
end;
$$;
