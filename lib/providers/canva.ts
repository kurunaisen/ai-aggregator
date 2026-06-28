import "server-only";

import { getSiteUrl } from "@/lib/seo/site";
import {
  clearCanvaTokens,
  readCanvaTokens,
  setCanvaTokens,
  type CanvaTokenSet,
} from "@/lib/providers/canva-session";
import type { CanvaPresetName } from "@/data/canva-options";

const CANVA_API_BASE = "https://api.canva.com/rest/v1";
const CANVA_OAUTH_BASE = "https://www.canva.com/api/oauth";

export const CANVA_SCOPES = [
  "design:content:write",
  "design:meta:read",
  "profile:read",
].join(" ");

export type CanvaOAuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type CanvaDesignResult = {
  id: string;
  title: string;
  editUrl: string;
  viewUrl: string | null;
};

function getClientCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.CANVA_CLIENT_ID?.trim();
  const clientSecret = process.env.CANVA_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret };
}

export { isCanvaConfigured } from "@/lib/providers/canva-config";

export function getCanvaRedirectUri(): string {
  return `${getSiteUrl()}/api/canva/callback`;
}

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

async function parseCanvaError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      message?: string;
      error?: string;
      error_description?: string;
    };

    return (
      data.message ??
      data.error_description ??
      data.error ??
      `Canva API error (${response.status})`
    );
  } catch {
    return `Canva API error (${response.status})`;
  }
}

function mapTokenResponse(data: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}): CanvaOAuthTokens {
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export function buildCanvaAuthorizeUrl(params: {
  codeChallenge: string;
  state: string;
}): string | null {
  const credentials = getClientCredentials();
  if (!credentials) return null;

  const url = new URL(`${CANVA_OAUTH_BASE}/authorize`);
  url.searchParams.set("client_id", credentials.clientId);
  url.searchParams.set("redirect_uri", getCanvaRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "s256");
  url.searchParams.set("scope", CANVA_SCOPES);
  url.searchParams.set("state", params.state);

  return url.toString();
}

export async function exchangeCanvaAuthorizationCode(
  code: string,
  codeVerifier: string,
): Promise<CanvaOAuthTokens> {
  const credentials = getClientCredentials();
  if (!credentials) {
    throw new Error("Canva OAuth не настроен на сервере.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getCanvaRedirectUri(),
    code_verifier: codeVerifier,
  });

  const response = await fetch(`${CANVA_API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(credentials.clientId, credentials.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(await parseCanvaError(response));
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return mapTokenResponse(data);
}

export async function refreshCanvaAccessToken(refreshToken: string): Promise<CanvaOAuthTokens> {
  const credentials = getClientCredentials();
  if (!credentials) {
    throw new Error("Canva OAuth не настроен на сервере.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(`${CANVA_API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(credentials.clientId, credentials.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(await parseCanvaError(response));
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return mapTokenResponse(data);
}

export async function getValidCanvaAccessToken(userId: string): Promise<string | null> {
  const tokens = await readCanvaTokens(userId);
  if (!tokens) return null;

  const now = Date.now();
  const refreshThresholdMs = 60 * 1000;

  if (tokens.expiresAt - refreshThresholdMs > now) {
    return tokens.accessToken;
  }

  try {
    const refreshed = await refreshCanvaAccessToken(tokens.refreshToken);
    const nextTokens: CanvaTokenSet = {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresAt: Date.now() + refreshed.expiresIn * 1000,
      userId,
    };

    await setCanvaTokens(nextTokens);
    return nextTokens.accessToken;
  } catch {
    await clearCanvaTokens();
    return null;
  }
}

export async function createCanvaDesign(params: {
  accessToken: string;
  title: string;
  preset: CanvaPresetName;
}): Promise<CanvaDesignResult> {
  const response = await fetch(`${CANVA_API_BASE}/designs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      design_type: {
        type: "preset",
        name: params.preset,
      },
      title: params.title,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseCanvaError(response));
  }

  const data = (await response.json()) as {
    design?: {
      id?: string;
      title?: string;
      urls?: {
        edit_url?: string;
        view_url?: string;
      };
    };
  };

  const design = data.design;
  const editUrl = design?.urls?.edit_url;

  if (!design?.id || !editUrl) {
    throw new Error("Canva не вернула ссылку на редактор.");
  }

  return {
    id: design.id,
    title: design.title ?? params.title,
    editUrl,
    viewUrl: design.urls?.view_url ?? null,
  };
}
