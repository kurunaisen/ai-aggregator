/**
 * Проверка RUNWAY_API_KEY из .env.local
 * Запуск: node scripts/check-runway.mjs
 */
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

loadEnvFile(".env.local");
loadEnvFile(".env");

const apiKey = process.env.RUNWAY_API_KEY?.trim();
const baseUrl = "https://api.dev.runwayml.com/v1";

console.log("\n=== Runway API check ===\n");

if (!apiKey) {
  console.error("ERROR: задайте RUNWAY_API_KEY в .env.local");
  console.error("Ключ: https://dev.runwayml.com/ → Manage → New API key");
  process.exit(1);
}

if (!/^key_[0-9a-f]{128}$/i.test(apiKey)) {
  console.warn("WARNING: ключ обычно выглядит как key_ + 128 hex-символов");
}

console.log(`Key: ${apiKey.slice(0, 8)}…${apiKey.slice(-6)}`);

try {
  const response = await fetch(`${baseUrl}/tasks/runway-connectivity-probe`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Runway-Version": "2024-11-06",
    },
  });
  const body = await response.text();

  if (response.status === 401) {
    console.error("\nFAIL: HTTP 401 — неверный или деактивированный ключ");
    if (body) console.error(body.slice(0, 400));
    process.exit(1);
  }

  console.log(`\nOK: HTTP ${response.status} — ключ принят API`);
  if (body) console.log(body.slice(0, 200));
  console.log("\nДобавьте RUNWAY_API_KEY в Vercel и пополните credits на dev.runwayml.com");
  console.log("Инструмент: /tool/runway\n");
} catch (error) {
  console.error("\nFAIL:", error instanceof Error ? error.message : error);
  process.exit(1);
}
