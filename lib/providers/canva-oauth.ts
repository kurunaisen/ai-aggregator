import { createHash, randomBytes } from "crypto";

export function generateCodeVerifier(): string {
  return randomBytes(96).toString("base64url");
}

export function generateCodeChallenge(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

export function generateOAuthState(userId: string): string {
  const payload = {
    uid: userId,
    nonce: randomBytes(16).toString("hex"),
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function parseOAuthState(state: string): { uid: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
      uid?: unknown;
    };

    if (typeof parsed.uid === "string" && parsed.uid.length > 0) {
      return { uid: parsed.uid };
    }
  } catch {
    return null;
  }

  return null;
}
