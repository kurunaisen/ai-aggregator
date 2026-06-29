import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getPlanProduct } from "@/lib/payments/plan-products";
import type { YooKassaWebhookPayment } from "@/lib/payments/yookassa";
import { grantDeai } from "@/lib/subscription/deai";

export async function fulfillYookassaPayment(
  admin: SupabaseClient<Database>,
  payment: YooKassaWebhookPayment,
): Promise<{ ok: true; alreadyProcessed: boolean } | { ok: false; error: string }> {
  const paymentId = payment.id;
  const planSlug = payment.metadata?.plan;
  const userId = payment.metadata?.user_id;

  if (!paymentId || !planSlug || !userId) {
    return { ok: false, error: "missing_metadata" };
  }

  const product = getPlanProduct(planSlug);
  if (!product) {
    return { ok: false, error: "invalid_plan" };
  }

  if (payment.status !== "succeeded") {
    return { ok: false, error: "not_succeeded" };
  }

  const paidValue = Number(payment.amount?.value ?? 0);
  if (Math.abs(paidValue - product.amountRub) > 0.01) {
    return { ok: false, error: "amount_mismatch" };
  }

  const { data: existing } = await admin
    .from("payment_orders")
    .select("status")
    .eq("external_id", paymentId)
    .maybeSingle();

  if (existing?.status === "succeeded") {
    return { ok: true, alreadyProcessed: true };
  }

  if (existing) {
    const { error: updateError } = await admin
      .from("payment_orders")
      .update({
        status: "succeeded",
        paid_at: new Date().toISOString(),
      })
      .eq("external_id", paymentId)
      .eq("status", "pending");

    if (updateError) {
      return { ok: false, error: updateError.message };
    }
  } else {
    const { error: insertError } = await admin.from("payment_orders").insert({
      user_id: userId,
      provider: "yookassa",
      external_id: paymentId,
      plan: product.plan,
      amount_rub: product.amountRub,
      deai_grant: product.deaiGrant,
      status: "succeeded",
      paid_at: new Date().toISOString(),
    });

    if (insertError) {
      return { ok: false, error: insertError.message };
    }
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      plan: product.plan,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  const balance = await grantDeai(admin, userId, product.deaiGrant);
  if (balance === null) {
    return { ok: false, error: "grant_deai_failed" };
  }

  return { ok: true, alreadyProcessed: false };
}
