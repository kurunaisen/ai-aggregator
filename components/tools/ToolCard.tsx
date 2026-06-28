import Link from "next/link";
import { getCategoryBySlug } from "@/data/categories";
import { pricingLabels } from "@/types/tool";
import type { Tool } from "@/types/tool";
import { Badge } from "@/components/ui/Badge";
import { ToolLogo } from "@/components/tools/ToolLogo";

type ToolCardProps = {
  tool: Tool;
};

const categoryColors: Record<string, string> = {
  text: "from-silver/20 to-gold/10 text-gold-light",
  image: "from-gold/25 to-silver/10 text-gold-light",
  code: "from-silver/15 to-white/5 text-silver",
  video: "from-gold/20 to-gold-dim/10 text-gold",
};

export function ToolCard({ tool }: ToolCardProps) {
  const category = getCategoryBySlug(tool.toolType);
  const colorClass =
    categoryColors[tool.toolType] ?? "from-silver/15 to-white/5 text-silver";

  return (
    <Link
      href={`/tool/${tool.slug}`}
      className="carbon-card group relative flex min-h-[220px] flex-col overflow-hidden rounded-2xl p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-gold"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ToolLogo
            slug={tool.slug}
            name={tool.name}
            website={tool.website}
            logoUrl={tool.logoUrl}
            colorClass={colorClass}
          />
          <div>
            <h3 className="font-semibold text-silver group-hover:text-gold-light">
              {tool.name}
            </h3>
            {category && (
              <p className="mt-0.5 text-xs text-silver-dim">{category.name}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {tool.featured && <Badge variant="accent">Топ</Badge>}
          <Badge>{pricingLabels[tool.pricing]}</Badge>
        </div>
      </div>

      <p className="mb-5 flex-1 text-sm leading-relaxed text-silver-dim">
        {tool.tagline}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {tool.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-silver-dim ring-1 ring-white/5"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
