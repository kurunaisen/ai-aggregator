import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";
import { getPublishedToolSlugs } from "@/lib/tools/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const slugs = await getPublishedToolSlugs();

  const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, changeFrequency: "daily" },
    { path: "/catalog", priority: 0.9, changeFrequency: "daily" },
    { path: "/about", priority: 0.5, changeFrequency: "monthly" },
    { path: "/submit", priority: 0.4, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ];

  const now = new Date();

  return [
    ...staticRoutes.map(({ path, priority, changeFrequency }) => ({
      url: path ? `${base}${path}` : base,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...slugs.map((slug) => ({
      url: `${base}/tool/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
