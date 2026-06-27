import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { FREE_DAILY_LIMIT, type Plan } from "@/lib/subscription/constants";

export type UsageSummary = {
  plan: Plan;
  usedToday: number;
  dailyLimit: number | null;
  remaining: number | null;
};

function startOfUtcDay(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

export async function getUsageSummary(
  supabase: SupabaseClient<Database>,
  userId: string,
  plan: Plan,
): Promise<UsageSummary> {
  const since = startOfUtcDay();

  const { count, error } = await supabase
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error) {
    console.error("getUsageSummary:", error.message);
  }

  const usedToday = count ?? 0;

  if (plan === "pro") {
    return {
      plan,
      usedToday,
      dailyLimit: null,
      remaining: null,
    };
  }

  return {
    plan,
    usedToday,
    dailyLimit: FREE_DAILY_LIMIT,
    remaining: Math.max(0, FREE_DAILY_LIMIT - usedToday),
  };
}

export function isLimitReached(summary: UsageSummary): boolean {
  if (summary.plan === "pro") return false;
  return summary.usedToday >= FREE_DAILY_LIMIT;
}

export async function recordUsage(
  supabase: SupabaseClient<Database>,
  userId: string,
  toolSlug: string,
  requestType: "chat" | "video",
): Promise<void> {
  const { error } = await supabase.from("usage_logs").insert({
    user_id: userId,
    tool_slug: toolSlug,
    request_type: requestType,
  });

  if (error) {
    console.error("recordUsage:", error.message);
  }
}
