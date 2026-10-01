export const DOCUMENTS_TOOL_SLUG = "documents";

export const DOCUMENTS_MODEL = "gpt-4.1";
export const EMBEDDING_MODEL = "text-embedding-3-small";

export const MAX_BASES = 30;
export const MAX_DOCUMENTS_PER_BASE = 40;
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_EXTRACTED_CHARS = 500_000;
export const MAX_CHUNKS_PER_DOCUMENT = 400;
export const CHUNK_SIZE = 1800;
export const CHUNK_OVERLAP = 250;
export const FULL_CONTEXT_CHARS = 52_000;
export const MAX_CONTEXT_CHARS = 52_000;
export const MAX_RETRIEVED_CHUNKS = 12;
export const MAX_SEMANTIC_CHUNKS = 12;
export const EMBED_BACKFILL_BATCH = 64;
export const EMBED_BACKFILL_ROUNDS = 3;
export const MAX_CHAT_MESSAGES = 12;
export const MAX_USER_MESSAGE_CHARS = 6_000;
export const MAX_EXPORT_CHARS = 100_000;

export const DOCUMENT_MODES = [
  {
    id: "answer",
    label: "Вопрос",
    hint: "Короткий ответ по фактам из файлов",
    placeholder: "Например: какие сроки, суммы и стороны указаны в договоре?",
  },
  {
    id: "act",
    label: "Акт",
    hint: "Акт выполненных, скрытых или приёмочных работ",
    placeholder:
      "Например: акт освидетельствования скрытых работ по гидроизоляции фундамента",
  },
  {
    id: "ppr",
    label: "ППР",
    hint: "Черновик проекта производства работ",
    placeholder:
      "Например: ППР на монтаж металлоконструкций каркаса по загруженному проекту",
  },
  {
    id: "protocol",
    label: "Протокол",
    hint: "Протокол совещания или испытаний",
    placeholder: "Например: протокол совещания по замечаниям к рабочей документации",
  },
  {
    id: "letter",
    label: "Письмо",
    hint: "Служебное или официальное письмо",
    placeholder:
      "Например: письмо заказчику о переносе сроков из-за отсутствия материалов по договору",
  },
  {
    id: "free",
    label: "Другой документ",
    hint: "Любая форма: справка, пояснение, перечень",
    placeholder: "Опишите, какой документ нужен, для кого и что в нём обязательно",
  },
] as const;

export type DocumentModeId = (typeof DOCUMENT_MODES)[number]["id"];

export const MIGRATION_HINT =
  "Хранилище документов ещё не создано. В Supabase откройте SQL Editor и выполните файл supabase/migration-document-bases.sql, затем обновите страницу.";

export function isDocumentMode(value: string): value is DocumentModeId {
  return DOCUMENT_MODES.some((mode) => mode.id === value);
}

export function documentModeLabel(mode: DocumentModeId): string {
  return DOCUMENT_MODES.find((item) => item.id === mode)?.label ?? "Документ";
}
