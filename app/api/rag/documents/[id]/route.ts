import { NextResponse } from "next/server";
import { removeDocument } from "@/lib/rag/documents";
import { applySessionCookie, readSessionId } from "@/lib/rag/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = readSessionId(request);
  const { id } = await context.params;
  const removed = await removeDocument(session.id, id);
  if (!removed) {
    return applySessionCookie(
      NextResponse.json({ message: "Документ не найден." }, { status: 404 }),
      session,
    );
  }
  return applySessionCookie(NextResponse.json({ ok: true }), session);
}
