"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DocumentsEmbedConfig } from "@/data/embed-tools";
import {
  DOCUMENT_MODES,
  documentModeLabel,
  type DocumentModeId,
} from "@/lib/documents/constants";
import { calculateTextDeaiCost } from "@/lib/subscription/deai-cost";
import type { DeaiSummary } from "@/lib/subscription/deai";
import { EmbeddedSubmitBar } from "@/components/tools/embedded/EmbeddedSubmitBar";
import { EmbeddedToolHeader } from "@/components/tools/embedded/EmbeddedToolHeader";
import { ProviderSetupMessage } from "@/components/tools/embedded/ProviderSetupMessage";
import { useProviderConfigured } from "@/components/tools/embedded/useProviderConfigured";

type SourceRef = {
  filename: string;
  chunkIndex: number;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: SourceRef[];
  coverage?: "full" | "retrieved";
};

type StoredDocument = {
  id: string;
  filename: string;
  charCount: number;
  notice: string | null;
};

type DocumentBase = {
  id: string;
  title: string;
  documents: StoredDocument[];
};

type EmbeddedDocumentsProps = {
  toolName: string;
  config: DocumentsEmbedConfig;
  initialDeai: DeaiSummary;
};

function formatChars(count: number): string {
  if (count < 1000) return `${count} зн.`;
  const thousands = count / 1000;
  return `${thousands.toFixed(thousands < 10 ? 1 : 0)} тыс. зн.`;
}

export function EmbeddedDocuments({ toolName, config, initialDeai }: EmbeddedDocumentsProps) {
  const providerConfigured = useProviderConfigured(config);
  const [bases, setBases] = useState<DocumentBase[]>([]);
  const [baseId, setBaseId] = useState<string | null>(null);
  const [baseTitle, setBaseTitle] = useState("Мой объект");
  const [mode, setMode] = useState<DocumentModeId>("answer");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deai, setDeai] = useState(initialDeai);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selected = bases.find((base) => base.id === baseId) ?? null;
  const modeMeta = DOCUMENT_MODES.find((item) => item.id === mode) ?? DOCUMENT_MODES[0];

  const estimatedCost = useMemo(() => {
    const chars =
      messages.reduce((sum, message) => sum + message.content.length, 0) +
      input.trim().length +
      8000;
    return calculateTextDeaiCost({ model: config.model, totalChars: Math.max(chars, 8000) });
  }, [config.model, input, messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, asking]);

  async function loadBases(preferredId?: string) {
    setLoadingList(true);
    try {
      const response = await fetch("/api/documents/bases");
      const data = (await response.json()) as { bases?: DocumentBase[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Не удалось загрузить комплекты");
      const next = data.bases ?? [];
      setBases(next);
      setBaseId((current) => {
        const wanted = preferredId ?? current;
        if (wanted && next.some((base) => base.id === wanted)) return wanted;
        return next[0]?.id ?? null;
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить комплекты");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    void loadBases();
  }, []);

  async function createBase(event: React.FormEvent) {
    event.preventDefault();
    const title = baseTitle.trim();
    if (!title) return;
    setError(null);
    const response = await fetch("/api/documents/bases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const data = (await response.json()) as { base?: DocumentBase; error?: string };
    if (!response.ok || !data.base) {
      setError(data.error ?? "Не удалось создать комплект");
      return;
    }
    setBaseTitle("Мой объект");
    await loadBases(data.base.id);
  }

  async function removeBase(id: string) {
    const base = bases.find((item) => item.id === id);
    if (!base) return;
    if (!window.confirm(`Удалить комплект «${base.title}» вместе с файлами?`)) return;
    const response = await fetch(`/api/documents/bases/${id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Не удалось удалить комплект");
      return;
    }
    setMessages([]);
    await loadBases();
  }

  async function uploadFile(file: File) {
    if (!baseId) {
      setError("Сначала создайте комплект документов.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("baseId", baseId);
      form.set("file", file);
      const response = await fetch("/api/documents/upload", { method: "POST", body: form });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Не удалось загрузить файл");
      await loadBases(baseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить файл");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeFile(id: string) {
    if (!baseId) return;
    const response = await fetch(`/api/documents/files/${id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Не удалось удалить файл");
      return;
    }
    await loadBases(baseId);
  }

  async function ask(event?: React.FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || asking || !baseId || providerConfigured !== true) return;
    if ((selected?.documents.length ?? 0) === 0) {
      setError("Загрузите хотя бы один файл в выбранный комплект.");
      return;
    }
    if (deai.balance < estimatedCost) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setInput("");
    setMessages(nextMessages);
    setAsking(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseId,
          mode,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });
      const data = (await response.json()) as {
        reply?: string;
        error?: string;
        code?: string;
        deai?: DeaiSummary;
        sources?: SourceRef[];
        coverage?: "full" | "retrieved";
      };

      if (!response.ok) {
        if (data.deai) setDeai(data.deai);
        setMessages(messages);
        setInput(text);
        throw new Error(data.error ?? "Не удалось получить ответ");
      }

      if (data.deai) setDeai(data.deai);
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data.reply ?? "",
          sources: data.sources,
          coverage: data.coverage,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки");
    } finally {
      setAsking(false);
      inputRef.current?.focus();
    }
  }

  async function download(message: ChatMessage, format: "docx" | "txt") {
    const response = await fetch("/api/documents/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: documentModeLabel(mode),
        text: message.content,
        format,
      }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось скачать файл");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const match = /filename\*=UTF-8''([^;]+)/.exec(disposition);
    link.href = url;
    link.download = match ? decodeURIComponent(match[1]) : `dokument.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Не удалось скопировать текст.");
    }
  }

  const insufficientDeai = deai.balance < estimatedCost;

  return (
    <div className="carbon-panel flex min-h-[640px] flex-col overflow-hidden rounded-2xl">
      <EmbeddedToolHeader toolName={toolName} deai={deai} />

      {providerConfigured === false ? (
        <ProviderSetupMessage config={config} />
      ) : providerConfigured === null ? (
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-sm text-silver-dim">
          Проверка API...
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="flex max-h-80 flex-col gap-4 overflow-y-auto border-b border-white/10 p-4 lg:max-h-none lg:border-b-0 lg:border-r">
            <div>
              <p className="text-sm font-medium text-silver">1. Комплект</p>
              <p className="mt-1 text-xs leading-relaxed text-silver-dim">
                Один комплект — один объект или дело: договор, проект, письма, старые акты.
              </p>
            </div>

            <form onSubmit={createBase} className="flex gap-2">
              <input
                value={baseTitle}
                onChange={(event) => setBaseTitle(event.target.value)}
                maxLength={80}
                placeholder="Название, например ЖК Север"
                className="input-theme min-w-0 flex-1 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg border border-gold/30 px-3 py-2 text-xs text-gold-light hover:bg-white/5"
              >
                Создать
              </button>
            </form>

            {loadingList ? (
              <p className="text-xs text-silver-dim">Загрузка комплектов...</p>
            ) : bases.length === 0 ? (
              <p className="text-xs text-silver-dim">Комплектов пока нет.</p>
            ) : (
              <ul className="space-y-1">
                {bases.map((base) => (
                  <li key={base.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setBaseId(base.id);
                        setMessages([]);
                      }}
                      className={`min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-left text-sm ${
                        base.id === baseId
                          ? "bg-gold/15 text-gold-light"
                          : "text-silver hover:bg-white/5"
                      }`}
                    >
                      {base.title}
                      <span className="ml-2 text-xs text-silver-dim">{base.documents.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeBase(base.id)}
                      className="rounded px-2 py-1 text-xs text-silver-dim hover:text-red-300"
                      aria-label={`Удалить ${base.title}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div>
              <p className="text-sm font-medium text-silver">2. Файлы</p>
              <p className="mt-1 text-xs leading-relaxed text-silver-dim">
                PDF, DOCX, TXT, MD, CSV или JSON, до 8 МБ. Скан без текстового слоя не подойдёт.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt,.md,.csv,.json,.log,application/pdf"
                className="mt-2 block w-full text-xs text-silver-dim file:mr-3 file:rounded-lg file:border file:border-gold/30 file:bg-transparent file:px-3 file:py-1.5 file:text-xs file:text-gold-light"
                disabled={!baseId || uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadFile(file);
                }}
              />
              {uploading && <p className="mt-2 text-xs text-silver-dim">Читаю файл...</p>}
            </div>

            <ul className="space-y-2">
              {(selected?.documents ?? []).map((document) => (
                <li key={document.id} className="rounded-lg bg-black/30 px-2 py-2">
                  <div className="flex items-start gap-2">
                    <p className="min-w-0 flex-1 break-words text-xs text-silver">
                      {document.filename}
                      <span className="mt-0.5 block text-silver-dim">
                        {formatChars(document.charCount)}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => void removeFile(document.id)}
                      className="text-xs text-silver-dim hover:text-red-300"
                    >
                      Удалить
                    </button>
                  </div>
                  {document.notice && (
                    <p className="mt-1 text-xs text-gold-light/80">{document.notice}</p>
                  )}
                </li>
              ))}
            </ul>
          </aside>

          <section className="flex min-h-[420px] flex-col">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-sm font-medium text-silver">3. Что сделать</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DOCUMENT_MODES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      mode === item.id
                        ? "border-gold/50 bg-gold/15 text-gold-light"
                        : "border-white/10 text-silver-dim hover:text-silver"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-silver-dim">{modeMeta.hint}</p>
            </div>

            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-relaxed text-silver-dim">
                  Напишите вопрос или опишите документ. Ответ строится по файлам выбранного
                  комплекта. Если суммы, даты или фамилии в файлах нет, в тексте будет пометка{" "}
                  <span className="text-gold-light">[уточнить]</span>, а не выдуманное значение.
                  {selected ? ` Сейчас выбран комплект «${selected.title}».` : " Сначала создайте комплект слева."}
                </div>
              )}

              {messages.map((message, index) => (
                <article
                  key={`${message.role}-${index}`}
                  className={
                    message.role === "user"
                      ? "ml-8 rounded-xl bg-white/5 px-4 py-3 text-sm text-silver"
                      : "mr-2 rounded-xl border border-gold/20 bg-black/30 px-4 py-3 text-sm text-silver"
                  }
                >
                  <p className="mb-2 text-xs uppercase tracking-wide text-silver-dim">
                    {message.role === "user" ? "Вы" : "Черновик"}
                  </p>
                  <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                  {message.role === "assistant" && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void copyText(message.content)}
                        className="rounded-lg border border-white/10 px-2 py-1 text-xs text-silver-dim hover:text-silver"
                      >
                        Копировать
                      </button>
                      <button
                        type="button"
                        onClick={() => void download(message, "docx")}
                        className="rounded-lg border border-gold/30 px-2 py-1 text-xs text-gold-light"
                      >
                        Скачать DOCX
                      </button>
                      <button
                        type="button"
                        onClick={() => void download(message, "txt")}
                        className="rounded-lg border border-white/10 px-2 py-1 text-xs text-silver-dim hover:text-silver"
                      >
                        Скачать TXT
                      </button>
                      {message.coverage === "retrieved" && (
                        <span className="text-xs text-silver-dim">
                          Взяты ближайшие фрагменты, не весь архив.
                        </span>
                      )}
                    </div>
                  )}
                  {message.sources && message.sources.length > 0 && (
                    <p className="mt-2 text-xs leading-relaxed text-silver-dim">
                      Источники:{" "}
                      {[...new Set(message.sources.map((source) => source.filename))].join(", ")}
                    </p>
                  )}
                </article>
              ))}
              {asking && <p className="text-sm text-silver-dim">Собираю ответ по файлам...</p>}
            </div>

            <form onSubmit={ask} className="border-t border-white/10 p-4">
              {error && <p className="mb-3 text-sm text-red-300">{error}</p>}
              {insufficientDeai && (
                <p className="mb-3 text-sm text-red-300">Недостаточно Deai для этого запроса.</p>
              )}
              <EmbeddedSubmitBar
                value={input}
                onChange={setInput}
                onSubmit={ask}
                placeholder={modeMeta.placeholder}
                rows={3}
                disabled={!baseId || insufficientDeai}
                loading={asking}
                submitLabel={mode === "answer" ? "Спросить" : "Составить"}
                cost={estimatedCost}
                deai={deai}
                inputRef={inputRef}
              />
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
