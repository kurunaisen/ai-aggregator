"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { VideoEmbedConfig } from "@/data/embed-tools";
import {
  KLING_ASPECT_RATIO_OPTIONS,
  KLING_DURATION_OPTIONS,
  KLING_MODE_OPTIONS,
  KLING_MODEL_OPTIONS,
  type KlingDurationSeconds,
  type KlingGenerationRequest,
  type KlingModelId,
} from "@/data/kling-options";
import { calculateVideoDeaiCost } from "@/lib/subscription/deai-cost";
import type { DeaiSummary } from "@/lib/subscription/deai";
import { EmbeddedSubmitBar } from "@/components/tools/embedded/EmbeddedSubmitBar";
import { EmbeddedToolHeader } from "@/components/tools/embedded/EmbeddedToolHeader";
import { ProviderSetupMessage } from "@/components/tools/embedded/ProviderSetupMessage";
import { useProviderConfigured } from "@/components/tools/embedded/useProviderConfigured";

type EmbeddedKlingVideoProps = {
  slug: string;
  toolName: string;
  config: VideoEmbedConfig;
  initialDeai: DeaiSummary;
};

const selectClassName = "input-theme w-full rounded-xl px-3 py-2.5 text-sm";

function klingModeToQuality(mode: KlingGenerationRequest["mode"]): "1k" | "2k" {
  return mode === "pro" ? "2k" : "1k";
}

export function EmbeddedKlingVideo({
  slug,
  toolName,
  config,
  initialDeai,
}: EmbeddedKlingVideoProps) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<KlingModelId>("kling-v2-6");
  const [duration, setDuration] = useState<KlingDurationSeconds>(5);
  const [aspectRatio, setAspectRatio] =
    useState<KlingGenerationRequest["aspectRatio"]>("16:9");
  const [mode, setMode] = useState<KlingGenerationRequest["mode"]>("pro");
  const [sound, setSound] = useState(false);
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
        model,
        duration,
        quality: klingModeToQuality(mode),
      }),
    [model, duration, mode],
  );

  const insufficientDeai = deai.balance < estimatedCost;

  async function pollTask(taskId: string) {
    setPolling(true);
    setStatusText("Генерация видео Kling...");

    for (let i = 0; i < 60; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

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
    throw new Error("Превышено время ожидания.");
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
          video: {
            kling: {
              model,
              durationSeconds: duration,
              aspectRatio,
              mode,
              sound,
            },
          },
        }),
      });

      const data = (await response.json()) as {
        taskId?: string;
        error?: string;
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
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs text-silver-dim">Модель</span>
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value as KlingModelId)}
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {KLING_MODEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs text-silver-dim">Длительность</span>
                <select
                  value={duration}
                  onChange={(event) =>
                    setDuration(Number(event.target.value) as KlingDurationSeconds)
                  }
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {KLING_DURATION_OPTIONS.map((seconds) => (
                    <option key={seconds} value={seconds}>
                      {seconds} сек
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs text-silver-dim">Режим</span>
                <select
                  value={mode}
                  onChange={(event) =>
                    setMode(event.target.value as KlingGenerationRequest["mode"])
                  }
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {KLING_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs text-silver-dim">Формат</span>
                <select
                  value={aspectRatio}
                  onChange={(event) =>
                    setAspectRatio(
                      event.target.value as KlingGenerationRequest["aspectRatio"],
                    )
                  }
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {KLING_ASPECT_RATIO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 self-end pb-2 text-sm text-silver-dim">
                <input
                  type="checkbox"
                  checked={sound}
                  onChange={(event) => setSound(event.target.checked)}
                  disabled={loading || polling || model !== "kling-v2-6"}
                  className="rounded border-gold/30"
                />
                Звук (Kling 2.6)
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
              Генерация может занять 3–10 минут
            </p>
          </form>
        </>
      )}
    </div>
  );
}
