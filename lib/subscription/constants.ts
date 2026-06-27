export type Plan = "free" | "pro";

export const PRO_PRICE_RUB = 990;

export const PRO_PRICE_LABEL = `${PRO_PRICE_RUB} ₽/мес`;

export { FREE_STARTING_DEAI } from "@/lib/subscription/deai-cost";

/** Диапазоны: текст=токены, медиа=кредиты (одна валюта Deai) */
export const DEAI_PRICING_HINT = {
  text: "0.5–2 Deai (токены)",
  code: "как текст · 0.5–2 Deai",
  image: "1.5–8 Deai (кредиты)",
  video: "2–10 Deai (кредиты)",
} as const;

export const DEAI_STARTER_BUDGET_HINT =
  "25 Deai хватит примерно на 15–40 текстовых запросов, 3–8 изображений или 2–5 коротких видео";
