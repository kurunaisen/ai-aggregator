export type ProfileAvatarId =
  | "star"
  | "orbit"
  | "neural"
  | "bolt"
  | "prism"
  | "comet"
  | "hex"
  | "wave"
  | "shield"
  | "core";

export const DEFAULT_PROFILE_AVATAR_ID: ProfileAvatarId = "star";

export type ProfileAvatarOption = {
  id: ProfileAvatarId;
  label: string;
  bgClass: string;
};

export const PROFILE_AVATARS: ProfileAvatarOption[] = [
  { id: "star", label: "Звезда", bgClass: "from-amber-500/40 via-yellow-600/20 to-black" },
  { id: "orbit", label: "Орбита", bgClass: "from-indigo-500/35 via-violet-600/20 to-black" },
  { id: "neural", label: "Нейросеть", bgClass: "from-cyan-500/30 via-teal-700/20 to-black" },
  { id: "bolt", label: "Импульс", bgClass: "from-yellow-400/35 via-orange-600/25 to-black" },
  { id: "prism", label: "Призма", bgClass: "from-fuchsia-500/30 via-purple-700/20 to-black" },
  { id: "comet", label: "Комета", bgClass: "from-sky-400/35 via-blue-800/25 to-black" },
  { id: "hex", label: "Гекс", bgClass: "from-emerald-500/30 via-green-800/20 to-black" },
  { id: "wave", label: "Волна", bgClass: "from-rose-400/30 via-pink-800/20 to-black" },
  { id: "shield", label: "Щит", bgClass: "from-slate-400/30 via-slate-700/25 to-black" },
  { id: "core", label: "Ядро", bgClass: "from-gold/35 via-amber-800/30 to-black" },
];

const avatarIds = new Set(PROFILE_AVATARS.map((avatar) => avatar.id));

export function isProfileAvatarId(value: string): value is ProfileAvatarId {
  return avatarIds.has(value as ProfileAvatarId);
}

export function resolveProfileAvatarId(value: string | null | undefined): ProfileAvatarId {
  if (value && isProfileAvatarId(value)) return value;
  return DEFAULT_PROFILE_AVATAR_ID;
}

export function getProfileAvatarOption(id: ProfileAvatarId): ProfileAvatarOption {
  return PROFILE_AVATARS.find((avatar) => avatar.id === id) ?? PROFILE_AVATARS[0];
}
