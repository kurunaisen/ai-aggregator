import { Button } from "@/components/ui/Button";

type EmptyStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

export function EmptyState({
  title = "Ничего не найдено",
  description = "Попробуйте изменить запрос или сбросить фильтры.",
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/80">
        <svg
          className="h-7 w-7 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-zinc-200">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Button href={actionHref} variant="outline" className="mt-6">
          {actionLabel}
        </Button>
      )}
      {actionLabel && onAction && (
        <Button variant="outline" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
