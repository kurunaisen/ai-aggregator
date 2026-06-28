import { getCategoryBySlug, toolMatchesCategory } from "@/data/categories";
import type { PricingModel, Tool } from "@/types/tool";

export type CatalogFilters = {
  q: string;
  category: string | null;
  pricing: PricingModel | null;
};

const PRICING_VALUES: PricingModel[] = ["free", "freemium", "paid"];

export function parseCatalogFilters(
  params: Record<string, string | string[] | undefined>,
): CatalogFilters {
  const get = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value : null;
  };

  const pricing = get("pricing");
  const validPricing = PRICING_VALUES.includes(pricing as PricingModel)
    ? (pricing as PricingModel)
    : null;

  const categoryParam = get("category") ?? get("tool_type");
  const validCategory =
    categoryParam && getCategoryBySlug(categoryParam) ? categoryParam : null;

  return {
    q: get("q") ?? "",
    category: validCategory,
    pricing: validPricing,
  };
}

export function buildCatalogUrl(filters: CatalogFilters): string {
  const params = new URLSearchParams();

  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.pricing) params.set("pricing", filters.pricing);

  const qs = params.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

export function filterAndSortTools(
  tools: Tool[],
  filters: CatalogFilters,
): Tool[] {
  const q = filters.q.trim().toLowerCase();

  const filtered = tools.filter((tool) => {
    if (filters.category) {
      const cat = getCategoryBySlug(filters.category);
      if (cat && !toolMatchesCategory(tool, cat)) return false;
    }

    if (filters.pricing && tool.pricing !== filters.pricing) return false;

    if (q) {
      const haystack = `${tool.name} ${tool.tagline}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    if (a.featured !== b.featured) {
      return a.featured ? -1 : 1;
    }
    return a.name.localeCompare(b.name, "ru");
  });
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return (
    filters.q.trim() !== "" ||
    filters.category !== null ||
    filters.pricing !== null
  );
}

export function countActiveFilters(filters: CatalogFilters): number {
  let count = 0;
  if (filters.q.trim()) count++;
  if (filters.category) count++;
  if (filters.pricing) count++;
  return count;
}

export function emptyFilters(): CatalogFilters {
  return { q: "", category: null, pricing: null };
}
