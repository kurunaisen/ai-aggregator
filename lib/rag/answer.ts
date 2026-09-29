import { getRagConfig } from "@/lib/rag/config";
import { MISSING_KEY, NO_DOCUMENTS, REFUSAL } from "@/lib/rag/messages";
import { completeChat, embedTexts, ProviderError } from "@/lib/rag/openai";
import { retrieve, type RankedChunk } from "@/lib/rag/retrieve";
import { readStore, withStoreLock, writeStore } from "@/lib/rag/store";
import type { AskResponse, Citation, StoreData } from "@/lib/rag/types";

const QUOTE_MAX = 240;

type ModelQuote = {
  chunkId: string;
  quote: string;
};

type ModelAnswer = {
  answer: string;
  usedChunkIds: string[];
  quotes: ModelQuote[];
};

function clipQuote(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= QUOTE_MAX) return normalized;
  const slice = normalized.slice(0, QUOTE_MAX - 1);
  const cut = slice.lastIndexOf(" ");
  const clipped = (cut > 140 ? slice.slice(0, cut) : slice).trimEnd();
  return `${clipped}…`;
}

function pickQuote(chunkText: string, requested?: string): string {
  const normalized = chunkText.replace(/\s+/g, " ").trim();
  if (requested) {
    const quote = requested.replace(/\s+/g, " ").trim();
    if (quote.length >= 8) {
      const at = normalized.toLowerCase().indexOf(quote.toLowerCase());
      if (at >= 0) return clipQuote(normalized.slice(at, at + quote.length));
    }
  }
  return clipQuote(normalized);
}

function hasTokenNumber(haystack: string, num: string): boolean {
  const escaped = num.replace(/\./g, "\\.");
  return new RegExp(`(?:^|[^\\d.])${escaped}(?:[^\\d]|$)`).test(haystack);
}

function answerStaysInsideSources(answer: string, sources: string): boolean {
  const haystack = sources.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ");
  const compactHaystack = haystack.replace(/\s+/g, "");

  const normRefs = answer.match(/(?:гост(?:\s+р)?|сп|снип)\s*[0-9][0-9.\-–]*/gi) ?? [];
  for (const ref of normRefs) {
    const compact = ref.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, "");
    if (!compactHaystack.includes(compact)) return false;
  }

  const clauseRefs = answer.match(/(?:пункт|п\.)\s*\d+(?:\.\d+)*/gi) ?? [];
  for (const ref of clauseRefs) {
    const num = ref.match(/\d+(?:\.\d+)*/)?.[0];
    if (num && !hasTokenNumber(haystack, num)) return false;
  }

  const dotted = answer.match(/\b\d+\.\d+(?:\.\d+)+\b/g) ?? [];
  for (const num of dotted) {
    if (!hasTokenNumber(haystack, num)) return false;
  }

  const measures = answer.match(/\d+(?:[.,]\d+)?\s*(?:мм|см|км|м|‰|%|°)/gi) ?? [];
  for (const measure of measures) {
    const compact = measure.toLowerCase().replace(/\s+/g, "").replace(",", ".");
    if (!compactHaystack.includes(compact)) return false;
  }

  return true;
}

function parseModelAnswer(raw: string): ModelAnswer | null {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    const value = JSON.parse(trimmed.slice(start, end + 1)) as {
      answer?: unknown;
      usedChunkIds?: unknown;
      quotes?: unknown;
    };
    if (typeof value.answer !== "string" || !value.answer.trim()) return null;
    const usedChunkIds = Array.isArray(value.usedChunkIds)
      ? value.usedChunkIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [];
    const quotes = Array.isArray(value.quotes)
      ? value.quotes.flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const chunkId = "chunkId" in item && typeof item.chunkId === "string" ? item.chunkId : "";
          const quote = "quote" in item && typeof item.quote === "string" ? item.quote : "";
          return chunkId && quote ? [{ chunkId, quote }] : [];
        })
      : [];
    return { answer: value.answer.trim(), usedChunkIds, quotes };
  } catch {
    return null;
  }
}

function formatContext(chunks: RankedChunk[]): string {
  return chunks
    .map((chunk) =>
      [
        `[id] ${chunk.chunkId}`,
        `Документ: ${chunk.document.title}`,
        `Файл: ${chunk.document.filename}`,
        chunk.document.documentNumber ? `Номер: ${chunk.document.documentNumber}` : null,
        chunk.document.documentDate ? `Дата: ${chunk.document.documentDate}` : null,
        chunk.clause ? `Пункт: ${chunk.clause}` : null,
        chunk.section ? `Раздел: ${chunk.section}` : null,
        chunk.page ? `Страница: ${chunk.page}` : null,
        "Текст:",
        chunk.text,
      ]
        .filter((line): line is string => Boolean(line))
        .join("\n"),
    )
    .join("\n\n---\n\n");
}

function refused(): AskResponse {
  return { status: "refused", answer: REFUSAL, citations: [] };
}

function citationsFrom(model: ModelAnswer, chunks: RankedChunk[]): Citation[] {
  const byId = new Map(chunks.map((chunk) => [chunk.chunkId, chunk]));
  const seen = new Set<string>();
  const citations: Citation[] = [];

  for (const chunkId of model.usedChunkIds) {
    if (seen.has(chunkId)) continue;
    const chunk = byId.get(chunkId);
    if (!chunk) continue;
    seen.add(chunkId);
    const requested = model.quotes.find((quote) => quote.chunkId === chunkId)?.quote;
    citations.push({
      documentTitle: chunk.document.title,
      filename: chunk.document.filename,
      documentNumber: chunk.document.documentNumber,
      documentDate: chunk.document.documentDate,
      clause: chunk.clause,
      section: chunk.section,
      page: chunk.page,
      quote: pickQuote(chunk.text, requested),
    });
  }

  return citations;
}

async function ensureEmbeddings(sessionId: string, question: string, store: StoreData): Promise<{
  store: StoreData;
  queryVector: number[];
}> {
  const [queryVector] = await embedTexts([question]);
  const missing = store.documents.flatMap((document) =>
    document.chunks.filter((chunk) => !chunk.embedding || chunk.embedding.length !== queryVector.length),
  );

  if (missing.length === 0) return { store, queryVector };

  const vectors = await embedTexts(missing.map((chunk) => chunk.text));
  const byId = new Map<string, number[]>();
  missing.forEach((chunk, index) => {
    const vector = vectors[index];
    if (vector) byId.set(chunk.id, vector);
  });

  const saved = await withStoreLock(sessionId, async () => {
    const fresh = await readStore(sessionId);
    for (const document of fresh.documents) {
      document.chunks = document.chunks.map((chunk) => {
        const vector = byId.get(chunk.id);
        if (!vector) return chunk;
        if (chunk.embedding && chunk.embedding.length === queryVector.length) return chunk;
        return { ...chunk, embedding: vector };
      });
    }
    await writeStore(sessionId, fresh);
    return fresh;
  });

  return { store: saved, queryVector };
}

const SYSTEM_PROMPT = `Ты отвечаешь на вопросы только по фрагментам нормативных документов из запроса.
Правила:
- Не используй знания вне этих фрагментов.
- Не выдумывай нормы, допуски, размеры и номера пунктов.
- Если фрагментов недостаточно для прямого ответа, верни answer ровно этой фразой: «${REFUSAL}» и пустые usedChunkIds и quotes.
- Если отвечаешь, каждое число, допуск и номер пункта в answer должны дословно встречаться в тексте фрагментов, чьи id указаны в usedChunkIds.
- quotes — короткие дословные цитаты из поля «Текст» (не длиннее 240 символов), без пересказа.
- Пиши ответ по-русски, кратко, без вводных фраз.
Верни только JSON без markdown:
{"answer":"...","usedChunkIds":["id"],"quotes":[{"chunkId":"id","quote":"..."}]}`;

async function completeGrounded(question: string, chunks: RankedChunk[]): Promise<AskResponse> {
  if (chunks.length === 0) return refused();

  const raw = await completeChat([
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Вопрос:\n${question}\n\nФрагменты:\n${formatContext(chunks)}`,
    },
  ]);

  const model = parseModelAnswer(raw);
  if (!model) {
    return {
      status: "error",
      answer: "Модель вернула ответ в неожиданном формате. Попробуйте ещё раз.",
      citations: [],
    };
  }

  if (model.answer.toLowerCase().includes("нет оснований") || model.usedChunkIds.length === 0) {
    return refused();
  }

  const citations = citationsFrom(model, chunks);
  if (citations.length === 0) return refused();

  const sources = chunks
    .filter((chunk) => model.usedChunkIds.includes(chunk.chunkId))
    .map((chunk) => chunk.text)
    .join("\n");

  if (!answerStaysInsideSources(model.answer, sources)) return refused();

  return { status: "answered", answer: model.answer, citations };
}

export async function answerQuestion(sessionId: string, question: string): Promise<{
  httpStatus: number;
  body: AskResponse;
}> {
  const trimmed = question.trim();
  if (!trimmed) {
    return {
      httpStatus: 400,
      body: { status: "error", answer: "Введите вопрос.", citations: [] },
    };
  }
  if (trimmed.length > 2000) {
    return {
      httpStatus: 400,
      body: {
        status: "error",
        answer: "Вопрос слишком длинный. Сократите его до 2000 символов.",
        citations: [],
      },
    };
  }

  const store = await readStore(sessionId);
  const hasChunks = store.documents.some((document) => document.chunks.length > 0);
  if (!hasChunks) {
    return { httpStatus: 200, body: { status: "no_documents", answer: NO_DOCUMENTS, citations: [] } };
  }

  if (!getRagConfig().configured) {
    return { httpStatus: 503, body: { status: "missing_key", answer: MISSING_KEY, citations: [] } };
  }

  try {
    const prepared = await ensureEmbeddings(sessionId, trimmed, store);
    const ranked = retrieve(trimmed, prepared.store.documents, prepared.queryVector, 5);
    const body = await completeGrounded(trimmed, ranked);
    const httpStatus = body.status === "error" ? 502 : 200;
    return { httpStatus, body };
  } catch (error) {
    const answer =
      error instanceof ProviderError
        ? error.message
        : "Не удалось подготовить ответ по документам. Попробуйте ещё раз.";
    return { httpStatus: 502, body: { status: "error", answer, citations: [] } };
  }
}
