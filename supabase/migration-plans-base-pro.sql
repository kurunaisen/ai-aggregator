-- Тарифы: free | base (990 Deai) | pro (2000 Deai + видео-студия)
-- Выполните в Supabase SQL Editor

alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'base', 'pro'));

-- Старый plan=pro (990 ₽) → base
update public.profiles
set plan = 'base', updated_at = now()
where plan = 'pro';
