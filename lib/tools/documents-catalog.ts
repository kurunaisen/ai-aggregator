import type { Tool } from "@/types/tool";

export const DOCUMENTS_CATALOG_SLUG = "documents";

export function documentsCatalogTool(): Tool {
  return {
    slug: DOCUMENTS_CATALOG_SLUG,
    name: "Документы",
    tagline: "Ответы, акты, ППР и протоколы по вашим файлам",
    description: "Ответы, акты, ППР и протоколы по вашим файлам",
    longDescription:
      "Загрузите PDF, DOCX и текстовые файлы. Система отвечает на вопросы и готовит черновики актов, ППР, протоколов и писем только по фактам из ваших документов.",
    categoryLabel: "Текст",
    toolType: "text",
    pricing: "freemium",
    website: "https://platform.openai.com",
    logoUrl: "/logos/documents.svg",
    featured: true,
    tags: [],
    features: [],
  };
}

export function withDocumentsTool(tools: Tool[]): Tool[] {
  if (tools.some((tool) => tool.slug === DOCUMENTS_CATALOG_SLUG)) return tools;
  return [documentsCatalogTool(), ...tools];
}
