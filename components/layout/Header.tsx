import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ToolUpdatesMarquee } from "@/components/layout/ToolUpdatesMarquee";
import { UserMenu } from "@/components/layout/UserMenu";
import { ensureProfile, getSessionUser } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const user = supabase ? await getSessionUser(supabase) : null;
  const profile =
    user && supabase ? await ensureProfile(supabase, user) : null;

  return (
    <header className="sticky top-0 z-50 border-b divider-metallic bg-black/75 backdrop-blur-md">
      <Container>
        <div className="relative flex h-14 items-center lg:h-16">
          <div className="relative z-10 flex shrink-0 items-center gap-3">
            <Link
              href="/"
              aria-label="На главную"
              title="На главную"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border divider-metallic text-silver-dim transition-colors hover:border-gold/40 hover:bg-gold/10 hover:text-gold-light"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
            </Link>

            <Link href="/" className="hidden text-lg font-semibold tracking-tight text-silver sm:inline">
              Deltaplan<span className="text-gold">AI</span>
            </Link>
          </div>

          <ToolUpdatesMarquee />

          <div className="relative z-10 ml-auto shrink-0 pl-2">
            <UserMenu
              user={user}
              deaiBalance={profile?.deaiBalance ?? 0}
              plan={profile?.plan ?? "free"}
            />
          </div>
        </div>
      </Container>
    </header>
  );
}
