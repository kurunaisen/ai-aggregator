import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "ghost" | "outline";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-gold to-gold-light text-black hover:from-gold-light hover:to-gold border border-gold/30 shadow-gold",
  ghost:
    "text-silver-dim hover:text-gold-light hover:bg-white/5 border border-transparent",
  outline:
    "border divider-metallic text-silver hover:border-gold/40 hover:text-gold-light bg-black/40",
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  type = "button",
  onClick,
  disabled,
}: ButtonProps) {
  const styles = `inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={styles} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
