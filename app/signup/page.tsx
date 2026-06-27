import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Регистрация",
  description: "Создайте аккаунт DeltaplanAI — 25 Deai для старта.",
};

export default function SignupPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold text-silver">Регистрация</h1>
        <p className="mb-8 text-center text-silver-dim">
          25 Deai при регистрации · текст 0.5–2 · изображения 2–3 · видео 3–5
        </p>
        <AuthForm mode="signup" />
      </div>
    </Container>
  );
}
