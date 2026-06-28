import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { DeaiUsageAnalytics } from "@/components/profile/DeaiUsageAnalytics";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileAvatarPicker } from "@/components/profile/ProfileAvatarPicker";
import { ProfileNameForm } from "@/components/profile/ProfileNameForm";
import { SubscriptionPanel } from "@/components/profile/SubscriptionPanel";
import { DeaiWalletLegend } from "@/components/deai/DeaiWalletLegend";
import { Button } from "@/components/ui/Button";
import {
  ensureProfile,
  getProfileDisplayName,
  getSessionUser,
} from "@/lib/auth/profile";
import { getOAuthEmail } from "@/lib/auth/oauth-metadata";
import { createClient } from "@/lib/supabase/server";
import {
  DEAI_PRICING_HINT,
  DEAI_STARTER_BUDGET_HINT,
} from "@/lib/subscription/constants";
import { getDeaiUsageReport } from "@/lib/subscription/deai-analytics";
import { formatDeai } from "@/lib/subscription/deai-cost";
import { getDeaiSummary } from "@/lib/subscription/deai";

export const metadata: Metadata = {
  title: "Профиль",
  description: "Имя аккаунта, подписка и аналитика расхода Deai на DeltaplanAI.",
};

type ProfilePageProps = {
  searchParams: Promise<{ days?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const profile = await ensureProfile(supabase, user);
  const deai = await getDeaiSummary(supabase, user.id, profile.plan);
  const displayName = getProfileDisplayName(profile, user);
  const accountEmail = getOAuthEmail(user);

  const params = await searchParams;
  const daysParam = Number(params.days);
  const days = daysParam === 7 || daysParam === 30 ? daysParam : 14;
  const usageReport = await getDeaiUsageReport(supabase, user.id, days);

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center gap-4">
          <ProfileAvatar avatarId={profile.avatarId} name={displayName} size="lg" />
          <div>
            <h1 className="text-3xl font-bold text-silver">{displayName}</h1>
            {accountEmail && (
              <p className="mt-1 text-sm text-silver-dim">{accountEmail}</p>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          <section className="carbon-panel rounded-2xl p-6 sm:p-8">
            <ProfileAvatarPicker
              initialAvatarId={profile.avatarId}
              displayName={displayName}
            />
          </section>

          <section className="carbon-panel rounded-2xl p-6 sm:p-8">
            <ProfileNameForm initialName={profile.displayName ?? displayName} />
          </section>

          <section className="carbon-panel rounded-2xl p-6 sm:p-8">
            <SubscriptionPanel plan={profile.plan} />
          </section>

          <section className="carbon-panel rounded-2xl p-6 sm:p-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gold/70">
              Баланс Deai
            </h2>
            {deai.unlimited ? (
              <p className="mt-3 text-silver">Без лимита (Pro)</p>
            ) : (
              <>
                <p className="mt-3 text-3xl font-bold text-gold-light">
                  {formatDeai(deai.balance)} Deai
                </p>
                <p className="mt-2 text-sm text-silver-dim">
                  {DEAI_STARTER_BUDGET_HINT}. Текст {DEAI_PRICING_HINT.text}, код{" "}
                  {DEAI_PRICING_HINT.code}, изображения {DEAI_PRICING_HINT.image}, видео{" "}
                  {DEAI_PRICING_HINT.video}.
                </p>
                <div className="mt-4">
                  <DeaiWalletLegend />
                </div>
              </>
            )}
          </section>

          <section className="carbon-panel rounded-2xl p-6 sm:p-8">
            <div className="mb-6 flex flex-wrap gap-2">
              {[7, 14, 30].map((period) => (
                <Link
                  key={period}
                  href={`/profile?days=${period}`}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    days === period
                      ? "border-gold/50 bg-gold/15 text-gold-light"
                      : "divider-metallic text-silver-dim hover:border-gold/30 hover:text-silver"
                  }`}
                >
                  {period} дн.
                </Link>
              ))}
            </div>
            <DeaiUsageAnalytics report={{ ...usageReport, days }} />
          </section>

          <div className="flex flex-wrap gap-3">
            <Button href="/catalog">Каталог</Button>
            <SignOutButton />
          </div>
        </div>
      </div>
    </Container>
  );
}
