"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PurchasablePlan } from "@/lib/payments/plan-products";
import { Button } from "@/components/ui/Button";

type PlanCheckoutButtonProps = {
  plan: PurchasablePlan;
  label: string;
  loggedIn: boolean;
  variant?: "primary" | "ghost" | "outline";
  className?: string;
};

export function PlanCheckoutButton({
  plan,
  label,
  loggedIn,
  variant = "primary",
  className = "",
}: PlanCheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent("/pricing")}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/yookassa/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = (await response.json()) as {
        confirmationUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.confirmationUrl) {
        throw new Error(data.error ?? "Не удалось перейти к оплате");
      }

      window.location.href = data.confirmationUrl;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error ? checkoutError.message : "Ошибка оплаты",
      );
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant={variant}
        className="w-full"
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading ? "Переход к оплате…" : label}
      </Button>
      {error && <p className="mt-2 text-center text-xs text-red-300">{error}</p>}
    </div>
  );
}
