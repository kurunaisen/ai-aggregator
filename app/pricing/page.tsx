import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { DeaiWalletLegend } from "@/components/deai/DeaiWalletLegend";
import { Button } from "@/components/ui/Button";
import {
  DEAI_PRICING_HINT,
  FREE_STARTING_DEAI,
  PRO_PRICE_LABEL,
} from "@/lib/subscription/constants";

export const metadata: Metadata = {
  title: "Тарифы",
  description: "Free и Pro тарифы DeltaplanAI — агрегатор нейросетей.",
};

const proTools = ["ChatGPT", "Claude", "Runway"];

export default function PricingPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold text-silver sm:text-4xl">Тарифы</h1>
        <p className="mt-4 text-silver-dim">
          Единая валюта Deai: текст и код — по токенам, изображения и видео — по кредитам
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
        <div className="carbon-panel rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-silver">Free</h2>
          <p className="mt-2 text-3xl font-bold text-gold-light">0 ₽</p>
          <ul className="mt-6 space-y-3 text-sm text-silver-dim">
            <li>{FREE_STARTING_DEAI} Deai при регистрации</li>
            <li>Код — {DEAI_PRICING_HINT.code}</li>
            <li>Изображения — {DEAI_PRICING_HINT.image}</li>
            <li>Видео — {DEAI_PRICING_HINT.video}</li>
          </ul>
          <Button href="/signup" className="mt-8 w-full">
            Начать бесплатно
          </Button>
        </div>

        <div className="carbon-panel relative rounded-2xl border-gold/30 p-8 shadow-gold">
          <span className="absolute -top-3 left-6 rounded-full bg-gold px-3 py-0.5 text-xs font-medium text-black">
            Рекомендуем
          </span>
          <h2 className="text-xl font-semibold text-silver">Pro</h2>
          <p className="mt-2 text-3xl font-bold text-gold-light">{PRO_PRICE_LABEL}</p>
          <ul className="mt-6 space-y-3 text-sm text-silver-dim">
            <li>Deai без лимита</li>
            {proTools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
            <li>Все модели ChatGPT</li>
            <li>Приоритетная генерация (скоро)</li>
          </ul>
          <Button href="/profile" variant="outline" className="mt-8 w-full">
            Оформить Pro — скоро
          </Button>
          <p className="mt-3 text-center text-xs text-silver-dim">
            Оплата через Stripe — этап 2
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
