import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/layout/Container";
import { DeaiWalletLegend } from "@/components/deai/DeaiWalletLegend";
import { Button } from "@/components/ui/Button";
import { PlanCheckoutButton } from "@/components/pricing/PlanCheckoutButton";
import { PricingPaymentNotice } from "@/components/pricing/PricingPaymentNotice";
import { getSessionUser } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import {
  BASE_DEAI_GRANT_LABEL,
  BASE_PLAN_DESCRIPTION,
  BASE_PRICE_LABEL,
  DEAI_EXCHANGE_HINT,
  DEAI_PRICING_HINT,
  FREE_STARTING_DEAI,
  PRO_DEAI_GRANT_LABEL,
  PRO_PLAN_DESCRIPTION,
  PRO_PRICE_LABEL,
} from "@/lib/subscription/constants";

export const metadata: Metadata = {
  title: "Тарифы",
  description: "Free, Base и Pro — тарифы DeltaplanAI с оплатой картой и СБП через ЮKassa.",
};

export default async function PricingPage() {
  const supabase = await createClient();
  const loggedIn = Boolean(supabase && (await getSessionUser(supabase)));

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold text-silver sm:text-4xl">Тарифы</h1>
        <p className="mt-4 text-silver-dim">
          Единая валюта Deai ({DEAI_EXCHANGE_HINT}). Оплата картой, СБП и SberPay через ЮKassa.
        </p>
      </div>

      <Suspense fallback={null}>
        <PricingPaymentNotice />
      </Suspense>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
        <div className="carbon-panel rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-silver">Free</h2>
          <p className="mt-2 text-3xl font-bold text-gold-light">0 ₽</p>
          <ul className="mt-6 space-y-3 text-sm text-silver-dim">
            <li>{FREE_STARTING_DEAI} Deai при регистрации</li>
            <li>Каталог инструментов по балансу</li>
            <li>Текст — {DEAI_PRICING_HINT.text}</li>
            <li>Изображения — {DEAI_PRICING_HINT.image}</li>
            <li>Видео — {DEAI_PRICING_HINT.video}</li>
          </ul>
          <Button href="/signup" className="mt-8 w-full">
            Начать бесплатно
          </Button>
        </div>

        <div className="carbon-panel relative rounded-2xl border-gold/20 p-8">
          <h2 className="text-xl font-semibold text-silver">Base</h2>
          <p className="mt-2 text-3xl font-bold text-gold-light">{BASE_PRICE_LABEL}</p>
          <ul className="mt-6 space-y-3 text-sm text-silver-dim">
            <li>{BASE_DEAI_GRANT_LABEL} на баланс при оплате</li>
            <li>{BASE_PLAN_DESCRIPTION}</li>
          </ul>
          <PlanCheckoutButton
            plan="base"
            label={`Оплатить Base — ${BASE_PRICE_LABEL}`}
            loggedIn={loggedIn}
            variant="outline"
            className="mt-8"
          />
        </div>

        <div className="carbon-panel relative rounded-2xl border-gold/30 p-8 shadow-gold">
          <span className="absolute -top-3 left-6 rounded-full bg-gold px-3 py-0.5 text-xs font-medium text-black">
            Максимум
          </span>
          <h2 className="text-xl font-semibold text-silver">Pro</h2>
          <p className="mt-2 text-3xl font-bold text-gold-light">{PRO_PRICE_LABEL}</p>
          <ul className="mt-6 space-y-3 text-sm text-silver-dim">
            <li>{PRO_DEAI_GRANT_LABEL} на баланс при оплате</li>
            <li>{PRO_PLAN_DESCRIPTION}</li>
          </ul>
          <PlanCheckoutButton
            plan="pro"
            label={`Оплатить Pro — ${PRO_PRICE_LABEL}`}
            loggedIn={loggedIn}
            className="mt-8"
          />
          <p className="mt-3 text-center text-xs text-silver-dim">
            Карта · СБП · SberPay · ЮMoney
          </p>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        <DeaiWalletLegend />
      </div>

      <p className="mt-10 text-center text-sm text-silver-dim">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-gold-light hover:underline">
          Войти
        </Link>
      </p>
    </Container>
  );
}
