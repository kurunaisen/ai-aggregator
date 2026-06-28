import type { ClaudeChatRequestOptions } from "@/data/claude-models";
import { CLAUDE_MODELS, createDefaultClaudeOptions } from "@/data/claude-models";

type ClaudeChatSettingsProps = {
  options: ClaudeChatRequestOptions;
  onChange: (options: ClaudeChatRequestOptions) => void;
  disabled?: boolean;
};

const selectClassName = "input-theme w-full rounded-xl px-3 py-2.5 text-sm";

export function createInitialClaudeOptions(): ClaudeChatRequestOptions {
  return createDefaultClaudeOptions();
}

export function ClaudeChatSettings({
  options,
  onChange,
  disabled = false,
}: ClaudeChatSettingsProps) {
  const active = CLAUDE_MODELS.find((model) => model.id === options.model);

  return (
    <div className="mb-3 space-y-2">
      <label className="block space-y-1.5">
        <span className="text-xs text-silver-dim">Модель Claude</span>
        <select
          value={options.model}
          onChange={(event) => onChange({ model: event.target.value as ClaudeChatRequestOptions["model"] })}
          disabled={disabled}
          className={selectClassName}
        >
          {CLAUDE_MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label} — {model.hint}
            </option>
          ))}
        </select>
      </label>
      {active && (
        <p className="text-xs leading-relaxed text-silver-dim">
          {active.vision
            ? "Поддерживает загрузку изображений: диаграммы, графики, скриншоты."
            : null}
        </p>
      )}
    </div>
  );
}
