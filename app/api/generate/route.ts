import { NextResponse } from "next/server";
import { ensureProfile, getSessionUser, type Profile } from "@/lib/auth/profile";
import {
  callAnthropic,
} from "@/lib/providers/ai";
import { pollVideoGeneration, startVideoGeneration } from "@/lib/providers/video";
import {
  validateVeoGenerationRequest,
  validateVeoPrompt,
} from "@/lib/providers/validate-veo-options";
import type { VeoGenerationRequest } from "@/data/veo-options";
import { callOpenAI } from "@/lib/providers/openai-chat";
import { validateOpenAIOptions } from "@/lib/providers/validate-openai-options";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  calculateTextDeaiCost,
  calculateVideoDeaiCost,
} from "@/lib/subscription/deai-cost";
import {
  canAffordDeai,
  deductDeai,
  getDeaiSummary,
  getInsufficientDeaiMessage,
  recordDeaiUsage,
  type DeaiSummary,
} from "@/lib/subscription/deai";
import { getEmbedConfig } from "@/lib/tools/embed";
import { getToolBySlug } from "@/lib/tools/queries";
import type { ChatEmbedConfig, CodeEmbedConfig, VideoEmbedConfig } from "@/data/embed-tools";
import type { SupabaseClient } from "@supabase/supabase-js";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 4000;
const MAX_PROMPT_LENGTH = 1000;

const MAX_EDITOR_CODE = 30000;

const EMBED_TOOL_TYPES: Record<string, string> = {
  chatgpt: "text",
  claude: "text",
  monaco: "text",
  cursor: "text",
  runway: "video",
  veo: "video",
};

type AuthContext = {
  supabase: SupabaseClient<Database>;
  user: { id: string };
  profile: Profile;
  deai: DeaiSummary;
};

async function resolveToolMeta(slug: string) {
  const tool = await getToolBySlug(slug);
  return {
    toolType: tool?.toolType ?? EMBED_TOOL_TYPES[slug] ?? "text",
    toolName: tool?.name,
  };
}

function totalMessageChars(messages: ChatMessage[]): number {
  return messages.reduce((sum, message) => sum + message.content.length, 0);
}

async function requireAuth(
  cost: number,
  skipCheck = false,
): Promise<(AuthContext & { blocked?: never }) | NextResponse> {
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
  const deai = await getDeaiSummary(supabase, user.id, profile.plan);

  if (!skipCheck && !canAffordDeai(deai, cost)) {
    return NextResponse.json(
      {
        error: getInsufficientDeaiMessage(cost),
        code: "INSUFFICIENT_DEAI",
        deai,
        deaiCost: cost,
      },
      { status: 429 },
    );
  }

  return { supabase, user, profile, deai };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const { slug, messages, prompt, action, taskId, openai, video, editorCode, language } =
    body as {
    slug?: string;
    messages?: ChatMessage[];
    prompt?: string;
    action?: string;
    taskId?: string;
    editorCode?: string;
    language?: string;
    openai?: {
      model?: string;
      responseFormat?: "text" | "json_object" | "json_schema";
      reasoningEffort?: "low" | "medium" | "high";
      jsonSchema?: string;
    };
    video?: {
      duration?: number;
      quality?: "1k" | "2k" | "4k";
      veo?: VeoGenerationRequest;
    };
  };

  const usageSlug = slug === "cursor" ? "monaco" : slug!;

  if (!slug) {
    return NextResponse.json({ error: "Не указан инструмент." }, { status: 400 });
  }

  const embed = getEmbedConfig(slug);
  if (!embed) {
    return NextResponse.json({ error: "Инструмент недоступен." }, { status: 403 });
  }

  await resolveToolMeta(slug);

  if (action === "poll" && embed.type === "video") {
    const auth = await requireAuth(0, true);
    if (auth instanceof NextResponse) return auth;

    if (!taskId) {
      return NextResponse.json({ error: "Не указан taskId." }, { status: 400 });
    }

    try {
      const result = await pollVideoGeneration(embed as VideoEmbedConfig, taskId);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Ошибка опроса статуса" },
        { status: 502 },
      );
    }
  }

  try {
    if (embed.type === "chat" || embed.type === "code") {
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

      const chatConfig = embed as ChatEmbedConfig | CodeEmbedConfig;
      const codeSnapshot =
        embed.type === "code" && typeof editorCode === "string" ? editorCode : "";
      const codeLanguage =
        embed.type === "code"
          ? language ?? (embed as CodeEmbedConfig).defaultLanguage
          : undefined;

      if (codeSnapshot.length > MAX_EDITOR_CODE) {
        return NextResponse.json(
          { error: `Код в редакторе: макс. ${MAX_EDITOR_CODE} символов.` },
          { status: 400 },
        );
      }

      let apiMessages = messages;
      if (embed.type === "code" && codeSnapshot.trim()) {
        const lastIndex = messages.length - 1;
        const last = messages[lastIndex];
        if (last?.role === "user") {
          apiMessages = [
            ...messages.slice(0, lastIndex),
            {
              role: "user",
              content: `${last.content}\n\nТекущий код редактора (${codeLanguage}):\n\`\`\`${codeLanguage}\n${codeSnapshot}\n\`\`\``,
            },
          ];
        }
      }

      const chars = totalMessageChars(messages) + codeSnapshot.length;

      let model = chatConfig.model;
      let reasoningEffort: "low" | "medium" | "high" | undefined;

      if (chatConfig.provider === "openai") {
        const prevalidated = validateOpenAIOptions(openai);
        if (typeof prevalidated === "string") {
          return NextResponse.json({ error: prevalidated }, { status: 400 });
        }
        model = prevalidated.model;
        reasoningEffort = prevalidated.reasoningEffort;
      }

      const deaiCost = calculateTextDeaiCost({
        model,
        totalChars: chars,
        reasoningEffort,
      });

      const auth = await requireAuth(deaiCost);
      if (auth instanceof NextResponse) return auth;

      const { supabase, user, profile } = auth;

      let reply: string;

      if (chatConfig.provider === "anthropic") {
        reply = await callAnthropic(chatConfig as ChatEmbedConfig, apiMessages);
      } else {
        const validated = validateOpenAIOptions(openai);
        if (typeof validated === "string") {
          return NextResponse.json({ error: validated }, { status: 400 });
        }
        const { parsedSchema, ...openaiOptions } = validated;
        reply = await callOpenAI(
          chatConfig as ChatEmbedConfig,
          apiMessages,
          openaiOptions,
          parsedSchema,
        );
      }

      const deducted = await deductDeai(supabase, user.id, deaiCost, profile.plan);
      if (!deducted.success) {
        return NextResponse.json(
          { error: getInsufficientDeaiMessage(deaiCost), code: "INSUFFICIENT_DEAI" },
          { status: 429 },
        );
      }

      await recordDeaiUsage(supabase, user.id, usageSlug, "chat", deaiCost, model);
      const deai = await getDeaiSummary(supabase, user.id, profile.plan);

      return NextResponse.json({ reply, deai, deaiCost });
    }

    if (embed.type === "video") {
      const promptError = validateVeoPrompt(prompt ?? "");
      if (promptError && (embed as VideoEmbedConfig).provider === "google-veo") {
        return NextResponse.json({ error: promptError }, { status: 400 });
      }

      if (!prompt?.trim()) {
        return NextResponse.json({ error: "Опишите сцену для видео." }, { status: 400 });
      }

      if (prompt.length > MAX_PROMPT_LENGTH) {
        return NextResponse.json({ error: `Макс. ${MAX_PROMPT_LENGTH} символов.` }, { status: 400 });
      }

      const videoConfig = embed as VideoEmbedConfig;
      const duration = video?.duration ?? videoConfig.duration ?? 5;
      const quality = video?.quality ?? "1k";

      let veoOptions: VeoGenerationRequest | undefined;
      if (videoConfig.provider === "google-veo") {
        const validated = validateVeoGenerationRequest(prompt, video?.veo);
        if (typeof validated === "string") {
          return NextResponse.json({ error: validated }, { status: 400 });
        }
        veoOptions = validated;
      }

      const deaiCost = calculateVideoDeaiCost({
        model: veoOptions?.model ?? videoConfig.model,
        duration: veoOptions?.durationSeconds ?? duration,
        quality: veoOptions
          ? veoOptions.resolution === "4k"
            ? "4k"
            : veoOptions.resolution === "1080p"
              ? "2k"
              : "1k"
          : quality,
      });

      const auth = await requireAuth(deaiCost);
      if (auth instanceof NextResponse) return auth;

      const { supabase, user, profile } = auth;

      const taskId = await startVideoGeneration(
        videoConfig,
        prompt,
        duration,
        videoConfig.ratio ?? "16:9",
        veoOptions,
      );

      const deducted = await deductDeai(supabase, user.id, deaiCost, profile.plan);
      if (!deducted.success) {
        return NextResponse.json(
          { error: getInsufficientDeaiMessage(deaiCost), code: "INSUFFICIENT_DEAI" },
          { status: 429 },
        );
      }

      await recordDeaiUsage(
        supabase,
        user.id,
        slug,
        "video",
        deaiCost,
        veoOptions?.model ?? videoConfig.model,
      );
      const deai = await getDeaiSummary(supabase, user.id, profile.plan);

      return NextResponse.json({ taskId, status: "PENDING", deai, deaiCost });
    }

    return NextResponse.json({ error: "Неподдерживаемый тип." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ошибка генерации" },
      { status: 502 },
    );
  }
}
