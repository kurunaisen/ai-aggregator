"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { DeaiBadge } from "@/components/layout/DeaiBadge";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";

type UserMenuProps = {
  user: User | null;
  displayName?: string;
  avatarId?: string | null;
  deaiBalance?: number;
};

export function UserMenu({
  user,
  displayName = "Профиль",
  avatarId,
  deaiBalance = 0,
}: UserMenuProps) {
  if (!user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <DeaiBadge href="/pricing" />
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
      <DeaiBadge balance={deaiBalance} />
      <Link
        href="/profile"
        aria-label={`Профиль: ${displayName}`}
        title={displayName}
        className="inline-flex rounded-full transition-transform hover:scale-105"
      >
        <ProfileAvatar avatarId={avatarId} name={displayName} size="sm" />
      </Link>
    </div>
  );
}
