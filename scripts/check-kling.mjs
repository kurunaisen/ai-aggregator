/**
 * Проверка Kling API из .env.local / .env
 * Запуск: node scripts/check-kling.mjs
 */
import { createHmac } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function splitCombinedKlingKey(value) {
  for (const separator of [":", "|", ",", ";", "\n"]) {
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

function resolveKlingAuth() {
  const accessKey = process.env.KLING_ACCESS_KEY?.trim();
  const secretKey = process.env.KLING_SECRET_KEY?.trim();
  const apiKey = process.env.KLING_API_KEY?.trim();

  if (accessKey && secretKey) {
    return { mode: "jwt", accessKey, secretKey };
  }
  if (accessKey && apiKey && apiKey !== accessKey) {
    return { mode: "jwt", accessKey, secretKey: apiKey };
  }
  if (secretKey && apiKey && !accessKey) {
    return { mode: "jwt", accessKey: apiKey, secretKey };
  }
  if (apiKey) {
    const combined = splitCombinedKlingKey(apiKey);
    if (combined) return { mode: "jwt", ...combined };
    return { mode: "bearer", apiKey };
  }
  if (accessKey) return { mode: "bearer", apiKey: accessKey };
  if (secretKey) return { mode: "bearer", apiKey: secretKey };
  return null;
}

function createKlingJwt(accessKey, secretKey) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url",
  );
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ iss: accessKey, exp: now + 1800, nbf: now - 5 }),
  ).toString("base64url");
  const signature = createHmac("sha256", secretKey)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function getBearerToken(auth) {
  if (auth.mode === "bearer") return auth.apiKey;
  return createKlingJwt(auth.accessKey, auth.secretKey);
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const baseUrl =
  process.env.KLING_API_BASE?.trim() || "https://api-singapore.klingai.com";

console.log("\n=== Kling API check ===\n");

const auth = resolveKlingAuth();

if (!auth) {
  console.error("ERROR: задайте один из вариантов:");
  console.error("  • KLING_API_KEY=ключ_из_окна_Create");
  console.error("  • KLING_ACCESS_KEY=ключ_из_таблицы + KLING_API_KEY=ключ_из_окна");
  console.error("  • KLING_ACCESS_KEY + KLING_SECRET_KEY");
  console.error("  • KLING_API_KEY=access:secret");
  console.error("Ключи: https://app.klingai.com/global/dev/api-key");
  process.exit(1);
}

console.log(`Base URL: ${baseUrl}`);
console.log(`Auth mode: ${auth.mode === "jwt" ? "JWT (access + secret)" : "Bearer (single key)"}`);

if (auth.mode === "jwt") {
  console.log(`Access key: ${auth.accessKey.slice(0, 6)}…${auth.accessKey.slice(-4)}`);
} else {
  console.log(`API key: ${auth.apiKey.slice(0, 6)}…${auth.apiKey.slice(-4)}`);
}

const token = getBearerToken(auth);
const probeUrl = `${baseUrl}/v1/videos/text2video/connectivity-probe-${Date.now()}`;

try {
  const response = await fetch(probeUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.text();

  if (response.status === 401 || response.status === 403) {
    console.error(`\nFAIL: HTTP ${response.status} — ключ не принят`);

    if (auth.mode === "bearer") {
      console.error("\nЕсли в окне Create был один ключ, а запрос падает:");
      console.error("  1) Скопируйте «API Key» из таблицы → KLING_ACCESS_KEY");
      console.error("  2) Ключ из окна → KLING_API_KEY (или KLING_SECRET_KEY)");
      console.error("  3) Либо KLING_API_KEY=access:secret в одной переменной");
    }

    if (body) console.error(body.slice(0, 500));
    process.exit(1);
  }

  console.log(`\nOK: HTTP ${response.status} — авторизация прошла`);
  if (body) console.log(body.slice(0, 300));
  console.log("\nДобавьте те же переменные в Vercel → Settings → Environment Variables");
  console.log("и откройте /tool/kling на сайте.\n");
} catch (error) {
  console.error("\nFAIL:", error instanceof Error ? error.message : error);
  console.error("Если timeout — попробуйте KLING_API_BASE=https://api.klingai.com");
  process.exit(1);
}
