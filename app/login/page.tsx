import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Вход",
  description: "Войдите в DeltaplanAI для доступа к встроенным нейросетям.",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; reason?: string }>;
};

function buildAuthErrorMessage(error?: string, reason?: string): string | null {
  if (error !== "auth") return null;
  if (reason?.includes("missing provider id")) {
    return "Supabase не получил ID пользователя от Яндекса. Задеплойте сайт и перезапустите scripts/run-yandex-oauth-fix.cmd (userinfo proxy).";
  }
  if (reason?.includes("email from external provider")) {
    return "Яндекс не передал email в формате Supabase. В Supabase для custom:yandex включите email_optional и custom_claims_allowlist (scripts/update-yandex-oauth.ps1), затем войдите снова.";
  }
  if (reason) {
    return `Не удалось войти: ${reason}`;
  }
  return "Не удалось войти. Попробуйте снова или выберите другой способ.";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const initialMessage = buildAuthErrorMessage(params.error, params.reason);

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold text-silver">Вход</h1>
        <p className="mb-8 text-center text-silver-dim">
          Используйте ChatGPT, Claude и Runway на DeltaplanAI
        </p>
        <AuthForm mode="login" initialMessage={initialMessage} />
        <p className="mt-6 text-center text-sm text-silver-dim">
          <Link href="/pricing" className="text-gold-light hover:underline">
            Тарифы и лимиты
          </Link>
        </p>
      </div>
    </Container>
  );
}
