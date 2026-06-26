import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Условия использования",
  description: "Условия использования сервиса DeltaplanAI.",
};

export default function TermsPage() {
  return (
    <Container className="py-12">
      <article className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
          Условия использования
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
        </p>

        <div className="mt-8 space-y-6 text-zinc-400 leading-relaxed">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-200">
              1. Общие положения
            </h2>
            <p>
              Используя DeltaplanAI, вы соглашаетесь с настоящими условиями.
              Сервис предоставляет информационный каталог AI-инструментов «как
              есть».
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-200">
              2. Контент
            </h2>
            <p>
              Описания инструментов носят справочный характер. Мы не
              гарантируем актуальность цен, функций и доступности сторонних
              сервисов.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-200">
              3. Ссылки на сторонние сайты
            </h2>
            <p>
              Каталог содержит ссылки на внешние ресурсы. DeltaplanAI не несёт
              ответственности за их содержание и политику конфиденциальности.
            </p>
          </section>
        </div>
      </article>
    </Container>
  );
}
