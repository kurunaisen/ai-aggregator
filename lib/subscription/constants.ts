import { FREE_STARTING_DEAI as STARTING_DEAI } from "@/lib/subscription/deai-cost";
import { DEAI_RUB } from "@/lib/subscription/deai-rates";

export type Plan = "free" | "base" | "pro";

export const BASE_PRICE_RUB = 990;

export const PRO_PRICE_RUB = 2000;

export const BASE_PRICE_LABEL = `${BASE_PRICE_RUB} ₽/мес`;

export const PRO_PRICE_LABEL = `${PRO_PRICE_RUB} ₽/мес`;

/** Deai при оплате: цена подписки / стоимость 1 Deai (1 Deai = 1 ₽) */
export function getBaseMonthlyDeai(): number {
  return BASE_PRICE_RUB / DEAI_RUB;
}

export function getProMonthlyDeai(): number {
  return PRO_PRICE_RUB / DEAI_RUB;
}

export const BASE_MONTHLY_DEAI = getBaseMonthlyDeai();

export const PRO_MONTHLY_DEAI = getProMonthlyDeai();

export const BASE_DEAI_GRANT_LABEL = `${BASE_MONTHLY_DEAI} Deai/мес`;

export const PRO_DEAI_GRANT_LABEL = `${PRO_MONTHLY_DEAI} Deai/мес`;

export {
  FREE_STARTING_DEAI,
  getImageDeaiRangeLabel,
  getTextDeaiRangeLabel,
  getTypicalTextDeaiCost,
  getVideoDeaiRangeLabel,
} from "@/lib/subscription/deai-cost";

export { DEAI_PLATFORM_MARKUP, DEAI_RUB, DEAI_USD } from "@/lib/subscription/deai-rates";

/** Диапазоны стоимости в Deai · 1 Deai = 1 ₽ */
export const DEAI_PRICING_HINT = {
  text: "от 0.5 Deai · GPT-4o Mini ~0.5–1 · GPT-4.1 до ~6",
  code: "как текст · по модели и объёму",
  image: "от 3.5 Deai за 1K-кадр",
  video:
    "Runway 5с ~23 · Kling 5с ~28 · Grok Video 8с ~56 · Veo Lite 8с ~37 · Veo 3.1 8с ~296 Deai",
} as const;

export const DEAI_STARTER_BUDGET_HINT = `${STARTING_DEAI} Deai ≈ ${STARTING_DEAI} ₽: ~80–100 коротких текстовых запросов (GPT-4o Mini) или 2 видео Runway 5 с`;

export const DEAI_EXCHANGE_HINT = "1 Deai = 1 ₽";
