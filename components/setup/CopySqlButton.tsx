"use client";

import { useState } from "react";

type CopySqlButtonProps = {
  sql: string;
};

export function CopySqlButton({ sql }: CopySqlButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sql);
      } else {
        const area = document.createElement("textarea");
        area.value = sql;
        area.setAttribute("readonly", "true");
        area.style.position = "fixed";
        area.style.left = "0";
        area.style.top = "0";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.focus();
        area.select();
        const copied = document.execCommand("copy");
        area.remove();
        if (!copied) throw new Error("copy failed");
      }
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => void copy()}
        className="w-full rounded-2xl border border-gold/40 bg-gradient-to-r from-gold to-gold-light px-6 py-5 text-lg font-semibold text-black shadow-gold"
      >
        {status === "copied" ? "Скопировано" : "Скопировать код"}
      </button>
      {status === "copied" && (
        <p className="text-base leading-relaxed text-silver">
          Теперь откройте Supabase → SQL Editor → New query. Долгое нажатие в пустом поле →
          Вставить → Run.
        </p>
      )}
      {status === "failed" && (
        <p className="text-base leading-relaxed text-red-300">
          Браузер не дал скопировать. Нажмите кнопку ещё раз или откройте страницу в Safari или
          Chrome.
        </p>
      )}
    </div>
  );
}
