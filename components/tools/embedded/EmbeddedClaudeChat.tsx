"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatEmbedConfig } from "@/data/embed-tools";
import type { ClaudeChatAttachment, ClaudeChatMessage, ClaudeChatRequestOptions } from "@/data/claude-models";
import {
  MAX_CLAUDE_ATTACHMENTS,
  readImageFileAsAttachment,
} from "@/lib/chat/claude-attachments";
import { calculateTextDeaiCost } from "@/lib/subscription/deai-cost";
import type { DeaiSummary } from "@/lib/subscription/deai";
import {
  ClaudeChatSettings,
  createInitialClaudeOptions,
} from "@/components/tools/embedded/ClaudeChatSettings";
import { EmbeddedSubmitBar } from "@/components/tools/embedded/EmbeddedSubmitBar";
import { EmbeddedToolHeader } from "@/components/tools/embedded/EmbeddedToolHeader";
import { ProviderSetupMessage } from "@/components/tools/embedded/ProviderSetupMessage";
import { useProviderConfigured } from "@/components/tools/embedded/useProviderConfigured";

type EmbeddedClaudeChatProps = {
  slug: string;
  toolName: string;
  config: ChatEmbedConfig;
  initialDeai: DeaiSummary;
};

export function EmbeddedClaudeChat({
  slug,
  toolName,
  config,
  initialDeai,
}: EmbeddedClaudeChatProps) {
  const [messages, setMessages] = useState<ClaudeChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<ClaudeChatAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deai, setDeai] = useState(initialDeai);
  const [claudeOptions, setClaudeOptions] = useState<ClaudeChatRequestOptions>(
    createInitialClaudeOptions,
  );
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const providerConfigured = useProviderConfigured(config);

  const attachmentCountInHistory = useMemo(
    () =>
      messages.reduce((sum, message) => sum + (message.attachments?.length ?? 0), 0) +
      pendingAttachments.length,
    [messages, pendingAttachments],
  );

  const estimatedCost = useMemo(() => {
    const draft = input.trim();
    const textChars =
      messages.reduce((sum, message) => sum + message.content.length, 0) + draft.length;
    const imageChars = attachmentCountInHistory * 6000;

    return calculateTextDeaiCost({
      model: claudeOptions.model,
      totalChars: Math.max(textChars + imageChars, draft.length || 40),
    });
  }, [attachmentCountInHistory, claudeOptions.model, input, messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, pendingAttachments]);

  async function addFiles(files: FileList | File[]) {
    setError(null);
    const next = [...pendingAttachments];

    for (const file of Array.from(files)) {
      if (next.length >= MAX_CLAUDE_ATTACHMENTS) {
        setError(`Максимум ${MAX_CLAUDE_ATTACHMENTS} изображений за сообщение.`);
        break;
      }

      const result = await readImageFileAsAttachment(file);
      if (typeof result === "string") {
        setError(result);
        continue;
      }

      next.push(result);
    }

    setPendingAttachments(next);
  }

  async function handlePaste(event: React.ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      event.preventDefault();
      await addFiles(imageFiles);
    }
  }

  function removePendingAttachment(id: string) {
    setPendingAttachments((current) => current.filter((item) => item.id !== id));
  }

  async function sendMessage(event?: React.FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    const hasAttachments = pendingAttachments.length > 0;

    if ((!text && !hasAttachments) || loading || providerConfigured !== true) return;
    if (deai.balance < estimatedCost) return;

    const userMessage: ClaudeChatMessage = {
      role: "user",
      content: text,
      attachments: hasAttachments ? pendingAttachments : undefined,
    };
    const nextMessages = [...messages, userMessage];

    setInput("");
    setPendingAttachments([]);
    setMessages(nextMessages);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          messages: nextMessages,
          claude: claudeOptions,
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        error?: string;
        code?: string;
        deai?: DeaiSummary;
      };

      if (!response.ok) {
        if (data.code === "INSUFFICIENT_DEAI") {
          setError(data.error ?? "Недостаточно Deai");
          if (data.deai) setDeai(data.deai);
          setMessages(messages);
          setPendingAttachments(userMessage.attachments ?? []);
          return;
        }
        throw new Error(data.error ?? "Не удалось получить ответ");
      }

      if (!data.reply) throw new Error("Пустой ответ");
      if (data.deai) setDeai(data.deai);

      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки");
      setMessages(messages);
      setPendingAttachments(userMessage.attachments ?? []);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const insufficientDeai = deai.balance < estimatedCost;
  const canSend = Boolean(input.trim() || pendingAttachments.length > 0);

  return (
    <div className="carbon-panel flex min-h-[520px] flex-col overflow-hidden rounded-2xl">
      <EmbeddedToolHeader toolName={toolName} deai={deai} />

      {!providerConfigured ? (
        providerConfigured === false ? (
          <ProviderSetupMessage config={config} />
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 py-12 text-sm text-silver-dim">
            Проверка API...
          </div>
        )
      ) : (
        <>
          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-gold/20 bg-gold/10 px-4 py-3 text-sm leading-relaxed text-silver">
              {config.welcomeMessage}
            </div>

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "rounded-br-md bg-white/10 text-silver"
                      : "rounded-bl-md border border-gold/15 bg-black/40 text-silver-dim"
                  }`}
                >
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {message.attachments.map((attachment) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={attachment.id}
                          src={attachment.dataUrl}
                          alt={attachment.name}
                          className="h-20 w-20 rounded-lg border divider-metallic object-cover"
                        />
                      ))}
                    </div>
                  )}
                  {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-gold/15 bg-black/40 px-4 py-3 text-sm text-silver-dim">
                  ● ● ●
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="border-t divider-metallic px-5 py-2 text-sm text-red-300 sm:px-6">
              {error}
              {insufficientDeai && (
                <>
                  {" "}
                  <Link href="/pricing" className="text-gold-light underline">
                    Pro 990 ₽/мес
                  </Link>
                </>
              )}
            </p>
          )}

          <form onSubmit={sendMessage} className="border-t divider-metallic p-4 sm:p-5">
            <ClaudeChatSettings
              options={claudeOptions}
              onChange={setClaudeOptions}
              disabled={loading}
            />

            {pendingAttachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {pendingAttachments.map((attachment) => (
                  <div key={attachment.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={attachment.dataUrl}
                      alt={attachment.name}
                      className="h-20 w-20 rounded-lg border divider-metallic object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePendingAttachment(attachment.id)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-xs text-silver"
                      aria-label="Удалить изображение"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) {
                    void addFiles(event.target.files);
                    event.target.value = "";
                  }
                }}
              />
              <button
                type="button"
                disabled={loading || pendingAttachments.length >= MAX_CLAUDE_ATTACHMENTS}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border divider-metallic px-3 py-2 text-xs text-silver-dim transition-colors hover:border-gold/30 hover:text-gold-light disabled:opacity-50"
              >
                📎 Изображение
              </button>
              <span className="text-xs text-silver-dim">
                Диаграммы, графики, скриншоты · до {MAX_CLAUDE_ATTACHMENTS} файлов
              </span>
            </div>

            <div onPaste={handlePaste}>
              <EmbeddedSubmitBar
                value={input}
                onChange={setInput}
                onSubmit={sendMessage}
                placeholder={
                  config.placeholder ??
                  "Сообщение или загрузите изображение для анализа..."
                }
                disabled={insufficientDeai || !canSend}
                loading={loading}
                cost={estimatedCost}
                deai={deai}
                inputRef={inputRef}
              />
            </div>
          </form>
        </>
      )}
    </div>
  );
}
