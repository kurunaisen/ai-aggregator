import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Вход",
  description: "Войдите в DeltaplanAI для доступа к встроенным нейросетям.",
};

export default function LoginPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold text-silver">Вход</h1>
        <p className="mb-8 text-center text-silver-dim">
          Используйте ChatGPT, Claude и Runway на DeltaplanAI
        </p>
        <AuthForm mode="login" />
        <p className="mt-6 text-center text-sm text-silver-dim">
          <Link href="/pricing" className="text-gold-light hover:underline">
            Тарифы и лимиты
          </Link>
        </p>
      </div>
    </Container>
  );
}
