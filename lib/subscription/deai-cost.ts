import type { ReasoningEffort } from "@/data/openai-models";

export const FREE_STARTING_DEAI = 25;

export type DeaiCategory = "text" | "image" | "video";

function roundDeai(value: number): number {
  return Math.round(value * 2) / 2;
}

function clampDeai(value: number, min: number, max: number): number {
  return roundDeai(Math.min(max, Math.max(min, value)));
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

function textVolumeFactor(totalChars: number): number {
  if (totalChars <= 400) return 1;
  if (totalChars <= 1200) return 1.25;
  return 1.5;
}

function reasoningSurcharge(effort?: ReasoningEffort): number {
  if (effort === "low") return 0;
  if (effort === "medium") return 0.25;
  if (effort === "high") return 0.5;
  return 0;
}

/** Текст / код: 0.5–2 Deai */
export function calculateTextDeaiCost(params: {
  model: string;
  totalChars: number;
  reasoningEffort?: ReasoningEffort;
}): number {
  const cost =
    textModelBase(params.model) * textVolumeFactor(params.totalChars) +
    reasoningSurcharge(params.reasoningEffort);

  return clampDeai(cost, 0.5, 2);
}

/** Изображение: 2–3 Deai */
export function calculateImageDeaiCost(params: {
  model: string;
  promptLength: number;
}): number {
  let cost = 2;

  if (params.promptLength > 250) cost += 0.5;
  if (/pro|ultra|hd|large/i.test(params.model)) cost += 0.5;

  return clampDeai(cost, 2, 3);
}

/** Видео: 3–5 Deai */
export function calculateVideoDeaiCost(params: {
  model: string;
  promptLength: number;
  duration?: number;
}): number {
  let cost = params.model.includes("turbo") ? 3 : 3.5;

  if (params.promptLength > 350) cost += 0.5;
  if ((params.duration ?? 5) > 5) cost += 1;

  return clampDeai(cost, 3, 5);
}

export function formatDeai(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
}

export function resolveDeaiCategory(toolType: string): DeaiCategory {
  if (toolType === "image") return "image";
  if (toolType === "video") return "video";
  return "text";
}
