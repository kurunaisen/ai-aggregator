import "server-only";

import { cookies } from "next/headers";

const OAUTH_VERIFIER = "dp_canva_oauth_verifier";
const OAUTH_STATE = "dp_canva_oauth_state";
const ACCESS_TOKEN = "dp_canva_access_token";
const REFRESH_TOKEN = "dp_canva_refresh_token";
const EXPIRES_AT = "dp_canva_expires_at";
const USER_ID = "dp_canva_user_id";

const OAUTH_COOKIE_MAX_AGE = 60 * 10;
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 60;

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export type CanvaTokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
};

export async function setCanvaOAuthPending(codeVerifier: string, state: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(OAUTH_VERIFIER, codeVerifier, {
    ...baseCookieOptions,
    maxAge: OAUTH_COOKIE_MAX_AGE,
  });
  cookieStore.set(OAUTH_STATE, state, {
    ...baseCookieOptions,
    maxAge: OAUTH_COOKIE_MAX_AGE,
  });
}

export async function readCanvaOAuthPending(): Promise<{
  codeVerifier: string | null;
  state: string | null;
}> {
  const cookieStore = await cookies();

  return {
    codeVerifier: cookieStore.get(OAUTH_VERIFIER)?.value ?? null,
    state: cookieStore.get(OAUTH_STATE)?.value ?? null,
  };
}

export async function clearCanvaOAuthPending(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OAUTH_VERIFIER);
  cookieStore.delete(OAUTH_STATE);
}

export async function setCanvaTokens(tokens: CanvaTokenSet): Promise<void> {
  const cookieStore = await cookies();
  const maxAge = TOKEN_COOKIE_MAX_AGE;

  cookieStore.set(ACCESS_TOKEN, tokens.accessToken, { ...baseCookieOptions, maxAge });
  cookieStore.set(REFRESH_TOKEN, tokens.refreshToken, { ...baseCookieOptions, maxAge });
  cookieStore.set(EXPIRES_AT, String(tokens.expiresAt), { ...baseCookieOptions, maxAge });
  cookieStore.set(USER_ID, tokens.userId, { ...baseCookieOptions, maxAge });
}

export async function readCanvaTokens(expectedUserId?: string): Promise<CanvaTokenSet | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN)?.value;
  const expiresAtRaw = cookieStore.get(EXPIRES_AT)?.value;
  const userId = cookieStore.get(USER_ID)?.value;

  if (!accessToken || !refreshToken || !expiresAtRaw || !userId) {
    return null;
  }

  if (expectedUserId && userId !== expectedUserId) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    expiresAt,
    userId,
  };
}

export async function clearCanvaTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN);
  cookieStore.delete(REFRESH_TOKEN);
  cookieStore.delete(EXPIRES_AT);
  cookieStore.delete(USER_ID);
}
