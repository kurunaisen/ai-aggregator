"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { VideoEmbedConfig } from "@/data/embed-tools";
import {
  calculateVideoDeaiCost,
  MEDIA_QUALITY_OPTIONS,
  VIDEO_DURATION_OPTIONS,
  type MediaQuality,
  type VideoDuration,
} from "@/lib/subscription/deai-cost";
import type { DeaiSummary } from "@/lib/subscription/deai";
import { EmbeddedSubmitBar } from "@/components/tools/embedded/EmbeddedSubmitBar";
import { EmbeddedToolHeader } from "@/components/tools/embedded/EmbeddedToolHeader";
import { ProviderSetupMessage } from "@/components/tools/embedded/ProviderSetupMessage";
import { useProviderConfigured } from "@/components/tools/embedded/useProviderConfigured";

type EmbeddedVideoProps = {
  slug: string;
  toolName: string;
  config: VideoEmbedConfig;
  initialDeai: DeaiSummary;
};

const selectClassName = "input-theme w-full rounded-xl px-3 py-2.5 text-sm";

export function EmbeddedVideo({
  slug,
  toolName,
  config,
  initialDeai,
}: EmbeddedVideoProps) {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<VideoDuration>(
    (config.duration === 10 || config.duration === 15 ? config.duration : 5) as VideoDuration,
  );
  const [quality, setQuality] = useState<MediaQuality>("1k");
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
        duration,
        quality,
      }),
    [config.model, duration, quality],
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

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    const text = prompt.trim();
    if (!text || loading || polling || insufficientDeai || providerConfigured !== true) return;

    setLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          prompt: text,
          video: { duration, quality },
        }),
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
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs text-silver-dim">Длительность</span>
                <select
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value) as VideoDuration)}
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {VIDEO_DURATION_OPTIONS.map((seconds) => (
                    <option key={seconds} value={seconds}>
                      {seconds} сек
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs text-silver-dim">Качество</span>
                <select
                  value={quality}
                  onChange={(event) => setQuality(event.target.value as MediaQuality)}
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {MEDIA_QUALITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <EmbeddedSubmitBar
              value={prompt}
              onChange={setPrompt}
              onSubmit={handleSubmit}
              placeholder={config.placeholder}
              rows={3}
              disabled={insufficientDeai || polling}
              loading={loading || polling}
              submitLabel="Сгенерировать"
              cost={estimatedCost}
              deai={deai}
              enterToSubmit={false}
            />
            <p className="mt-2 text-xs text-silver-dim/70">
              Генерация может занять 1–2 минуты
            </p>
          </form>
        </>
      )}
    </div>
  );
}
