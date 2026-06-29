-- ЮKassa: заказы на оплату тарифов Base / Pro
-- Выполните в Supabase SQL Editor

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null default 'yookassa',
  external_id text not null unique,
  plan text not null check (plan in ('base', 'pro')),
  amount_rub numeric(10, 2) not null,
  deai_grant numeric(8, 1) not null,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'canceled')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists payment_orders_user_created_idx
  on public.payment_orders (user_id, created_at desc);

alter table public.payment_orders enable row level security;

create policy "Users read own payment orders"
  on public.payment_orders for select
  using (auth.uid() = user_id);
