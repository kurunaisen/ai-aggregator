-- Скрыть Canva из каталога (инструмент удалён из embed-виджетов)
update public.tools
set is_published = false
where slug = 'canva';
