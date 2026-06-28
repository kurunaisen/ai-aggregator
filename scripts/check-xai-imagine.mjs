/**
 * Проверка Grok Imagine API из .env.local / .env
 * Запуск: node scripts/check-xai-imagine.mjs
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

loadEnvFile(".env");
loadEnvFile(".env.local");

const apiKey = process.env.XAI_API_KEY?.trim();

if (!apiKey) {
  console.error("XAI_API_KEY не задан. Добавьте ключ из https://console.x.ai/");
  process.exit(1);
}

const models = ["grok-imagine-image", "grok-imagine-image-quality"];

for (const model of models) {
  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt: "A simple red circle on white background, flat design",
      resolution: "1k",
      n: 1,
    }),
  });

  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error(`\n[${model}] HTTP ${response.status} — не JSON:`);
    console.error(raw.slice(0, 500));
    continue;
  }

  if (!response.ok) {
    console.error(`\n[${model}] HTTP ${response.status}:`);
    console.error(JSON.stringify(data, null, 2));
    continue;
  }

  const url = data?.data?.[0]?.url;
  const b64 = data?.data?.[0]?.b64_json;
  console.log(`\n[${model}] OK`);
  if (url) console.log("  url:", url.slice(0, 80) + "...");
  if (b64) console.log("  b64_json:", `${b64.length} chars`);
}
