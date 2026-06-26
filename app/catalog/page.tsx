import type { Metadata } from "next";
import { Suspense } from "react";
import { getPublishedTools } from "@/lib/tools/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildCatalogItemListSchema } from "@/lib/seo/schema";
import { CatalogContent } from "@/components/catalog/CatalogContent";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const tools = await getPublishedTools();

  return buildPageMetadata({
    title: "Каталог нейросетей",
    description: `Полный каталог AI-инструментов — ${tools.length} сервисов для текста, изображений, кода, видео и аудио. Поиск, фильтры и описания.`,
    path: "/catalog",
  });
}

export const revalidate = 60;

function CatalogFallback() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-12 rounded-2xl bg-zinc-900" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-zinc-900" />
        ))}
      </div>
    </div>
  );
}

export default async function CatalogPage() {
  const tools = await getPublishedTools();

  return (
    <>
      <JsonLd data={buildCatalogItemListSchema(tools)} />

      <Container className="py-10 sm:py-16">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            Каталог нейросетей
          </h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-400 sm:mt-4 sm:text-lg">
            {tools.length} инструментов. Используйте поиск и фильтры — ссылку с
            выбранными параметрами можно отправить коллеге.
          </p>
        </div>

        <Suspense fallback={<CatalogFallback />}>
          <CatalogContent tools={tools} />
        </Suspense>
      </Container>
    </>
  );
}
