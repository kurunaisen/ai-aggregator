import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { DeaiWalletLegend } from "@/components/deai/DeaiWalletLegend";
import { Button } from "@/components/ui/Button";
import {
  BASE_DEAI_GRANT_LABEL,
  BASE_MONTHLY_DEAI,
  BASE_PRICE_LABEL,
  BASE_PRICE_RUB,
  DEAI_EXCHANGE_HINT,
  DEAI_PRICING_HINT,
  FREE_STARTING_DEAI,
  PRO_DEAI_GRANT_LABEL,
  PRO_PRICE_LABEL,
} from "@/lib/subscription/constants";

export const metadata: Metadata = {
  title: "Тарифы",
  description: "Free, Base и Pro — тарифы DeltaplanAI с пакетами Deai.",
};

const baseTools = [
  "ChatGPT",
  "Claude",
  "Grok",
  "Monaco Editor",
  "Nano Banana",
  "FLUX",
  "Kling",
];

export default function PricingPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold text-silver sm:text-4xl">Тарифы</h1>
        <p className="mt-4 text-silver-dim">
          Единая валюта Deai ({DEAI_EXCHANGE_HINT}). Пакет начисляется на баланс при каждой оплате
          подписки.
        </p>
      </div>

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
            <li>{BASE_DEAI_GRANT_LABEL} при каждой оплате</li>
            <li>Каталог инструментов — по балансу Deai</li>
            <li>
              {BASE_PRICE_RUB} ₽ ÷ 1 ₽ = {BASE_MONTHLY_DEAI} Deai
            </li>
            {baseTools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
            <li>Runway и Google Veo — по 1 пробной генерации</li>
            <li>Текст — {DEAI_PRICING_HINT.text}</li>
            <li>Изображения — {DEAI_PRICING_HINT.image}</li>
            <li>Видео — {DEAI_PRICING_HINT.video}</li>
            <li>Все модели ChatGPT</li>
          </ul>
          <Button href="/profile" variant="outline" className="mt-8 w-full">
            Оформить Base — скоро
          </Button>
        </div>

        <div className="carbon-panel relative rounded-2xl border-gold/30 p-8 shadow-gold">
          <span className="absolute -top-3 left-6 rounded-full bg-gold px-3 py-0.5 text-xs font-medium text-black">
            Максимум
          </span>
          <h2 className="text-xl font-semibold text-silver">Pro</h2>
          <p className="mt-2 text-3xl font-bold text-gold-light">{PRO_PRICE_LABEL}</p>
          <ul className="mt-6 space-y-3 text-sm text-silver-dim">
            <li>{PRO_DEAI_GRANT_LABEL} при каждой оплате</li>
            <li>Всё из Base — списание с баланса Deai</li>
            <li>Runway и Google Veo без лимита проб</li>
            <li>Видео-студия: персонаж → сцены → ролик</li>
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
