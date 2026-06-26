import type { Metadata } from "next";
import { getPublishedTools } from "@/lib/tools/queries";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "О проекте",
  description:
    "DeltaplanAI — независимый каталог нейросетей и AI-инструментов. Узнайте больше о нашей миссии.",
};

export const revalidate = 60;

export default async function AboutPage() {
  const tools = await getPublishedTools();

  return (
    <Container className="py-12 sm:py-16">
      <article className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          О проекте
        </h1>

        <div className="mt-10 space-y-6 text-lg leading-relaxed text-zinc-400">
          <p>
            <strong className="text-zinc-200">DeltaplanAI</strong> — это каталог
            нейросетей и AI-инструментов, который помогает быстро найти
            подходящий сервис для работы, учёбы и творчества.
          </p>
          <p>
            Мы собираем актуальные инструменты, группируем их по категориям и
            даём понятные описания — без лишнего шума и рекламных обещаний.
          </p>
          <p>
            Сейчас в каталоге{" "}
            <span className="text-zinc-200">{tools.length} инструментов</span>.
            Данные хранятся в Supabase и обновляются по мере модерации заявок.
          </p>
        </div>
      </article>
    </Container>
  );
}
