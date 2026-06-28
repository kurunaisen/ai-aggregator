"use client";

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
    <div className="space-y-5">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-center xl:max-w-5xl 2xl:max-w-6xl">
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
    </div>
  );
}
