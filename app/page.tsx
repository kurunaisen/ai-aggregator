import type { Metadata } from "next";
import { getFeaturedTools, getPublishedTools } from "@/lib/tools/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildWebSiteSchema } from "@/lib/seo/schema";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { HomeCatalogSidebar } from "@/components/home/HomeCatalogSidebar";
import { JsonLd } from "@/components/seo/JsonLd";
import { ToolGrid } from "@/components/tools/ToolGrid";

export async function generateMetadata(): Promise<Metadata> {
  const featured = await getFeaturedTools();
  const names = featured
    .slice(0, 3)
    .map((t) => t.name)
    .join(", ");

  const description = names
    ? `Каталог AI-инструментов: ${names} и другие нейросети для текста, изображений, кода и видео.`
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
  const [featuredTools, allTools] = await Promise.all([
    getFeaturedTools(),
    getPublishedTools(),
  ]);

  return (
    <>
      <JsonLd data={buildWebSiteSchema()} />

      <section className="hero-glow border-b divider-metallic">
        <Container className="py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-silver sm:text-6xl sm:leading-tight">
              Найдите нейросеть{" "}
              <span className="text-gradient-metallic">для любой задачи</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-silver-dim">
              Текст, изображения, код и видео — собрали лучшие
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

      <section>
        <Container className="py-12 sm:py-16">
          <div className="flex flex-col gap-10 xl:grid xl:grid-cols-[minmax(0,280px)_1fr] xl:items-start xl:gap-12 2xl:grid-cols-[minmax(0,300px)_1fr] 2xl:gap-14">
            <HomeCatalogSidebar toolCount={allTools.length} />

            <div className="min-w-0">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
