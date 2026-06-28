"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatEmbedConfig } from "@/data/embed-tools";
import type { OpenAIChatRequestOptions, ResponseFormatType } from "@/data/openai-models";
import { calculateTextDeaiCost } from "@/lib/subscription/deai-cost";
import type { DeaiSummary } from "@/lib/subscription/deai";
import { EmbeddedSubmitBar } from "@/components/tools/embedded/EmbeddedSubmitBar";
import { EmbeddedToolHeader } from "@/components/tools/embedded/EmbeddedToolHeader";
import { ProviderSetupMessage } from "@/components/tools/embedded/ProviderSetupMessage";
import {
  createInitialOpenAIOptions,
  OpenAIChatSettings,
} from "@/components/tools/embedded/OpenAIChatSettings";
import { useProviderConfigured } from "@/components/tools/embedded/useProviderConfigured";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type EmbeddedOpenAIChatProps = {
  slug: string;
  toolName: string;
  config: ChatEmbedConfig;
  initialDeai: DeaiSummary;
};

function formatMessageContent(content: string, responseFormat: ResponseFormatType): string {
  if (responseFormat === "text") return content;

  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

export function EmbeddedOpenAIChat({
  slug,
  toolName,
  config,
  initialDeai,
}: EmbeddedOpenAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deai, setDeai] = useState(initialDeai);
  const [openAIOptions, setOpenAIOptions] = useState<OpenAIChatRequestOptions>(
    createInitialOpenAIOptions,
  );
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const providerConfigured = useProviderConfigured(config);

  const estimatedCost = useMemo(() => {
    const draft = input.trim();
    const chars =
      messages.reduce((sum, message) => sum + message.content.length, 0) + draft.length;

    return calculateTextDeaiCost({
      model: openAIOptions.model,
      totalChars: Math.max(chars, draft.length || 40),
      reasoningEffort: openAIOptions.reasoningEffort,
    });
  }, [input, messages, openAIOptions.model, openAIOptions.reasoningEffort]);

  const totalChars = useMemo(() => {
    const draft = input.trim();
    return messages.reduce((sum, message) => sum + message.content.length, 0) + draft.length;
  }, [input, messages]);

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
        body: JSON.stringify({
          slug,
          messages: nextMessages,
          openai: openAIOptions,
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
  const isJsonFormat = openAIOptions.responseFormat !== "text";

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
          <OpenAIChatSettings
            options={openAIOptions}
            onChange={setOpenAIOptions}
            totalChars={totalChars}
            disabled={loading}
          />

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
                  <p
                    className={`whitespace-pre-wrap ${
                      message.role === "assistant" && isJsonFormat ? "font-mono text-xs" : ""
                    }`}
                  >
                    {message.role === "assistant"
                      ? formatMessageContent(message.content, openAIOptions.responseFormat)
                      : message.content}
                  </p>
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
