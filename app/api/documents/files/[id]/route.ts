import { NextResponse } from "next/server";
import { requireDocumentSession, schemaErrorResponse } from "@/lib/documents/session";
import { isUuid } from "@/lib/documents/schema";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireDocumentSession();
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Файл не найден." }, { status: 404 });
  }

  const { error, count } = await session.supabase
    .from("source_documents")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", session.userId);

  if (error) {
    const schema = schemaErrorResponse(new Error(error.message));
    if (schema) return schema;
    return NextResponse.json({ error: "Не удалось удалить файл." }, { status: 500 });
  }

  if (!count) {
    return NextResponse.json({ error: "Файл не найден." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
