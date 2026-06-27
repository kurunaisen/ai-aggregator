"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type ProfileNameFormProps = {
  initialName: string;
};

export function ProfileNameForm({ initialName }: ProfileNameFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = name.trim() !== initialName.trim();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!dirty || saving) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      });

      const data = (await response.json()) as {
        displayName?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Не удалось сохранить");
        return;
      }

      setName(data.displayName ?? name.trim());
      setMessage("Имя сохранено");
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gold/70">
          Имя аккаунта
        </span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={32}
          disabled={saving}
          className="input-theme w-full rounded-xl px-4 py-3 text-sm"
          placeholder="Как вас показывать на сайте"
        />
      </label>

      {error && <p className="text-sm text-red-300">{error}</p>}
      {message && <p className="text-sm text-gold-light">{message}</p>}

      <Button type="submit" disabled={!dirty || saving || name.trim().length < 2}>
        {saving ? "Сохранение..." : "Сохранить"}
      </Button>
    </form>
  );
}
