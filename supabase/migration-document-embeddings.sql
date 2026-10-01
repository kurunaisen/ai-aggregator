-- Смысловой поиск по фрагментам документов.
-- Выполните в Supabase → SQL Editor после migration-document-bases.sql.
-- Повторный запуск безопасен.

create extension if not exists vector with schema extensions;

alter table public.document_chunks
  add column if not exists embedding extensions.vector(1536);

create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

create or replace function public.match_document_chunks_semantic(
  p_base_id uuid,
  p_embedding text,
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
set search_path = public, extensions
as $$
declare
  v_embedding extensions.vector(1536);
  v_limit integer;
begin
  if auth.uid() is null or p_embedding is null or length(p_embedding) < 3 then
    return;
  end if;

  v_embedding := p_embedding::extensions.vector;
  v_limit := least(greatest(coalesce(p_limit, 12), 1), 24);

  return query
  select
    c.id,
    c.document_id,
    d.filename,
    c.chunk_index,
    c.content,
    (1 - (c.embedding <=> v_embedding))::real
  from public.document_chunks c
  join public.source_documents d on d.id = c.document_id
  where c.base_id = p_base_id
    and c.user_id = auth.uid()
    and c.embedding is not null
  order by c.embedding <=> v_embedding
  limit v_limit;
end;
$$;

revoke all on function public.match_document_chunks_semantic(uuid, text, integer) from public;
grant execute on function public.match_document_chunks_semantic(uuid, text, integer) to authenticated;

create or replace function public.expand_document_chunk_neighbors(
  p_base_id uuid,
  p_chunk_ids uuid[]
)
returns table (
  chunk_id uuid,
  document_id uuid,
  filename text,
  chunk_index integer,
  content text,
  rank real
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    n.id,
    n.document_id,
    d.filename,
    n.chunk_index,
    n.content,
    0::real
  from public.document_chunks c
  join public.document_chunks n
    on n.document_id = c.document_id
   and n.user_id = c.user_id
   and n.chunk_index between c.chunk_index - 1 and c.chunk_index + 1
  join public.source_documents d on d.id = n.document_id
  where c.base_id = p_base_id
    and c.user_id = auth.uid()
    and c.id = any(p_chunk_ids);
$$;

revoke all on function public.expand_document_chunk_neighbors(uuid, uuid[]) from public;
grant execute on function public.expand_document_chunk_neighbors(uuid, uuid[]) to authenticated;
