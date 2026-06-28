import type { ReasoningEffort } from "@/data/openai-models";
import {
  getImageBaseUsd,
  getTextModelRatesUsd,
  getVideoUsdPerSecond,
  usdToDeai,
} from "@/lib/subscription/deai-rates";

export const FREE_STARTING_DEAI = 25;

/** Единая валюта Deai; внутри — разные «режимы» списания */
export type DeaiBillingMode = "token" | "credit";

export type DeaiCategory = "text" | "image" | "video";

/** Разрешение / качество для медиа (1K–4K) */
export type MediaQuality = "1k" | "2k" | "4k";

export const MEDIA_QUALITY_OPTIONS: { value: MediaQuality; label: string }[] = [
  { value: "1k", label: "1K (720p)" },
  { value: "2k", label: "2K (1080p)" },
  { value: "4k", label: "4K" },
];

export const VIDEO_DURATION_OPTIONS = [5, 10, 15] as const;
export type VideoDuration = (typeof VIDEO_DURATION_OPTIONS)[number];

export const IMAGE_OUTPUT_OPTIONS = [1, 2, 3, 4] as const;
export type ImageOutputCount = (typeof IMAGE_OUTPUT_OPTIONS)[number];

/** Типичный объём для оценки диапазонов в UI */
const TYPICAL_TEXT_CHARS = 1200;
const LARGE_TEXT_CHARS = 4500;

function roundDeai(value: number): number {
  return Math.round(value * 2) / 2;
}

function clampDeai(value: number, min: number, max: number): number {
  return roundDeai(Math.min(max, Math.max(min, value)));
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** ~4 символа ≈ 1 токен (грубая оценка для UI и биллинга) */
export function estimateTokensFromChars(totalChars: number): number {
  return Math.ceil(Math.max(totalChars, 1) / 4);
}

function reasoningOutputMultiplier(effort?: ReasoningEffort): number {
  if (effort === "high") return 2.5;
  if (effort === "medium") return 1.75;
  if (effort === "low") return 1.25;
  return 1;
}

function estimateTextTokenSplit(totalChars: number, reasoningEffort?: ReasoningEffort) {
  const totalTokens = estimateTokensFromChars(totalChars);
  const inputTokens = Math.round(totalTokens * 0.65 + 120);
  let outputTokens = Math.round(Math.max(180, totalTokens * 0.35));
  outputTokens = Math.round(outputTokens * reasoningOutputMultiplier(reasoningEffort));
  return { inputTokens, outputTokens };
}

function textCostUsd(params: {
  model: string;
  totalChars: number;
  reasoningEffort?: ReasoningEffort;
}): number {
  const rates = getTextModelRatesUsd(params.model);
  const { inputTokens, outputTokens } = estimateTextTokenSplit(
    params.totalChars,
    params.reasoningEffort,
  );

  return (
    (inputTokens * rates.inputPerMTok + outputTokens * rates.outputPerMTok) / 1_000_000
  );
}

/**
 * Текст и код — режим «токены».
 * 1 Deai = 1 ₽ ≈ $0.012977 (API + 20% наценка платформы).
 */
export function calculateTextDeaiCost(params: {
  model: string;
  totalChars: number;
  reasoningEffort?: ReasoningEffort;
}): number {
  const deai = usdToDeai(textCostUsd(params));
  return clampDeai(deai, 0.5, 20);
}

/**
 * Изображения — режим «кредиты».
 */
export function calculateImageDeaiCost(params: {
  model: string;
  outputCount?: number;
  quality?: MediaQuality;
}): number {
  const outputs = clampInt(params.outputCount ?? 1, 1, 4);
  const quality = params.quality ?? "1k";
  const usd = getImageBaseUsd(params.model, quality) * outputs;
  return clampDeai(usdToDeai(usd), 2, 30);
}

/**
 * Видео — режим «кредиты».
 */
export function calculateVideoDeaiCost(params: {
  model: string;
  duration?: number;
  quality?: MediaQuality;
}): number {
  const duration = clampInt(params.duration ?? 5, 4, 15);
  const quality = params.quality ?? "1k";
  const usd = getVideoUsdPerSecond(params.model, quality) * duration;
  return clampDeai(usdToDeai(usd), 2, 300);
}

/** Диапазоны для подсказок в UI (типичный запрос) */
export function getTextDeaiRangeLabel(model = "gpt-4o-mini"): string {
  const low = formatDeai(calculateTextDeaiCost({ model, totalChars: 400 }));
  const high = formatDeai(
    calculateTextDeaiCost({ model: "gpt-4.1", totalChars: LARGE_TEXT_CHARS }),
  );
  return `${low}–${high} Deai`;
}

export function getVideoDeaiRangeLabel(): string {
  const runway = formatDeai(
    calculateVideoDeaiCost({ model: "gen3a_turbo", duration: 5, quality: "1k" }),
  );
  const veoLite = formatDeai(
    calculateVideoDeaiCost({
      model: "veo-3.1-lite-generate-preview",
      duration: 8,
      quality: "1k",
    }),
  );
  const veoStd = formatDeai(
    calculateVideoDeaiCost({
      model: "veo-3.1-generate-preview",
      duration: 8,
      quality: "1k",
    }),
  );
  return `${runway} (Runway 5с) · ${veoLite} (Veo Lite 8с) · ${veoStd} (Veo 3.1 8с)`;
}

export function getImageDeaiRangeLabel(): string {
  const low = formatDeai(calculateImageDeaiCost({ model: "flux", quality: "1k" }));
  const high = formatDeai(
    calculateImageDeaiCost({ model: "flux-pro", quality: "4k", outputCount: 4 }),
  );
  return `${low}–${high} Deai`;
}

export function getTypicalTextDeaiCost(model = "gpt-4o-mini"): number {
  return calculateTextDeaiCost({ model, totalChars: TYPICAL_TEXT_CHARS });
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

export function billingModeFromToolType(toolType: string): DeaiBillingMode {
  return resolveDeaiCategory(toolType) === "text" ? "token" : "credit";
}

/** Подпись для UI: что именно списывается */
export function formatDeaiBillingHint(category: DeaiCategory): string {
  if (category === "text") {
    return "токены · текст и код";
  }
  if (category === "image") {
    return "кредиты · 1–4 изображения · 1K–4K";
  }
  return "кредиты · 4–15 с · 720p–4K";
}
