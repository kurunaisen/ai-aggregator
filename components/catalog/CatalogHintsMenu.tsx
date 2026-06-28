"use client";

import Link from "next/link";
import { catalogHints } from "@/data/catalog-hints";

type CatalogHintsMenuProps = {
  /** Компактный вид для боковой колонки на главной */
  variant?: "catalog" | "sidebar";
  className?: string;
};

export function CatalogHintsMenu({
  variant = "catalog",
  className = "",
}: CatalogHintsMenuProps) {
  const isSidebar = variant === "sidebar";

  return (
    <section className={className} aria-label="Подсказки по задачам">
      <h2
        className={`font-semibold uppercase tracking-wider text-gold-light ${
          isSidebar ? "mb-2 text-xs" : "mb-3 text-xs"
        }`}
      >
        Что хотите сделать?
      </h2>

      {isSidebar ? (
        <nav className="max-h-52 space-y-1 overflow-y-auto pr-1 sm:max-h-64">
          {catalogHints.map((hint) => (
            <Link
              key={hint.id}
              href={hint.href}
              className="block rounded-xl px-3 py-2 text-sm text-silver-dim transition-colors hover:bg-white/5 hover:text-silver"
            >
              {hint.label}
            </Link>
          ))}
        </nav>
      ) : (
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
          {catalogHints.map((hint) => (
            <Link
              key={hint.id}
              href={hint.href}
              className="chip-inactive shrink-0 rounded-xl px-3 py-2 text-sm transition-all sm:shrink"
            >
              {hint.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
