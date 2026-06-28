import {
  CLAUDE_MODELS,
  DEFAULT_CLAUDE_MODEL,
  isAllowedClaudeModel,
  type ClaudeChatRequestOptions,
} from "@/data/claude-models";

export function validateClaudeOptions(
  raw: Partial<ClaudeChatRequestOptions> | undefined,
): ClaudeChatRequestOptions | string {
  const model =
    typeof raw?.model === "string" && raw.model.trim() ? raw.model.trim() : DEFAULT_CLAUDE_MODEL;

  if (!isAllowedClaudeModel(model)) {
    return "Недопустимая модель Claude.";
  }

  return { model };
}

export { CLAUDE_MODELS };
