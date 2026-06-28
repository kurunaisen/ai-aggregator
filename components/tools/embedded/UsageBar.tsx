import Link from "next/link";
import { formatDeai } from "@/lib/subscription/deai-cost";
import type { DeaiSummary } from "@/lib/subscription/deai";

type UsageBarProps = {
  deai: DeaiSummary;
};

export function UsageBar({ deai }: UsageBarProps) {
  if (deai.unlimited) {
    return (
      <div className="space-y-1 text-xs text-silver-dim">
        <p>Pro · Deai без лимита</p>
        <Link href="/profile" className="text-gold-light hover:underline">
          профиль
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 text-xs text-silver-dim">
      <p>На балансе {formatDeai(deai.balance)} Deai</p>
      <Link href="/profile" className="text-gold-light hover:underline">
        профиль · режимы списания
      </Link>
    </div>
  );
}
