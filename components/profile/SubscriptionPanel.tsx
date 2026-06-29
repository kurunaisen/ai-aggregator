import Link from "next/link";
import { PlanCheckoutButton } from "@/components/pricing/PlanCheckoutButton";
import type { Plan } from "@/lib/subscription/constants";
import {
  BASE_DEAI_GRANT_LABEL,
  BASE_PLAN_DESCRIPTION,
  BASE_PRICE_LABEL,
  PRO_DEAI_GRANT_LABEL,
  PRO_PLAN_DESCRIPTION,
  PRO_PRICE_LABEL,
} from "@/lib/subscription/constants";
import { getPlanLabel, hasProPlan, isPaidPlan } from "@/lib/subscription/plans";

type SubscriptionPanelProps = {
  plan: Plan;
  loggedIn?: boolean;
};

export function SubscriptionPanel({ plan, loggedIn = false }: SubscriptionPanelProps) {
  const label = getPlanLabel(plan);
  const paid = isPaidPlan(plan);
  const pro = hasProPlan(plan);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold/70">
            Подписка
          </p>
          <p className="mt-2 text-2xl font-semibold text-silver">{label}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            pro
              ? "border border-gold/50 bg-gold/20 text-gold-light"
              : paid
                ? "border border-gold/40 bg-gold/15 text-gold-light"
                : "border divider-metallic bg-black/40 text-silver-dim"
          }`}
        >
          {pro ? "Pro активен" : paid ? "Base активен" : "Бесплатный тариф"}
        </span>
      </div>

      {pro ? (
        <div className="space-y-3 text-sm text-silver-dim">
          <p>
            {PRO_PLAN_DESCRIPTION}. {PRO_DEAI_GRANT_LABEL} начисляются при оплате ({PRO_PRICE_LABEL}
            ).{" "}
            <Link href="/studio/video" className="text-gold-light underline">
              Видео-студия
            </Link>
            .
          </p>
          <PlanCheckoutButton
            plan="pro"
            label={`Пополнить Pro — ${PRO_PRICE_LABEL}`}
            loggedIn={loggedIn}
            variant="outline"
          />
        </div>
      ) : paid ? (
        <div className="space-y-3 text-sm text-silver-dim">
          <p>
            {BASE_PLAN_DESCRIPTION}. {BASE_DEAI_GRANT_LABEL} на баланс при оплате ({BASE_PRICE_LABEL}
            ). Полный доступ — в тарифе Pro.
          </p>
          <div className="flex flex-wrap gap-3">
            <PlanCheckoutButton
              plan="pro"
              label={`Перейти на Pro — ${PRO_PRICE_LABEL}`}
              loggedIn={loggedIn}
            />
            <PlanCheckoutButton
              plan="base"
              label={`Пополнить Base — ${BASE_PRICE_LABEL}`}
              loggedIn={loggedIn}
              variant="outline"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-silver-dim">
          <p>
            Base — {BASE_PRICE_LABEL} ({BASE_DEAI_GRANT_LABEL}): {BASE_PLAN_DESCRIPTION} Pro —{" "}
            {PRO_PRICE_LABEL} ({PRO_DEAI_GRANT_LABEL}): {PRO_PLAN_DESCRIPTION}
          </p>
          <div className="flex flex-wrap gap-3">
            <PlanCheckoutButton
              plan="base"
              label={`Оплатить Base — ${BASE_PRICE_LABEL}`}
              loggedIn={loggedIn}
              variant="outline"
            />
            <PlanCheckoutButton
              plan="pro"
              label={`Оплатить Pro — ${PRO_PRICE_LABEL}`}
              loggedIn={loggedIn}
            />
            <Link
              href="/pricing"
              className="inline-flex items-center text-gold-light hover:underline"
            >
              Подробнее о тарифах
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
