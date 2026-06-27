export type Plan = "free" | "pro";

export const PRO_PRICE_RUB = 990;

export const PRO_PRICE_LABEL = `${PRO_PRICE_RUB} ₽/мес`;

export { FREE_STARTING_DEAI } from "@/lib/subscription/deai-cost";

export const DEAI_PRICING_HINT = {
  text: "0.5–2 Deai",
  image: "2–3 Deai",
  video: "3–5 Deai",
} as const;
