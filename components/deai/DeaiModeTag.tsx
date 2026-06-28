import type { DeaiBillingMode } from "@/lib/subscription/deai-cost";

type DeaiModeTagProps = {
  mode: DeaiBillingMode;
  className?: string;
};

const config: Record<DeaiBillingMode, { label: string }> = {
  token: { label: "Tokens" },
  credit: { label: "Credits" },
};

const tagClassName = "border-red-400/40 bg-red-950/50 text-red-200";

export function DeaiModeTag({ mode, className = "" }: DeaiModeTagProps) {
  const { label } = config[mode];

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${tagClassName} ${className}`}
    >
      {label}
    </span>
  );
}
