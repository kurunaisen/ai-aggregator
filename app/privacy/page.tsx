import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Политика конфиденциальности сервиса DeltaplanAI.",
};

export default function PrivacyPage() {
  return (
    <Container className="py-12">
      <article className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-silver">
          Политика конфиденциальности
        </h1>
        <p className="mt-3 text-sm text-silver-dim">
          Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
        </p>

        <div className="carbon-panel mt-8 space-y-6 rounded-2xl p-8 text-silver-dim leading-relaxed">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-silver">
              1. Сбор данных
            </h2>
            <p>
              На первом этапе DeltaplanAI не собирает персональные данные
              пользователей. При подключении форм и аналитики эта политика будет
              обновлена.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-silver">
              2. Cookies
            </h2>
            <p>
              Сайт может использовать технические cookies, необходимые для
              корректной работы. Рекламные cookies не используются.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-silver">
              3. Контакты
            </h2>
            <p>
              По вопросам конфиденциальности обращайтесь через форму на странице
              «Добавить инструмент».
            </p>
          </section>
        </div>
      </article>
    </Container>
  );
}
