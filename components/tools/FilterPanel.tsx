"use client";

import { useRef, useState } from "react";
import type { Category, PricingModel } from "@/types/tool";
import { pricingLabels } from "@/types/tool";

type FilterPanelProps = {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (slug: string | null) => void;
  selectedPricing: PricingModel | null;
  onPricingChange: (pricing: PricingModel | null) => void;
  categoryCounts: Record<string, number>;
  mobileOpen?: boolean;
  onMobileToggle?: () => void;
  activeFilterCount?: number;
};

const pricingOptions: PricingModel[] = ["free", "freemium", "paid"];

export function FilterPanel({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedPricing,
  onPricingChange,
  categoryCounts,
  mobileOpen = true,
  onMobileToggle,
  activeFilterCount = 0,
}: FilterPanelProps) {
  const [hoverOpen, setHoverOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openHover() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setHoverOpen(true);
  }

  function scheduleCloseHover() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setHoverOpen(false), 120);
  }

  const filterBody = (
    <div className="space-y-6">
      <FilterGroup label="Категория">
        <FilterChip active={selectedCategory === null} onClick={() => onCategoryChange(null)}>
          Все
        </FilterChip>
        {categories.map((category) => (
          <FilterChip
            key={category.slug}
            active={selectedCategory === category.slug}
            onClick={() =>
              onCategoryChange(selectedCategory === category.slug ? null : category.slug)
            }
          >
            {category.name}
            <span className="ml-1 opacity-60">{categoryCounts[category.slug] ?? 0}</span>
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup label="Цена">
        <FilterChip active={selectedPricing === null} onClick={() => onPricingChange(null)}>
          Любая
        </FilterChip>
        {pricingOptions.map((pricing) => (
          <FilterChip
            key={pricing}
            active={selectedPricing === pricing}
            onClick={() => onPricingChange(selectedPricing === pricing ? null : pricing)}
          >
            {pricingLabels[pricing]}
          </FilterChip>
        ))}
      </FilterGroup>
    </div>
  );

  return (
    <>
      {onMobileToggle && (
        <div className="md:hidden">
          <button
            type="button"
            onClick={onMobileToggle}
            className="carbon-panel mb-4 flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-silver"
            aria-expanded={mobileOpen}
            aria-label="Категория и цена"
          >
            <span className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-gold/70" />
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs text-gold-light">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <svg
              className={`h-4 w-4 text-silver-dim transition-transform ${mobileOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {mobileOpen && (
            <div className="filter-popover carbon-panel mb-4 rounded-2xl p-5">{filterBody}</div>
          )}
        </div>
      )}

      <div
        className={`relative hidden shrink-0 md:block lg:sticky lg:top-24 lg:self-start ${
          hoverOpen ? "z-50" : "z-20"
        }`}
        onMouseEnter={openHover}
        onMouseLeave={scheduleCloseHover}
      >
        <div
          className={`carbon-panel relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
            hoverOpen || activeFilterCount > 0 ? "border-gold/30" : ""
          }`}
          aria-label="Категория и цена"
        >
          <FilterIcon className="h-5 w-5 text-gold/70" />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold/20 px-1 text-[10px] font-semibold text-gold-light">
              {activeFilterCount}
            </span>
          )}
        </div>

        {hoverOpen && (
          <div className="absolute left-full top-0 z-50 pl-2">
            <div className="filter-popover carbon-panel w-72 rounded-2xl p-5 shadow-gold">
              {filterBody}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
      />
    </svg>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold-light">{label}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm transition-all ${active ? "chip-active" : "chip-inactive"}`}
    >
      {children}
    </button>
  );
}
