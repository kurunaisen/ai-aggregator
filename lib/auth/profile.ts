import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { Plan } from "@/lib/subscription/constants";

export type Profile = {
  id: string;
  email: string | null;
  plan: Plan;
};

export async function getProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, plan")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("getProfile:", error.message);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    plan: data.plan as Plan,
  };
}

export async function ensureProfile(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<Profile> {
  const existing = await getProfile(supabase, user.id);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      plan: "free",
    })
    .select("id, email, plan")
    .single();

  if (error || !data) {
    return {
      id: user.id,
      email: user.email ?? null,
      plan: "free",
    };
  }

  return {
    id: data.id,
    email: data.email,
    plan: data.plan as Plan,
  };
}

export async function getSessionUser(
  supabase: SupabaseClient<Database> | null,
): Promise<User | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}
