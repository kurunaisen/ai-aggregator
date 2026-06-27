"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PROFILE_AVATARS,
  resolveProfileAvatarId,
  type ProfileAvatarId,
} from "@/data/profile-avatars";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/Button";

type ProfileAvatarPickerProps = {
  initialAvatarId: string | null;
  displayName: string;
};

export function ProfileAvatarPicker({
  initialAvatarId,
  displayName,
}: ProfileAvatarPickerProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<ProfileAvatarId>(
    resolveProfileAvatarId(initialAvatarId),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = selected !== resolveProfileAvatarId(initialAvatarId);

  async function handleSave() {
    if (!dirty || saving) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarId: selected }),
      });

      const data = (await response.json()) as { avatarId?: string; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Не удалось сохранить");
        return;
      }

      setMessage("Иконка обновлена");
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <ProfileAvatar avatarId={selected} name={displayName} size="lg" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold/70">
            Иконка профиля
          </p>
          <p className="mt-1 text-sm text-silver-dim">
            Выберите аватар — он отображается в шапке сайта
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-5 sm:gap-3">
        {PROFILE_AVATARS.map((avatar) => {
          const active = selected === avatar.id;

          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => setSelected(avatar.id)}
              disabled={saving}
              title={avatar.label}
              aria-label={avatar.label}
              aria-pressed={active}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all ${
                active
                  ? "border-gold/60 bg-gold/10 ring-1 ring-gold/40"
                  : "divider-metallic bg-black/30 hover:border-gold/30 hover:bg-gold/5"
              }`}
            >
              <ProfileAvatar avatarId={avatar.id} name={avatar.label} size="md" />
              <span className="max-w-full truncate text-[10px] text-silver-dim">{avatar.label}</span>
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}
      {message && <p className="text-sm text-gold-light">{message}</p>}

      <Button type="button" onClick={() => void handleSave()} disabled={!dirty || saving}>
        {saving ? "Сохранение..." : "Сохранить иконку"}
      </Button>
    </div>
  );
}
