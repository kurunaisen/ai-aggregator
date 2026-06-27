type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "accent";
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  const styles =
    variant === "accent"
      ? "bg-gold/10 text-gold-light border-gold/30"
      : "bg-white/5 text-silver-dim border-white/10";

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {children}
    </span>
  );
}
