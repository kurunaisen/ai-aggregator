import { NextResponse } from "next/server";
import { MAX_EXPORT_CHARS } from "@/lib/documents/constants";
import { downloadFilename, textToDocx } from "@/lib/documents/docx";
import { requireDocumentSession } from "@/lib/documents/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireDocumentSession();
  if (session instanceof NextResponse) return session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const payload = body as { title?: string; text?: string; format?: string };
  const text = payload.text?.trim() ?? "";
  const title = payload.title?.trim().slice(0, 120) || "Документ";

  if (!text || text.length > MAX_EXPORT_CHARS) {
    return NextResponse.json({ error: "Нет текста для скачивания." }, { status: 400 });
  }

  if (payload.format === "txt") {
    const filename = downloadFilename(title, "txt");
    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": contentDisposition(filename),
      },
    });
  }

  const buffer = await textToDocx(title, text);
  const filename = downloadFilename(title, "docx");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": contentDisposition(filename),
    },
  });
}

function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\w.\-]+/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
