-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Tools catalog
create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text not null,
  description text not null,
  long_description text not null,
  category text not null,
  pricing text not null check (pricing in ('free', 'freemium', 'paid')),
  website text not null,
  featured boolean not null default false,
  tags text[] not null default '{}',
  features text[] not null default '{}',
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- User submissions
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  category text not null,
  description text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists tools_published_idx on public.tools (published);
create index if not exists tools_slug_idx on public.tools (slug);
create index if not exists tools_category_idx on public.tools (category);

alter table public.tools enable row level security;
alter table public.submissions enable row level security;

-- Public read: published tools only (anon key)
create policy "Public can read published tools"
  on public.tools for select
  using (published = true);

-- Public insert: submissions (anon key, no service role on client)
create policy "Anyone can submit a tool"
  on public.submissions for insert
  with check (true);

-- Seed data (optional)
-- Seed: только встроенные инструменты (legacy schema; для новой БД используйте seed-embed-tools.sql)
insert into public.tools (slug, name, tagline, description, long_description, category, pricing, website, featured, tags, features, published) values
  ('chatgpt', 'ChatGPT', 'Универсальный AI-ассистент от OpenAI', 'Мультимодальный чат-бот для текста, кода, анализа и повседневных задач.', 'ChatGPT на DeltaplanAI — чат с моделями OpenAI прямо на сайте.', 'text', 'freemium', 'https://chat.openai.com', true, array['чат','gpt','openai'], array['Диалоги на русском','Генерация кода','Выбор модели'], true),
  ('claude', 'Claude', 'AI-ассистент от Anthropic', 'Надёжный помощник для длинных документов, анализа и написания кода.', 'Claude на DeltaplanAI — работает через API Anthropic на сайте.', 'text', 'freemium', 'https://claude.ai', true, array['чат','anthropic'], array['Большой контекст','Анализ','Код'], true),
  ('monaco', 'Monaco Editor', 'Редактор кода с AI', 'Monaco — движок VS Code в браузере на DeltaplanAI.', 'Monaco Editor: подсветка синтаксиса, языки программирования и AI-помощник для кода.', 'code', 'freemium', 'https://microsoft.github.io/monaco-editor/', true, array['код','ide','monaco'], array['Monaco','AI по коду'], true),
  ('runway', 'Runway', 'AI для видео', 'Генерация видео из текста на DeltaplanAI.', 'Runway Gen-3 Turbo — короткие ролики прямо на сайте.', 'video', 'freemium', 'https://runwayml.com', false, array['видео'], array['Text-to-video'], true),
  ('veo', 'Google Veo', 'Генерация видео от Google', 'Veo 3.1 на DeltaplanAI через Gemini API.', 'Google Veo — текст, изображение и Ingredients to Video.', 'video', 'freemium', 'https://deepmind.google/models/veo/', true, array['видео','google'], array['Veo 3.1','720p–4K'], true)
on conflict (slug) do nothing;
