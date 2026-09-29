import { Container } from "@/components/layout/Container";
import { AssistantPanel } from "@/components/rag/AssistantPanel";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Помощник по нормативным документам",
  description:
    "Загрузите инструкции и нормы и задайте вопрос по-русски. Ответ только по вашим файлам, с пунктом и цитатой.",
  path: "/assistant",
});

export default function AssistantPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-gold">Документы</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-silver sm:text-4xl">
          Помощник по нормативным документам
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-silver-dim">
          Загрузите свои инструкции и нормы — например, по содержанию железнодорожного пути — и
          задайте вопрос по-русски. Ответ строится только по загруженным файлам и сопровождается
          названием документа, номером пункта и короткой цитатой.
        </p>
        <AssistantPanel />
      </div>
    </Container>
  );
}
