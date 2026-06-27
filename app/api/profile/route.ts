import { NextResponse } from "next/server";
import {
  ensureProfile,
  getSessionUser,
  updateProfileAvatar,
  updateProfileDisplayName,
} from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase не настроен." }, { status: 503 });
  }

  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const payload = body as { displayName?: string; avatarId?: string };
  const hasName = typeof payload.displayName === "string";
  const hasAvatar = typeof payload.avatarId === "string";

  if (!hasName && !hasAvatar) {
    return NextResponse.json({ error: "Нечего обновлять." }, { status: 400 });
  }

  await ensureProfile(supabase, user);

  const response: { displayName?: string; avatarId?: string } = {};

  if (hasName) {
    const result = await updateProfileDisplayName(supabase, user.id, payload.displayName!);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    response.displayName = result.displayName;
  }

  if (hasAvatar) {
    const result = await updateProfileAvatar(supabase, user.id, payload.avatarId!);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    response.avatarId = result.avatarId;
  }

  return NextResponse.json(response);
}
