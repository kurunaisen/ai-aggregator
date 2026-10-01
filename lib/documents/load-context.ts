import type { SupabaseClient } from "@supabase/supabase-js";
import { mergePieces, packPieces, type ContextPiece } from "@/lib/documents/chunk";
import {
  EMBED_BACKFILL_BATCH,
  EMBED_BACKFILL_ROUNDS,
  FULL_CONTEXT_CHARS,
  MAX_CONTEXT_CHARS,
  MAX_RETRIEVED_CHUNKS,
  MAX_SEMANTIC_CHUNKS,
} from "@/lib/documents/constants";
import { embedTexts, formatVector } from "@/lib/documents/embed";
import { isOptionalSearchError } from "@/lib/documents/schema";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

type SourceRow = {
  id: string;
  filename: string;
  char_count: number;
};

type ChunkRow = {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
};

type MatchRow = {
  chunk_id: string;
  document_id: string;
  filename: string;
  chunk_index: number;
  content: string;
};

export type LoadedContext = {
  pieces: ContextPiece[];
  coverage: "full" | "retrieved";
  documentCount: number;
  files: { filename: string; charCount: number }[];
};

function mapChunk(row: ChunkRow, filenames: Map<string, string>): ContextPiece {
  return {
    id: row.id,
    documentId: row.document_id,
    filename: filenames.get(row.document_id) ?? "Документ",
    chunkIndex: row.chunk_index,
    content: row.content,
  };
}

function mapMatch(row: MatchRow): ContextPiece {
  return {
    id: row.chunk_id,
    documentId: row.document_id,
    filename: row.filename,
    chunkIndex: row.chunk_index,
    content: row.content,
  };
}

async function keywordMatches(
  supabase: Client,
  baseId: string,
  query: string,
): Promise<ContextPiece[]> {
  const { data, error } = await supabase.rpc("match_document_chunks", {
    p_base_id: baseId,
    p_query: query,
    p_limit: MAX_RETRIEVED_CHUNKS,
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapMatch);
}

async function semanticMatches(
  supabase: Client,
  baseId: string,
  query: string,
): Promise<ContextPiece[]> {
  const vectors = await embedTexts([query.slice(0, 8000)]);
  const embedding = vectors?.[0];
  if (!embedding) return [];

  const { data, error } = await supabase.rpc("match_document_chunks_semantic", {
    p_base_id: baseId,
    p_embedding: formatVector(embedding),
    p_limit: MAX_SEMANTIC_CHUNKS,
  });

  if (error) {
    if (isOptionalSearchError(error.message)) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map(mapMatch);
}

async function neighborMatches(
  supabase: Client,
  baseId: string,
  hits: ContextPiece[],
): Promise<ContextPiece[]> {
  const ids = hits.slice(0, 8).map((hit) => hit.id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase.rpc("expand_document_chunk_neighbors", {
    p_base_id: baseId,
    p_chunk_ids: ids,
  });

  if (error) {
    if (isOptionalSearchError(error.message)) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map(mapMatch);
}

async function backfillEmbeddings(
  supabase: Client,
  userId: string,
  baseId: string,
): Promise<void> {
  for (let round = 0; round < EMBED_BACKFILL_ROUNDS; round += 1) {
    const { data, error } = await supabase
      .from("document_chunks")
      .select("id, content")
      .eq("base_id", baseId)
      .eq("user_id", userId)
      .is("embedding", null)
      .limit(EMBED_BACKFILL_BATCH);

    if (error) {
      if (isOptionalSearchError(error.message)) return;
      throw new Error(error.message);
    }

    const pending = data ?? [];
    if (pending.length === 0) return;

    const vectors = await embedTexts(pending.map((row) => row.content));
    if (!vectors) return;

    const updates = await Promise.all(
      pending.map((row, index) =>
        supabase
          .from("document_chunks")
          .update({ embedding: formatVector(vectors[index]) })
          .eq("id", row.id)
          .eq("user_id", userId),
      ),
    );

    if (updates.some((result) => result.error && isOptionalSearchError(result.error.message))) {
      return;
    }
  }
}

export async function loadDocumentContext(
  supabase: Client,
  userId: string,
  baseId: string,
  query: string,
): Promise<LoadedContext> {
  const { data: documents, error: documentsError } = await supabase
    .from("source_documents")
    .select("id, filename, char_count")
    .eq("base_id", baseId)
    .eq("user_id", userId);

  if (documentsError) throw new Error(documentsError.message);

  const sources = (documents ?? []) as SourceRow[];
  if (sources.length === 0) {
    throw new Error("В этом комплекте ещё нет файлов. Сначала загрузите документы.");
  }

  const files = sources.map((source) => ({
    filename: source.filename,
    charCount: source.char_count,
  }));
  const filenames = new Map(sources.map((source) => [source.id, source.filename]));
  const totalChars = sources.reduce((sum, source) => sum + source.char_count, 0);

  if (totalChars <= FULL_CONTEXT_CHARS) {
    const { data, error } = await supabase
      .from("document_chunks")
      .select("id, document_id, chunk_index, content")
      .eq("base_id", baseId)
      .eq("user_id", userId)
      .order("chunk_index", { ascending: true })
      .limit(200);

    if (error) throw new Error(error.message);

    const pieces = ((data ?? []) as ChunkRow[])
      .map((row) => mapChunk(row, filenames))
      .sort((a, b) => a.filename.localeCompare(b.filename, "ru") || a.chunkIndex - b.chunkIndex);

    if (pieces.length === 0) {
      throw new Error("Файлы загружены, но текст из них не сохранился. Загрузите их ещё раз.");
    }

    return {
      pieces: packPieces(pieces, MAX_CONTEXT_CHARS),
      coverage: "full",
      documentCount: sources.length,
      files,
    };
  }

  await backfillEmbeddings(supabase, userId, baseId);

  const [semantic, keyword] = await Promise.all([
    semanticMatches(supabase, baseId, query),
    keywordMatches(supabase, baseId, query),
  ]);
  const hits = mergePieces(semantic, keyword);
  const neighbors = await neighborMatches(supabase, baseId, hits);

  const { data: overviews, error: overviewError } = await supabase
    .from("document_chunks")
    .select("id, document_id, chunk_index, content")
    .eq("base_id", baseId)
    .eq("user_id", userId)
    .eq("chunk_index", 0)
    .limit(40);

  if (overviewError) throw new Error(overviewError.message);

  const extra = ((overviews ?? []) as ChunkRow[]).map((row) => mapChunk(row, filenames));
  const pieces = packPieces(mergePieces(mergePieces(hits, neighbors), extra), MAX_CONTEXT_CHARS);
  if (pieces.length === 0) {
    throw new Error("Не удалось выбрать фрагменты. Уточните вопрос своими словами или цитатой из файла.");
  }

  return {
    pieces,
    coverage: "retrieved",
    documentCount: sources.length,
    files,
  };
}
