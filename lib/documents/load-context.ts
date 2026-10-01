import type { SupabaseClient } from "@supabase/supabase-js";
import { mergePieces, packPieces, type ContextPiece } from "@/lib/documents/chunk";
import {
  FULL_CONTEXT_CHARS,
  MAX_CONTEXT_CHARS,
  MAX_RETRIEVED_CHUNKS,
} from "@/lib/documents/constants";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

type SourceRow = {
  id: string;
  filename: string;
  char_count: number;
};

export type LoadedContext = {
  pieces: ContextPiece[];
  coverage: "full" | "retrieved";
  documentCount: number;
};

function mapChunk(
  row: {
    id: string;
    chunk_index: number;
    content: string;
    document_id: string;
  },
  filenames: Map<string, string>,
): ContextPiece {
  return {
    id: row.id,
    filename: filenames.get(row.document_id) ?? "Документ",
    chunkIndex: row.chunk_index,
    content: row.content,
  };
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

    const pieces = ((data ?? []) as {
      id: string;
      document_id: string;
      chunk_index: number;
      content: string;
    }[])
      .map((row) => mapChunk(row, filenames))
      .sort((a, b) => a.filename.localeCompare(b.filename, "ru") || a.chunkIndex - b.chunkIndex);

    if (pieces.length === 0) {
      throw new Error("Файлы загружены, но текст из них не сохранился. Загрузите их ещё раз.");
    }

    return {
      pieces: packPieces(pieces, MAX_CONTEXT_CHARS),
      coverage: "full",
      documentCount: sources.length,
    };
  }

  const { data: matched, error: matchError } = await supabase.rpc("match_document_chunks", {
    p_base_id: baseId,
    p_query: query,
    p_limit: MAX_RETRIEVED_CHUNKS,
  });

  if (matchError) throw new Error(matchError.message);

  const primary = (matched ?? []).map((row) =>
    mapChunk(
      {
        id: row.chunk_id,
        document_id: row.document_id,
        chunk_index: row.chunk_index,
        content: row.content,
      },
      filenames,
    ),
  );

  const { data: overviews, error: overviewError } = await supabase
    .from("document_chunks")
    .select("id, document_id, chunk_index, content")
    .eq("base_id", baseId)
    .eq("user_id", userId)
    .eq("chunk_index", 0)
    .limit(40);

  if (overviewError) throw new Error(overviewError.message);

  const extra = ((overviews ?? []) as {
    id: string;
    document_id: string;
    chunk_index: number;
    content: string;
  }[]).map((row) => mapChunk(row, filenames));

  const pieces = packPieces(mergePieces(primary, extra), MAX_CONTEXT_CHARS);
  if (pieces.length === 0) {
    throw new Error("Не удалось выбрать фрагменты. Уточните вопрос словами из документов.");
  }

  return {
    pieces,
    coverage: "retrieved",
    documentCount: sources.length,
  };
}
