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
    "bg-zinc-100 text-zinc-950 hover:bg-white border border-transparent",
  ghost: "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent",
  outline:
    "border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100",
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
  const styles = `inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`;

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
