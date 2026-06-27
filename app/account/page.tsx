import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { ensureProfile, getSessionUser } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import {
  FREE_DAILY_LIMIT,
  PRO_PRICE_LABEL,
} from "@/lib/subscription/constants";
import { getUsageSummary } from "@/lib/subscription/usage";
import { SignOutButton } from "@/components/auth/SignOutButton";

export const metadata: Metadata = {
  title: "Аккаунт",
  description: "Ваш тариф и использование DeltaplanAI.",
};

export default async function AccountPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const profile = await ensureProfile(supabase, user);
  const usage = await getUsageSummary(supabase, user.id, profile.plan);

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-bold text-silver">Аккаунт</h1>
        <p className="mt-2 text-silver-dim">{profile.email ?? user.email}</p>

        <div className="carbon-panel mt-8 space-y-6 rounded-2xl p-8">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gold/70">
              Тариф
            </h2>
            <p className="mt-2 text-2xl font-semibold capitalize text-silver">
              {profile.plan === "pro" ? "Pro" : "Free"}
            </p>
            {profile.plan === "free" && (
              <p className="mt-1 text-sm text-silver-dim">
                Pro — {PRO_PRICE_LABEL}, без лимита (скоро)
              </p>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gold/70">
              Использование сегодня
            </h2>
            {usage.plan === "pro" ? (
              <p className="mt-2 text-silver">{usage.usedToday} запросов · без лимита</p>
            ) : (
              <p className="mt-2 text-silver">
                {usage.usedToday} / {FREE_DAILY_LIMIT} запросов
                {usage.remaining !== null && (
                  <span className="text-silver-dim"> · осталось {usage.remaining}</span>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button href="/catalog">Каталог</Button>
            {profile.plan === "free" && (
              <Button href="/pricing" variant="outline">
                Перейти на Pro
              </Button>
            )}
            <SignOutButton />
          </div>
        </div>

        <p className="mt-6 text-sm text-silver-dim">
          Инструменты:{" "}
          <Link href="/tool/chatgpt" className="text-gold-light hover:underline">
            ChatGPT
          </Link>
          {", "}
          <Link href="/tool/claude" className="text-gold-light hover:underline">
            Claude
          </Link>
          {", "}
          <Link href="/tool/runway" className="text-gold-light hover:underline">
            Runway
          </Link>
        </p>
      </div>
    </Container>
  );
}
