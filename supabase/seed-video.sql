-- Категория «Видео» — вставьте этот SQL в Supabase → SQL Editor → Run
-- (не путь к файлу, а содержимое запроса ниже)

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
  'runway',
  'Runway',
  'Генерация и редактирование видео с помощью AI',
  'Runway — платформа для создания видео из текста, редактирования кадров и работы с AI-моделями Gen-3. Подходит для креативных проектов, рекламы и прототипирования роликов.',
  'Видео',
  'video',
  'freemium',
  'https://runwayml.com',
  false,
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
