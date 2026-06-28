import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { Plan } from "@/lib/subscription/constants";
import { PRO_PLAN_DESCRIPTION, PRO_PRICE_LABEL } from "@/lib/subscription/constants";
import { getInsufficientDeaiMessage } from "@/lib/subscription/deai";

export const BASE_TRIAL_VIDEO_TOOLS = ["runway", "veo"] as const;

export type BaseTrialVideoTool = (typeof BASE_TRIAL_VIDEO_TOOLS)[number];

export const BASE_TRIAL_USES_PER_TOOL = 1;

export type ToolAccessCode = "PLAN_TOOL_BLOCKED" | "INSUFFICIENT_DEAI";

export type ToolAccessStatus = {
  allowed: boolean;
  code?: ToolAccessCode;
  reason?: string;
  trialsUsed: number;
  trialsLimit: number | null;
  isBaseTrialTool: boolean;
  minDeaiCost: number;
};

export function isBaseTrialVideoTool(slug: string): slug is BaseTrialVideoTool {
  return slug === "runway" || slug === "veo";
}

function toolDisplayName(slug: BaseTrialVideoTool): string {
  return slug === "runway" ? "Runway" : "Google Veo";
}

export function getBaseTrialBlockedMessage(slug: BaseTrialVideoTool): string {
  return (
    `На тарифе Base доступна 1 пробная генерация в ${toolDisplayName(slug)}. ` +
    `Перейдите на Pro (${PRO_PRICE_LABEL}): ${PRO_PLAN_DESCRIPTION}`
  );
}

export function getBaseTrialHint(slug: BaseTrialVideoTool, trialsUsed: number): string | null {
  if (trialsUsed >= BASE_TRIAL_USES_PER_TOOL) return null;
  if (trialsUsed === 0) {
    return `Base: 1 пробная генерация в ${toolDisplayName(slug)}. Далее — только Pro.`;
  }
  return null;
}

export async function countToolUsage(
  supabase: SupabaseClient<Database>,
  userId: string,
  toolSlug: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("tool_slug", toolSlug);

  if (error) {
    console.error("countToolUsage:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function getToolAccessStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
  plan: Plan,
  toolSlug: string,
  balance: number,
  minDeaiCost: number,
): Promise<ToolAccessStatus> {
  const isBaseTrialTool = isBaseTrialVideoTool(toolSlug);

  if (plan === "base" && isBaseTrialTool) {
    const trialsUsed = await countToolUsage(supabase, userId, toolSlug);

    if (trialsUsed >= BASE_TRIAL_USES_PER_TOOL) {
      return {
        allowed: false,
        code: "PLAN_TOOL_BLOCKED",
        reason: getBaseTrialBlockedMessage(toolSlug),
        trialsUsed,
        trialsLimit: BASE_TRIAL_USES_PER_TOOL,
        isBaseTrialTool: true,
        minDeaiCost,
      };
    }

    if (balance < minDeaiCost) {
      return {
        allowed: false,
        code: "INSUFFICIENT_DEAI",
        reason: getInsufficientDeaiMessage(minDeaiCost),
        trialsUsed,
        trialsLimit: BASE_TRIAL_USES_PER_TOOL,
        isBaseTrialTool: true,
        minDeaiCost,
      };
    }

    return {
      allowed: true,
      trialsUsed,
      trialsLimit: BASE_TRIAL_USES_PER_TOOL,
      isBaseTrialTool: true,
      minDeaiCost,
    };
  }

  if (balance < minDeaiCost) {
    return {
      allowed: false,
      code: "INSUFFICIENT_DEAI",
      reason: getInsufficientDeaiMessage(minDeaiCost),
      trialsUsed: 0,
      trialsLimit: null,
      isBaseTrialTool,
      minDeaiCost,
    };
  }

  return {
    allowed: true,
    trialsUsed: 0,
    trialsLimit: null,
    isBaseTrialTool,
    minDeaiCost,
  };
}
