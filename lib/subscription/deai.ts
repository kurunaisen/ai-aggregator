import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { FREE_STARTING_DEAI } from "@/lib/subscription/deai-cost";
import type { Plan } from "@/lib/subscription/constants";
import {
  BASE_DEAI_GRANT_LABEL,
  BASE_PRICE_LABEL,
  PRO_DEAI_GRANT_LABEL,
  PRO_PRICE_LABEL,
  getBaseMonthlyDeai,
  getProMonthlyDeai,
} from "@/lib/subscription/constants";
import { getMonthlyDeaiGrant } from "@/lib/subscription/plans";

export type DeaiSummary = {
  plan: Plan;
  balance: number;
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
    balance: Math.max(0, balance),
  };
}

export function canAffordDeai(summary: DeaiSummary, cost: number): boolean {
  return summary.balance >= cost;
}

export function getInsufficientDeaiMessage(cost: number): string {
  return (
    `Недостаточно Deai (нужно ${cost}). ` +
    `Base — ${BASE_DEAI_GRANT_LABEL} за ${BASE_PRICE_LABEL}, ` +
    `Pro — ${PRO_DEAI_GRANT_LABEL} за ${PRO_PRICE_LABEL}.`
  );
}

export async function deductDeai(
  supabase: SupabaseClient<Database>,
  userId: string,
  cost: number,
): Promise<{ success: boolean; balance: number }> {
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

/** Начисление Deai (webhook оплаты подписки) */
export async function grantDeai(
  supabase: SupabaseClient<Database>,
  userId: string,
  amount: number,
): Promise<number | null> {
  const { data, error } = await supabase.rpc("add_deai", {
    p_amount: amount,
    p_user_id: userId,
  });

  if (!error && data !== null) {
    return Number(data);
  }

  if (error) {
    console.error("grantDeai rpc:", error.message);
  }

  return null;
}

export async function grantPlanMonthlyDeai(
  supabase: SupabaseClient<Database>,
  userId: string,
  plan: Exclude<Plan, "free">,
): Promise<number | null> {
  return grantDeai(supabase, userId, getMonthlyDeaiGrant(plan));
}

export async function grantBaseMonthlyDeai(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number | null> {
  return grantDeai(supabase, userId, getBaseMonthlyDeai());
}

export async function grantProMonthlyDeai(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number | null> {
  return grantDeai(supabase, userId, getProMonthlyDeai());
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
