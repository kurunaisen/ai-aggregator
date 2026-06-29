-- Безопасность: защита баланса/тарифа и валидация deduct_deai
-- Выполните в Supabase SQL Editor

-- 1) deduct_deai: запрет отрицательных сумм (иначе накрутка баланса)
create or replace function public.deduct_deai(p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  select deai_balance
  into v_balance
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception 'profile_not_found';
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

-- 2) add_deai: только положительные суммы (service_role)
create or replace function public.add_deai(p_amount numeric, p_user_id uuid default auth.uid())
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  if p_user_id is null then
    raise exception 'user_required';
  end if;

  update public.profiles
  set
    deai_balance = round((deai_balance + p_amount)::numeric, 1),
    updated_at = now()
  where id = p_user_id
  returning deai_balance into v_balance;

  if not found then
    raise exception 'profile_not_found';
  end if;

  return v_balance;
end;
$$;

revoke all on function public.add_deai(numeric, uuid) from public;
grant execute on function public.add_deai(numeric, uuid) to service_role;

-- 3) profiles: пользователь не может менять plan, balance, billing
create or replace function public.protect_profile_sensitive_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.email is distinct from old.email
     or new.plan is distinct from old.plan
     or new.deai_balance is distinct from old.deai_balance
     or new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.created_at is distinct from old.created_at then
    raise exception 'forbidden_profile_update';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_sensitive_columns on public.profiles;

create trigger protect_profile_sensitive_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_sensitive_columns();
