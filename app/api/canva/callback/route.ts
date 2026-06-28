import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { parseOAuthState } from "@/lib/providers/canva-oauth";
import { exchangeCanvaAuthorizationCode } from "@/lib/providers/canva";
import {
  clearCanvaOAuthPending,
  readCanvaOAuthPending,
  setCanvaTokens,
} from "@/lib/providers/canva-session";
import { absoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const redirectBase = absoluteUrl("/tool/canva");

  if (oauthError) {
    return NextResponse.redirect(`${redirectBase}?canva_error=${encodeURIComponent(oauthError)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${redirectBase}?canva_error=missing_code`);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${redirectBase}?canva_error=supabase`);
  }

  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.redirect(absoluteUrl("/login?next=/tool/canva"));
  }

  const parsedState = parseOAuthState(state);
  if (!parsedState || parsedState.uid !== user.id) {
    await clearCanvaOAuthPending();
    return NextResponse.redirect(`${redirectBase}?canva_error=invalid_state`);
  }

  const pending = await readCanvaOAuthPending();
  if (!pending.codeVerifier || !pending.state || pending.state !== state) {
    await clearCanvaOAuthPending();
    return NextResponse.redirect(`${redirectBase}?canva_error=invalid_session`);
  }

  try {
    const tokens = await exchangeCanvaAuthorizationCode(code, pending.codeVerifier);

    await setCanvaTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
      userId: user.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "token_exchange_failed";
    await clearCanvaOAuthPending();
    return NextResponse.redirect(
      `${redirectBase}?canva_error=${encodeURIComponent(message)}`,
    );
  }

  await clearCanvaOAuthPending();

  return NextResponse.redirect(`${redirectBase}?connected=1`);
}
