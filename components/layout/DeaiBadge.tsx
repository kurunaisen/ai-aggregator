import Link from "next/link";
import { formatDeai } from "@/lib/subscription/deai-cost";

type DeaiBadgeProps = {
  balance?: number;
  href?: string;
};

export function DeaiBadge({ balance, href = "/profile" }: DeaiBadgeProps) {
  return (
    <Link
      href={href}
      title="Единый баланс Deai · списание токенами (текст/код) или кредитами (медиа)"
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
        {balance !== undefined ? (
          <>
            {formatDeai(balance)}
            <span className="ml-0.5 font-medium text-gold/80">Deai</span>
          </>
        ) : (
          <span className="font-medium text-gold/80">Deai</span>
        )}
      </span>
    </Link>
  );
}
