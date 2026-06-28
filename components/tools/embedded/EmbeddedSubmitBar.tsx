"use client";

import type { RefObject } from "react";
import { Button } from "@/components/ui/Button";
import { DeaiCostHint } from "@/components/tools/embedded/DeaiCostHint";
import type { DeaiSummary } from "@/lib/subscription/deai";

export const embeddedInputClassName =
  "input-theme min-h-[52px] min-w-0 flex-1 resize-none rounded-xl px-4 py-3 text-sm";

export const embeddedSubmitButtonClassName = "shrink-0 gap-1.5 px-3 py-2 text-xs";

type EmbeddedSubmitBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event?: React.FormEvent) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  loading?: boolean;
  submitLabel?: string;
  cost: number;
  deai: DeaiSummary;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  enterToSubmit?: boolean;
};

export function EmbeddedSubmitBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Напишите сообщение...",
  rows = 2,
  disabled = false,
  loading = false,
  submitLabel = "Отправить",
  cost,
  deai,
  inputRef,
  enterToSubmit = true,
}: EmbeddedSubmitBarProps) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!enterToSubmit) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void onSubmit();
    }
  }

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled || loading}
        className={embeddedInputClassName}
      />
      <Button
        type="submit"
        disabled={disabled || loading || !value.trim()}
        className={embeddedSubmitButtonClassName}
      >
        <DeaiCostHint
          cost={cost}
          balance={deai.balance}
          unlimited={deai.unlimited}
          inButton
        />
        {loading ? "..." : submitLabel}
      </Button>
    </div>
  );
}
