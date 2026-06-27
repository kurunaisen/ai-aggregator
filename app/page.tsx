import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/data/categories";
import { getFeaturedTools } from "@/lib/tools/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildWebSiteSchema } from "@/lib/seo/schema";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { ToolGrid } from "@/components/tools/ToolGrid";

export async function generateMetadata(): Promise<Metadata> {
  const featured = await getFeaturedTools();
  const names = featured
    .slice(0, 3)
    .map((t) => t.name)
    .join(", ");

  const description = names
    ? `Каталог AI-инструментов: ${names} и другие нейросети для текста, изображений, кода, видео и аудио.`
    : "Каталог нейросетей и AI-инструментов с описаниями, категориями и фильтрами.";

  return buildPageMetadata({
    title: "Каталог нейросетей и AI-инструментов",
    description,
    path: "/",
    ogTitle: "DeltaplanAI — каталог нейросетей и AI-инструментов",
  });
}

export const revalidate = 60;

export default async function HomePage() {
  const featuredTools = await getFeaturedTools();

  return (
    <>
      <JsonLd data={buildWebSiteSchema()} />

      <section className="hero-glow border-b divider-metallic">
        <Container className="py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-5 inline-flex items-center rounded-full border border-gold/25 bg-gold/10 px-4 py-1.5 text-sm font-medium text-gold-light">
              Каталог AI-инструментов
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-silver sm:text-6xl sm:leading-tight">
              Найдите нейросеть{" "}
              <span className="text-gradient-metallic">для любой задачи</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-silver-dim">
              Текст, изображения, код, видео и аудио — собрали лучшие
              AI-инструменты в одном месте с описаниями и категориями.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/catalog" className="min-w-[180px]">
                Открыть каталог
              </Button>
              <Button href="/submit" variant="outline" className="min-w-[180px]">
                Добавить инструмент
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b divider-metallic">
        <Container className="py-20">
          <h2 className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-gold/70">
            Категории
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/catalog?category=${category.slug}`}
                className="carbon-card card-glow rounded-2xl px-5 py-6 text-center transition-all hover:border-gold/30 hover:shadow-gold"
              >
                <p className="font-medium text-silver">{category.name}</p>
                <p className="mt-2 text-xs leading-relaxed text-silver-dim">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-20">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-silver sm:text-3xl">
                Популярные инструменты
              </h2>
              <p className="mt-2 text-silver-dim">
                Топ нейросетей, которые стоит попробовать
              </p>
            </div>
            <Button href="/catalog" variant="ghost">
              Все инструменты →
            </Button>
          </div>
          <ToolGrid tools={featuredTools} />
        </Container>
      </section>
    </>
  );
}
