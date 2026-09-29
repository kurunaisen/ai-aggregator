import { NextResponse } from "next/server";

const COOKIE = "rag_session";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type RagSession = {
  id: string;
  isNew: boolean;
};

export function readSessionId(request: Request): RagSession {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;)\s*rag_session=([^;]+)/);
  const value = match?.[1]?.trim() ?? "";
  if (UUID_RE.test(value)) return { id: value, isNew: false };
  return { id: crypto.randomUUID(), isNew: true };
}

export function applySessionCookie(response: NextResponse, session: RagSession) {
  if (session.isNew) {
    response.cookies.set(COOKIE, session.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
    });
  }
  return response;
}
