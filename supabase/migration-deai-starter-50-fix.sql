-- Дополнение к migration-deai-starter-50.sql
-- 1) Новые пользователи — 50 Deai (функция + default)
-- 2) Существующие free-аккаунты с 25 Deai — поднять до 50

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

-- У кого уже был стартовый баланс 25 — довести до 50
update public.profiles
set
  deai_balance = 50,
  updated_at = now()
where plan = 'free'
  and deai_balance = 25;

-- Проверка (должны быть default 50 и ваш баланс 50)
select id, email, plan, deai_balance, updated_at
from public.profiles
order by created_at desc
limit 10;
