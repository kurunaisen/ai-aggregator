import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/profile";
import { getPlanProduct } from "@/lib/payments/plan-products";
import { createYookassaPayment, isYookassaConfigured } from "@/lib/payments/yookassa";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CreatePaymentBody = {
  plan?: string;
};

export async function POST(request: Request) {
  if (!isYookassaConfigured()) {
    return NextResponse.json(
      { error: "Оплата временно недоступна. ЮKassa не настроена на сервере." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase не настроен" }, { status: 503 });
  }

  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Войдите в аккаунт для оплаты" }, { status: 401 });
  }

  let body: CreatePaymentBody;
  try {
    body = (await request.json()) as CreatePaymentBody;
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const product = getPlanProduct(body.plan ?? "");
  if (!product) {
    return NextResponse.json({ error: "Неизвестный тариф" }, { status: 400 });
  }

  try {
    const { paymentId, confirmationUrl } = await createYookassaPayment(product, user.id);

    const admin = createAdminClient();
    if (admin) {
      const { error } = await admin.from("payment_orders").insert({
        user_id: user.id,
        provider: "yookassa",
        external_id: paymentId,
        plan: product.plan,
        amount_rub: product.amountRub,
        deai_grant: product.deaiGrant,
        status: "pending",
      });

      if (error) {
        console.error("payment_orders insert:", error.message);
      }
    }

    return NextResponse.json({ confirmationUrl, paymentId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось создать платёж";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
