import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { ensureProfile, getSessionUser } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { PRO_DEAI_GRANT_LABEL, PRO_PRICE_LABEL } from "@/lib/subscription/constants";
import { canAccessVideoStudio } from "@/lib/subscription/plans";

export const metadata: Metadata = {
  title: "Видео-студия",
  description: "Pro-студия DeltaplanAI: персонаж, сцены и видео в одном пайплайне.",
};

export default async function VideoStudioPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const user = await getSessionUser(supabase);
  if (!user) redirect("/login?next=/studio/video");

  const profile = await ensureProfile(supabase, user);

  if (!canAccessVideoStudio(profile.plan)) {
    return (
      <Container className="py-16">
        <div className="carbon-panel mx-auto max-w-lg rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-silver">Видео-студия</h1>
          <p className="mt-4 text-sm leading-relaxed text-silver-dim">
            Студия доступна только на тарифе <strong className="text-silver">Pro</strong> (
            {PRO_DEAI_GRANT_LABEL} за {PRO_PRICE_LABEL}): генерация референса персонажа, сцен с
            референсом и финального видео по кадрам.
          </p>
          <Button href="/pricing" className="mt-8">
            Перейти на Pro
          </Button>
          <p className="mt-4 text-xs text-silver-dim">
            Уже оформили Pro?{" "}
            <Link href="/profile" className="text-gold-light underline">
              Проверьте подписку в профиле
            </Link>
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <div className="carbon-panel mx-auto max-w-2xl rounded-2xl p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold/70">Pro</p>
        <h1 className="mt-2 text-3xl font-bold text-silver">Видео-студия</h1>
        <p className="mt-4 text-sm leading-relaxed text-silver-dim">
          Скоро здесь будет пайплайн из трёх шагов: референс персонажа → сцены с референсом →
          видео по кадрам. Тариф Pro активен — доступ откроется с первым релизом студии.
        </p>
        <ol className="mt-6 space-y-3 text-sm text-silver-dim">
          <li>
            <span className="font-medium text-silver">1. Персонаж</span> — генерация модели /
            референса
          </li>
          <li>
            <span className="font-medium text-silver">2. Сцены</span> — кадры с прикреплённым
            референсом
          </li>
          <li>
            <span className="font-medium text-silver">3. Видео</span> — анимация выбранных сцен
          </li>
        </ol>
        <Button href="/catalog" variant="outline" className="mt-8">
          Пока — инструменты каталога
        </Button>
      </div>
    </Container>
  );
}
