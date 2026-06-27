import {
  getProfileAvatarOption,
  resolveProfileAvatarId,
  type ProfileAvatarId,
} from "@/data/profile-avatars";
import { AvatarArt } from "@/components/profile/AvatarArt";

type ProfileAvatarProps = {
  avatarId?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-9 w-9 p-1.5",
  md: "h-12 w-12 p-2",
  lg: "h-16 w-16 p-2.5",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function ProfileAvatar({
  avatarId,
  name = "?",
  size = "sm",
  className = "",
}: ProfileAvatarProps) {
  const resolvedId = resolveProfileAvatarId(avatarId);
  const option = getProfileAvatarOption(resolvedId);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/35 bg-gradient-to-br shadow-[0_0_10px_rgba(212,175,55,0.12)] ${option.bgClass} ${sizeClasses[size]} ${className}`}
      aria-hidden={!name}
      title={name}
    >
      <AvatarArt id={resolvedId} />
    </span>
  );
}

/** Fallback для старых мест с только именем */
export function ProfileInitialsAvatar({
  name = "?",
  size = "sm",
  className = "",
}: Omit<ProfileAvatarProps, "avatarId">) {
  const letter = initials(name || "?");

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gradient-to-br from-gold/25 to-black/60 font-semibold text-gold-light shadow-[0_0_10px_rgba(212,175,55,0.15)] ${size === "sm" ? "h-9 w-9 text-sm" : size === "md" ? "h-12 w-12 text-base" : "h-16 w-16 text-xl"} ${className}`}
      aria-hidden
    >
      {letter}
    </span>
  );
}

export type { ProfileAvatarId };
