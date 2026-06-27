"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";

type UserMenuProps = {
  user: User | null;
};

export function UserMenu({ user }: UserMenuProps) {
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
      <Link
        href="/account"
        className="max-w-[120px] truncate rounded-lg border divider-metallic px-3 py-1.5 text-xs text-silver transition-colors hover:border-gold/40 hover:text-gold-light sm:max-w-[180px] sm:text-sm"
        title={user.email ?? "Аккаунт"}
      >
        {user.email ?? "Аккаунт"}
      </Link>
    </div>
  );
}
