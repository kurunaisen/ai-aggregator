import { NextResponse } from "next/server";
import {
  DOCUMENTS_MODEL,
  DOCUMENTS_TOOL_SLUG,
  documentModeLabel,
  isDocumentMode,
  MAX_CHAT_MESSAGES,
  MAX_USER_MESSAGE_CHARS,
  type DocumentModeId,
} from "@/lib/documents/constants";
import { completeDocuments } from "@/lib/documents/complete";
import { loadDocumentContext } from "@/lib/documents/load-context";
import { groundedUserMessage } from "@/lib/documents/prompt";
import { isUuid } from "@/lib/documents/schema";
import { requireDocumentSession, schemaErrorResponse } from "@/lib/documents/session";
import { calculateTextDeaiCost } from "@/lib/subscription/deai-cost";
import {
  canAffordDeai,
  deductDeai,
  getDeaiSummary,
  getInsufficientDeaiMessage,
  recordDeaiUsage,
} from "@/lib/subscription/deai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

function trimHistory(messages: IncomingMessage[]): IncomingMessage[] {
  return messages.slice(0, -1).map((message) => ({
    role: message.role,
    content:
      message.role === "assistant" && message.content.length > 2500
        ? `${message.content.slice(0, 2500)}\n…`
        : message.content,
  }));
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

  const payload = body as {
    baseId?: string;
    mode?: string;
    messages?: IncomingMessage[];
  };

  if (!payload.baseId || !isUuid(payload.baseId)) {
    return NextResponse.json({ error: "Выберите комплект документов." }, { status: 400 });
  }

  if (!payload.mode || !isDocumentMode(payload.mode)) {
    return NextResponse.json({ error: "Выберите тип задачи." }, { status: 400 });
  }

  const messages = payload.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_CHAT_MESSAGES) {
    return NextResponse.json({ error: "Напишите задание." }, { status: 400 });
  }

  for (const message of messages) {
    if (
      !message ||
      (message.role !== "user" && message.role !== "assistant") ||
      typeof message.content !== "string" ||
      message.content.length > 20_000
    ) {
      return NextResponse.json({ error: "Некорректные сообщения." }, { status: 400 });
    }
  }

  const latest = messages[messages.length - 1];
  if (latest.role !== "user" || latest.content.trim().length === 0) {
    return NextResponse.json({ error: "Напишите задание." }, { status: 400 });
  }

  if (latest.content.length > MAX_USER_MESSAGE_CHARS) {
    return NextResponse.json(
      { error: `Задание не длиннее ${MAX_USER_MESSAGE_CHARS} символов.` },
      { status: 400 },
    );
  }

  const mode = payload.mode as DocumentModeId;
  const { supabase, userId, profile } = session;

  const { data: base, error: baseError } = await supabase
    .from("document_bases")
    .select("id")
    .eq("id", payload.baseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (baseError) {
    const schema = schemaErrorResponse(new Error(baseError.message));
    if (schema) return schema;
    return NextResponse.json({ error: "Не удалось открыть комплект." }, { status: 500 });
  }

  if (!base) {
    return NextResponse.json({ error: "Комплект не найден." }, { status: 404 });
  }

  let loaded;
  try {
    const priorUser = messages
      .filter((message) => message.role === "user")
      .slice(-2)
      .map((message) => message.content)
      .join("\n");
    loaded = await loadDocumentContext(
      supabase,
      userId,
      payload.baseId,
      `${documentModeLabel(mode)}\n${priorUser}`,
    );
  } catch (error) {
    const schema = schemaErrorResponse(error);
    if (schema) return schema;
    const message = error instanceof Error ? error.message : "Не удалось прочитать документы.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const grounded = groundedUserMessage({
    mode,
    task: latest.content,
    pieces: loaded.pieces,
    coverage: loaded.coverage,
    files: loaded.files,
  });

  const apiMessages = [...trimHistory(messages), { role: "user" as const, content: grounded }];
  const totalChars = apiMessages.reduce((sum, message) => sum + message.content.length, 800);
  const deaiCost = calculateTextDeaiCost({ model: DOCUMENTS_MODEL, totalChars });
  const deaiBefore = await getDeaiSummary(supabase, userId, profile.plan);

  if (!canAffordDeai(deaiBefore, deaiCost)) {
    return NextResponse.json(
      {
        error: getInsufficientDeaiMessage(deaiCost),
        code: "INSUFFICIENT_DEAI",
        deai: deaiBefore,
      },
      { status: 429 },
    );
  }

  let reply = "";
  try {
    reply = await completeDocuments(apiMessages);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось получить ответ.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const deducted = await deductDeai(supabase, userId, deaiCost);
  if (!deducted.success) {
    return NextResponse.json(
      {
        error: getInsufficientDeaiMessage(deaiCost),
        code: "INSUFFICIENT_DEAI",
        deai: deaiBefore,
      },
      { status: 429 },
    );
  }

  await recordDeaiUsage(supabase, userId, DOCUMENTS_TOOL_SLUG, "chat", deaiCost, DOCUMENTS_MODEL);
  const deai = await getDeaiSummary(supabase, userId, profile.plan);

  return NextResponse.json({
    reply,
    deai,
    deaiCost,
    coverage: loaded.coverage,
    sources: loaded.pieces.map((piece) => ({
      filename: piece.filename,
      chunkIndex: piece.chunkIndex + 1,
    })),
  });
}
