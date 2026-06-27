import { formatDeai } from "@/lib/subscription/deai-cost";

type DeaiCostHintProps = {
  cost: number;
  balance?: number;
  unlimited?: boolean;
};

export function DeaiCostHint({ cost, balance, unlimited = false }: DeaiCostHintProps) {
  if (unlimited) return null;

  const canAfford = balance === undefined || balance >= cost;

  return (
    <div
      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold tabular-nums transition-colors ${
        canAfford
          ? "border-gold/35 bg-gold/10 text-gold-light shadow-[0_0_12px_rgba(212,175,55,0.2)]"
          : "border-red-400/40 bg-red-950/30 text-red-300"
      }`}
      title="Стоимость этого запроса"
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-4 w-4 shrink-0 ${canAfford ? "text-gold drop-shadow-[0_0_4px_rgba(212,175,55,0.6)]" : "text-red-400"}`}
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 2l2.2 6.8H21l-5.5 4 2.1 6.7L12 15.8 6.4 19.5l2.1-6.7L3 8.8h6.8L12 2z" />
      </svg>
      <span>
        −{formatDeai(cost)} <span className="font-medium opacity-80">Deai</span>
      </span>
    </div>
  );
}
