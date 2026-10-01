-- Комплекты документов пользователя и инструмент «Документы»
-- Supabase → SQL Editor → Run

create table if not exists public.document_bases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  created_at timestamptz not null default now()
);

create table if not exists public.source_documents (
  id uuid primary key default gen_random_uuid(),
  base_id uuid not null references public.document_bases (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  filename text not null,
  char_count integer not null default 0,
  notice text,
  created_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.source_documents (id) on delete cascade,
  base_id uuid not null references public.document_bases (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  search_text tsvector generated always as (to_tsvector('russian', content)) stored
);

create index if not exists document_bases_user_idx
  on public.document_bases (user_id, created_at desc);

create index if not exists source_documents_base_idx
  on public.source_documents (base_id, user_id);

create index if not exists document_chunks_base_idx
  on public.document_chunks (base_id, user_id, chunk_index);

create index if not exists document_chunks_search_idx
  on public.document_chunks using gin (search_text);

alter table public.document_bases enable row level security;
alter table public.source_documents enable row level security;
alter table public.document_chunks enable row level security;

drop policy if exists "Users read own document bases" on public.document_bases;
drop policy if exists "Users insert own document bases" on public.document_bases;
drop policy if exists "Users update own document bases" on public.document_bases;
drop policy if exists "Users delete own document bases" on public.document_bases;

create policy "Users read own document bases"
  on public.document_bases for select
  using (auth.uid() = user_id);

create policy "Users insert own document bases"
  on public.document_bases for insert
  with check (auth.uid() = user_id);

create policy "Users update own document bases"
  on public.document_bases for update
  using (auth.uid() = user_id);

create policy "Users delete own document bases"
  on public.document_bases for delete
  using (auth.uid() = user_id);

drop policy if exists "Users read own source documents" on public.source_documents;
drop policy if exists "Users insert own source documents" on public.source_documents;
drop policy if exists "Users delete own source documents" on public.source_documents;

create policy "Users read own source documents"
  on public.source_documents for select
  using (auth.uid() = user_id);

create policy "Users insert own source documents"
  on public.source_documents for insert
  with check (auth.uid() = user_id);

create policy "Users delete own source documents"
  on public.source_documents for delete
  using (auth.uid() = user_id);

drop policy if exists "Users read own document chunks" on public.document_chunks;
drop policy if exists "Users insert own document chunks" on public.document_chunks;
drop policy if exists "Users delete own document chunks" on public.document_chunks;

create policy "Users read own document chunks"
  on public.document_chunks for select
  using (auth.uid() = user_id);

create policy "Users insert own document chunks"
  on public.document_chunks for insert
  with check (auth.uid() = user_id);

create policy "Users delete own document chunks"
  on public.document_chunks for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.document_bases to authenticated;
grant select, insert, delete on public.source_documents to authenticated;
grant select, insert, delete on public.document_chunks to authenticated;

create or replace function public.match_document_chunks(
  p_base_id uuid,
  p_query text,
  p_limit integer default 12
)
returns table (
  chunk_id uuid,
  document_id uuid,
  filename text,
  chunk_index integer,
  content text,
  rank real
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_query tsquery;
  v_word text;
  v_part tsquery;
  v_limit integer;
begin
  if auth.uid() is null then
    return;
  end if;

  v_limit := least(greatest(coalesce(p_limit, 12), 1), 24);
  v_query := null;

  for v_word in
    select token
    from (
      select distinct token
      from regexp_split_to_table(
        lower(coalesce(p_query, '')),
        '[^0-9a-zа-яё./_-]+'
      ) as token
    ) words
    where char_length(token) >= 3
    limit 24
  loop
    begin
      v_part := plainto_tsquery('russian', v_word);
    exception
      when others then
        v_part := null;
    end;

    if v_part is not null and v_part::text <> '' then
      if v_query is null then
        v_query := v_part;
      else
        v_query := v_query || v_part;
      end if;
    end if;
  end loop;

  if v_query is null then
    return;
  end if;

  return query
  select
    c.id,
    c.document_id,
    d.filename,
    c.chunk_index,
    c.content,
    ts_rank(c.search_text, v_query)::real
  from public.document_chunks c
  join public.source_documents d on d.id = c.document_id
  where c.base_id = p_base_id
    and c.user_id = auth.uid()
    and c.search_text @@ v_query
  order by ts_rank(c.search_text, v_query) desc, d.filename, c.chunk_index
  limit v_limit;
end;
$$;

revoke all on function public.match_document_chunks(uuid, text, integer) from public;
grant execute on function public.match_document_chunks(uuid, text, integer) to authenticated;

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
  'documents',
  'Документы',
  'Ответы, акты, ППР и протоколы по вашим файлам',
  'Документы на DeltaplanAI: загрузите PDF, DOCX и текстовые файлы. Система отвечает на вопросы и готовит черновики актов, ППР, протоколов и писем только по фактам из ваших документов. Пропуски помечаются как [уточнить].',
  'Текст',
  'text',
  'freemium',
  'https://platform.openai.com',
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

-- Смысловой поиск: supabase/migration-document-embeddings.sql
