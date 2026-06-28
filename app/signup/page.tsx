import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { Container } from "@/components/layout/Container";
import { DEAI_PRICING_HINT, FREE_STARTING_DEAI } from "@/lib/subscription/constants";

export const metadata: Metadata = {
  title: "Регистрация",
  description: `Создайте аккаунт DeltaplanAI — ${FREE_STARTING_DEAI} Deai для старта.`,
};

export default function SignupPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold text-silver">Регистрация</h1>
        <p className="mb-8 text-center text-silver-dim">
          {FREE_STARTING_DEAI} Deai при регистрации · текст {DEAI_PRICING_HINT.text} · изображения{" "}
          {DEAI_PRICING_HINT.image} · видео {DEAI_PRICING_HINT.video}
        </p>
        <AuthForm mode="signup" />
      </div>
    </Container>
  );
}
