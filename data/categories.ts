import type { Category } from "@/types/tool";

export const categories: Category[] = [
  {
    id: "text",
    name: "Текст",
    slug: "text",
    description: "Генерация и редактирование текста",
  },
  {
    id: "image",
    name: "Изображения",
    slug: "image",
    description: "Создание и редактирование изображений",
  },
  {
    id: "code",
    name: "Код",
    slug: "code",
    description: "Помощь в разработке и ревью кода",
  },
  {
    id: "video",
    name: "Видео",
    slug: "video",
    description: "Генерация и монтаж видео",
  },
  {
    id: "design",
    name: "Дизайн",
    slug: "design",
    description: "Графический дизайн и AI-макеты",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function toolMatchesCategory(
  tool: { categoryLabel: string; toolType: string },
  category: Category,
): boolean {
  return (
    tool.categoryLabel === category.name ||
    tool.toolType === category.slug ||
    tool.categoryLabel === category.slug
  );
}

export function getToolCountByCategoryLabel(
  tools: { categoryLabel: string; toolType: string }[],
  categoryName: string,
): number {
  const category = categories.find((c) => c.name === categoryName);
  if (!category) return 0;
  return tools.filter((t) => toolMatchesCategory(t, category)).length;
}

export function getToolCountByCategory(
  tools: { categoryLabel: string; toolType: string }[],
  category: Category,
): number {
  return tools.filter((t) => toolMatchesCategory(t, category)).length;
}

export function getToolCountByToolType(
  tools: { toolType: string }[],
  toolType: string,
): number {
  return tools.filter((t) => t.toolType === toolType).length;
}

export function getUniqueToolTypes(tools: { toolType: string }[]): string[] {
  return [...new Set(tools.map((t) => t.toolType))].sort();
}
