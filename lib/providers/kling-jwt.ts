import { createHmac } from "crypto";

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

export type KlingAuth =
  | { mode: "jwt"; accessKey: string; secretKey: string }
  | { mode: "bearer"; apiKey: string };

const COMBINED_KEY_SEPARATORS = [":", "|", ",", ";", "\n"] as const;

function splitCombinedKlingKey(value: string): { accessKey: string; secretKey: string } | null {
  for (const separator of COMBINED_KEY_SEPARATORS) {
    const parts = value
      .split(separator)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 2) {
      return { accessKey: parts[0], secretKey: parts[1] };
    }
  }

  return null;
}

/** Разрешает ключи из KLING_API_KEY / KLING_ACCESS_KEY / KLING_SECRET_KEY. */
export function resolveKlingAuth(): KlingAuth | null {
  const accessKey = process.env.KLING_ACCESS_KEY?.trim();
  const secretKey = process.env.KLING_SECRET_KEY?.trim();
  const apiKey = process.env.KLING_API_KEY?.trim();

  if (accessKey && secretKey) {
    return { mode: "jwt", accessKey, secretKey };
  }

  // Access из таблицы + ключ из окна Create (часто кладут в KLING_API_KEY на Vercel)
  if (accessKey && apiKey && apiKey !== accessKey) {
    return { mode: "jwt", accessKey, secretKey: apiKey };
  }

  if (secretKey && apiKey && !accessKey) {
    return { mode: "jwt", accessKey: apiKey, secretKey };
  }

  if (apiKey) {
    const combined = splitCombinedKlingKey(apiKey);
    if (combined) {
      return { mode: "jwt", ...combined };
    }

    return { mode: "bearer", apiKey };
  }

  if (accessKey) {
    return { mode: "bearer", apiKey: accessKey };
  }

  if (secretKey) {
    return { mode: "bearer", apiKey: secretKey };
  }

  return null;
}

export function createKlingJwt(accessKey: string, secretKey: string): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: accessKey,
      exp: now + 1800,
      nbf: now - 5,
    }),
  );
  const signature = createHmac("sha256", secretKey)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

export function getKlingBearerToken(): string {
  const auth = resolveKlingAuth();

  if (!auth) {
    throw new Error("Kling API не настроен");
  }

  if (auth.mode === "bearer") {
    return auth.apiKey;
  }

  return createKlingJwt(auth.accessKey, auth.secretKey);
}

/** @deprecated use getKlingBearerToken */
export function getKlingCredentials(): { accessKey: string; secretKey: string } {
  const auth = resolveKlingAuth();

  if (!auth || auth.mode !== "jwt") {
    throw new Error("Kling API не настроен");
  }

  return { accessKey: auth.accessKey, secretKey: auth.secretKey };
}

export function isKlingConfigured(): boolean {
  return resolveKlingAuth() !== null;
}

export function getKlingBaseUrl(): string {
  return process.env.KLING_API_BASE?.trim() || "https://api-singapore.klingai.com";
}

export function describeKlingAuthMode(): string {
  const auth = resolveKlingAuth();
  if (!auth) return "not configured";
  if (auth.mode === "bearer") return "bearer (single API key)";
  return "jwt (access + secret)";
}

/** Варианты Bearer-токена: сначала основной, затем JWT-fallback для одного ключа. */
export function getKlingAuthAttempts(): string[] {
  const auth = resolveKlingAuth();
  if (!auth) return [];

  const tokens: string[] = [];

  if (auth.mode === "jwt") {
    tokens.push(createKlingJwt(auth.accessKey, auth.secretKey));
  } else {
    tokens.push(auth.apiKey);

    const accessKey = process.env.KLING_ACCESS_KEY?.trim();
    const secretKey = process.env.KLING_SECRET_KEY?.trim();

    if (accessKey && accessKey !== auth.apiKey) {
      tokens.push(createKlingJwt(accessKey, auth.apiKey));
    }
    if (secretKey && secretKey !== auth.apiKey) {
      tokens.push(createKlingJwt(auth.apiKey, secretKey));
      if (accessKey && accessKey !== auth.apiKey) {
        tokens.push(createKlingJwt(accessKey, secretKey));
      }
    }

    tokens.push(createKlingJwt(auth.apiKey, auth.apiKey));
  }

  return [...new Set(tokens)];
}
