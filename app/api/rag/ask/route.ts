import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/rag/answer";
import { applySessionCookie, readSessionId } from "@/lib/rag/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = readSessionId(request);

  let question = "";
  try {
    const body = (await request.json()) as { question?: unknown };
    question = typeof body.question === "string" ? body.question : "";
  } catch {
    return applySessionCookie(
      NextResponse.json(
        { status: "error", answer: "Не удалось прочитать вопрос.", citations: [] },
        { status: 400 },
      ),
      session,
    );
  }

  const result = await answerQuestion(session.id, question);
  return applySessionCookie(NextResponse.json(result.body, { status: result.httpStatus }), session);
}
