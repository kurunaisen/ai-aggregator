-- Pro: списание Deai для всех тарифов + начисление пакета при оплате
-- Выполните в Supabase SQL Editor

create or replace function public.deduct_deai(p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
begin
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

create or replace function public.add_deai(p_amount numeric, p_user_id uuid default auth.uid())
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
begin
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
