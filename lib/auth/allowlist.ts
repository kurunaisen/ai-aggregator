const DEFAULT_ALLOWED_AUTH_EMAILS = ["ruslansusla93@gmail.com"];

export const AUTH_CLOSED_MESSAGE =
  "Регистрация и вход временно закрыты. Сайт доступен только для приглашённых пользователей.";

function parseEmailList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

/** Список email, которым разрешены регистрация и вход. */
export function getAllowedAuthEmails(): string[] {
  const fromEnv = parseEmailList(
    process.env.AUTH_ALLOWED_EMAILS ?? process.env.NEXT_PUBLIC_AUTH_ALLOWED_EMAILS,
  );
  return fromEnv.length > 0 ? fromEnv : DEFAULT_ALLOWED_AUTH_EMAILS;
}

export function isAuthEmailAllowed(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  return getAllowedAuthEmails().includes(email.trim().toLowerCase());
}
