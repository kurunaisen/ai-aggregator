import { randomUUID } from "crypto";
import type { PlanProduct } from "@/lib/payments/plan-products";
import { formatRubAmount } from "@/lib/payments/plan-products";
import { absoluteUrl } from "@/lib/seo/site";

const YOOKASSA_API = "https://api.yookassa.ru/v3";

type YooKassaPaymentResponse = {
  id?: string;
  status?: string;
  confirmation?: {
    type?: string;
    confirmation_url?: string;
  };
  description?: string;
};

export function isYookassaConfigured(): boolean {
  return Boolean(
    process.env.YOOKASSA_SHOP_ID?.trim() && process.env.YOOKASSA_SECRET_KEY?.trim(),
  );
}

function getAuthHeader(): string {
  const shopId = process.env.YOOKASSA_SHOP_ID?.trim();
  const secretKey = process.env.YOOKASSA_SECRET_KEY?.trim();
  if (!shopId || !secretKey) {
    throw new Error("ЮKassa не настроена. Добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY.");
  }
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

export async function createYookassaPayment(
  product: PlanProduct,
  userId: string,
): Promise<{ paymentId: string; confirmationUrl: string }> {
  const body = {
    amount: {
      value: formatRubAmount(product.amountRub),
      currency: "RUB",
    },
    capture: true,
    confirmation: {
      type: "redirect",
      return_url: absoluteUrl(`/pricing?payment=success&plan=${product.plan}`),
    },
    description: product.title,
    metadata: {
      user_id: userId,
      plan: product.plan,
      deai_grant: String(product.deaiGrant),
    },
  };

  const response = await fetch(`${YOOKASSA_API}/payments`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      "Idempotence-Key": randomUUID(),
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as YooKassaPaymentResponse & {
    type?: string;
    description?: string;
  };

  if (!response.ok) {
    const detail = data.description ?? `HTTP ${response.status}`;
    throw new Error(`ЮKassa: ${detail}`);
  }

  const paymentId = data.id;
  const confirmationUrl = data.confirmation?.confirmation_url;

  if (!paymentId || !confirmationUrl) {
    throw new Error("ЮKassa не вернула ссылку на оплату");
  }

  return { paymentId, confirmationUrl };
}

export type YooKassaWebhookPayment = {
  id: string;
  status: string;
  amount?: { value?: string; currency?: string };
  metadata?: Record<string, string>;
};

export type YooKassaWebhookPayload = {
  event?: string;
  object?: YooKassaWebhookPayment;
};

export function parseYookassaWebhookPayload(raw: string): YooKassaWebhookPayload {
  return JSON.parse(raw) as YooKassaWebhookPayload;
}

export async function fetchYookassaPayment(
  paymentId: string,
): Promise<YooKassaWebhookPayment | null> {
  const response = await fetch(`${YOOKASSA_API}/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as YooKassaWebhookPayment;
}
