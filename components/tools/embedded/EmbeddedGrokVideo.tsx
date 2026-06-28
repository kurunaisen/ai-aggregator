"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { VideoEmbedConfig } from "@/data/embed-tools";
import {
  GROK_VIDEO_ASPECT_RATIO_OPTIONS,
  GROK_VIDEO_DURATION_OPTIONS,
  GROK_VIDEO_MODEL_OPTIONS,
  GROK_VIDEO_RESOLUTION_OPTIONS,
  grokVideoResolutionToQuality,
  type GrokVideoDurationSeconds,
  type GrokVideoGenerationRequest,
  type GrokVideoModelId,
  type GrokVideoResolution,
} from "@/data/grok-video-options";
import { calculateVideoDeaiCost } from "@/lib/subscription/deai-cost";
import type { DeaiSummary } from "@/lib/subscription/deai";
import { EmbeddedSubmitBar } from "@/components/tools/embedded/EmbeddedSubmitBar";
import { EmbeddedToolHeader } from "@/components/tools/embedded/EmbeddedToolHeader";
import { ProviderSetupMessage } from "@/components/tools/embedded/ProviderSetupMessage";
import { useProviderConfigured } from "@/components/tools/embedded/useProviderConfigured";

type EmbeddedGrokVideoProps = {
  slug: string;
  toolName: string;
  config: VideoEmbedConfig;
  initialDeai: DeaiSummary;
};

const selectClassName = "input-theme w-full rounded-xl px-3 py-2.5 text-sm";

export function EmbeddedGrokVideo({
  slug,
  toolName,
  config,
  initialDeai,
}: EmbeddedGrokVideoProps) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<GrokVideoModelId>("grok-imagine-video");
  const [duration, setDuration] = useState<GrokVideoDurationSeconds>(8);
  const [aspectRatio, setAspectRatio] =
    useState<GrokVideoGenerationRequest["aspectRatio"]>("16:9");
  const [resolution, setResolution] = useState<GrokVideoResolution>("720p");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [deai, setDeai] = useState(initialDeai);
  const providerConfigured = useProviderConfigured(config);

  const resolutionOptions = useMemo(
    () =>
      GROK_VIDEO_RESOLUTION_OPTIONS.filter(
        (option) => !option.models || option.models.includes(model),
      ),
    [model],
  );

  const estimatedCost = useMemo(
    () =>
      calculateVideoDeaiCost({
        model,
        duration,
        quality: grokVideoResolutionToQuality(resolution),
      }),
    [model, duration, resolution],
  );

  const insufficientDeai = deai.balance < estimatedCost;

  async function pollTask(taskId: string) {
    setPolling(true);
    setStatusText("Генерация Grok Video...");

    for (let i = 0; i < 90; i++) {
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
            grok: {
              model,
              durationSeconds: duration,
              aspectRatio,
              resolution,
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
      if (!data.taskId) throw new Error("Нет request_id");

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
                      Тарифы
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
                  onChange={(event) => {
                    const nextModel = event.target.value as GrokVideoModelId;
                    setModel(nextModel);
                    if (
                      nextModel !== "grok-imagine-video-1.5" &&
                      resolution === "1080p"
                    ) {
                      setResolution("720p");
                    }
                  }}
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {GROK_VIDEO_MODEL_OPTIONS.map((option) => (
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
                    setDuration(Number(event.target.value) as GrokVideoDurationSeconds)
                  }
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {GROK_VIDEO_DURATION_OPTIONS.map((seconds) => (
                    <option key={seconds} value={seconds}>
                      {seconds} сек
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs text-silver-dim">Разрешение</span>
                <select
                  value={resolution}
                  onChange={(event) =>
                    setResolution(event.target.value as GrokVideoResolution)
                  }
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {resolutionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs text-silver-dim">Формат</span>
                <select
                  value={aspectRatio}
                  onChange={(event) =>
                    setAspectRatio(
                      event.target.value as GrokVideoGenerationRequest["aspectRatio"],
                    )
                  }
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {GROK_VIDEO_ASPECT_RATIO_OPTIONS.map((option) => (
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
              Grok Video · генерация может занять 3–10 минут
            </p>
          </form>
        </>
      )}
    </div>
  );
}
