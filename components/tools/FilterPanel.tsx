"use client";

import type { Category, PricingModel } from "@/types/tool";
import { pricingLabels, toolTypeLabels } from "@/types/tool";

type FilterPanelProps = {
  categories: Category[];
  toolTypes: string[];
  selectedCategory: string | null;
  onCategoryChange: (slug: string | null) => void;
  selectedToolType: string | null;
  onToolTypeChange: (toolType: string | null) => void;
  selectedPricing: PricingModel | null;
  onPricingChange: (pricing: PricingModel | null) => void;
  categoryCounts: Record<string, number>;
  toolTypeCounts: Record<string, number>;
  mobileOpen?: boolean;
  onMobileToggle?: () => void;
  activeFilterCount?: number;
};

const pricingOptions: PricingModel[] = ["free", "freemium", "paid"];

export function FilterPanel({
  categories,
  toolTypes,
  selectedCategory,
  onCategoryChange,
  selectedToolType,
  onToolTypeChange,
  selectedPricing,
  onPricingChange,
  categoryCounts,
  toolTypeCounts,
  mobileOpen = true,
  onMobileToggle,
  activeFilterCount = 0,
}: FilterPanelProps) {
  const filterBody = (
    <div className="space-y-6">
      <FilterGroup label="Категория">
        <FilterChip
          active={selectedCategory === null}
          onClick={() => onCategoryChange(null)}
        >
          Все
        </FilterChip>
        {categories.map((category) => (
          <FilterChip
            key={category.slug}
            active={selectedCategory === category.slug}
            onClick={() =>
              onCategoryChange(
                selectedCategory === category.slug ? null : category.slug,
              )
            }
          >
            {category.name}
            <span className="ml-1 opacity-60">
              {categoryCounts[category.slug] ?? 0}
            </span>
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup label="Тип (tool_type)">
        <FilterChip
          active={selectedToolType === null}
          onClick={() => onToolTypeChange(null)}
        >
          Все
        </FilterChip>
        {toolTypes.map((type) => (
          <FilterChip
            key={type}
            active={selectedToolType === type}
            onClick={() =>
              onToolTypeChange(selectedToolType === type ? null : type)
            }
          >
            {toolTypeLabels[type] ?? type}
            <span className="ml-1 opacity-60">{toolTypeCounts[type] ?? 0}</span>
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup label="Цена">
        <FilterChip
          active={selectedPricing === null}
          onClick={() => onPricingChange(null)}
        >
          Любая
        </FilterChip>
        {pricingOptions.map((pricing) => (
          <FilterChip
            key={pricing}
            active={selectedPricing === pricing}
            onClick={() =>
              onPricingChange(selectedPricing === pricing ? null : pricing)
            }
          >
            {pricingLabels[pricing]}
          </FilterChip>
        ))}
      </FilterGroup>
    </div>
  );

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      {onMobileToggle && (
        <button
          type="button"
          onClick={onMobileToggle}
          className="mb-4 flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm font-medium text-zinc-200 lg:hidden"
          aria-expanded={mobileOpen}
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            Фильтры
          </span>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">
              {activeFilterCount}
            </span>
          )}
          <svg
            className={`h-4 w-4 text-zinc-500 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      )}

      <div
        className={`rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6 ${
          mobileOpen ? "block" : "hidden lg:block"
        }`}
      >
        <h2 className="mb-5 hidden text-sm font-semibold text-zinc-300 lg:block">
          Фильтры
        </h2>
        {filterBody}
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

type FilterChipProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function FilterChip({ active, onClick, children }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-sm transition-all ${
        active
          ? "border-violet-500/40 bg-violet-500/10 text-violet-200"
          : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}
