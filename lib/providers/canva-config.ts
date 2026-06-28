/** Client-safe Canva env check (no next/headers). */
export function isCanvaConfigured(): boolean {
  const clientId = process.env.CANVA_CLIENT_ID?.trim();
  const clientSecret = process.env.CANVA_CLIENT_SECRET?.trim();
  return Boolean(clientId && clientSecret);
}
