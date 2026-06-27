import Link from "next/link";
import { DeaiModeTag } from "@/components/deai/DeaiModeTag";
import type { DeaiBillingMode } from "@/lib/subscription/deai-cost";
import { formatDeai } from "@/lib/subscription/deai-cost";
import type { DeaiSummary } from "@/lib/subscription/deai";

type UsageBarProps = {
  deai: DeaiSummary;
  billingMode?: DeaiBillingMode;
};

export function UsageBar({ deai, billingMode }: UsageBarProps) {
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
      <div className="flex flex-wrap items-center gap-2">
        <p>На балансе {formatDeai(deai.balance)} Deai</p>
        {billingMode && <DeaiModeTag mode={billingMode} />}
      </div>
      <Link href="/profile" className="text-gold-light hover:underline">
        профиль · режимы списания
      </Link>
    </div>
  );
}
