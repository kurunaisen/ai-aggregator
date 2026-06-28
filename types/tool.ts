export type PricingModel = "free" | "freemium" | "paid";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type Tool = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  /** DB column: category (display name, e.g. «Текст») */
  categoryLabel: string;
  /** DB column: tool_type (slug, e.g. text) */
  toolType: string;
  pricing: PricingModel;
  website: string;
  logoUrl?: string | null;
  featured: boolean;
  tags: string[];
  features: string[];
};

export const pricingLabels: Record<PricingModel, string> = {
  free: "Бесплатно",
  freemium: "Freemium",
  paid: "Платно",
};

export const toolTypeLabels: Record<string, string> = {
  text: "Текст",
  image: "Изображения",
  code: "Код",
  video: "Видео",
  design: "Дизайн",
};
