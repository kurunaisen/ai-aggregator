-- Google Veo — каталог + встроенный инструмент
-- Supabase → SQL Editor → Run

insert into public.tools (
  slug,
  name,
  short_description,
  description,
  category,
  tool_type,
  pricing,
  website_url,
  featured,
  is_published
) values (
  'veo',
  'Google Veo',
  'Генерация видео от Google DeepMind',
  'Google Veo — модель для создания реалистичного видео из текста. На DeltaplanAI доступна генерация через Gemini API: опишите сцену и получите короткий ролик. Списание кредитами Deai.',
  'Видео',
  'video',
  'freemium',
  'https://deepmind.google/models/veo/',
  true,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  category = excluded.category,
  tool_type = excluded.tool_type,
  pricing = excluded.pricing,
  website_url = excluded.website_url,
  featured = excluded.featured,
  is_published = excluded.is_published;
