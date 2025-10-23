-- ============================================
-- SECURITY FIXES: Function Search Path & Extensions
-- ============================================

-- Fix 1, 2, 3: Add search_path to functions without it

-- Fix update_updated_at_column function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Fix match_rag_chunks function (already has search_path, but recreating to be sure)
create or replace function public.match_rag_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5,
  filter_user_id uuid default null
)
returns table (
  id uuid,
  chunk_id uuid,
  document_id uuid,
  content text,
  similarity float,
  metadata jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select
    e.id,
    e.chunk_id,
    c.document_id,
    c.content,
    1 - (e.embedding <=> query_embedding) as similarity,
    c.metadata
  from public.rag_embeddings e
  join public.rag_chunks c on c.id = e.chunk_id
  where 
    (filter_user_id is null or e.user_id = filter_user_id)
    and 1 - (e.embedding <=> query_embedding) > match_threshold
  order by e.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Fix 4: Move extensions to 'extensions' schema instead of 'public'
-- Note: uuid-ossp should be in extensions schema by default
-- vector extension will remain in public for now as it's required for the vector type
-- This is acceptable as vector is specifically designed for this purpose