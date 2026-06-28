import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
} from "@/lib/providers/canva-oauth";
import { buildCanvaAuthorizeUrl, isCanvaConfigured } from "@/lib/providers/canva";
import { setCanvaOAuthPending } from "@/lib/providers/canva-session";
import { absoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isCanvaConfigured()) {
    return NextResponse.json({ error: "Canva OAuth не настроен." }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase не настроен." }, { status: 503 });
  }

  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.redirect(absoluteUrl("/login?next=/tool/canva"));
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateOAuthState(user.id);
  const authorizeUrl = buildCanvaAuthorizeUrl({ codeChallenge, state });

  if (!authorizeUrl) {
    return NextResponse.json({ error: "Canva OAuth не настроен." }, { status: 503 });
  }

  await setCanvaOAuthPending(codeVerifier, state);

  return NextResponse.redirect(authorizeUrl);
}
