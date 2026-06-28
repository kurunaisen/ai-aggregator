export type Plan = "free" | "pro";

export const PRO_PRICE_RUB = 990;

export const PRO_PRICE_LABEL = `${PRO_PRICE_RUB} ₽/мес`;

export {
  FREE_STARTING_DEAI,
  getImageDeaiRangeLabel,
  getTextDeaiRangeLabel,
  getTypicalTextDeaiCost,
  getVideoDeaiRangeLabel,
} from "@/lib/subscription/deai-cost";

export { DEAI_PLATFORM_MARKUP, DEAI_RUB, DEAI_USD } from "@/lib/subscription/deai-rates";

/** Диапазоны: API + 20% · 1 Deai = 1 ₽ */
export const DEAI_PRICING_HINT = {
  text: "от 0.5 Deai · GPT-4o Mini ~0.5–1 · GPT-4.1 до ~6",
  code: "как текст · по модели и объёму",
  image: "от 3.5 Deai за 1K-кадр",
  video:
    "Runway 5с ~23 · Veo Lite 8с ~37 · Veo Fast 8с ~74 · Veo 3.1 8с ~296 Deai",
} as const;

export const DEAI_STARTER_BUDGET_HINT =
  "25 Deai ≈ 25 ₽: ~40–50 коротких текстовых запросов (GPT-4o Mini) или 1 видео Runway 5 с";

export const DEAI_EXCHANGE_HINT = "1 Deai = 1 ₽ · API + 20%";
