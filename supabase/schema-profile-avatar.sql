-- Иконка профиля (пресет из приложения)
-- Выполните в Supabase SQL Editor после schema-profile.sql

alter table public.profiles
  add column if not exists avatar_id text default 'star';

update public.profiles
set avatar_id = 'star'
where avatar_id is null;
