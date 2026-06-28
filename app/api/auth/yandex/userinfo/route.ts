import { NextResponse } from "next/server";

type YandexProfile = {
  id?: string | number;
  login?: string;
  default_email?: string;
  emails?: string[];
  display_name?: string;
  real_name?: string;
  first_name?: string;
  default_avatar_id?: string;
  is_avatar_empty?: boolean;
};

function yandexAuthHeader(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization) return null;

  if (/^oauth\s+/i.test(authorization)) {
    return authorization;
  }

  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch?.[1]) {
    return `OAuth ${bearerMatch[1]}`;
  }

  return authorization;
}

/** Supabase calls this as userinfo_url; Yandex returns `id`, we expose OIDC-style `sub`. */
export async function GET(request: Request) {
  const authHeader = yandexAuthHeader(request);
  if (!authHeader) {
    return NextResponse.json({ error: "missing authorization" }, { status: 401 });
  }

  const yandexResponse = await fetch("https://login.yandex.ru/info?format=json", {
    headers: { Authorization: authHeader },
    cache: "no-store",
  });

  if (!yandexResponse.ok) {
    return NextResponse.json(
      { error: "yandex userinfo failed", status: yandexResponse.status },
      { status: 502 },
    );
  }

  const profile = (await yandexResponse.json()) as YandexProfile;
  const subject = profile.id != null ? String(profile.id) : null;

  if (!subject) {
    return NextResponse.json({ error: "yandex profile missing id" }, { status: 502 });
  }

  const email = profile.default_email ?? profile.emails?.[0] ?? undefined;

  return NextResponse.json({
    sub: subject,
    id: subject,
    email,
    email_verified: Boolean(email),
    name: profile.display_name ?? profile.real_name ?? profile.first_name ?? profile.login,
    preferred_username: profile.login,
    ...profile,
  });
}
