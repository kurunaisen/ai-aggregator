import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { ToolAccessStatus } from "@/lib/subscription/tool-access";

type ToolAccessGateMessageProps = {
  toolName: string;
  access: ToolAccessStatus;
};

export function ToolAccessGateMessage({ toolName, access }: ToolAccessGateMessageProps) {
  if (access.allowed) return null;

  const insufficientDeai = access.code === "INSUFFICIENT_DEAI";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center text-sm text-silver-dim">
      <p className="max-w-md leading-relaxed">
        {access.reason ??
          (insufficientDeai
            ? `Недостаточно Deai для ${toolName}. Пополните баланс или оформите подписку.`
            : `Пробная генерация в ${toolName} на тарифе Base уже использована.`)}
      </p>
      <Button href="/pricing">
        {insufficientDeai ? "Пополнить Deai" : "Перейти на Pro"}
      </Button>
      <Link href="/profile" className="text-gold-light underline hover:text-gold">
        Профиль и баланс Deai
      </Link>
    </div>
  );
}

/** @deprecated use ToolAccessGateMessage */
export const BaseTrialGateMessage = ToolAccessGateMessage;

export function BaseTrialHint({ access }: { access: ToolAccessStatus }) {
  if (!access.isBaseTrialTool || !access.allowed || access.trialsLimit === null) {
    return null;
  }

  if (access.trialsUsed >= access.trialsLimit) return null;

  const remaining = access.trialsLimit - access.trialsUsed;

  return (
    <p className="rounded-xl border border-gold/25 bg-gold/10 px-3 py-2 text-xs text-gold-light">
      Base: осталось {remaining} из {access.trialsLimit} пробной генерации на этом инструменте.
      Полный доступ — в тарифе Pro.
    </p>
  );
}
