"use client";

import {
  DEFAULT_JSON_SCHEMA,
  modelSupportsReasoning,
  OPENAI_MODELS,
  type OpenAIChatRequestOptions,
  type ReasoningEffort,
  type ResponseFormatType,
} from "@/data/openai-models";
import { calculateTextDeaiCost, formatDeai } from "@/lib/subscription/deai-cost";
import { getDefaultOpenAIOptions } from "@/lib/providers/validate-openai-options";

type OpenAIChatSettingsProps = {
  options: OpenAIChatRequestOptions;
  onChange: (options: OpenAIChatRequestOptions) => void;
  totalChars: number;
  disabled?: boolean;
};

const FORMAT_OPTIONS: { value: ResponseFormatType; label: string }[] = [
  { value: "text", label: "Текст" },
  { value: "json_object", label: "JSON-объект" },
  { value: "json_schema", label: "JSON-схема" },
];

const REASONING_OPTIONS: { value: ReasoningEffort; label: string }[] = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
];

const selectClassName =
  "input-theme w-full rounded-xl px-3 py-2.5 text-sm";

function modelDeaiLabel(modelId: string, totalChars: number, reasoningEffort?: ReasoningEffort): string {
  const cost = calculateTextDeaiCost({
    model: modelId,
    totalChars,
    reasoningEffort: modelSupportsReasoning(modelId) ? reasoningEffort : undefined,
  });

  return formatDeai(cost);
}

export function OpenAIChatSettings({
  options,
  onChange,
  totalChars,
  disabled = false,
}: OpenAIChatSettingsProps) {
  const showReasoning = modelSupportsReasoning(options.model);
  const chars = Math.max(totalChars, 40);

  function updateModel(model: string) {
    const reasoning = modelSupportsReasoning(model);
    onChange({
      ...options,
      model,
      reasoningEffort: reasoning ? (options.reasoningEffort ?? "medium") : undefined,
    });
  }

  function updateFormat(responseFormat: ResponseFormatType) {
    onChange({
      ...options,
      responseFormat,
      jsonSchema:
        responseFormat === "json_schema"
          ? options.jsonSchema ?? DEFAULT_JSON_SCHEMA
          : options.jsonSchema,
    });
  }

  return (
    <div className="space-y-3 border-b divider-metallic px-5 py-4 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-gold/70">
        Настройки ChatGPT
      </p>
      <p className="text-xs text-silver-dim/80">
        Сравнивайте модели по Deai в списке — цена обновляется от объёма текста и настроек
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block space-y-1.5">
          <span className="text-xs text-silver-dim">Модель</span>
          <select
            value={options.model}
            onChange={(event) => updateModel(event.target.value)}
            disabled={disabled}
            className={selectClassName}
          >
            {OPENAI_MODELS.map((model) => {
              const effort =
                model.id === options.model
                  ? options.reasoningEffort
                  : model.reasoning
                    ? "medium"
                    : undefined;

              return (
                <option key={model.id} value={model.id}>
                  {model.label} · {modelDeaiLabel(model.id, chars, effort)} Deai
                </option>
              );
            })}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-silver-dim">Формат ответа</span>
          <select
            value={options.responseFormat}
            onChange={(event) => updateFormat(event.target.value as ResponseFormatType)}
            disabled={disabled}
            className={selectClassName}
          >
            {FORMAT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {showReasoning ? (
          <label className="block space-y-1.5">
            <span className="text-xs text-silver-dim">Рассуждение</span>
            <select
              value={options.reasoningEffort ?? "medium"}
              onChange={(event) =>
                onChange({
                  ...options,
                  reasoningEffort: event.target.value as ReasoningEffort,
                })
              }
              disabled={disabled}
              className={selectClassName}
            >
              {REASONING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="hidden lg:block" />
        )}
      </div>

      {options.responseFormat === "json_schema" && (
        <label className="block space-y-1.5">
          <span className="text-xs text-silver-dim">JSON Schema</span>
          <textarea
            value={options.jsonSchema ?? DEFAULT_JSON_SCHEMA}
            onChange={(event) =>
              onChange({ ...options, jsonSchema: event.target.value })
            }
            disabled={disabled}
            rows={6}
            spellCheck={false}
            className="input-theme w-full resize-y rounded-xl px-3 py-2.5 font-mono text-xs leading-relaxed"
          />
        </label>
      )}
    </div>
  );
}

export function createInitialOpenAIOptions() {
  return getDefaultOpenAIOptions();
}
