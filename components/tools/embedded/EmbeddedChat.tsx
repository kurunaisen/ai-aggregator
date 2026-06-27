"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ChatEmbedConfig } from "@/data/embed-tools";
import type { UsageSummary } from "@/lib/subscription/usage";
import { Button } from "@/components/ui/Button";
import { UsageBar } from "@/components/tools/embedded/UsageBar";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type EmbeddedChatProps = {
  slug: string;
  toolName: string;
  config: ChatEmbedConfig;
  providerConfigured: boolean;
  initialUsage: UsageSummary;
};

export function EmbeddedChat({
  slug,
  toolName,
  config,
  providerConfigured,
  initialUsage,
}: EmbeddedChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState(initialUsage);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(event?: React.FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || loading || !providerConfigured) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];

    setInput("");
    setMessages(nextMessages);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, messages: nextMessages }),
      });

      const data = (await response.json()) as {
        reply?: string;
        error?: string;
        code?: string;
        usage?: UsageSummary;
      };

      if (!response.ok) {
        if (data.code === "LIMIT_REACHED") {
          setError(data.error ?? "Лимит исчерпан");
          if (data.usage) setUsage(data.usage);
          setMessages(messages);
          return;
        }
        throw new Error(data.error ?? "Не удалось получить ответ");
      }

      if (!data.reply) throw new Error("Пустой ответ");
      if (data.usage) setUsage(data.usage);

      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки");
      setMessages(messages);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  const limitReached = usage.plan === "free" && (usage.remaining ?? 0) <= 0;

  return (
    <div className="carbon-panel flex min-h-[520px] flex-col overflow-hidden rounded-2xl">
      <div className="border-b divider-metallic px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-silver">{toolName} — на сайте</h2>
        <div className="mt-1">
          <UsageBar usage={usage} />
        </div>
      </div>

      {!providerConfigured ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center text-sm text-silver-dim">
          API провайдера не настроен на сервере.
        </div>
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
                  <p className="whitespace-pre-wrap">{message.content}</p>
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
              {limitReached && (
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={config.placeholder ?? "Напишите сообщение..."}
                rows={2}
                disabled={loading || limitReached}
                className="input-theme min-h-[52px] flex-1 resize-none rounded-xl px-4 py-3 text-sm"
              />
              <Button
                type="submit"
                disabled={loading || limitReached || !input.trim()}
                className="shrink-0 sm:min-w-[120px]"
              >
                {loading ? "..." : "Отправить"}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
