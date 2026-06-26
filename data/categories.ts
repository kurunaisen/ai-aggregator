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
    id: "audio",
    name: "Аудио",
    slug: "audio",
    description: "Голос, музыка и озвучка",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getToolCountByCategoryLabel(
  tools: { categoryLabel: string }[],
  categoryName: string,
): number {
  return tools.filter((t) => t.categoryLabel === categoryName).length;
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
