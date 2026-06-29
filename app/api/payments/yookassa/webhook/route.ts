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

  let verifiedPayment = payment;
  const fetched = await fetchYookassaPayment(payment.id);
  if (fetched?.status === "succeeded") {
    verifiedPayment = fetched;
  }

  const result = await fulfillYookassaPayment(admin, verifiedPayment);

  if (!result.ok) {
    console.error("fulfillYookassaPayment:", result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, alreadyProcessed: result.alreadyProcessed });
}
