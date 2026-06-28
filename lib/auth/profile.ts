import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getOAuthDisplayName, getOAuthEmail } from "@/lib/auth/oauth-metadata";
import {
  DEFAULT_PROFILE_AVATAR_ID,
  isProfileAvatarId,
  resolveProfileAvatarId,
  type ProfileAvatarId,
} from "@/data/profile-avatars";
import type { Plan } from "@/lib/subscription/constants";
import { normalizePlan } from "@/lib/subscription/plans";
import { FREE_STARTING_DEAI } from "@/lib/subscription/deai-cost";

export type Profile = {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarId: ProfileAvatarId;
  plan: Plan;
  deaiBalance: number;
};

const PROFILE_FIELDS = "id, email, display_name, avatar_id, plan, deai_balance" as const;

function mapProfileRow(data: {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_id: string | null;
  plan: string;
  deai_balance: number;
}): Profile {
  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    avatarId: resolveProfileAvatarId(data.avatar_id),
    plan: normalizePlan(data.plan),
    deaiBalance: Number(data.deai_balance ?? FREE_STARTING_DEAI),
  };
}

export function getProfileDisplayName(profile: Profile, user: User): string {
  if (profile.displayName?.trim()) return profile.displayName.trim();
  const oauthName = getOAuthDisplayName(user);
  if (oauthName) return oauthName;
  const oauthEmail = getOAuthEmail(user);
  if (oauthEmail) return oauthEmail.split("@")[0] ?? "Профиль";
  if (user.email) return user.email.split("@")[0] ?? "Профиль";
  return "Профиль";
}

export async function getProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_FIELDS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("getProfile:", error.message);
    return null;
  }

  if (!data) return null;

  return mapProfileRow(data);
}

export async function ensureProfile(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<Profile> {
  const existing = await getProfile(supabase, user.id);
  const oauthEmail = getOAuthEmail(user);

  if (existing) {
    if (oauthEmail && !existing.email) {
      const { data } = await supabase
        .from("profiles")
        .update({ email: oauthEmail, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select(PROFILE_FIELDS)
        .maybeSingle();

      if (data) return mapProfileRow(data);
    }

    return existing;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: oauthEmail ?? user.email ?? null,
      plan: "free",
      deai_balance: FREE_STARTING_DEAI,
      avatar_id: DEFAULT_PROFILE_AVATAR_ID,
    })
    .select(PROFILE_FIELDS)
    .single();

  if (error || !data) {
    return {
      id: user.id,
      email: oauthEmail ?? user.email ?? null,
      displayName: null,
      avatarId: DEFAULT_PROFILE_AVATAR_ID,
      plan: "free",
      deaiBalance: FREE_STARTING_DEAI,
    };
  }

  return mapProfileRow(data);
}

export async function updateProfileDisplayName(
  supabase: SupabaseClient<Database>,
  userId: string,
  displayName: string,
): Promise<{ ok: true; displayName: string } | { ok: false; error: string }> {
  const trimmed = displayName.trim();

  if (trimmed.length < 2 || trimmed.length > 32) {
    return { ok: false, error: "Имя: от 2 до 32 символов." };
  }

  if (!/^[\p{L}\p{N} _.-]+$/u.test(trimmed)) {
    return { ok: false, error: "Допустимы буквы, цифры, пробел, дефис и точка." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("updateProfileDisplayName:", error.message);
    return { ok: false, error: "Не удалось сохранить имя." };
  }

  return { ok: true, displayName: trimmed };
}

export async function updateProfileAvatar(
  supabase: SupabaseClient<Database>,
  userId: string,
  avatarId: string,
): Promise<{ ok: true; avatarId: ProfileAvatarId } | { ok: false; error: string }> {
  if (!isProfileAvatarId(avatarId)) {
    return { ok: false, error: "Недопустимая иконка." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_id: avatarId, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("updateProfileAvatar:", error.message);
    return { ok: false, error: "Не удалось сохранить иконку." };
  }

  return { ok: true, avatarId };
}

export async function getSessionUser(
  supabase: SupabaseClient<Database> | null,
): Promise<User | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}
