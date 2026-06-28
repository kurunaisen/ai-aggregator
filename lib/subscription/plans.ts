import type { Plan } from "@/lib/subscription/constants";
import {
  BASE_DEAI_GRANT_LABEL,
  BASE_PRICE_LABEL,
  PRO_DEAI_GRANT_LABEL,
  PRO_PRICE_LABEL,
  getBaseMonthlyDeai,
  getProMonthlyDeai,
} from "@/lib/subscription/constants";

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  base: "Base",
  pro: "Pro",
};

export function getPlanLabel(plan: Plan): string {
  return PLAN_LABELS[plan];
}

export function isPaidPlan(plan: Plan): boolean {
  return plan === "base" || plan === "pro";
}

export function hasProPlan(plan: Plan): boolean {
  return plan === "pro";
}

/** Каталог инструментов — с тарифа Base и выше (Free тратит стартовые Deai) */
export function canAccessEmbedTools(plan: Plan): boolean {
  return plan === "free" || isPaidPlan(plan);
}

/** Видео-студия — только Pro */
export function canAccessVideoStudio(plan: Plan): boolean {
  return plan === "pro";
}

export function getMonthlyDeaiGrant(plan: Exclude<Plan, "free">): number {
  return plan === "base" ? getBaseMonthlyDeai() : getProMonthlyDeai();
}

export function getPlanGrantLabel(plan: Exclude<Plan, "free">): string {
  return plan === "base" ? BASE_DEAI_GRANT_LABEL : PRO_DEAI_GRANT_LABEL;
}

export function getPlanPriceLabel(plan: Exclude<Plan, "free">): string {
  return plan === "base" ? BASE_PRICE_LABEL : PRO_PRICE_LABEL;
}

export function normalizePlan(value: string | null | undefined): Plan {
  if (value === "base" || value === "pro" || value === "free") {
    return value;
  }

  return "free";
}
