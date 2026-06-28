"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { VideoEmbedConfig } from "@/data/embed-tools";
import {
  VEO_ASPECT_RATIO_OPTIONS,
  VEO_DURATION_OPTIONS,
  VEO_MODE_OPTIONS,
  VEO_MODEL_OPTIONS,
  VEO_RESOLUTION_OPTIONS,
  resolveVeoDurationForRequest,
  veoModelSupportsIngredients,
  veoResolutionToMediaQuality,
  type VeoAspectRatio,
  type VeoDurationSeconds,
  type VeoGenerationMode,
  type VeoModelId,
  type VeoResolution,
} from "@/data/veo-options";
import { calculateVideoDeaiCost } from "@/lib/subscription/deai-cost";
import type { DeaiSummary } from "@/lib/subscription/deai";
import { fileToImagePayload } from "@/lib/utils/image-base64";
import { EmbeddedSubmitBar } from "@/components/tools/embedded/EmbeddedSubmitBar";
import { EmbeddedToolHeader } from "@/components/tools/embedded/EmbeddedToolHeader";
import { ProviderSetupMessage } from "@/components/tools/embedded/ProviderSetupMessage";
import { useProviderConfigured } from "@/components/tools/embedded/useProviderConfigured";

type EmbeddedVeoVideoProps = {
  slug: string;
  toolName: string;
  config: VideoEmbedConfig;
  initialDeai: DeaiSummary;
};

const selectClassName = "input-theme w-full rounded-xl px-3 py-2.5 text-sm";

export function EmbeddedVeoVideo({
  slug,
  toolName,
  config,
  initialDeai,
}: EmbeddedVeoVideoProps) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<VeoModelId>("veo-3.1-generate-preview");
  const [mode, setMode] = useState<VeoGenerationMode>("text-to-video");
  const [duration, setDuration] = useState<VeoDurationSeconds>(8);
  const [aspectRatio, setAspectRatio] = useState<VeoAspectRatio>("16:9");
  const [resolution, setResolution] = useState<VeoResolution>("720p");
  const [startImage, setStartImage] = useState<File | null>(null);
  const [ingredientImages, setIngredientImages] = useState<(File | null)[]>([
    null,
    null,
    null,
  ]);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [deai, setDeai] = useState(initialDeai);
  const providerConfigured = useProviderConfigured(config);

  const effectiveDuration = useMemo(
    () => resolveVeoDurationForRequest(duration, mode, resolution),
    [duration, mode, resolution],
  );

  const durationLocked = effectiveDuration === 8 && duration !== 8;

  const estimatedCost = useMemo(
    () =>
      calculateVideoDeaiCost({
        model,
        duration: effectiveDuration,
        quality: veoResolutionToMediaQuality(resolution),
      }),
    [model, effectiveDuration, resolution],
  );

  const insufficientDeai = !deai.unlimited && deai.balance < estimatedCost;

  const availableModes = useMemo(
    () =>
      VEO_MODE_OPTIONS.filter(
        (option) =>
          option.value !== "ingredients-to-video" ||
          veoModelSupportsIngredients(model),
      ),
    [model],
  );

  const availableResolutions = useMemo(
    () =>
      VEO_RESOLUTION_OPTIONS.filter(
        (option) => model !== "veo-3.1-lite-generate-preview" || option.liteSupported,
      ),
    [model],
  );

  useEffect(() => {
    if (!veoModelSupportsIngredients(model) && mode === "ingredients-to-video") {
      setMode("text-to-video");
    }
  }, [model, mode]);

  useEffect(() => {
    if (
      model === "veo-3.1-lite-generate-preview" &&
      resolution === "4k"
    ) {
      setResolution("1080p");
    }
  }, [model, resolution]);

  async function pollTask(taskId: string) {
    setPolling(true);
    setStatusText("Генерация Veo...");

    for (let i = 0; i < 72; i++) {
      await new Promise((r) => setTimeout(r, 5000));

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
    throw new Error("Превышено время ожидания. Попробуйте снова позже.");
  }

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    const text = prompt.trim();
    if (!text || loading || polling || insufficientDeai || providerConfigured !== true) {
      return;
    }

    setLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      let imagePayload;
      let referenceImagesPayload;

      if (mode === "image-to-video") {
        if (!startImage) throw new Error("Загрузите стартовое изображение");
        imagePayload = await fileToImagePayload(startImage);
      }

      if (mode === "ingredients-to-video") {
        const files = ingredientImages.filter((file): file is File => file !== null);
        if (files.length === 0) {
          throw new Error("Загрузите хотя бы одно референс-изображение");
        }
        referenceImagesPayload = await Promise.all(files.map(fileToImagePayload));
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          prompt: text,
          video: {
            veo: {
              model,
              mode,
              durationSeconds: effectiveDuration,
              aspectRatio,
              resolution,
              image: imagePayload,
              referenceImages: referenceImagesPayload,
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
                  onChange={(event) => setModel(event.target.value as VeoModelId)}
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {VEO_MODEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} — {option.description}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs text-silver-dim">Режим</span>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value as VeoGenerationMode)}
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {availableModes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} · {option.description}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs text-silver-dim">Длительность</span>
                <select
                  value={duration}
                  onChange={(event) =>
                    setDuration(Number(event.target.value) as VeoDurationSeconds)
                  }
                  disabled={loading || polling || durationLocked}
                  className={selectClassName}
                >
                  {VEO_DURATION_OPTIONS.map((seconds) => (
                    <option key={seconds} value={seconds}>
                      {seconds} сек
                      {durationLocked && seconds !== 8 ? " (недоступно)" : ""}
                    </option>
                  ))}
                </select>
                {durationLocked && (
                  <span className="text-[11px] text-silver-dim/80">
                    Для выбранного режима или разрешения — только 8 сек
                  </span>
                )}
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs text-silver-dim">Соотношение</span>
                <select
                  value={aspectRatio}
                  onChange={(event) =>
                    setAspectRatio(event.target.value as VeoAspectRatio)
                  }
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {VEO_ASPECT_RATIO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs text-silver-dim">Разрешение</span>
                <select
                  value={resolution}
                  onChange={(event) =>
                    setResolution(event.target.value as VeoResolution)
                  }
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {availableResolutions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {mode === "image-to-video" && (
              <label className="mb-3 block space-y-1.5">
                <span className="text-xs text-silver-dim">Стартовое изображение</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={loading || polling}
                  onChange={(event) => setStartImage(event.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-silver-dim file:mr-3 file:rounded-lg file:border-0 file:bg-gold/15 file:px-3 file:py-2 file:text-xs file:font-medium file:text-gold-light"
                />
              </label>
            )}

            {mode === "ingredients-to-video" && (
              <div className="mb-3 space-y-2">
                <p className="text-xs text-silver-dim">
                  Ingredients to Video — до 3 референсов (персонаж, объект, стиль)
                </p>
                {[0, 1, 2].map((index) => (
                  <label key={index} className="block space-y-1">
                    <span className="text-[11px] text-silver-dim/80">
                      Референс {index + 1}
                      {index === 0 ? " *" : ""}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={loading || polling}
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setIngredientImages((current) => {
                          const next = [...current];
                          next[index] = file;
                          return next;
                        });
                      }}
                      className="block w-full text-xs text-silver-dim file:mr-3 file:rounded-lg file:border-0 file:bg-gold/15 file:px-3 file:py-2 file:text-xs file:font-medium file:text-gold-light"
                    />
                  </label>
                ))}
              </div>
            )}

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
              Veo 3.1 · генерация может занять 2–6 минут
            </p>
          </form>
        </>
      )}
    </div>
  );
}
