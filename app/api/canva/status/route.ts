import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { getValidCanvaAccessToken, isCanvaConfigured } from "@/lib/providers/canva";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isCanvaConfigured()) {
    return NextResponse.json({ configured: false, connected: false });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ configured: true, connected: false });
  }

  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ configured: true, connected: false });
  }

  const accessToken = await getValidCanvaAccessToken(user.id);

  return NextResponse.json({
    configured: true,
    connected: Boolean(accessToken),
  });
}
