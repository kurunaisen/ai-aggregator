import type { ReasoningEffort } from "@/data/openai-models";

export const FREE_STARTING_DEAI = 25;

/** Единая валюта Deai; внутри — разные «режимы» списания */
export type DeaiBillingMode = "token" | "credit";

export type DeaiCategory = "text" | "image" | "video";

/** Разрешение / качество для медиа (1K–4K) */
export type MediaQuality = "1k" | "2k" | "4k";

export const MEDIA_QUALITY_OPTIONS: { value: MediaQuality; label: string }[] = [
  { value: "1k", label: "1K (стандарт)" },
  { value: "2k", label: "2K (HD)" },
  { value: "4k", label: "4K (Ultra)" },
];

export const VIDEO_DURATION_OPTIONS = [5, 10, 15] as const;
export type VideoDuration = (typeof VIDEO_DURATION_OPTIONS)[number];

export const IMAGE_OUTPUT_OPTIONS = [1, 2, 3, 4] as const;
export type ImageOutputCount = (typeof IMAGE_OUTPUT_OPTIONS)[number];

function roundDeai(value: number): number {
  return Math.round(value * 2) / 2;
}

function clampDeai(value: number, min: number, max: number): number {
  return roundDeai(Math.min(max, Math.max(min, value)));
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function qualityMultiplier(quality: MediaQuality): number {
  if (quality === "2k") return 1.25;
  if (quality === "4k") return 1.55;
  return 1;
}

/** ~4 символа ≈ 1 токен (грубая оценка для UI и биллинга) */
export function estimateTokensFromChars(totalChars: number): number {
  return Math.ceil(Math.max(totalChars, 1) / 4);
}

function textModelBase(model: string): number {
  const id = model.toLowerCase();

  if (
    id.includes("nano") ||
    id.includes("4o-mini") ||
    id.includes("4.1-mini") ||
    id.includes("haiku")
  ) {
    return 0.5;
  }

  if (
    id.includes("4.1") ||
    id.includes("4o") ||
    id.includes("sonnet") ||
    id.includes("3-mini")
  ) {
    return 1;
  }

  if (id.includes("5-mini") || id.includes("5-nano") || id.includes("o4-mini")) {
    return 1.5;
  }

  return 2;
}

/** Множитель объёма по эквиваленту токенов (вход + контекст) */
function textTokenVolumeFactor(estimatedTokens: number): number {
  if (estimatedTokens <= 500) return 1;
  if (estimatedTokens <= 1500) return 1.25;
  return 1.5;
}

function reasoningSurcharge(effort?: ReasoningEffort): number {
  if (effort === "low") return 0;
  if (effort === "medium") return 0.25;
  if (effort === "high") return 0.5;
  return 0;
}

function imageModelMultiplier(model: string): number {
  if (/pro|ultra|large|v[56]/i.test(model)) return 1.2;
  if (/hd|quality|plus/i.test(model)) return 1.1;
  return 1;
}

function videoModelMultiplier(model: string): number {
  if (/gen4|gen-4/i.test(model)) return 1.25;
  if (/turbo/i.test(model)) return 1;
  return 1.1;
}

/**
 * Текст и код — режим «токены».
 * Код на платформе тарифицируется как текст (Monaco Editor + AI).
 * 0.5–2 Deai за запрос.
 */
export function calculateTextDeaiCost(params: {
  model: string;
  totalChars: number;
  reasoningEffort?: ReasoningEffort;
}): number {
  const tokens = estimateTokensFromChars(params.totalChars);
  const cost =
    textModelBase(params.model) * textTokenVolumeFactor(tokens) +
    reasoningSurcharge(params.reasoningEffort);

  return clampDeai(cost, 0.5, 2);
}

/**
 * Изображения — режим «кредиты».
 * Зависит от числа выходных картинок (1–4), качества (1K–4K) и tier модели.
 * 1.5–8 Deai за генерацию.
 */
export function calculateImageDeaiCost(params: {
  model: string;
  outputCount?: number;
  quality?: MediaQuality;
}): number {
  const outputs = clampInt(params.outputCount ?? 1, 1, 4);
  const quality = params.quality ?? "1k";

  const cost =
    0.75 *
    outputs *
    qualityMultiplier(quality) *
    imageModelMultiplier(params.model);

  return clampDeai(cost, 1.5, 8);
}

/**
 * Видео — режим «кредиты».
 * Зависит от длительности (5–15 с), качества (1K–4K) и tier модели.
 * 2–10 Deai за генерацию.
 */
export function calculateVideoDeaiCost(params: {
  model: string;
  duration?: number;
  quality?: MediaQuality;
}): number {
  const duration = clampInt(params.duration ?? 5, 5, 15);
  const quality = params.quality ?? "1k";

  const cost =
    0.4 * duration * qualityMultiplier(quality) * videoModelMultiplier(params.model);

  return clampDeai(cost, 2, 10);
}

export function getDeaiBillingMode(category: DeaiCategory): DeaiBillingMode {
  return category === "text" ? "token" : "credit";
}

export function formatDeai(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
}

export function resolveDeaiCategory(toolType: string): DeaiCategory {
  if (toolType === "image") return "image";
  if (toolType === "video") return "video";
  return "text";
}

export function billingModeFromRequestType(requestType: string): DeaiBillingMode {
  return requestType === "chat" ? "token" : "credit";
}

/** Подпись для UI: что именно списывается */
export function formatDeaiBillingHint(category: DeaiCategory): string {
  if (category === "text") {
    return "токены · текст и код";
  }
  if (category === "image") {
    return "кредиты · 1–4 изображения · 1K–4K";
  }
  return "кредиты · 5–15 с · 1K–4K";
}
