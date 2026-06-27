"use client";

import Link from "next/link";
import { useState } from "react";
import type { VideoEmbedConfig } from "@/data/embed-tools";
import type { UsageSummary } from "@/lib/subscription/usage";
import { Button } from "@/components/ui/Button";
import { UsageBar } from "@/components/tools/embedded/UsageBar";

type EmbeddedVideoProps = {
  slug: string;
  toolName: string;
  config: VideoEmbedConfig;
  providerConfigured: boolean;
  initialUsage: UsageSummary;
};

export function EmbeddedVideo({
  slug,
  toolName,
  config,
  providerConfigured,
  initialUsage,
}: EmbeddedVideoProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [usage, setUsage] = useState(initialUsage);

  const limitReached = usage.plan === "free" && (usage.remaining ?? 0) <= 0;

  async function pollTask(taskId: string) {
    setPolling(true);
    setStatusText("Генерация видео...");

    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 3000));

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action: "poll", taskId }),
      });

      const data = (await response.json()) as {
        status?: string;
        videoUrl?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Ошибка опроса статуса");
      }

      if (data.status === "SUCCEEDED" && data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setStatusText(null);
        setPolling(false);
        return;
      }

      if (data.status === "FAILED") {
        throw new Error(data.error ?? "Генерация не удалась");
      }

      setStatusText(`Статус: ${data.status ?? "ожидание"}...`);
    }

    setPolling(false);
    throw new Error("Превышено время ожидания. Попробуйте короче промпт.");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = prompt.trim();
    if (!text || loading || polling || limitReached || !providerConfigured) return;

    setLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, prompt: text }),
      });

      const data = (await response.json()) as {
        taskId?: string;
        error?: string;
        code?: string;
        usage?: UsageSummary;
      };

      if (!response.ok) {
        if (data.usage) setUsage(data.usage);
        throw new Error(data.error ?? "Не удалось запустить генерацию");
      }

      if (data.usage) setUsage(data.usage);
      if (!data.taskId) throw new Error("Нет taskId");

      setLoading(false);
      await pollTask(data.taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
      setStatusText(null);
    } finally {
      setLoading(false);
      setPolling(false);
    }
  }

  return (
    <div className="carbon-panel flex min-h-[520px] flex-col overflow-hidden rounded-2xl">
      <div className="border-b divider-metallic px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-silver">{toolName} — на сайте</h2>
        <div className="mt-1">
          <UsageBar usage={usage} />
        </div>
      </div>

      {!providerConfigured ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-silver-dim">
          RUNWAY_API_KEY не настроен на сервере.
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-4 px-5 py-5 sm:px-6">
            <p className="text-sm text-silver-dim">{config.welcomeMessage}</p>

            {videoUrl && (
              <video
                src={videoUrl}
                controls
                className="w-full rounded-xl border divider-metallic"
              >
                Ваш браузер не поддерживает видео.
              </video>
            )}

            {statusText && (
              <p className="text-sm text-gold-light">{statusText}</p>
            )}

            {error && (
              <p className="text-sm text-red-300">
                {error}
                {limitReached && (
                  <>
                    {" "}
                    <Link href="/pricing" className="text-gold-light underline">
                      Pro
                    </Link>
                  </>
                )}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t divider-metallic p-4 sm:p-5">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={config.placeholder}
              rows={3}
              disabled={loading || polling || limitReached}
              className="input-theme mb-3 w-full resize-none rounded-xl px-4 py-3 text-sm"
            />
            <Button
              type="submit"
              disabled={loading || polling || limitReached || !prompt.trim()}
              className="w-full sm:w-auto"
            >
              {loading || polling ? "Генерация..." : "Сгенерировать видео"}
            </Button>
            <p className="mt-2 text-xs text-silver-dim/70">
              Генерация может занять 1–2 минуты
            </p>
          </form>
        </>
      )}
    </div>
  );
}
