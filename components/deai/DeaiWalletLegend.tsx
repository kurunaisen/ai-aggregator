import { DEAI_EXCHANGE_HINT, DEAI_PRICING_HINT } from "@/lib/subscription/constants";
import { DeaiModeTag } from "@/components/deai/DeaiModeTag";

type DeaiWalletLegendProps = {
  compact?: boolean;
};

export function DeaiWalletLegend({ compact = false }: DeaiWalletLegendProps) {
  if (compact) {
    return (
      <p className="text-xs text-silver-dim">
        Один баланс Deai · списание{" "}
        <DeaiModeTag mode="token" className="mx-0.5 align-middle" /> или{" "}
        <DeaiModeTag mode="credit" className="mx-0.5 align-middle" />
      </p>
    );
  }

  return (
    <div className="rounded-xl border divider-metallic bg-black/30 p-4">
      <p className="text-sm font-medium text-silver">Один кошелёк Deai</p>
      <p className="mt-2 text-xs leading-relaxed text-silver-dim">
        {DEAI_EXCHANGE_HINT}. Все инструменты списывают с одного баланса. Режим зависит от
        типа задачи:
      </p>
      <ul className="mt-3 space-y-2 text-xs text-silver-dim">
        <li className="flex flex-wrap items-center gap-2">
          <DeaiModeTag mode="token" />
          <span>
            текст и код — {DEAI_PRICING_HINT.text}
          </span>
        </li>
        <li className="flex flex-wrap items-center gap-2">
          <DeaiModeTag mode="credit" />
          <span>
            изображения — {DEAI_PRICING_HINT.image}
          </span>
        </li>
        <li className="flex flex-wrap items-center gap-2">
          <DeaiModeTag mode="credit" />
          <span>
            видео — {DEAI_PRICING_HINT.video}
          </span>
        </li>
      </ul>
    </div>
  );
}
