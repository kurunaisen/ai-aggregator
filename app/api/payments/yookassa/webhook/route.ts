import { NextResponse } from "next/server";
import { fulfillYookassaPayment } from "@/lib/payments/fulfill-order";
import {
  fetchYookassaPayment,
  parseYookassaWebhookPayload,
  isYookassaConfigured,
} from "@/lib/payments/yookassa";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isYookassaConfigured()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "admin client missing" }, { status: 503 });
  }

  const raw = await request.text();

  let payload;
  try {
    payload = parseYookassaWebhookPayload(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const event = payload.event;
  const payment = payload.object;

  if (!event || !payment?.id) {
    return NextResponse.json({ ok: true });
  }

  if (event === "payment.canceled") {
    await admin
      .from("payment_orders")
      .update({ status: "canceled" })
      .eq("external_id", payment.id)
      .eq("status", "pending");
    return NextResponse.json({ ok: true });
  }

  if (event !== "payment.succeeded") {
    return NextResponse.json({ ok: true });
  }

  const fetched = await fetchYookassaPayment(payment.id);
  if (!fetched || fetched.status !== "succeeded") {
    console.error("yookassa webhook: payment verification failed", payment.id);
    return NextResponse.json({ error: "verification_failed" }, { status: 400 });
  }

  const result = await fulfillYookassaPayment(admin, fetched);

  if (!result.ok) {
    console.error("fulfillYookassaPayment:", result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, alreadyProcessed: result.alreadyProcessed });
}
