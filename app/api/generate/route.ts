import { NextResponse } from "next/server";
import { ensureProfile, getSessionUser, type Profile } from "@/lib/auth/profile";
import {
  callAnthropic,
  callOpenAI,
  pollRunwayTask,
  startRunwayVideo,
} from "@/lib/providers/ai";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  getUsageSummary,
  isLimitReached,
  recordUsage,
  type UsageSummary,
} from "@/lib/subscription/usage";
import { getEmbedConfig } from "@/lib/tools/embed";
import type { ChatEmbedConfig, VideoEmbedConfig } from "@/data/embed-tools";
import type { SupabaseClient } from "@supabase/supabase-js";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 4000;
const MAX_PROMPT_LENGTH = 1000;

type AuthContext = {
  supabase: SupabaseClient<Database>;
  user: { id: string };
  profile: Profile;
  usage: UsageSummary;
};

async function requireAuthAndLimit(
  skipLimit = false,
): Promise<AuthContext | NextResponse> {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase не настроен." }, { status: 503 });
  }

  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json(
      {
        error: "Войдите в аккаунт, чтобы использовать инструменты.",
        code: "AUTH_REQUIRED",
      },
      { status: 401 },
    );
  }

  const profile = await ensureProfile(supabase, user);
  const usage = await getUsageSummary(supabase, user.id, profile.plan);

  if (!skipLimit && isLimitReached(usage)) {
    return NextResponse.json(
      {
        error: "Дневной лимит исчерпан. Оформите Pro за 990 ₽/мес.",
        code: "LIMIT_REACHED",
        usage,
      },
      { status: 429 },
    );
  }

  return { supabase, user, profile, usage };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const { slug, messages, prompt, action, taskId } = body as {
    slug?: string;
    messages?: ChatMessage[];
    prompt?: string;
    action?: string;
    taskId?: string;
  };

  if (!slug) {
    return NextResponse.json({ error: "Не указан инструмент." }, { status: 400 });
  }

  const embed = getEmbedConfig(slug);
  if (!embed) {
    return NextResponse.json({ error: "Инструмент недоступен." }, { status: 403 });
  }

  if (action === "poll" && embed.type === "video") {
    const auth = await requireAuthAndLimit(true);
    if (auth instanceof NextResponse) return auth;

    if (!taskId) {
      return NextResponse.json({ error: "Не указан taskId." }, { status: 400 });
    }

    try {
      const result = await pollRunwayTask(taskId);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Ошибка Runway" },
        { status: 502 },
      );
    }
  }

  const auth = await requireAuthAndLimit();
  if (auth instanceof NextResponse) return auth;

  const { supabase, user, profile } = auth;

  try {
    if (embed.type === "chat") {
      if (!Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json({ error: "Сообщения не переданы." }, { status: 400 });
      }

      if (messages.length > MAX_MESSAGES) {
        return NextResponse.json({ error: `Макс. ${MAX_MESSAGES} сообщений.` }, { status: 400 });
      }

      for (const message of messages) {
        if (
          !message ||
          (message.role !== "user" && message.role !== "assistant") ||
          typeof message.content !== "string" ||
          !message.content.trim() ||
          message.content.length > MAX_CONTENT_LENGTH
        ) {
          return NextResponse.json({ error: "Некорректные сообщения." }, { status: 400 });
        }
      }

      const chatConfig = embed as ChatEmbedConfig;
      const reply =
        chatConfig.provider === "anthropic"
          ? await callAnthropic(chatConfig, messages)
          : await callOpenAI(chatConfig, messages);

      await recordUsage(supabase, user.id, slug, "chat");
      const usage = await getUsageSummary(supabase, user.id, profile.plan);

      return NextResponse.json({ reply, usage });
    }

    if (embed.type === "video") {
      if (!prompt?.trim()) {
        return NextResponse.json({ error: "Опишите сцену для видео." }, { status: 400 });
      }

      if (prompt.length > MAX_PROMPT_LENGTH) {
        return NextResponse.json({ error: `Макс. ${MAX_PROMPT_LENGTH} символов.` }, { status: 400 });
      }

      const videoConfig = embed as VideoEmbedConfig;
      const runwayTaskId = await startRunwayVideo(
        prompt,
        videoConfig.model,
        videoConfig.duration ?? 5,
        videoConfig.ratio ?? "16:9",
      );

      await recordUsage(supabase, user.id, slug, "video");
      const usage = await getUsageSummary(supabase, user.id, profile.plan);

      return NextResponse.json({ taskId: runwayTaskId, status: "PENDING", usage });
    }

    return NextResponse.json({ error: "Неподдерживаемый тип." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ошибка генерации" },
      { status: 502 },
    );
  }
}
