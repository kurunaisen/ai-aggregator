import { CopySqlButton } from "@/components/setup/CopySqlButton";
import { DOCUMENTS_SETUP_SQL } from "@/data/documents-setup-sql";
import { Container } from "@/components/layout/Container";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Код для Supabase",
  description: "Одна кнопка копирует SQL для раздела «Документы».",
  path: "/setup/documents-sql",
  noIndex: true,
});

export default function DocumentsSqlPage() {
  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold text-silver">Код для Supabase</h1>
      <p className="mt-4 text-base leading-relaxed text-silver-dim">
        Нажмите кнопку. Код попадёт в буфер целиком, выделять его пальцем не нужно.
      </p>
      <div className="mt-8">
        <CopySqlButton sql={DOCUMENTS_SETUP_SQL} />
      </div>
    </Container>
  );
}
