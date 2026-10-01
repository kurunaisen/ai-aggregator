import { NextResponse } from "next/server";
import { MAX_BASES } from "@/lib/documents/constants";
import { requireDocumentSession, schemaErrorResponse } from "@/lib/documents/session";

export const dynamic = "force-dynamic";

type BaseRow = {
  id: string;
  title: string;
  created_at: string;
};

type FileRow = {
  id: string;
  base_id: string;
  filename: string;
  char_count: number;
  notice: string | null;
  created_at: string;
};

export async function GET() {
  const session = await requireDocumentSession();
  if (session instanceof NextResponse) return session;

  const { supabase, userId } = session;
  const { data: bases, error } = await supabase
    .from("document_bases")
    .select("id, title, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    const schema = schemaErrorResponse(new Error(error.message));
    if (schema) return schema;
    return NextResponse.json({ error: "Не удалось загрузить комплекты." }, { status: 500 });
  }

  const baseRows = (bases ?? []) as BaseRow[];
  const ids = baseRows.map((base) => base.id);
  let files: FileRow[] = [];

  if (ids.length > 0) {
    const { data, error: filesError } = await supabase
      .from("source_documents")
      .select("id, base_id, filename, char_count, notice, created_at")
      .eq("user_id", userId)
      .in("base_id", ids)
      .order("created_at", { ascending: true });

    if (filesError) {
      return NextResponse.json({ error: "Не удалось загрузить список файлов." }, { status: 500 });
    }

    files = (data ?? []) as FileRow[];
  }

  return NextResponse.json({
    bases: baseRows.map((base) => ({
      id: base.id,
      title: base.title,
      createdAt: base.created_at,
      documents: files
        .filter((file) => file.base_id === base.id)
        .map((file) => ({
          id: file.id,
          filename: file.filename,
          charCount: file.char_count,
          notice: file.notice,
          createdAt: file.created_at,
        })),
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireDocumentSession();
  if (session instanceof NextResponse) return session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const title = (body as { title?: string }).title?.trim() ?? "";
  if (title.length < 1 || title.length > 80) {
    return NextResponse.json(
      { error: "Название комплекта: от 1 до 80 символов." },
      { status: 400 },
    );
  }

  const { supabase, userId } = session;
  const { count, error: countError } = await supabase
    .from("document_bases")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    const schema = schemaErrorResponse(new Error(countError.message));
    if (schema) return schema;
    return NextResponse.json({ error: "Не удалось проверить комплекты." }, { status: 500 });
  }

  if ((count ?? 0) >= MAX_BASES) {
    return NextResponse.json(
      { error: `Можно хранить не больше ${MAX_BASES} комплектов.` },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("document_bases")
    .insert({ user_id: userId, title })
    .select("id, title, created_at")
    .single();

  if (error || !data) {
    const schema = schemaErrorResponse(error ? new Error(error.message) : new Error(""));
    if (schema) return schema;
    return NextResponse.json({ error: "Не удалось создать комплект." }, { status: 500 });
  }

  const created = data as BaseRow;
  return NextResponse.json({
    base: {
      id: created.id,
      title: created.title,
      createdAt: created.created_at,
      documents: [],
    },
  });
}
