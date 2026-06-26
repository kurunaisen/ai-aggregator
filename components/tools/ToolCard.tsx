import Link from "next/link";
import { getCategoryBySlug } from "@/data/categories";
import { pricingLabels } from "@/types/tool";
import type { Tool } from "@/types/tool";
import { Badge } from "@/components/ui/Badge";

type ToolCardProps = {
  tool: Tool;
};

const categoryColors: Record<string, string> = {
  text: "from-violet-500/20 to-violet-600/5 text-violet-300",
  image: "from-fuchsia-500/20 to-fuchsia-600/5 text-fuchsia-300",
  code: "from-cyan-500/20 to-cyan-600/5 text-cyan-300",
  video: "from-orange-500/20 to-orange-600/5 text-orange-300",
  audio: "from-emerald-500/20 to-emerald-600/5 text-emerald-300",
};

export function ToolCard({ tool }: ToolCardProps) {
  const category = getCategoryBySlug(tool.toolType);
  const initial = tool.name.charAt(0).toUpperCase();
  const colorClass =
    categoryColors[tool.toolType] ?? "from-zinc-500/20 to-zinc-600/5 text-zinc-300";

  return (
    <Link
      href={`/tool/${tool.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900/70 hover:shadow-lg hover:shadow-violet-500/5"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold ${colorClass}`}
          >
            {initial}
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 group-hover:text-white">
              {tool.name}
            </h3>
            {category && (
              <p className="mt-0.5 text-xs text-zinc-500">{category.name}</p>
            )}
          </div>
        </div>
            {tool.featured && (
              <Badge variant="accent">Топ</Badge>
            )}
            <Badge>{pricingLabels[tool.pricing]}</Badge>
      </div>

      <p className="mb-5 flex-1 text-sm leading-relaxed text-zinc-400">
        {tool.tagline}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {tool.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-500"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
