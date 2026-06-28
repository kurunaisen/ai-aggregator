"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatEmbedConfig } from "@/data/embed-tools";
import { calculateTextDeaiCost } from "@/lib/subscription/deai-cost";
import type { DeaiSummary } from "@/lib/subscription/deai";
import { EmbeddedSubmitBar } from "@/components/tools/embedded/EmbeddedSubmitBar";
import { EmbeddedToolHeader } from "@/components/tools/embedded/EmbeddedToolHeader";
import { ProviderSetupMessage } from "@/components/tools/embedded/ProviderSetupMessage";
import { useProviderConfigured } from "@/components/tools/embedded/useProviderConfigured";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type EmbeddedChatProps = {
  slug: string;
  toolName: string;
  config: ChatEmbedConfig;
  initialDeai: DeaiSummary;
};

export function EmbeddedChat({
  slug,
  toolName,
  config,
  initialDeai,
}: EmbeddedChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deai, setDeai] = useState(initialDeai);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const providerConfigured = useProviderConfigured(config);

  const estimatedCost = useMemo(() => {
    const draft = input.trim();
    const chars =
      messages.reduce((sum, message) => sum + message.content.length, 0) + draft.length;

    return calculateTextDeaiCost({
      model: config.model,
      totalChars: Math.max(chars, draft.length || 40),
    });
  }, [config.model, input, messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(event?: React.FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || loading || providerConfigured !== true) return;
    if (deai.balance < estimatedCost) return;

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
        deai?: DeaiSummary;
      };

      if (!response.ok) {
        if (data.code === "INSUFFICIENT_DEAI") {
          setError(data.error ?? "Недостаточно Deai");
          if (data.deai) setDeai(data.deai);
          setMessages(messages);
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
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const insufficientDeai = deai.balance < estimatedCost;

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
            <EmbeddedSubmitBar
              value={input}
              onChange={setInput}
              onSubmit={sendMessage}
              placeholder={config.placeholder ?? "Напишите сообщение..."}
              disabled={insufficientDeai}
              loading={loading}
              cost={estimatedCost}
              deai={deai}
              inputRef={inputRef}
            />
          </form>
        </>
      )}
    </div>
  );
}
