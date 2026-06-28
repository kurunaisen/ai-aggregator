-- Deai: токены вместо дневных лимитов
-- Выполните в Supabase SQL Editor после schema-aggregator.sql

alter table public.profiles
  add column if not exists deai_balance numeric(6, 1) not null default 50;

update public.profiles
set deai_balance = 25
where deai_balance is null;

alter table public.usage_logs
  add column if not exists deai_cost numeric(6, 1);

alter table public.usage_logs
  drop constraint if exists usage_logs_request_type_check;

alter table public.usage_logs
  add constraint usage_logs_request_type_check
  check (request_type in ('chat', 'video', 'image'));

create or replace function public.deduct_deai(p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_balance numeric;
begin
  select plan, deai_balance
  into v_plan, v_balance
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception 'profile_not_found';
  end if;

  if v_plan = 'pro' then
    return v_balance;
  end if;

  if v_balance < p_amount then
    raise exception 'insufficient_deai';
  end if;

  update public.profiles
  set
    deai_balance = round((deai_balance - p_amount)::numeric, 1),
    updated_at = now()
  where id = auth.uid()
  returning deai_balance into v_balance;

  return v_balance;
end;
$$;

revoke all on function public.deduct_deai(numeric) from public;
grant execute on function public.deduct_deai(numeric) to authenticated;

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
