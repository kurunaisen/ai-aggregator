"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  categories,
  getToolCountByCategoryLabel,
  getToolCountByToolType,
  getUniqueToolTypes,
} from "@/data/categories";
import {
  buildCatalogUrl,
  countActiveFilters,
  hasActiveFilters,
  type CatalogFilters,
} from "@/lib/catalog/filters";
import type { Tool } from "@/types/tool";
import { FilterPanel } from "@/components/tools/FilterPanel";
import { SearchBar } from "@/components/tools/SearchBar";
import { Button } from "@/components/ui/Button";

type CatalogFiltersBarProps = {
  tools: Tool[];
  filters: CatalogFilters;
};

export function CatalogFiltersBar({ tools, filters }: CatalogFiltersBarProps) {
  const router = useRouter();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.q);

  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  const pushFilters = useCallback(
    (next: CatalogFilters) => {
      router.push(buildCatalogUrl(next));
    },
    [router],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.q) {
        pushFilters({ ...filters, q: searchInput });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters, pushFilters]);

  const toolTypes = getUniqueToolTypes(tools);
  const categoryCounts = Object.fromEntries(
    categories.map((c) => [
      c.slug,
      getToolCountByCategoryLabel(tools, c.name),
    ]),
  );
  const toolTypeCounts = Object.fromEntries(
    toolTypes.map((type) => [type, getToolCountByToolType(tools, type)]),
  );

  const activeFilterCount = countActiveFilters(filters);
  const filtersActive = hasActiveFilters(filters);

  function resetFilters() {
    setSearchInput("");
    router.push("/catalog");
    setMobileFiltersOpen(false);
  }

  function updateFilter(patch: Partial<CatalogFilters>) {
    pushFilters({ ...filters, ...patch, q: searchInput });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={searchInput} onChange={setSearchInput} />
        {filtersActive && (
          <Button variant="ghost" onClick={resetFilters} className="shrink-0 text-xs">
            Сбросить
          </Button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <QuickChip href="/catalog" active={!filters.category && !filters.toolType}>
          Все ({tools.length})
        </QuickChip>
        {categories.map((category) => {
          const count = categoryCounts[category.slug] ?? 0;
          if (count === 0) return null;
          return (
            <QuickChip
              key={category.slug}
              href={`/catalog?category=${category.slug}`}
              active={filters.category === category.slug}
            >
              {category.name} ({count})
            </QuickChip>
          );
        })}
      </div>

      <FilterPanel
        categories={categories.filter(
          (c) => (categoryCounts[c.slug] ?? 0) > 0,
        )}
        toolTypes={toolTypes}
        selectedCategory={filters.category}
        onCategoryChange={(category) => updateFilter({ category })}
        selectedToolType={filters.toolType}
        onToolTypeChange={(toolType) => updateFilter({ toolType })}
        selectedPricing={filters.pricing}
        onPricingChange={(pricing) => updateFilter({ pricing })}
        categoryCounts={categoryCounts}
        toolTypeCounts={toolTypeCounts}
        mobileOpen={mobileFiltersOpen}
        onMobileToggle={() => setMobileFiltersOpen((v) => !v)}
        activeFilterCount={activeFilterCount}
      />
    </div>
  );
}

function QuickChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-xl px-3.5 py-2 text-sm transition-colors ${active ? "chip-active" : "chip-inactive"}`}
    >
      {children}
    </Link>
  );
}
