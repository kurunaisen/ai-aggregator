export const SITE_NAME = "DeltaplanAI";

export const SITE_DESCRIPTION =
  "Каталог нейросетей и AI-инструментов: текст, изображения, код, видео и аудио. Описания, категории и фильтры — найдите подходящий сервис быстро.";

export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}
