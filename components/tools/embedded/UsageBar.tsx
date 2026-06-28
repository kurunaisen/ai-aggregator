"use client";

import Link from "next/link";
import { formatDeai } from "@/lib/subscription/deai-cost";
import type { DeaiSummary } from "@/lib/subscription/deai";
import { getPlanLabel } from "@/lib/subscription/plans";

type UsageBarProps = {
  deai: DeaiSummary;
};

export function UsageBar({ deai }: UsageBarProps) {
  const planPrefix = deai.plan !== "free" ? `${getPlanLabel(deai.plan)} · ` : "";

  return (
    <div className="space-y-1.5 text-xs text-silver-dim">
      <p>
        {planPrefix}на балансе {formatDeai(deai.balance)} Deai
      </p>
      <Link href="/profile" className="text-gold-light hover:underline">
        профиль · тарифы
      </Link>
    </div>
  );
}
