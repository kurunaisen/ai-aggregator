import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { SubmitForm } from "@/components/submit/SubmitForm";

export const metadata: Metadata = {
  title: "Добавить инструмент",
  description:
    "Предложите нейросеть или AI-инструмент для добавления в каталог DeltaplanAI.",
};

export default function SubmitPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight text-silver sm:text-4xl">
          Добавить инструмент
        </h1>
        <p className="mt-4 text-lg text-silver-dim">
          Знаете полезную нейросеть, которой нет в каталоге? Расскажите о ней —
          мы рассмотрим заявку и добавим инструмент.
        </p>

        <SubmitForm />
      </div>
    </Container>
  );
}
