/** 1 Deai = 1 ₽ = 0.012977 USD */
export const DEAI_USD = 0.012977;

export const DEAI_RUB = 1;

/** Наценка платформы поверх API-себестоимости */
export const DEAI_PLATFORM_MARKUP = 1.2;

export type TokenRatesUsd = {
  inputPerMTok: number;
  outputPerMTok: number;
};

/** Официальные/рыночные API-тарифы (USD за 1M токенов), июнь 2026 */
export function getTextModelRatesUsd(model: string): TokenRatesUsd {
  const id = model.toLowerCase();

  if (id.includes("4.1-nano") || (id.includes("nano") && !id.includes("mini"))) {
    return { inputPerMTok: 0.1, outputPerMTok: 0.4 };
  }

  if (id.includes("4o-mini")) {
    return { inputPerMTok: 0.15, outputPerMTok: 0.6 };
  }

  if (id.includes("4.1-mini")) {
    return { inputPerMTok: 0.4, outputPerMTok: 1.6 };
  }

  if (id.includes("haiku")) {
    return { inputPerMTok: 0.8, outputPerMTok: 4.0 };
  }

  if (
    id.includes("5-mini") ||
    id.includes("5-nano") ||
    id.includes("o3-mini") ||
    id.includes("o4-mini") ||
    id.includes("o1-mini")
  ) {
    return { inputPerMTok: 1.1, outputPerMTok: 4.4 };
  }

  if (id.includes("4.1") && !id.includes("mini") && !id.includes("nano")) {
    return { inputPerMTok: 2.0, outputPerMTok: 8.0 };
  }

  if (id.includes("4o") && !id.includes("mini")) {
    return { inputPerMTok: 2.5, outputPerMTok: 10.0 };
  }

  if (
    id.includes("gpt-5") ||
    id.includes("o3") ||
    id.includes("o1") ||
    id.includes("sonnet")
  ) {
    return { inputPerMTok: 15.0, outputPerMTok: 60.0 };
  }

  return { inputPerMTok: 2.0, outputPerMTok: 8.0 };
}

/** USD за секунду видео (Gemini API / Runway, с аудио где указано) */
export function getVideoUsdPerSecond(model: string, quality: "1k" | "2k" | "4k"): number {
  const id = model.toLowerCase();

  if (id.includes("veo-3.1-lite") || id.includes("lite-generate")) {
    if (quality === "4k") return 0.08;
    if (quality === "2k") return 0.08;
    return 0.05;
  }

  if (id.includes("fast")) {
    if (quality === "4k") return 0.3;
    if (quality === "2k") return 0.12;
    return 0.1;
  }

  if (id.includes("veo")) {
    if (quality === "4k") return 0.6;
    return 0.4;
  }

  if (id.includes("gen4") || id.includes("gen-4")) {
    return 0.08;
  }

  if (id.includes("gen3") || id.includes("turbo")) {
    return 0.05;
  }

  return 0.05;
}

/** Базовая цена одного изображения ~1024px (USD) */
export function getImageBaseUsd(model: string, quality: "1k" | "2k" | "4k"): number {
  let usd = 0.04;

  if (/pro|ultra|large|v[56]/i.test(model)) usd *= 1.35;
  else if (/hd|quality|plus|flux/i.test(model)) usd *= 1.15;

  if (quality === "2k") usd *= 1.5;
  if (quality === "4k") usd *= 2.2;

  return usd;
}

export function usdToDeai(usd: number): number {
  return (usd * DEAI_PLATFORM_MARKUP) / DEAI_USD;
}
