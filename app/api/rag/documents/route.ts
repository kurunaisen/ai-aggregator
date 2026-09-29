import { NextResponse } from "next/server";
import { addDocument, listDocuments } from "@/lib/rag/documents";
import { IngestError } from "@/lib/rag/parse";
import { applySessionCookie, readSessionId } from "@/lib/rag/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = readSessionId(request);
  const body = await listDocuments(session.id);
  return applySessionCookie(NextResponse.json(body), session);
}

export async function POST(request: Request) {
  const session = readSessionId(request);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return applySessionCookie(
      NextResponse.json({ message: "Не удалось прочитать файл." }, { status: 400 }),
      session,
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return applySessionCookie(
      NextResponse.json({ message: "Выберите файл PDF, DOCX или TXT." }, { status: 400 }),
      session,
    );
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const document = await addDocument(session.id, {
      filename: file.name,
      mime: file.type,
      bytes,
    });
    return applySessionCookie(NextResponse.json({ document }), session);
  } catch (error) {
    const message = error instanceof IngestError ? error.message : "Не удалось обработать документ.";
    const status = error instanceof IngestError ? 400 : 500;
    console.error("rag upload:", error instanceof Error ? error.message : error);
    return applySessionCookie(NextResponse.json({ message }, { status }), session);
  }
}
