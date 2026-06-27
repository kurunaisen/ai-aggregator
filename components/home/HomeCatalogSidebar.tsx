import Link from "next/link";
import { categories } from "@/data/categories";
import { Button } from "@/components/ui/Button";
import { HomeCatalogSearch } from "@/components/home/HomeCatalogSearch";

type HomeCatalogSidebarProps = {
  toolCount: number;
};

export function HomeCatalogSidebar({ toolCount }: HomeCatalogSidebarProps) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="carbon-panel rounded-2xl p-5 sm:p-6">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gold/70">
          Каталог
        </h2>
        <p className="mb-4 text-xs text-silver-dim">
          {toolCount} {toolCount === 1 ? "инструмент" : toolCount >= 2 && toolCount <= 4 ? "инструмента" : "инструментов"}
        </p>

        <HomeCatalogSearch />

        <nav className="space-y-1">
          <SidebarLink href="/catalog" active>
            Все инструменты
          </SidebarLink>

          <div className="my-3 border-t divider-metallic" />

          {categories.map((category) => (
            <SidebarLink
              key={category.slug}
              href={`/catalog?category=${category.slug}`}
            >
              <span className="font-medium text-silver">{category.name}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-silver-dim">
                {category.description}
              </span>
            </SidebarLink>
          ))}
        </nav>

        <Button href="/catalog" className="mt-6 w-full">
          Открыть каталог
        </Button>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl px-3 py-2.5 text-sm transition-colors ${
        active
          ? "border border-gold/30 bg-gold/10 text-gold-light"
          : "text-silver-dim hover:bg-white/5 hover:text-silver"
      }`}
    >
      {children}
    </Link>
  );
}
