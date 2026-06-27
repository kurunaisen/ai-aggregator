import type { Metadata } from "next";
import { SITE_NAME, getSiteUrl } from "@/lib/seo/site";

type BuildMetadataOptions = {
  /** Page title without site name (layout template adds it) */
  title: string;
  description: string;
  /** Path starting with /, e.g. /catalog */
  path: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
  /** Override full OG/Twitter title (defaults to title | SITE_NAME) */
  ogTitle?: string;
};

export function buildPageMetadata({
  title,
  description,
  path,
  ogType = "website",
  noIndex = false,
  ogTitle,
}: BuildMetadataOptions): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}${path}`;
  const fullTitle = ogTitle ?? `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "ru_RU",
      type: ogType,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

export function buildRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${SITE_NAME} — каталог нейросетей и AI-инструментов`,
      template: `%s | ${SITE_NAME}`,
    },
    description:
      "Найдите лучшие нейросети для текста, изображений, кода и видео. Актуальный каталог AI-инструментов с описаниями и категориями.",
    openGraph: {
      type: "website",
      locale: "ru_RU",
      siteName: SITE_NAME,
      title: `${SITE_NAME} — каталог нейросетей и AI-инструментов`,
      description:
        "Найдите лучшие нейросети для текста, изображений, кода и видео.",
      url: siteUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — каталог нейросетей`,
      description:
        "Каталог AI-инструментов с описаниями, категориями и фильтрами.",
    },
  };
}
