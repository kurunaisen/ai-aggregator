import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/data/categories";
import {
  getPublishedToolSlugs,
  getRelatedTools,
  getToolBySlug,
} from "@/lib/tools/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildToolApplicationSchema } from "@/lib/seo/schema";
import { absoluteUrl } from "@/lib/seo/site";
import { pricingLabels } from "@/types/tool";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { ToolLogo } from "@/components/tools/ToolLogo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getPublishedToolSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    return buildPageMetadata({
      title: "Инструмент не найден",
      description: "Запрошенный AI-инструмент не найден в каталоге DeltaplanAI.",
      path: `/tool/${slug}`,
      noIndex: true,
    });
  }

  const category = getCategoryBySlug(tool.toolType);
  const pricing = pricingLabels[tool.pricing];
  const summary = tool.longDescription || tool.tagline;
  const excerpt =
    summary.length > 120 ? `${summary.slice(0, 117).trim()}…` : summary;

  return buildPageMetadata({
    title: `${tool.name} — обзор AI-инструмента`,
    description: `${tool.tagline}. Категория: ${category?.name ?? tool.categoryLabel}. Тариф: ${pricing}. ${excerpt}`,
    path: `/tool/${slug}`,
    ogType: "article",
    ogTitle: `${tool.name} — ${tool.tagline} | DeltaplanAI`,
  });
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) notFound();

  const category = getCategoryBySlug(tool.toolType);
  const related = await getRelatedTools(tool.toolType, tool.slug);

  return (
    <>
      <JsonLd
        data={buildToolApplicationSchema(tool, category?.name)}
      />

      <Container className="py-12 sm:py-16">
        <nav className="mb-10 text-sm text-silver-dim" aria-label="Хлебные крошки">
          <Link href="/" className="transition-colors hover:text-gold-light">
            Главная
          </Link>
          <span className="mx-2 text-gold/30">/</span>
          <Link href="/catalog" className="transition-colors hover:text-gold-light">
            Каталог
          </Link>
          <span className="mx-2 text-gold/30">/</span>
          <span className="text-silver">{tool.name}</span>
        </nav>

        <article itemScope itemType="https://schema.org/SoftwareApplication">
          <meta itemProp="name" content={tool.name} />
          <meta itemProp="url" content={tool.website} />
          <link itemProp="sameAs" href={absoluteUrl(`/tool/${tool.slug}`)} />

          <header className="carbon-panel mb-12 rounded-2xl p-8 sm:p-10">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {category && <Badge variant="accent">{category.name}</Badge>}
              <Badge>{pricingLabels[tool.pricing]}</Badge>
            </div>

            <div className="flex items-start gap-4 sm:gap-5">
              <ToolLogo
                name={tool.name}
                website={tool.website}
                logoUrl={tool.logoUrl}
                size="lg"
              />
              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-silver sm:text-5xl">
                  {tool.name}
                </h1>
                <p className="mt-4 text-lg text-silver-dim sm:text-xl">{tool.tagline}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={tool.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-gold/30 bg-gradient-to-r from-gold to-gold-light px-5 py-2.5 text-sm font-medium text-black transition-all hover:from-gold-light hover:to-gold shadow-gold"
              >
                Перейти на сайт ↗
              </a>
              <Button href="/catalog" variant="outline">
                ← Назад в каталог
              </Button>
            </div>
          </header>

          <div className="grid gap-12 lg:grid-cols-3">
            <div className="space-y-10 lg:col-span-2">
              <section>
                <h2 className="mb-4 text-xl font-semibold text-silver">
                  Описание
                </h2>
                <p className="leading-relaxed text-silver-dim" itemProp="description">
                  {tool.longDescription}
                </p>
              </section>

              {tool.features.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xl font-semibold text-silver">
                    Возможности
                  </h2>
                  <ul className="space-y-3">
                    {tool.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-silver-dim"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="space-y-8">
              {tool.tags.length > 0 && (
                <section className="carbon-panel rounded-2xl p-6">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold/70">
                    Теги
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {tool.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </section>
              )}

              {related.length > 0 && (
                <section className="carbon-panel rounded-2xl p-6">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold/70">
                    Похожие
                  </h2>
                  <ul className="space-y-3">
                    {related.map((item) => (
                      <li key={item.slug}>
                        <Link
                          href={`/tool/${item.slug}`}
                          className="text-sm text-silver transition-colors hover:text-gold-light"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          </div>
        </article>
      </Container>
    </>
  );
}
