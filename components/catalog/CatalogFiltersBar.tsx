"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { categories, getToolCountByCategory } from "@/data/categories";
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
import { CatalogHintsMenu } from "@/components/catalog/CatalogHintsMenu";

type CatalogFiltersBarProps = {
  tools: Tool[];
  filters: CatalogFilters;
  children: ReactNode;
};

export function CatalogFiltersBar({ tools, filters, children }: CatalogFiltersBarProps) {
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

  const categoryCounts = Object.fromEntries(
    categories.map((c) => [c.slug, getToolCountByCategory(tools, c)]),
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
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-5 lg:gap-6">
      <FilterPanel
        categories={categories}
        selectedCategory={filters.category}
        onCategoryChange={(category) => updateFilter({ category })}
        selectedPricing={filters.pricing}
        onPricingChange={(pricing) => updateFilter({ pricing })}
        categoryCounts={categoryCounts}
        mobileOpen={mobileFiltersOpen}
        onMobileToggle={() => setMobileFiltersOpen((v) => !v)}
        activeFilterCount={activeFilterCount}
      />

      <div className="min-w-0 flex-1 space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            className="w-full min-w-0 flex-1"
          />
          {filtersActive && (
            <Button variant="ghost" onClick={resetFilters} className="shrink-0 text-xs">
              Сбросить
            </Button>
          )}
        </div>

        <CatalogHintsMenu />

        {children}
      </div>
    </div>
  );
}
