import { NextResponse } from "next/server";
import { ensureProfile, getSessionUser, type Profile } from "@/lib/auth/profile";
import { callClaude } from "@/lib/providers/claude-chat";
import { pollImageGeneration, startImageGeneration } from "@/lib/providers/image";
import { pollVideoGeneration, startVideoGeneration } from "@/lib/providers/video";
import {
  validateVeoGenerationRequest,
  validateVeoPrompt,
} from "@/lib/providers/validate-veo-options";
import type { VeoGenerationRequest } from "@/data/veo-options";
import type {
  FluxGenerationRequest,
  GrokImagineGenerationRequest,
  NanobananaGenerationRequest,
} from "@/data/image-options";
import { validateGrokImagineOptions } from "@/lib/providers/validate-grok-imagine-options";
import { validateImagePrompt } from "@/data/image-options";
import {
  validateKlingGenerationRequest,
  validateKlingPrompt,
} from "@/data/kling-options";
import type { KlingGenerationRequest } from "@/data/kling-options";
import {
  validateGrokVideoGenerationRequest,
  validateGrokVideoPrompt,
} from "@/data/grok-video-options";
import type { GrokVideoGenerationRequest } from "@/data/grok-video-options";
import type { RunwayGenerationRequest } from "@/data/runway-options";
import { validateRunwayGenerationRequest } from "@/lib/providers/validate-runway-options";
import { callOpenAI } from "@/lib/providers/openai-chat";
import { callXai } from "@/lib/providers/xai-chat";
import { validateClaudeOptions } from "@/lib/providers/validate-claude-options";
import { validateOpenAIOptions } from "@/lib/providers/validate-openai-options";
import type { ClaudeChatMessage, ClaudeChatRequestOptions } from "@/data/claude-models";
import {
  estimateAttachmentChars,
  validateClaudeAttachments,
} from "@/lib/chat/claude-attachments";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  calculateImageDeaiCost,
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
import { getToolAccessStatus } from "@/lib/subscription/tool-access";
import type {
  ChatEmbedConfig,
  CodeEmbedConfig,
  ImageEmbedConfig,
  VideoEmbedConfig,
} from "@/data/embed-tools";
import type { SupabaseClient } from "@supabase/supabase-js";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  attachments?: ClaudeChatMessage["attachments"];
};

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 4000;
const MAX_PROMPT_LENGTH = 1000;

const MAX_EDITOR_CODE = 30000;

const EMBED_TOOL_TYPES: Record<string, string> = {
  chatgpt: "text",
  claude: "text",
  grok: "text",
  "grok-imagine": "image",
  monaco: "text",
  cursor: "text",
  nanobanana: "image",
  flux: "image",
  runway: "video",
  veo: "video",
  kling: "video",
  "grok-video": "video",
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
  return messages.reduce((sum, message) => {
    const attachmentChars = estimateAttachmentChars(message.attachments?.length ?? 0);
    return sum + message.content.length + attachmentChars;
  }, 0);
}

function validateChatMessages(
  messages: ChatMessage[],
  options: { allowAttachments: boolean },
): string | null {
  if (messages.length > MAX_MESSAGES) {
    return `Макс. ${MAX_MESSAGES} сообщений.`;
  }

  for (const message of messages) {
    if (
      !message ||
      (message.role !== "user" && message.role !== "assistant") ||
      typeof message.content !== "string" ||
      message.content.length > MAX_CONTENT_LENGTH
    ) {
      return "Некорректные сообщения.";
    }

    if (message.role === "assistant" && message.attachments?.length) {
      return "Вложения поддерживаются только в сообщениях пользователя.";
    }

    if (message.attachments?.length) {
      if (!options.allowAttachments) {
        return "Вложения недоступны для этого инструмента.";
      }

      const validated = validateClaudeAttachments(message.attachments);
      if (!Array.isArray(validated)) {
        return validated.error;
      }
    }

    if (message.role === "user") {
      const hasText = message.content.trim().length > 0;
      const hasAttachments = (message.attachments?.length ?? 0) > 0;
      if (!hasText && !hasAttachments) {
        return "Сообщение пользователя пустое.";
      }
    } else if (!message.content.trim()) {
      return "Некорректные сообщения.";
    }
  }

  return null;
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

  const { slug, messages, prompt, action, taskId, openai, claude, video, image, editorCode, language } =
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
    claude?: Partial<ClaudeChatRequestOptions>;
    video?: {
      duration?: number;
      quality?: "1k" | "2k" | "4k";
      veo?: VeoGenerationRequest;
      kling?: KlingGenerationRequest;
      runway?: RunwayGenerationRequest;
      grok?: GrokVideoGenerationRequest;
    };
    image?: {
      quality?: "1k" | "2k" | "4k";
      nanobanana?: NanobananaGenerationRequest;
      flux?: FluxGenerationRequest;
      grokImagine?: GrokImagineGenerationRequest;
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

  if (action === "poll" && embed.type === "image") {
    const auth = await requireAuth(0, true);
    if (auth instanceof NextResponse) return auth;

    if (!taskId) {
      return NextResponse.json({ error: "Не указан taskId." }, { status: 400 });
    }

    try {
      const result = await pollImageGeneration(embed as ImageEmbedConfig, taskId);
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

      const chatConfig = embed as ChatEmbedConfig | CodeEmbedConfig;
      const allowAttachments =
        embed.type === "chat" && chatConfig.provider === "anthropic";

      const messagesError = validateChatMessages(messages, { allowAttachments });
      if (messagesError) {
        return NextResponse.json({ error: messagesError }, { status: 400 });
      }

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

      if (chatConfig.provider === "anthropic") {
        const validatedClaude = validateClaudeOptions(claude);
        if (typeof validatedClaude === "string") {
          return NextResponse.json({ error: validatedClaude }, { status: 400 });
        }
        model = validatedClaude.model;
      } else if (chatConfig.provider === "openai") {
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
        reply = await callClaude(
          chatConfig as ChatEmbedConfig,
          model,
          apiMessages as ClaudeChatMessage[],
        );
      } else if (chatConfig.provider === "xai") {
        reply = await callXai(chatConfig as ChatEmbedConfig, apiMessages);
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

      const deducted = await deductDeai(supabase, user.id, deaiCost);
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

    if (embed.type === "image") {
      const promptError = validateImagePrompt(prompt ?? "");
      if (promptError) {
        return NextResponse.json({ error: promptError }, { status: 400 });
      }

      const imageConfig = embed as ImageEmbedConfig;
      const quality = image?.quality ?? "1k";

      let imageModel = imageConfig.model;
      let generationOptions:
        | NanobananaGenerationRequest
        | FluxGenerationRequest
        | GrokImagineGenerationRequest;
      let billingQuality: "1k" | "2k" | "4k" = quality;

      if (imageConfig.provider === "google-imagen") {
        generationOptions = {
          model: image?.nanobanana?.model ?? (imageConfig.model as NanobananaGenerationRequest["model"]),
          quality,
          aspectRatio: image?.nanobanana?.aspectRatio ?? "1:1",
        };
        imageModel = generationOptions.model;
      } else if (imageConfig.provider === "xai-imagine") {
        const validatedGrokImagine = validateGrokImagineOptions(image?.grokImagine);
        if (typeof validatedGrokImagine === "string") {
          return NextResponse.json({ error: validatedGrokImagine }, { status: 400 });
        }
        generationOptions = validatedGrokImagine;
        imageModel = generationOptions.model;
        billingQuality = generationOptions.resolution;
      } else {
        generationOptions = {
          model: image?.flux?.model ?? (imageConfig.model as FluxGenerationRequest["model"]),
          quality,
          aspectRatio: image?.flux?.aspectRatio ?? "1:1",
        };
        imageModel = generationOptions.model;
      }

      const deaiCost = calculateImageDeaiCost({
        model: imageModel,
        quality: billingQuality,
        outputCount: 1,
      });

      const auth = await requireAuth(deaiCost);
      if (auth instanceof NextResponse) return auth;

      const { supabase, user, profile } = auth;

      const result = await startImageGeneration(imageConfig, prompt!, generationOptions);

      const deducted = await deductDeai(supabase, user.id, deaiCost);
      if (!deducted.success) {
        return NextResponse.json(
          { error: getInsufficientDeaiMessage(deaiCost), code: "INSUFFICIENT_DEAI" },
          { status: 429 },
        );
      }

      await recordDeaiUsage(supabase, user.id, slug, "image", deaiCost, imageModel);
      const deai = await getDeaiSummary(supabase, user.id, profile.plan);

      if (result.imageUrl) {
        return NextResponse.json({ imageUrl: result.imageUrl, deai, deaiCost });
      }

      return NextResponse.json({
        taskId: result.taskId,
        status: "PENDING",
        deai,
        deaiCost,
      });
    }

    if (embed.type === "video") {
      const videoConfig = embed as VideoEmbedConfig;

      if (videoConfig.provider === "google-veo") {
        const promptError = validateVeoPrompt(prompt ?? "");
        if (promptError) {
          return NextResponse.json({ error: promptError }, { status: 400 });
        }
      }

      if (
        videoConfig.provider !== "google-veo" &&
        videoConfig.provider !== "runway" &&
        !prompt?.trim()
      ) {
        return NextResponse.json({ error: "Опишите сцену для видео." }, { status: 400 });
      }

      if (prompt && prompt.length > MAX_PROMPT_LENGTH) {
        return NextResponse.json({ error: `Макс. ${MAX_PROMPT_LENGTH} символов.` }, { status: 400 });
      }

      const duration = video?.duration ?? videoConfig.duration ?? 5;
      const quality = video?.quality ?? "1k";

      let veoOptions: VeoGenerationRequest | undefined;
      let klingOptions: KlingGenerationRequest | undefined;
      let runwayOptions: RunwayGenerationRequest | undefined;
      let grokOptions: GrokVideoGenerationRequest | undefined;

      if (videoConfig.provider === "google-veo") {
        const validated = validateVeoGenerationRequest(prompt ?? "", video?.veo);
        if (typeof validated === "string") {
          return NextResponse.json({ error: validated }, { status: 400 });
        }
        veoOptions = validated;
      }

      if (videoConfig.provider === "kling") {
        const promptError = validateKlingPrompt(prompt ?? "");
        if (promptError) {
          return NextResponse.json({ error: promptError }, { status: 400 });
        }

        const validated = validateKlingGenerationRequest(prompt ?? "", video?.kling);
        if (typeof validated === "string") {
          return NextResponse.json({ error: validated }, { status: 400 });
        }
        klingOptions = validated;
      }

      if (videoConfig.provider === "runway") {
        const validated = validateRunwayGenerationRequest(prompt ?? "", video?.runway);
        if (typeof validated === "string") {
          return NextResponse.json({ error: validated }, { status: 400 });
        }
        runwayOptions = validated;
      }

      if (videoConfig.provider === "xai-video") {
        const promptError = validateGrokVideoPrompt(prompt ?? "");
        if (promptError) {
          return NextResponse.json({ error: promptError }, { status: 400 });
        }

        const validated = validateGrokVideoGenerationRequest(prompt ?? "", video?.grok);
        if (typeof validated === "string") {
          return NextResponse.json({ error: validated }, { status: 400 });
        }
        grokOptions = validated;
      }

      const deaiCost = calculateVideoDeaiCost({
        model:
          runwayOptions?.model ??
          klingOptions?.model ??
          grokOptions?.model ??
          veoOptions?.model ??
          videoConfig.model,
        duration:
          runwayOptions?.durationSeconds ??
          klingOptions?.durationSeconds ??
          grokOptions?.durationSeconds ??
          veoOptions?.durationSeconds ??
          duration,
        quality: grokOptions
          ? grokOptions.resolution === "1080p"
            ? "4k"
            : grokOptions.resolution === "720p"
              ? "2k"
              : "1k"
          : klingOptions
          ? klingOptions.mode === "pro"
            ? "2k"
            : "1k"
          : veoOptions
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

      const toolAccess = await getToolAccessStatus(
        supabase,
        user.id,
        profile.plan,
        slug,
        auth.deai.balance,
        deaiCost,
      );
      if (!toolAccess.allowed) {
        return NextResponse.json(
          {
            error: toolAccess.reason,
            code: toolAccess.code ?? "PLAN_TOOL_BLOCKED",
            deai: auth.deai,
          },
          { status: 403 },
        );
      }

      const generationTaskId = await startVideoGeneration(
        videoConfig,
        prompt ?? "",
        duration,
        runwayOptions?.ratio ?? videoConfig.ratio ?? "16:9",
        veoOptions,
        klingOptions,
        runwayOptions,
        grokOptions,
      );

      const deducted = await deductDeai(supabase, user.id, deaiCost);
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
        runwayOptions?.model ??
          klingOptions?.model ??
          grokOptions?.model ??
          veoOptions?.model ??
          videoConfig.model,
      );
      const deai = await getDeaiSummary(supabase, user.id, profile.plan);

      return NextResponse.json({ taskId: generationTaskId, status: "PENDING", deai, deaiCost });
    }

    return NextResponse.json({ error: "Неподдерживаемый тип." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ошибка генерации" },
      { status: 502 },
    );
  }
}
