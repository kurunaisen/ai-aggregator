import type { DeaiBillingMode } from "@/lib/subscription/deai-cost";

type DeaiModeTagProps = {
  mode: DeaiBillingMode;
  size?: "xs" | "sm";
  className?: string;
};

const config: Record<
  DeaiBillingMode,
  { label: string; className: string }
> = {
  token: {
    label: "токены",
    className: "border-sky-400/35 bg-sky-950/40 text-sky-200",
  },
  credit: {
    label: "кредиты",
    className: "border-violet-400/35 bg-violet-950/40 text-violet-200",
  },
};

export function DeaiModeTag({ mode, size = "xs", className = "" }: DeaiModeTagProps) {
  const { label, className: modeClass } = config[mode];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wide ${size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"} ${modeClass} ${className}`}
    >
      {label}
    </span>
  );
}
