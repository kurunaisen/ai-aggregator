import { formatDeai } from "@/lib/subscription/deai-cost";

type DeaiCostHintProps = {
  cost: number;
  balance?: number;
  unlimited?: boolean;
  inButton?: boolean;
};

export function DeaiCostHint({
  cost,
  balance,
  unlimited = false,
  inButton = false,
}: DeaiCostHintProps) {
  if (unlimited) return null;

  const canAfford = balance === undefined || balance >= cost;

  const textClass = inButton
    ? canAfford
      ? "text-black/80"
      : "text-red-900"
    : canAfford
      ? "text-gold-light"
      : "text-red-300";

  const iconClass = inButton
    ? canAfford
      ? "text-black/90"
      : "text-red-800"
    : canAfford
      ? "text-gold drop-shadow-[0_0_4px_rgba(212,175,55,0.5)]"
      : "text-red-400";

  return (
    <span
      className={`inline-flex items-center gap-1 tabular-nums text-xs font-semibold ${textClass}`}
      title="Списание Deai"
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-3.5 w-3.5 shrink-0 ${iconClass}`}
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 2l2.2 6.8H21l-5.5 4 2.1 6.7L12 15.8 6.4 19.5l2.1-6.7L3 8.8h6.8L12 2z" />
      </svg>
      {formatDeai(cost)}
    </span>
  );
}
