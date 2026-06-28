"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { VideoEmbedConfig } from "@/data/embed-tools";
import {
  RUNWAY_DURATION_OPTIONS,
  RUNWAY_IMAGE_TO_VIDEO_MODELS,
  RUNWAY_MODE_OPTIONS,
  RUNWAY_RATIO_OPTIONS,
  RUNWAY_TEXT_TO_VIDEO_MODELS,
  defaultRunwayModelForMode,
  type RunwayDurationSeconds,
  type RunwayGenerationMode,
  type RunwayGenerationRequest,
  type RunwayModelId,
  type RunwayRatio,
} from "@/data/runway-options";
import { calculateVideoDeaiCost } from "@/lib/subscription/deai-cost";
import type { DeaiSummary } from "@/lib/subscription/deai";
import { fileToImagePayload } from "@/lib/utils/image-base64";
import { EmbeddedSubmitBar } from "@/components/tools/embedded/EmbeddedSubmitBar";
import { EmbeddedToolHeader } from "@/components/tools/embedded/EmbeddedToolHeader";
import { ProviderSetupMessage } from "@/components/tools/embedded/ProviderSetupMessage";
import { useProviderConfigured } from "@/components/tools/embedded/useProviderConfigured";

type EmbeddedRunwayVideoProps = {
  slug: string;
  toolName: string;
  config: VideoEmbedConfig;
  initialDeai: DeaiSummary;
};

const selectClassName = "input-theme w-full rounded-xl px-3 py-2.5 text-sm";

export function EmbeddedRunwayVideo({
  slug,
  toolName,
  config,
  initialDeai,
}: EmbeddedRunwayVideoProps) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<RunwayGenerationMode>("text-to-video");
  const [model, setModel] = useState<RunwayModelId>("gen4.5");
  const [duration, setDuration] = useState<RunwayDurationSeconds>(5);
  const [ratio, setRatio] = useState<RunwayRatio>("1280:720");
  const [startImage, setStartImage] = useState<File | null>(null);
  const [startImagePreview, setStartImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [deai, setDeai] = useState(initialDeai);
  const providerConfigured = useProviderConfigured(config);

  const modelOptions =
    mode === "text-to-video" ? RUNWAY_TEXT_TO_VIDEO_MODELS : RUNWAY_IMAGE_TO_VIDEO_MODELS;

  useEffect(() => {
    const allowed = modelOptions.some((option) => option.value === model);
    if (!allowed) {
      setModel(defaultRunwayModelForMode(mode));
    }
  }, [mode, model, modelOptions]);

  useEffect(() => {
    if (!startImage) {
      setStartImagePreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(startImage);
    setStartImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [startImage]);

  const promptRequired =
    mode === "text-to-video" || model === "gen4_turbo" || model === "gen3a_turbo";

  const estimatedCost = useMemo(
    () =>
      calculateVideoDeaiCost({
        model,
        duration,
        quality: "1k",
      }),
    [model, duration],
  );

  const insufficientDeai = !deai.unlimited && deai.balance < estimatedCost;

  async function pollTask(taskId: string) {
    setPolling(true);
    setStatusText("Генерация видео Runway...");

    for (let i = 0; i < 72; i++) {
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
    throw new Error("Превышено время ожидания. Попробуйте короче промпт.");
  }

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    const text = prompt.trim();

    if (
      loading ||
      polling ||
      insufficientDeai ||
      providerConfigured !== true ||
      (promptRequired && !text) ||
      (mode === "image-to-video" && !startImage)
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      let promptImage;
      if (mode === "image-to-video" && startImage) {
        promptImage = await fileToImagePayload(startImage);
      }

      const runway: RunwayGenerationRequest = {
        mode,
        model,
        durationSeconds: duration,
        ratio,
        promptImage,
      };

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          prompt: text,
          video: { runway },
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
                <span className="text-xs text-silver-dim">Режим</span>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value as RunwayGenerationMode)}
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {RUNWAY_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} — {option.description}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs text-silver-dim">Модель</span>
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value as RunwayModelId)}
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {modelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} — {option.description}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs text-silver-dim">Формат</span>
                <select
                  value={ratio}
                  onChange={(event) => setRatio(event.target.value as RunwayRatio)}
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {RUNWAY_RATIO_OPTIONS.map((option) => (
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
                    setDuration(Number(event.target.value) as RunwayDurationSeconds)
                  }
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {RUNWAY_DURATION_OPTIONS.map((seconds) => (
                    <option key={seconds} value={seconds}>
                      {seconds} сек
                    </option>
                  ))}
                </select>
              </label>

              {mode === "image-to-video" && (
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="text-xs text-silver-dim">Стартовое изображение</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={loading || polling}
                    onChange={(event) => setStartImage(event.target.files?.[0] ?? null)}
                    className="input-theme w-full rounded-xl px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-gold/15 file:px-3 file:py-1.5 file:text-sm file:text-gold-light"
                  />
                  {startImagePreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={startImagePreview}
                      alt="Стартовый кадр"
                      className="mt-2 max-h-48 rounded-xl border divider-metallic object-contain"
                    />
                  )}
                </label>
              )}
            </div>

            <EmbeddedSubmitBar
              value={prompt}
              onChange={setPrompt}
              onSubmit={handleSubmit}
              placeholder={
                mode === "image-to-video"
                  ? promptRequired
                    ? "Опишите движение камеры и действие в кадре..."
                    : "Опционально: опишите движение (можно оставить пустым для Gen-4.5)..."
                  : config.placeholder
              }
              rows={3}
              disabled={
                insufficientDeai ||
                polling ||
                (mode === "image-to-video" && !startImage) ||
                (promptRequired && !prompt.trim())
              }
              loading={loading || polling}
              submitLabel="Сгенерировать"
              cost={estimatedCost}
              deai={deai}
              enterToSubmit={false}
            />
            <p className="mt-2 text-xs text-silver-dim/70">
              Text-to-video: Gen-4.5. Image-to-video: Gen-4.5, Gen-4 Turbo или Gen-3 Alpha Turbo.
              Генерация может занять 2–5 минут.
            </p>
          </form>
        </>
      )}
    </div>
  );
}
