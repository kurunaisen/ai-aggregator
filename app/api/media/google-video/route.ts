import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/profile";
import { getGoogleApiKey } from "@/lib/providers/veo";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_HOSTS = [
  "generativelanguage.googleapis.com",
  "storage.googleapis.com",
  "googleapis.com",
];

function isAllowedGoogleVideoUrl(uri: string): boolean {
  try {
    const { hostname } = new URL(uri);
    return ALLOWED_HOSTS.some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
    );
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase не настроен." }, { status: 503 });
  }

  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  }

  const uri = new URL(request.url).searchParams.get("uri");
  if (!uri || !isAllowedGoogleVideoUrl(uri)) {
    return NextResponse.json({ error: "Некорректный URL видео." }, { status: 400 });
  }

  try {
    const upstream = await fetch(uri, {
      headers: { "x-goog-api-key": getGoogleApiKey() },
      redirect: "follow",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Не удалось загрузить видео от Google." },
        { status: 502 },
      );
    }

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "video/mp4",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Ошибка загрузки видео." }, { status: 502 });
  }
}
