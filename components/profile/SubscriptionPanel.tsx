import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { Plan } from "@/lib/subscription/constants";
import { PRO_PRICE_LABEL } from "@/lib/subscription/constants";

type SubscriptionPanelProps = {
  plan: Plan;
};

export function SubscriptionPanel({ plan }: SubscriptionPanelProps) {
  const isPro = plan === "pro";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold/70">
            Подписка
          </p>
          <p className="mt-2 text-2xl font-semibold text-silver">
            {isPro ? "Pro" : "Free"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isPro
              ? "border border-gold/40 bg-gold/15 text-gold-light"
              : "border divider-metallic bg-black/40 text-silver-dim"
          }`}
        >
          {isPro ? "Активна" : "Бесплатный тариф"}
        </span>
      </div>

      {isPro ? (
        <div className="space-y-3 text-sm text-silver-dim">
          <p>Deai без лимита · все модели · приоритет (скоро).</p>
          <Button href="/pricing" variant="outline">
            Управление подпиской — скоро
          </Button>
          <p className="text-xs text-silver-dim/70">
            Отмена и смена карты через Stripe Customer Portal (этап 2).
          </p>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-silver-dim">
          <p>
            Pro — {PRO_PRICE_LABEL}: Deai без лимита и расширенные возможности.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href="/pricing">Перейти на Pro</Button>
            <Link
              href="/pricing"
              className="inline-flex items-center text-gold-light hover:underline"
            >
              Сравнить тарифы
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
