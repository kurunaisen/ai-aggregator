import type { Plan } from "@/lib/subscription/constants";
import {
  BASE_MONTHLY_DEAI,
  BASE_PLAN_DESCRIPTION,
  BASE_PRICE_RUB,
  PRO_MONTHLY_DEAI,
  PRO_PLAN_DESCRIPTION,
  PRO_PRICE_RUB,
} from "@/lib/subscription/constants";
import { SITE_NAME } from "@/lib/seo/site";

export type PurchasablePlan = Exclude<Plan, "free">;

export type PlanProduct = {
  plan: PurchasablePlan;
  amountRub: number;
  deaiGrant: number;
  title: string;
  description: string;
};

export const PLAN_PRODUCTS: Record<PurchasablePlan, PlanProduct> = {
  base: {
    plan: "base",
    amountRub: BASE_PRICE_RUB,
    deaiGrant: BASE_MONTHLY_DEAI,
    title: `${SITE_NAME} — Base`,
    description: BASE_PLAN_DESCRIPTION,
  },
  pro: {
    plan: "pro",
    amountRub: PRO_PRICE_RUB,
    deaiGrant: PRO_MONTHLY_DEAI,
    title: `${SITE_NAME} — Pro`,
    description: PRO_PLAN_DESCRIPTION,
  },
};

export function getPlanProduct(plan: string): PlanProduct | null {
  if (plan === "base" || plan === "pro") {
    return PLAN_PRODUCTS[plan];
  }
  return null;
}

export function formatRubAmount(amountRub: number): string {
  return `${amountRub.toFixed(2)}`;
}
