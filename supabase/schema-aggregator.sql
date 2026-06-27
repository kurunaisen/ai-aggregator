-- Этап 1: агрегатор — профили, учёт запросов, RLS
-- Выполните в Supabase SQL Editor после schema.sql

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_id text default 'star',
  plan text not null default 'free' check (plan in ('free', 'pro')),
  deai_balance numeric(6, 1) not null default 25,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tool_slug text not null,
  request_type text not null check (request_type in ('chat', 'video', 'image')),
  deai_cost numeric(6, 1),
  model text,
  created_at timestamptz not null default now()
);

create index if not exists usage_logs_user_day_idx
  on public.usage_logs (user_id, created_at desc);

create index if not exists usage_logs_tool_idx
  on public.usage_logs (tool_slug);

alter table public.profiles enable row level security;
alter table public.usage_logs enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users read own usage"
  on public.usage_logs for select
  using (auth.uid() = user_id);

create policy "Users insert own usage"
  on public.usage_logs for insert
  with check (auth.uid() = user_id);

-- Профиль при регистрации
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, plan, deai_balance)
  values (new.id, new.email, 'free', 25)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
