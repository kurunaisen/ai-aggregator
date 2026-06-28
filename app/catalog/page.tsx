import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { getPublishedTools } from "@/lib/tools/queries";
import {
  filterAndSortTools,
  parseCatalogFilters,
} from "@/lib/catalog/filters";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildCatalogItemListSchema } from "@/lib/seo/schema";
import { CatalogFiltersBar } from "@/components/catalog/CatalogFiltersBar";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { ToolGrid } from "@/components/tools/ToolGrid";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  noStore();
  const params = await searchParams;
  const tools = await getPublishedTools();
  const filters = parseCatalogFilters(params);
  const filtered = filterAndSortTools(tools, filters);

  return buildPageMetadata({
    title: "Каталог нейросетей",
    description: `${filtered.length} встроенных AI-инструментов: чат, код и видео на DeltaplanAI.`,
    path: "/catalog",
  });
}

function formatToolCount(count: number): string {
  if (count === 1) return "1 инструмент";
  if (count >= 2 && count <= 4) return `${count} инструмента`;
  return `${count} инструментов`;
}

export default async function CatalogPage({ searchParams }: PageProps) {
  noStore();
  const params = await searchParams;
  const tools = await getPublishedTools();
  const filters = parseCatalogFilters(params);
  const filtered = filterAndSortTools(tools, filters);

  return (
    <>
      <JsonLd data={buildCatalogItemListSchema(filtered)} />

      <Container className="py-10 sm:py-16">
        <div className="mb-8 text-center sm:mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-silver sm:text-4xl">
            Каталог нейросетей
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-base text-silver-dim sm:mt-4 sm:text-lg">
            {tools.length === 0 ? (
              <>
                Пока нет опубликованных инструментов. Проверьте подключение к
                Supabase и поле{" "}
                <code className="rounded border border-gold/20 bg-black/60 px-1.5 py-0.5 text-sm text-gold-light">
                  is_published
                </code>
                .
              </>
            ) : (
              <>
                {formatToolCount(filtered.length)}
                {filtered.length !== tools.length && (
                  <span className="text-silver-dim/60"> из {tools.length}</span>
                )}
                . Выберите задачу ниже, категорию в фильтрах или найдите сервис через поиск.
              </>
            )}
          </p>
        </div>

        {tools.length > 0 && (
          <CatalogFiltersBar tools={tools} filters={filters}>
            <ToolGrid
              tools={filtered}
              emptyTitle="Ничего не найдено"
              emptyDescription="Попробуйте другую категорию или сбросьте фильтры."
            />
          </CatalogFiltersBar>
        )}

        {tools.length === 0 && (
          <ToolGrid
            tools={[]}
            emptyTitle="Каталог пуст"
            emptyDescription="Добавьте инструменты в Supabase и установите is_published = true, либо отправьте заявку через форму на сайте."
          />
        )}
      </Container>
    </>
  );
}
