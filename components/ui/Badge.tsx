type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "accent";
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  const styles =
    variant === "accent"
      ? "bg-violet-500/10 text-violet-300 border-violet-500/20"
      : "bg-zinc-800 text-zinc-400 border-zinc-700";

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {children}
    </span>
  );
}
