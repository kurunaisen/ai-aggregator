"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { Plan } from "@/lib/subscription/constants";
import { DeaiBadge } from "@/components/layout/DeaiBadge";

type UserMenuProps = {
  user: User | null;
  deaiBalance?: number;
  plan?: Plan;
};

export function UserMenu({ user, deaiBalance = 0, plan = "free" }: UserMenuProps) {
  if (!user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/pricing"
          className="hidden text-xs text-silver-dim transition-colors hover:text-gold-light sm:inline"
        >
          Тарифы
        </Link>
        <Link
          href="/login"
          className="rounded-lg border divider-metallic px-3 py-1.5 text-xs text-silver transition-colors hover:border-gold/40 hover:text-gold-light sm:text-sm"
        >
          Войти
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <DeaiBadge balance={deaiBalance} unlimited={plan === "pro"} />
      <Link
        href="/account"
        className="hidden max-w-[140px] truncate rounded-lg border divider-metallic px-3 py-1.5 text-xs text-silver transition-colors hover:border-gold/40 hover:text-gold-light sm:inline sm:max-w-[180px] sm:text-sm"
        title={user.email ?? "Аккаунт"}
      >
        {user.email ?? "Аккаунт"}
      </Link>
    </div>
  );
}
