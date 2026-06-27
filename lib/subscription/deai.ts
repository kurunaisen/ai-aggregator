import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { FREE_STARTING_DEAI } from "@/lib/subscription/deai-cost";
import type { Plan } from "@/lib/subscription/constants";

export type DeaiSummary = {
  plan: Plan;
  balance: number;
  unlimited: boolean;
};

export async function getDeaiSummary(
  supabase: SupabaseClient<Database>,
  userId: string,
  plan: Plan,
): Promise<DeaiSummary> {
  const { data, error } = await supabase
    .from("profiles")
    .select("deai_balance")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("getDeaiSummary:", error.message);
  }

  const balance = Number(data?.deai_balance ?? FREE_STARTING_DEAI);

  return {
    plan,
    balance: plan === "pro" ? balance : Math.max(0, balance),
    unlimited: plan === "pro",
  };
}

export function canAffordDeai(summary: DeaiSummary, cost: number): boolean {
  if (summary.unlimited) return true;
  return summary.balance >= cost;
}

export function getInsufficientDeaiMessage(cost: number): string {
  return `Недостаточно Deai (нужно ${cost}). Оформите Pro за 990 ₽/мес.`;
}

export async function deductDeai(
  supabase: SupabaseClient<Database>,
  userId: string,
  cost: number,
  plan: Plan,
): Promise<{ success: boolean; balance: number }> {
  if (plan === "pro") {
    const summary = await getDeaiSummary(supabase, userId, plan);
    return { success: true, balance: summary.balance };
  }

  const { data, error } = await supabase.rpc("deduct_deai", { p_amount: cost });

  if (!error && data !== null) {
    return { success: true, balance: Number(data) };
  }

  if (error && !error.message.includes("insufficient_deai")) {
    console.error("deductDeai rpc:", error.message);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("deai_balance")
    .eq("id", userId)
    .single();

  const current = Number(profile?.deai_balance ?? 0);
  if (current < cost) {
    return { success: false, balance: current };
  }

  const newBalance = Math.round((current - cost) * 10) / 10;
  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({ deai_balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .gte("deai_balance", cost)
    .select("deai_balance")
    .maybeSingle();

  if (updateError || !updated) {
    return { success: false, balance: current };
  }

  return { success: true, balance: Number(updated.deai_balance) };
}

export async function recordDeaiUsage(
  supabase: SupabaseClient<Database>,
  userId: string,
  toolSlug: string,
  requestType: "chat" | "video" | "image",
  deaiCost: number,
  model: string,
): Promise<void> {
  const { error } = await supabase.from("usage_logs").insert({
    user_id: userId,
    tool_slug: toolSlug,
    request_type: requestType,
    deai_cost: deaiCost,
    model,
  });

  if (error) {
    console.error("recordDeaiUsage:", error.message);
  }
}
