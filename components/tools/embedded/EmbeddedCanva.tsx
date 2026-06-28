"use client";

import { useEffect, useState } from "react";
import type { DesignEmbedConfig } from "@/data/embed-tools";
import {
  CANVA_DESIGN_DEAI,
  CANVA_DESIGN_PRESETS,
  type CanvaPresetName,
} from "@/data/canva-options";
import type { DeaiSummary } from "@/lib/subscription/deai";
import { EmbeddedToolHeader } from "@/components/tools/embedded/EmbeddedToolHeader";
import { ProviderSetupMessage } from "@/components/tools/embedded/ProviderSetupMessage";
import { useProviderConfigured } from "@/components/tools/embedded/useProviderConfigured";
import { Button } from "@/components/ui/Button";
import { DeaiCostHint } from "@/components/tools/embedded/DeaiCostHint";

type EmbeddedCanvaProps = {
  slug: string;
  toolName: string;
  config: DesignEmbedConfig;
  initialDeai: DeaiSummary;
};

type CanvaStatus = {
  configured: boolean;
  connected: boolean;
};

type CanvaDesignResponse = {
  design?: {
    id: string;
    title: string;
    editUrl: string;
    viewUrl: string | null;
  };
  deai?: DeaiSummary;
  error?: string;
  code?: string;
};

const selectClassName = "input-theme w-full rounded-xl px-3 py-2.5 text-sm";

export function EmbeddedCanva({
  toolName,
  config,
  initialDeai,
}: EmbeddedCanvaProps) {
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const providerConfigured = useProviderConfigured(config);

  const [canvaStatus, setCanvaStatus] = useState<CanvaStatus | null>(null);
  const [title, setTitle] = useState("");
  const [preset, setPreset] = useState<CanvaPresetName>("doc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState<string | null>(null);
  const [deai, setDeai] = useState(initialDeai);

  const connected = canvaStatus?.connected === true;
  const estimatedCost = CANVA_DESIGN_DEAI;
  const insufficientDeai = !deai.unlimited && deai.balance < estimatedCost;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("connected") === "1") {
      setBanner({
        type: "success",
        text: "Canva подключена. Создайте дизайн и откройте редактор.",
      });
      return;
    }

    const canvaError = params.get("canva_error");
    if (canvaError) {
      setBanner({
        type: "error",
        text: `Не удалось подключить Canva: ${canvaError}`,
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/canva/status")
      .then((response) => response.json())
      .then((status: CanvaStatus) => {
        if (!cancelled) setCanvaStatus(status);
      })
      .catch(() => {
        if (!cancelled) setCanvaStatus({ configured: false, connected: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateDesign(event: React.FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || loading || insufficientDeai || !connected) return;

    setLoading(true);
    setError(null);
    setEditUrl(null);

    try {
      const response = await fetch("/api/canva/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle, preset }),
      });

      const data = (await response.json()) as CanvaDesignResponse;

      if (!response.ok) {
        if (data.code === "not_connected") {
          setCanvaStatus((current) =>
            current ? { ...current, connected: false } : { configured: true, connected: false },
          );
        }
        throw new Error(data.error ?? "Не удалось создать дизайн.");
      }

      if (data.deai) setDeai(data.deai);
      if (data.design?.editUrl) setEditUrl(data.design.editUrl);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Ошибка создания дизайна.");
    } finally {
      setLoading(false);
    }
  }

  if (providerConfigured === false) {
    return (
      <div className="flex min-h-[480px] flex-col rounded-2xl border divider-metallic bg-panel">
        <EmbeddedToolHeader toolName={toolName} deai={deai} />
        <ProviderSetupMessage config={config} />
      </div>
    );
  }

  if (providerConfigured === null || canvaStatus === null) {
    return (
      <div className="flex min-h-[480px] flex-col rounded-2xl border divider-metallic bg-panel">
        <EmbeddedToolHeader toolName={toolName} deai={deai} />
        <div className="flex flex-1 items-center justify-center text-sm text-silver-dim">
          Загрузка Canva...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[480px] flex-col rounded-2xl border divider-metallic bg-panel">
      <EmbeddedToolHeader toolName={toolName} deai={deai} />

      <div className="flex flex-1 flex-col gap-4 px-5 py-5 sm:px-6">
        <p className="text-sm leading-relaxed text-silver-dim">{config.welcomeMessage}</p>

        {banner && (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              banner.type === "success"
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            {banner.text}
          </div>
        )}

        {!connected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed divider-metallic px-6 py-10 text-center">
            <p className="max-w-md text-sm leading-relaxed text-silver-dim">
              Подключите свой аккаунт Canva через OAuth. После этого вы сможете создавать дизайны
              и использовать Canva AI прямо в редакторе Canva.
            </p>
            <Button href="/api/canva/authorize">Подключить Canva</Button>
          </div>
        ) : (
          <form onSubmit={handleCreateDesign} className="flex flex-1 flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm text-silver-dim">
                Название дизайна
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={config.placeholder ?? "Мой проект"}
                  disabled={loading}
                  className={selectClassName}
                  maxLength={120}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm text-silver-dim">
                Формат
                <select
                  value={preset}
                  onChange={(event) => setPreset(event.target.value as CanvaPresetName)}
                  disabled={loading}
                  className={selectClassName}
                >
                  {CANVA_DESIGN_PRESETS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                      {item.hint ? ` — ${item.hint}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="text-xs leading-relaxed text-silver-dim">
              Canva AI (Magic Media, Magic Write и др.) доступен внутри редактора Canva после
              создания дизайма. Откроется новая вкладка с вашим аккаунтом.
            </p>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {editUrl && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
                <p className="font-medium">Дизайн создан.</p>
                <p className="mt-1 text-emerald-200/90">
                  Откройте редактор Canva, чтобы использовать AI-инструменты.
                </p>
                <a
                  href={editUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-gold to-gold-light px-4 py-2 text-sm font-medium text-black transition-all hover:from-gold-light hover:to-gold"
                >
                  Открыть в Canva ↗
                </a>
              </div>
            )}

            <div className="mt-auto flex items-center justify-between gap-3 border-t divider-metallic pt-4">
              <DeaiCostHint
                cost={estimatedCost}
                balance={deai.balance}
                unlimited={deai.unlimited}
              />
              <Button
                type="submit"
                disabled={loading || !title.trim() || insufficientDeai}
                className="gap-1.5 px-4 py-2 text-sm"
              >
                {loading ? "Создание..." : "Создать дизайн"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
