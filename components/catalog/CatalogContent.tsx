"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  categories,
  getToolCountByCategoryLabel,
  getToolCountByToolType,
  getUniqueToolTypes,
} from "@/data/categories";
import {
  buildCatalogUrl,
  countActiveFilters,
  emptyFilters,
  filterAndSortTools,
  hasActiveFilters,
  parseCatalogFilters,
  type CatalogFilters,
} from "@/lib/catalog/filters";
import type { Tool } from "@/types/tool";
import { FilterPanel } from "@/components/tools/FilterPanel";
import { SearchBar } from "@/components/tools/SearchBar";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { Button } from "@/components/ui/Button";

type CatalogContentProps = {
  tools: Tool[];
};

function formatToolCount(count: number): string {
  if (count === 1) return "1 инструмент";
  if (count >= 2 && count <= 4) return `${count} инструмента`;
  return `${count} инструментов`;
}

export function CatalogContent({ tools }: CatalogContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const filtersFromUrl = useMemo(
    () =>
      parseCatalogFilters(
        Object.fromEntries(searchParams.entries()) as Record<
          string,
          string | undefined
        >,
      ),
    [searchParams],
  );

  useEffect(() => {
    setSearchInput(filtersFromUrl.q);
  }, [filtersFromUrl.q]);

  const effectiveFilters: CatalogFilters = useMemo(
    () => ({ ...filtersFromUrl, q: searchInput }),
    [filtersFromUrl, searchInput],
  );

  const pushFilters = useCallback(
    (next: CatalogFilters) => {
      router.replace(buildCatalogUrl(next), { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filtersFromUrl.q) {
        pushFilters({ ...filtersFromUrl, q: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filtersFromUrl, pushFilters]);

  const toolTypes = useMemo(() => getUniqueToolTypes(tools), [tools]);

  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        categories.map((c) => [
          c.slug,
          getToolCountByCategoryLabel(tools, c.name),
        ]),
      ),
    [tools],
  );

  const toolTypeCounts = useMemo(
    () =>
      Object.fromEntries(
        toolTypes.map((type) => [type, getToolCountByToolType(tools, type)]),
      ),
    [tools, toolTypes],
  );

  const filtered = useMemo(
    () => filterAndSortTools(tools, effectiveFilters),
    [tools, effectiveFilters],
  );

  const activeFilterCount = countActiveFilters(effectiveFilters);
  const filtersActive = hasActiveFilters(effectiveFilters);

  function resetFilters() {
    setSearchInput("");
    pushFilters(emptyFilters());
    setMobileFiltersOpen(false);
  }

  function updateFilter(patch: Partial<CatalogFilters>) {
    pushFilters({ ...filtersFromUrl, ...patch, q: searchInput });
  }

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start lg:gap-10 lg:space-y-0">
      <aside>
        <FilterPanel
          categories={categories}
          toolTypes={toolTypes}
          selectedCategory={filtersFromUrl.category}
          onCategoryChange={(category) => updateFilter({ category })}
          selectedToolType={filtersFromUrl.toolType}
          onToolTypeChange={(toolType) => updateFilter({ toolType })}
          selectedPricing={filtersFromUrl.pricing}
          onPricingChange={(pricing) => updateFilter({ pricing })}
          categoryCounts={categoryCounts}
          toolTypeCounts={toolTypeCounts}
          mobileOpen={mobileFiltersOpen}
          onMobileToggle={() => setMobileFiltersOpen((v) => !v)}
          activeFilterCount={activeFilterCount}
        />
      </aside>

      <div className="min-w-0 space-y-6">
        <SearchBar value={searchInput} onChange={setSearchInput} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">
            {formatToolCount(filtered.length)}
            {filtersActive && (
              <span className="text-zinc-600"> · из {tools.length}</span>
            )}
          </p>
          {filtersActive && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="self-start text-xs sm:self-auto"
            >
              Сбросить фильтры
            </Button>
          )}
        </div>

        <ToolGrid
          tools={filtered}
          emptyTitle="Ничего не найдено"
          emptyDescription="Попробуйте изменить запрос или сбросить фильтры — возможно, нужный инструмент ещё не добавлен в каталог."
          emptyActionLabel={filtersActive ? "Сбросить фильтры" : undefined}
          onEmptyAction={filtersActive ? resetFilters : undefined}
        />
      </div>
    </div>
  );
}
