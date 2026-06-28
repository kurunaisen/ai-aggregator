import { createHmac } from "crypto";

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
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

export function getKlingCredentials(): { accessKey: string; secretKey: string } {
  const accessKey = process.env.KLING_ACCESS_KEY?.trim();
  const secretKey = process.env.KLING_SECRET_KEY?.trim();

  if (!accessKey || !secretKey) {
    throw new Error("Kling API не настроен");
  }

  return { accessKey, secretKey };
}

export function isKlingConfigured(): boolean {
  return Boolean(
    process.env.KLING_ACCESS_KEY?.trim() && process.env.KLING_SECRET_KEY?.trim(),
  );
}

export function getKlingBaseUrl(): string {
  return process.env.KLING_API_BASE?.trim() || "https://api-singapore.klingai.com";
}
