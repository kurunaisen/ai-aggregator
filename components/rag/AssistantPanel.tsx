"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { AskResponse, Citation, DocumentSummary } from "@/lib/rag/types";

type LibraryResponse = {
  configured: boolean;
  setupMessage: string | null;
  documents: DocumentSummary[];
};

function placeLabel(citation: Citation): string {
  const parts = [
    citation.clause ? `п. ${citation.clause}` : citation.section,
    citation.page ? `стр. ${citation.page}` : null,
  ].filter((part): part is string => Boolean(part));
  return parts.join(" · ");
}

function sourceMeta(citation: Citation): string {
  return [citation.documentNumber, citation.documentDate, citation.filename]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

export function AssistantPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/rag/documents");
        const data = (await response.json()) as LibraryResponse;
        if (cancelled) return;
        setDocuments(data.documents ?? []);
        setSetupMessage(data.setupMessage);
      } catch {
        if (!cancelled) setUploadError("Не удалось открыть список документов.");
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (result) answerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [result]);

  async function upload(file: File | null) {
    if (!file || !ready) return;
    setUploadError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/rag/documents", { method: "POST", body });
      const data = (await response.json()) as { document?: DocumentSummary; message?: string };
      const uploaded = data.document;
      if (!response.ok || !uploaded) {
        throw new Error(data.message || "Не удалось загрузить файл.");
      }
      setDocuments((current) => [uploaded, ...current.filter((item) => item.id !== uploaded.id)]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Не удалось загрузить файл.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(id: string) {
    setUploadError("");
    const response = await fetch(`/api/rag/documents/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      setUploadError(data?.message || "Не удалось удалить документ.");
      return;
    }
    setDocuments((current) => current.filter((document) => document.id !== id));
  }

  async function ask(event: FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || asking) return;
    setAsking(true);
    setResult(null);
    try {
      const response = await fetch("/api/rag/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = (await response.json()) as AskResponse;
      if (!data.answer) {
        throw new Error("Не удалось получить ответ.");
      }
      setResult(data);
    } catch (error) {
      setResult({
        status: "error",
        answer: error instanceof Error ? error.message : "Не удалось получить ответ.",
        citations: [],
      });
    } finally {
      setAsking(false);
    }
  }

  const warning = result?.status === "missing_key" || result?.status === "error";

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
      <section className="carbon-panel rounded-2xl p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-silver">Документы</h2>
        <p className="mt-2 text-sm leading-relaxed text-silver-dim">
          PDF, DOCX или TXT до 8 МБ. Ключ модели для загрузки не нужен. Сканы без текстового слоя
          не читаются.
        </p>

        <label
          className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center transition-colors ${
            dragging ? "border-gold/60 bg-gold/10" : "border-gold/30 bg-black/30 hover:border-gold/50"
          } ${!ready || uploading ? "pointer-events-none opacity-60" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void upload(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            disabled={!ready || uploading}
            onChange={(event) => void upload(event.target.files?.[0] ?? null)}
          />
          <span className="text-sm font-medium text-gold-light">
            {uploading ? "Читаем документ…" : "Выбрать файл или перетащить сюда"}
          </span>
          <span className="mt-1 text-xs text-silver-dim">.pdf, .docx, .txt</span>
        </label>

        {uploadError && (
          <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {uploadError}
          </p>
        )}

        <ul className="mt-6 space-y-3">
          {documents.length === 0 && ready && (
            <li className="rounded-xl border divider-metallic px-4 py-4 text-sm text-silver-dim">
              Пока нет загруженных документов.
            </li>
          )}
          {documents.map((document) => (
            <li key={document.id} className="carbon-card rounded-xl px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-silver">{document.title}</p>
                  <p className="mt-1 text-xs text-silver-dim">
                    {[document.documentNumber, document.documentDate, document.filename]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-2 text-xs text-gold-light">Фрагментов: {document.chunkCount}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-sm text-silver-dim transition-colors hover:text-gold-light"
                  onClick={() => void remove(document.id)}
                >
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="carbon-panel rounded-2xl p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-silver">Вопрос</h2>
        {setupMessage && (
          <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm leading-relaxed text-gold-light">
            {setupMessage}
          </p>
        )}

        <form onSubmit={(event) => void ask(event)} className="mt-5 space-y-4">
          <label htmlFor="rag-question" className="sr-only">
            Вопрос по документам
          </label>
          <textarea
            id="rag-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={5}
            required
            placeholder="Например: какая ширина колеи должна быть на прямом участке и какие у неё допуски?"
            className="input-theme w-full rounded-xl px-4 py-3 text-sm"
          />
          <Button type="submit" disabled={!ready || asking || question.trim().length === 0}>
            {asking ? "Ищем ответ…" : "Спросить"}
          </Button>
        </form>

        {result && (
          <div ref={answerRef} className="mt-8" aria-live="polite">
            <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-gold">Ответ</h3>
            <div
              className={`mt-3 rounded-xl px-4 py-4 text-sm leading-relaxed ${
                warning
                  ? "border border-gold/30 bg-gold/10 text-gold-light"
                  : "border divider-metallic bg-black/30 text-silver"
              }`}
            >
              <p className="whitespace-pre-wrap">{result.answer}</p>
            </div>

            {result.citations.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-gold">Источники</h3>
                <ol className="mt-3 space-y-3">
                  {result.citations.map((citation, index) => {
                    const place = placeLabel(citation);
                    return (
                      <li key={`${citation.filename}-${citation.clause}-${index}`} className="carbon-card rounded-xl px-4 py-4">
                        <p className="font-medium text-silver">{citation.documentTitle}</p>
                        <p className="mt-1 text-xs text-silver-dim">{sourceMeta(citation)}</p>
                        {place && <p className="mt-2 text-sm text-gold-light">{place}</p>}
                        <blockquote className="mt-2 border-l-2 border-gold/40 pl-3 text-sm leading-relaxed text-silver-dim">
                          «{citation.quote}»
                        </blockquote>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
