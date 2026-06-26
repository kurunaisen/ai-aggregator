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
insert into public.tools (slug, name, tagline, description, long_description, category, pricing, website, featured, tags, features, published) values
  ('chatgpt', 'ChatGPT', 'Универсальный AI-ассистент от OpenAI', 'Мультимодальный чат-бот для текста, кода, анализа и повседневных задач.', 'ChatGPT — один из самых популярных AI-ассистентов. Подходит для написания текстов, программирования, мозгового штурма, перевода и работы с документами.', 'text', 'freemium', 'https://chat.openai.com', true, array['чат','gpt','openai'], array['Диалоги на русском','Генерация кода','Анализ файлов'], true),
  ('claude', 'Claude', 'AI-ассистент от Anthropic', 'Надёжный помощник для длинных документов, анализа и написания кода.', 'Claude от Anthropic славится качественной работой с большими текстами и сильными возможностями в программировании.', 'text', 'freemium', 'https://claude.ai', true, array['чат','anthropic'], array['Большой контекст','Artifacts','API'], true),
  ('midjourney', 'Midjourney', 'Генерация изображений по тексту', 'Один из лидеров в создании художественных иллюстраций.', 'Midjourney позволяет создавать высококачественные изображения по промптам.', 'image', 'paid', 'https://midjourney.com', true, array['изображения','арт'], array['Upscale','Стилизация'], true),
  ('cursor', 'Cursor', 'AI-редактор кода', 'IDE с встроенным AI-агентом для разработчиков.', 'Cursor — редактор на базе VS Code с глубокой AI-интеграцией.', 'code', 'freemium', 'https://cursor.com', true, array['код','ide'], array['AI-агент','Inline-редактирование'], true),
  ('github-copilot', 'GitHub Copilot', 'AI-помощник для разработчиков', 'Автодополнение кода прямо в IDE.', 'GitHub Copilot интегрируется в VS Code, JetBrains и другие редакторы.', 'code', 'paid', 'https://github.com/features/copilot', false, array['код','github'], array['Автодополнение','Chat в IDE'], true),
  ('runway', 'Runway', 'AI для видео', 'Генерация и редактирование видео.', 'Runway предлагает AI-модели для создания видео из текста.', 'video', 'freemium', 'https://runwayml.com', false, array['видео'], array['Text-to-video','Inpainting'], true),
  ('elevenlabs', 'ElevenLabs', 'Озвучка и клонирование голоса', 'Text-to-speech с естественным звучанием.', 'ElevenLabs создаёт озвучку для видео, подкастов и приложений.', 'audio', 'freemium', 'https://elevenlabs.io', false, array['голос','tts'], array['TTS','Клонирование голоса'], true),
  ('perplexity', 'Perplexity', 'AI-поиск с источниками', 'Поисковик с AI-ответами и ссылками.', 'Perplexity сочетает поиск в интернете с генерацией ответов.', 'text', 'freemium', 'https://perplexity.ai', false, array['поиск'], array['Цитаты','Pro Search'], true),
  ('stable-diffusion', 'Stable Diffusion', 'Open-source генерация изображений', 'Модель для локальной и облачной генерации.', 'Stable Diffusion — популярная open-source модель для изображений.', 'image', 'free', 'https://stability.ai', false, array['open-source'], array['Локальный запуск','LoRA'], true)
on conflict (slug) do nothing;
