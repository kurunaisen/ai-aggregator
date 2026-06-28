/**
 * Проверка Grok Chat API из .env.local / .env
 * Запуск: node scripts/check-xai-chat.mjs
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

const models = ["grok-4.3", "grok-3"];

for (const model of models) {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Reply with exactly: ok" }],
      max_tokens: 16,
      stream: false,
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

  const reply = data?.choices?.[0]?.message?.content;
  console.log(`\n[${model}] OK → ${JSON.stringify(reply)}`);
}
