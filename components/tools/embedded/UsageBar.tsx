import Link from "next/link";
import type { UsageSummary } from "@/lib/subscription/usage";

type UsageBarProps = {
  usage: UsageSummary;
};

export function UsageBar({ usage }: UsageBarProps) {
  if (usage.plan === "pro") {
    return (
      <p className="text-xs text-silver-dim">
        Pro · сегодня {usage.usedToday} запросов ·{" "}
        <Link href="/account" className="text-gold-light hover:underline">
          аккаунт
        </Link>
      </p>
    );
  }

  return (
    <p className="text-xs text-silver-dim">
      Free · осталось {usage.remaining ?? 0} из {usage.dailyLimit} запросов сегодня ·{" "}
      {usage.remaining === 0 ? (
        <Link href="/pricing" className="text-gold-light hover:underline">
          Pro 990 ₽/мес
        </Link>
      ) : (
        <Link href="/account" className="text-gold-light hover:underline">
          аккаунт
        </Link>
      )}
    </p>
  );
}
