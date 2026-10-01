import { NextResponse } from "next/server";
import { requireDocumentSession, schemaErrorResponse } from "@/lib/documents/session";
import { isUuid } from "@/lib/documents/schema";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireDocumentSession();
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Комплект не найден." }, { status: 404 });
  }

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

  const { data, error } = await session.supabase
    .from("document_bases")
    .update({ title })
    .eq("id", id)
    .eq("user_id", session.userId)
    .select("id")
    .maybeSingle();

  if (error) {
    const schema = schemaErrorResponse(new Error(error.message));
    if (schema) return schema;
    return NextResponse.json({ error: "Не удалось переименовать комплект." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Комплект не найден." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, title });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireDocumentSession();
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Комплект не найден." }, { status: 404 });
  }

  const { error, count } = await session.supabase
    .from("document_bases")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", session.userId);

  if (error) {
    const schema = schemaErrorResponse(new Error(error.message));
    if (schema) return schema;
    return NextResponse.json({ error: "Не удалось удалить комплект." }, { status: 500 });
  }

  if (!count) {
    return NextResponse.json({ error: "Комплект не найден." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
