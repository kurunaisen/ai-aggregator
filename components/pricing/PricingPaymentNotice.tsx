"use client";

import { useSearchParams } from "next/navigation";
import { getPlanProduct } from "@/lib/payments/plan-products";

export function PricingPaymentNotice() {
  const searchParams = useSearchParams();
  const payment = searchParams.get("payment");
  const plan = searchParams.get("plan");

  if (payment !== "success") {
    return null;
  }

  const product = plan ? getPlanProduct(plan) : null;

  return (
    <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-gold/30 bg-gold/10 px-5 py-4 text-center text-sm text-silver">
      {product ? (
        <>
          Оплата тарифа <strong className="text-gold-light">{product.plan.toUpperCase()}</strong>{" "}
          принята. {product.deaiGrant} Deai будут на балансе в течение минуты — обновите профиль,
          если сумма ещё не появилась.
        </>
      ) : (
        <>Оплата принята. Deai и тариф обновятся в течение минуты.</>
      )}
    </div>
  );
}
