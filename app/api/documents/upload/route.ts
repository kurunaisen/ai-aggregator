import { NextResponse } from "next/server";
import { chunkText } from "@/lib/documents/chunk";
import {
  MAX_CHUNKS_PER_DOCUMENT,
  MAX_DOCUMENTS_PER_BASE,
  MAX_EXTRACTED_CHARS,
  MAX_FILE_BYTES,
} from "@/lib/documents/constants";
import {
  emptyDocumentMessage,
  extractDocumentText,
  isSupportedDocument,
  safeFilename,
  unsupportedDocumentMessage,
} from "@/lib/documents/extract";
import { isUuid } from "@/lib/documents/schema";
import { requireDocumentSession, schemaErrorResponse } from "@/lib/documents/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await requireDocumentSession();
  if (session instanceof NextResponse) return session;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать файл." }, { status: 400 });
  }

  const baseId = String(form.get("baseId") ?? "");
  const file = form.get("file");

  if (!isUuid(baseId)) {
    return NextResponse.json({ error: "Сначала выберите или создайте комплект." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не приложен." }, { status: 400 });
  }

  const filename = safeFilename(file.name);
  if (!isSupportedDocument(filename)) {
    return NextResponse.json({ error: unsupportedDocumentMessage(filename) }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Файл должен быть не больше 8 МБ." }, { status: 400 });
  }

  const { supabase, userId } = session;
  const { data: base, error: baseError } = await supabase
    .from("document_bases")
    .select("id")
    .eq("id", baseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (baseError) {
    const schema = schemaErrorResponse(new Error(baseError.message));
    if (schema) return schema;
    return NextResponse.json({ error: "Не удалось проверить комплект." }, { status: 500 });
  }

  if (!base) {
    return NextResponse.json({ error: "Комплект не найден." }, { status: 404 });
  }

  const { count, error: countError } = await supabase
    .from("source_documents")
    .select("id", { count: "exact", head: true })
    .eq("base_id", baseId)
    .eq("user_id", userId);

  if (countError) {
    return NextResponse.json({ error: "Не удалось проверить число файлов." }, { status: 500 });
  }

  if ((count ?? 0) >= MAX_DOCUMENTS_PER_BASE) {
    return NextResponse.json(
      { error: `В одном комплекте не больше ${MAX_DOCUMENTS_PER_BASE} файлов.` },
      { status: 400 },
    );
  }

  let text = "";
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    text = await extractDocumentText(filename, bytes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось прочитать файл.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (text.length < 20) {
    return NextResponse.json({ error: emptyDocumentMessage(filename) }, { status: 400 });
  }

  let notice: string | null = null;
  if (text.length > MAX_EXTRACTED_CHARS) {
    text = text.slice(0, MAX_EXTRACTED_CHARS);
    notice = "Сохранена только первая часть файла: он слишком большой.";
  }

  const chunks = chunkText(text).slice(0, MAX_CHUNKS_PER_DOCUMENT);
  if (chunks.length === MAX_CHUNKS_PER_DOCUMENT) {
    notice = notice ?? "Сохранены первые фрагменты файла: он слишком большой.";
  }

  const storedText = chunks.join("\n\n");
  const { data: created, error: insertError } = await supabase
    .from("source_documents")
    .insert({
      base_id: baseId,
      user_id: userId,
      filename,
      char_count: storedText.length,
      notice,
    })
    .select("id, filename, char_count, notice, created_at")
    .single();

  if (insertError || !created) {
    const schema = schemaErrorResponse(insertError ? new Error(insertError.message) : new Error(""));
    if (schema) return schema;
    return NextResponse.json({ error: "Не удалось сохранить файл." }, { status: 500 });
  }

  const rows = chunks.map((content, chunkIndex) => ({
    document_id: created.id,
    base_id: baseId,
    user_id: userId,
    chunk_index: chunkIndex,
    content,
  }));

  for (let offset = 0; offset < rows.length; offset += 40) {
    const { error: chunkError } = await supabase
      .from("document_chunks")
      .insert(rows.slice(offset, offset + 40));

    if (chunkError) {
      await supabase.from("source_documents").delete().eq("id", created.id).eq("user_id", userId);
      return NextResponse.json({ error: "Не удалось сохранить текст файла." }, { status: 500 });
    }
  }

  return NextResponse.json({
    document: {
      id: created.id,
      filename: created.filename,
      charCount: created.char_count,
      notice: created.notice,
      createdAt: created.created_at,
    },
  });
}
