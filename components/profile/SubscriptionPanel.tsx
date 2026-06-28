import Link from "next/link";
import { Button } from "@/components/ui/Button";
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
};

export function SubscriptionPanel({ plan }: SubscriptionPanelProps) {
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
          <Button href="/pricing" variant="outline">
            Управление подпиской — скоро
          </Button>
        </div>
      ) : paid ? (
        <div className="space-y-3 text-sm text-silver-dim">
          <p>
            {BASE_PLAN_DESCRIPTION}. {BASE_DEAI_GRANT_LABEL} на баланс при оплате ({BASE_PRICE_LABEL}
            ). Полный доступ — в тарифе Pro.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href="/pricing">Перейти на Pro</Button>
            <Button href="/pricing" variant="outline">
              Управление Base — скоро
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-silver-dim">
          <p>
            Base — {BASE_PRICE_LABEL} ({BASE_DEAI_GRANT_LABEL}): {BASE_PLAN_DESCRIPTION} Pro —{" "}
            {PRO_PRICE_LABEL} ({PRO_DEAI_GRANT_LABEL}): {PRO_PLAN_DESCRIPTION}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href="/pricing">Сравнить тарифы</Button>
            <Link
              href="/pricing"
              className="inline-flex items-center text-gold-light hover:underline"
            >
              Подробнее о Base и Pro
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
