import Link from "next/link";
import { getMarqueeTools } from "@/lib/tools/queries";

const fallbackItems = [
  {
    slug: "submit",
    href: "/submit",
    label: "Предложите AI-инструмент для добавления в каталог",
  },
  {
    slug: "catalog",
    href: "/catalog",
    label: "Откройте каталог DeltaplanAI",
  },
];

export async function ToolUpdatesMarquee() {
  const tools = await getMarqueeTools(3);
  const hasTools = tools.length > 0;

  const entries = hasTools
    ? tools.map((tool) => ({
        key: tool.slug,
        href: `/tool/${tool.slug}`,
        label: tool.name,
      }))
    : fallbackItems.map((item) => ({
        key: item.slug,
        href: item.href,
        label: item.label,
      }));

  const loop = [...entries, ...entries];

  return (
    <div
      className="ticker-mask relative min-w-0 flex-1 overflow-hidden"
      aria-label="Последние изменения в каталоге"
    >
      <div className="ticker-track flex w-max items-center gap-10 py-1">
        {loop.map((entry, index) => (
          <Link
            key={`${entry.key}-${index}`}
            href={entry.href}
            className="inline-flex shrink-0 items-center gap-2 text-sm text-silver-dim transition-colors hover:text-gold-light"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" aria-hidden />
            <span className="whitespace-nowrap">{entry.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
