"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ImageEmbedConfig } from "@/data/embed-tools";
import {
  FLUX_MODEL_OPTIONS,
  IMAGE_ASPECT_RATIO_OPTIONS,
  NANOBANANA_MODEL_OPTIONS,
  type FluxGenerationRequest,
  type NanobananaGenerationRequest,
} from "@/data/image-options";
import {
  calculateImageDeaiCost,
  MEDIA_QUALITY_OPTIONS,
  type MediaQuality,
} from "@/lib/subscription/deai-cost";
import type { DeaiSummary } from "@/lib/subscription/deai";
import { EmbeddedSubmitBar } from "@/components/tools/embedded/EmbeddedSubmitBar";
import { EmbeddedToolHeader } from "@/components/tools/embedded/EmbeddedToolHeader";
import { ProviderSetupMessage } from "@/components/tools/embedded/ProviderSetupMessage";
import { useProviderConfigured } from "@/components/tools/embedded/useProviderConfigured";

type EmbeddedImageProps = {
  slug: string;
  toolName: string;
  config: ImageEmbedConfig;
  initialDeai: DeaiSummary;
};

const selectClassName = "input-theme w-full rounded-xl px-3 py-2.5 text-sm";

export function EmbeddedImage({
  slug,
  toolName,
  config,
  initialDeai,
}: EmbeddedImageProps) {
  const [prompt, setPrompt] = useState("");
  const [quality, setQuality] = useState<MediaQuality>("1k");
  const [nanobanana, setNanobanana] = useState<NanobananaGenerationRequest>({
    model: config.model as NanobananaGenerationRequest["model"],
    quality: "1k",
    aspectRatio: "1:1",
  });
  const [flux, setFlux] = useState<FluxGenerationRequest>({
    model: config.model as FluxGenerationRequest["model"],
    quality: "1k",
    aspectRatio: "1:1",
  });
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [deai, setDeai] = useState(initialDeai);
  const providerConfigured = useProviderConfigured(config);

  const activeModel =
    config.provider === "google-imagen" ? nanobanana.model : flux.model;

  const estimatedCost = useMemo(
    () => calculateImageDeaiCost({ model: activeModel, quality, outputCount: 1 }),
    [activeModel, quality],
  );

  const insufficientDeai = !deai.unlimited && deai.balance < estimatedCost;

  async function pollTask(taskId: string) {
    setPolling(true);
    setStatusText("Генерация изображения...");

    for (let i = 0; i < 40; i++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action: "poll", taskId }),
      });

      const data = (await response.json()) as {
        status?: string;
        imageUrl?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Ошибка опроса статуса");
      }

      if (data.status === "SUCCEEDED" && data.imageUrl) {
        setImageUrl(data.imageUrl);
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
    setImageUrl(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          prompt: text,
          image: {
            quality,
            nanobanana: config.provider === "google-imagen" ? { ...nanobanana, quality } : undefined,
            flux: config.provider === "bfl-flux" ? { ...flux, quality } : undefined,
          },
        }),
      });

      const data = (await response.json()) as {
        imageUrl?: string;
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

      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
        setLoading(false);
        return;
      }

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

            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Сгенерированное изображение"
                className="w-full rounded-xl border divider-metallic"
              />
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
                <span className="text-xs text-silver-dim">Модель</span>
                <select
                  value={activeModel}
                  onChange={(event) => {
                    const model = event.target.value;
                    if (config.provider === "google-imagen") {
                      setNanobanana((prev) => ({
                        ...prev,
                        model: model as NanobananaGenerationRequest["model"],
                      }));
                    } else {
                      setFlux((prev) => ({
                        ...prev,
                        model: model as FluxGenerationRequest["model"],
                      }));
                    }
                  }}
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {(config.provider === "google-imagen"
                    ? NANOBANANA_MODEL_OPTIONS
                    : FLUX_MODEL_OPTIONS
                  ).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
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

              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs text-silver-dim">Формат кадра</span>
                <select
                  value={
                    config.provider === "google-imagen"
                      ? nanobanana.aspectRatio
                      : flux.aspectRatio
                  }
                  onChange={(event) => {
                    const aspectRatio = event.target.value as NanobananaGenerationRequest["aspectRatio"];
                    if (config.provider === "google-imagen") {
                      setNanobanana((prev) => ({ ...prev, aspectRatio }));
                    } else {
                      setFlux((prev) => ({ ...prev, aspectRatio }));
                    }
                  }}
                  disabled={loading || polling}
                  className={selectClassName}
                >
                  {IMAGE_ASPECT_RATIO_OPTIONS.map((option) => (
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
          </form>
        </>
      )}
    </div>
  );
}
