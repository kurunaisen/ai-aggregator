"use client";

import Link from "next/link";
import { formatDeai } from "@/lib/subscription/deai-cost";

type DeaiBadgeProps = {
  balance: number;
  unlimited?: boolean;
};

export function DeaiBadge({ balance, unlimited = false }: DeaiBadgeProps) {
  const label = unlimited ? "∞" : formatDeai(balance);

  return (
    <Link
      href="/account"
      title="Баланс Deai"
      className="deai-badge group relative inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-black/60 px-2.5 py-1 text-xs font-semibold text-gold-light transition-colors hover:border-gold/70 hover:text-gold sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
    >
      <span className="deai-badge-glow pointer-events-none absolute inset-0 rounded-full" aria-hidden />
      <span className="relative flex h-5 w-5 items-center justify-center sm:h-6 sm:w-6">
        <svg
          viewBox="0 0 24 24"
          className="h-full w-full text-gold drop-shadow-[0_0_6px_rgba(212,175,55,0.65)]"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 2l2.2 6.8H21l-5.5 4 2.1 6.7L12 15.8 6.4 19.5l2.1-6.7L3 8.8h6.8L12 2z" />
        </svg>
      </span>
      <span className="relative tabular-nums">
        {label}
        <span className="ml-0.5 font-medium text-gold/80">Deai</span>
      </span>
    </Link>
  );
}
