"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { VideoEmbedConfig } from "@/data/embed-tools";
import { calculateVideoDeaiCost } from "@/lib/subscription/deai-cost";
import type { DeaiSummary } from "@/lib/subscription/deai";
import { Button } from "@/components/ui/Button";
import { DeaiCostHint } from "@/components/tools/embedded/DeaiCostHint";
import { UsageBar } from "@/components/tools/embedded/UsageBar";
import { ProviderSetupMessage } from "@/components/tools/embedded/ProviderSetupMessage";
import { useProviderConfigured } from "@/components/tools/embedded/useProviderConfigured";

type EmbeddedVideoProps = {
  slug: string;
  toolName: string;
  config: VideoEmbedConfig;
  initialDeai: DeaiSummary;
};

export function EmbeddedVideo({
  slug,
  toolName,
  config,
  initialDeai,
}: EmbeddedVideoProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [deai, setDeai] = useState(initialDeai);
  const providerConfigured = useProviderConfigured(config);

  const estimatedCost = useMemo(
    () =>
      calculateVideoDeaiCost({
        model: config.model,
        promptLength: prompt.trim().length || 40,
        duration: config.duration,
      }),
    [config.duration, config.model, prompt],
  );

  const insufficientDeai = !deai.unlimited && deai.balance < estimatedCost;

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
    if (!text || loading || polling || insufficientDeai || providerConfigured !== true) return;

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
        deai?: DeaiSummary;
      };

      if (!response.ok) {
        if (data.deai) setDeai(data.deai);
        throw new Error(data.error ?? "Не удалось запустить генерацию");
      }

      if (data.deai) setDeai(data.deai);
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
        <h2 className="text-lg font-semibold text-silver">{toolName}</h2>
        <div className="mt-1">
          <UsageBar deai={deai} />
        </div>
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

            {statusText && <p className="text-sm text-gold-light">{statusText}</p>}

            {error && (
              <p className="text-sm text-red-300">
                {error}
                {insufficientDeai && (
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
              disabled={loading || polling || insufficientDeai}
              className="input-theme mb-3 w-full resize-none rounded-xl px-4 py-3 text-sm"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <DeaiCostHint
                cost={estimatedCost}
                balance={deai.balance}
                unlimited={deai.unlimited}
              />
              <Button
                type="submit"
                disabled={loading || polling || insufficientDeai || !prompt.trim()}
                className="w-full sm:w-auto"
              >
                {loading || polling ? "Генерация..." : "Сгенерировать видео"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-silver-dim/70">
              Генерация может занять 1–2 минуты
            </p>
          </form>
        </>
      )}
    </div>
  );
}
