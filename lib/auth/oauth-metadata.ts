import type { User } from "@supabase/supabase-js";

type UserMetadata = Record<string, unknown>;

function asRecord(value: unknown): UserMetadata | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UserMetadata)
    : null;
}

function readString(meta: UserMetadata | null, ...keys: string[]): string | null {
  if (!meta) return null;
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function readCustomClaim(user: User, key: string): string | null {
  const customClaims = asRecord(user.user_metadata?.custom_claims);
  return readString(customClaims, key);
}

/** Email from auth.users or Yandex OAuth metadata (default_email). */
export function getOAuthEmail(user: User): string | null {
  if (user.email?.trim()) return user.email.trim();

  const meta = asRecord(user.user_metadata);
  const fromMeta = readString(meta, "email", "default_email");
  if (fromMeta) return fromMeta;

  const fromClaim = readCustomClaim(user, "default_email");
  if (fromClaim) return fromClaim;

  const emails = meta?.emails;
  if (Array.isArray(emails) && typeof emails[0] === "string" && emails[0].trim()) {
    return emails[0].trim();
  }

  return null;
}

/** Display name from profile metadata or Yandex OAuth fields. */
export function getOAuthDisplayName(user: User): string | null {
  const meta = asRecord(user.user_metadata);

  return (
    readString(meta, "display_name", "name", "full_name", "real_name", "preferred_username", "login") ??
    readCustomClaim(user, "display_name") ??
    readCustomClaim(user, "real_name") ??
    readCustomClaim(user, "first_name") ??
    readCustomClaim(user, "login")
  );
}
