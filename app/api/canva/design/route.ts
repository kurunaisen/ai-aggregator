import { NextResponse } from "next/server";
import { ensureProfile, getSessionUser } from "@/lib/auth/profile";
import { CANVA_DESIGN_DEAI, validateCanvaDesignRequest } from "@/data/canva-options";
import { createCanvaDesign, getValidCanvaAccessToken, isCanvaConfigured } from "@/lib/providers/canva";
import { createClient } from "@/lib/supabase/server";
import {
  canAffordDeai,
  deductDeai,
  getDeaiSummary,
  getInsufficientDeaiMessage,
  recordDeaiUsage,
} from "@/lib/subscription/deai";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isCanvaConfigured()) {
    return NextResponse.json({ error: "Canva OAuth не настроен на сервере." }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase не настроен." }, { status: 503 });
  }

  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const profile = await ensureProfile(supabase, user);
  const deai = await getDeaiSummary(supabase, user.id, profile.plan);

  if (!canAffordDeai(deai, CANVA_DESIGN_DEAI)) {
    return NextResponse.json(
      { error: getInsufficientDeaiMessage(CANVA_DESIGN_DEAI) },
      { status: 402 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON." }, { status: 400 });
  }

  const validated = validateCanvaDesignRequest(body);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const accessToken = await getValidCanvaAccessToken(user.id);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Подключите аккаунт Canva.", code: "not_connected" },
      { status: 401 },
    );
  }

  try {
    const design = await createCanvaDesign({
      accessToken,
      title: validated.title,
      preset: validated.preset,
    });

    const deducted = await deductDeai(supabase, user.id, CANVA_DESIGN_DEAI, profile.plan);
    if (!deducted.success) {
      return NextResponse.json(
        { error: getInsufficientDeaiMessage(CANVA_DESIGN_DEAI) },
        { status: 402 },
      );
    }

    await recordDeaiUsage(
      supabase,
      user.id,
      "canva",
      "image",
      CANVA_DESIGN_DEAI,
      "canva-connect",
    );

    const updatedDeai = await getDeaiSummary(supabase, user.id, profile.plan);

    return NextResponse.json({
      design,
      deai: updatedDeai,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось создать дизайн.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
