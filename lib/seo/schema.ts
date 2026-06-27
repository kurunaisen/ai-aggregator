import { absoluteUrl } from "@/lib/seo/site";
import type { Tool } from "@/types/tool";

export function buildCatalogItemListSchema(tools: Tool[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Каталог нейросетей DeltaplanAI",
    description:
      "Список AI-инструментов и нейросетей: текст, изображения, код, видео.",
    numberOfItems: tools.length,
    itemListElement: tools.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.name,
      url: absoluteUrl(`/tool/${tool.slug}`),
    })),
  };
}

export function buildToolApplicationSchema(tool: Tool, categoryName?: string) {
  const offer: Record<string, unknown> = {
    "@type": "Offer",
    priceCurrency: "USD",
  };

  if (tool.pricing === "free") {
    offer.price = "0";
  }

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.longDescription || tool.tagline,
    url: tool.website,
    applicationCategory: categoryName ?? tool.categoryLabel,
    operatingSystem: "Web",
    offers: offer,
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DeltaplanAI",
    url: absoluteUrl("/"),
    description:
      "Каталог нейросетей и AI-инструментов с описаниями и категориями.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/catalog")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
