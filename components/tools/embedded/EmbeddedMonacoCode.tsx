"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CodeEmbedConfig } from "@/data/embed-tools";
import {
  CODE_LANGUAGES,
  getCodeLanguage,
  getStarterCode,
} from "@/data/code-languages";
import type { OpenAIChatRequestOptions } from "@/data/openai-models";
import { calculateTextDeaiCost } from "@/lib/subscription/deai-cost";
import type { DeaiSummary } from "@/lib/subscription/deai";
import { Button } from "@/components/ui/Button";
import { DeaiCostHint } from "@/components/tools/embedded/DeaiCostHint";
import { MonacoEditorPanel } from "@/components/tools/embedded/MonacoEditorPanel";
import { UsageBar } from "@/components/tools/embedded/UsageBar";
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

type EmbeddedMonacoCodeProps = {
  slug: string;
  toolName: string;
  config: CodeEmbedConfig;
  initialDeai: DeaiSummary;
};

const selectClassName = "input-theme w-full rounded-xl px-3 py-2.5 text-sm";

function extractFirstCodeBlock(text: string): string | null {
  const match = text.match(/```[\w-]*\n([\s\S]*?)```/);
  return match?.[1]?.trim() ?? null;
}

export function EmbeddedMonacoCode({
  slug,
  toolName,
  config,
  initialDeai,
}: EmbeddedMonacoCodeProps) {
  const [languageId, setLanguageId] = useState(config.defaultLanguage);
  const [editorCode, setEditorCode] = useState(() => getStarterCode(config.defaultLanguage));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deai, setDeai] = useState(initialDeai);
  const [openAIOptions, setOpenAIOptions] = useState<OpenAIChatRequestOptions>(
    createInitialOpenAIOptions,
  );
  const listRef = useRef<HTMLDivElement>(null);
  const language = getCodeLanguage(languageId);
  const providerConfigured = useProviderConfigured(config);

  const estimatedCost = useMemo(() => {
    const draft = input.trim();
    const chars =
      editorCode.length +
      messages.reduce((sum, message) => sum + message.content.length, 0) +
      draft.length;

    return calculateTextDeaiCost({
      model: openAIOptions.model,
      totalChars: Math.max(chars, draft.length || 40),
      reasoningEffort: openAIOptions.reasoningEffort,
    });
  }, [editorCode, input, messages, openAIOptions.model, openAIOptions.reasoningEffort]);

  const totalChars = useMemo(() => {
    const draft = input.trim();
    return (
      editorCode.length +
      messages.reduce((sum, message) => sum + message.content.length, 0) +
      draft.length
    );
  }, [editorCode, input, messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function handleLanguageChange(nextId: string) {
    setLanguageId(nextId);
    setEditorCode(getStarterCode(nextId));
  }

  function insertAssistantCode(content: string) {
    const block = extractFirstCodeBlock(content);
    if (block) setEditorCode(block);
  }

  async function sendMessage(event?: React.FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || loading || providerConfigured !== true) return;
    if (!deai.unlimited && deai.balance < estimatedCost) return;

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
          editorCode,
          language: languageId,
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
    }
  }

  const insufficientDeai = !deai.unlimited && deai.balance < estimatedCost;

  return (
    <div className="carbon-panel flex min-h-[640px] flex-col overflow-hidden rounded-2xl">
      <div className="border-b divider-metallic px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-silver">{toolName}</h2>
        <div className="mt-1">
          <UsageBar deai={deai} billingMode="token" />
        </div>
        <p className="mt-2 text-xs text-silver-dim/80">
          Monaco Editor + AI · списание токенами Deai
        </p>
      </div>

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

          <div className="grid flex-1 gap-0 lg:grid-cols-2 lg:divide-x divider-metallic">
            <div className="space-y-3 border-b divider-metallic p-4 sm:p-5 lg:border-b-0">
              <label className="block space-y-1.5">
                <span className="text-xs text-silver-dim">Язык</span>
                <select
                  value={languageId}
                  onChange={(event) => handleLanguageChange(event.target.value)}
                  disabled={loading}
                  className={selectClassName}
                >
                  {CODE_LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </label>
              <MonacoEditorPanel
                language={language}
                value={editorCode}
                onChange={setEditorCode}
                readOnly={loading}
              />
            </div>

            <div className="flex min-h-[320px] flex-col">
              <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
                <div className="rounded-xl border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-silver">
                  {config.welcomeMessage}
                </div>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[95%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "rounded-br-md bg-white/10 text-silver"
                          : "rounded-bl-md border border-gold/15 bg-black/40 text-silver-dim"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.role === "assistant" && extractFirstCodeBlock(message.content) && (
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-3 text-xs"
                          onClick={() => insertAssistantCode(message.content)}
                        >
                          Вставить код в редактор
                        </Button>
                      )}
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
                <p className="border-t divider-metallic px-4 py-2 text-sm text-red-300 sm:px-5">
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

              <form
                onSubmit={sendMessage}
                className="border-t divider-metallic p-4 sm:p-5"
              >
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={config.placeholder}
                  rows={2}
                  disabled={loading || insufficientDeai}
                  className="input-theme mb-3 min-h-[52px] w-full resize-none rounded-xl px-4 py-3 text-sm"
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <DeaiCostHint
                    cost={estimatedCost}
                    balance={deai.balance}
                    unlimited={deai.unlimited}
                    mode="token"
                  />
                  <Button
                    type="submit"
                    disabled={loading || insufficientDeai || !input.trim()}
                    className="w-full sm:w-auto sm:min-w-[140px]"
                  >
                    {loading ? "..." : "Спросить AI"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
