import { formatDeai } from "@/lib/subscription/deai-cost";

type DeaiBadgeProps = {
  balance: number;
};

export function DeaiBadge({ balance }: DeaiBadgeProps) {
  return (
    <span
      className="tabular-nums text-xs font-semibold text-gold-light"
      title="Баланс Deai"
    >
      {formatDeai(balance)}
    </span>
  );
}
