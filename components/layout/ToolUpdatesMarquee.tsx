import Link from "next/link";
import { getMarqueeTools } from "@/lib/tools/queries";

const fallbackItems = [
  { slug: "catalog", href: "/catalog", label: "Каталог" },
  { slug: "submit", href: "/submit", label: "Добавить инструмент" },
];

export async function ToolUpdatesMarquee() {
  const tools = await getMarqueeTools(3);

  const entries =
    tools.length > 0
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

  return (
    <nav
      className="absolute inset-0 flex items-center justify-center gap-4 px-24 sm:gap-8 sm:px-32 lg:px-40"
      aria-label="Последние обновления в каталоге"
    >
      {entries.map((entry) => (
        <Link
          key={entry.key}
          href={entry.href}
          className="inline-flex items-center gap-2 text-xs text-silver-dim transition-colors hover:text-gold-light sm:text-sm"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" aria-hidden />
          <span className="max-w-[8rem] truncate sm:max-w-none sm:whitespace-nowrap">
            {entry.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
