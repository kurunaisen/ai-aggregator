export type ClaudeModelId =
  | "claude-haiku-4-5-20251001"
  | "claude-sonnet-4-6"
  | "claude-opus-4-8";

export type ClaudeModelOption = {
  id: ClaudeModelId;
  label: string;
  hint: string;
  vision: boolean;
};

export const CLAUDE_MODELS: ClaudeModelOption[] = [
  {
    id: "claude-haiku-4-5-20251001",
    label: "Haiku 4.5",
    hint: "Быстро и дёшево — диаграммы, графики, черновики",
    vision: true,
  },
  {
    id: "claude-sonnet-4-6",
    label: "Sonnet 4.6",
    hint: "Баланс скорости и качества — тексты, код, анализ",
    vision: true,
  },
  {
    id: "claude-opus-4-8",
    label: "Opus 4.8",
    hint: "Максимальное качество — сложные задачи и агенты",
    vision: true,
  },
];

export const DEFAULT_CLAUDE_MODEL: ClaudeModelId = "claude-haiku-4-5-20251001";

export type ClaudeChatRequestOptions = {
  model: ClaudeModelId;
};

export type ClaudeImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export type ClaudeChatAttachment = {
  id: string;
  name: string;
  mediaType: ClaudeImageMediaType;
  dataUrl: string;
};

export type ClaudeChatMessage = {
  role: "user" | "assistant";
  content: string;
  attachments?: ClaudeChatAttachment[];
};

export function getClaudeModel(id: string): ClaudeModelOption | undefined {
  return CLAUDE_MODELS.find((model) => model.id === id);
}

export function isAllowedClaudeModel(modelId: string): modelId is ClaudeModelId {
  return CLAUDE_MODELS.some((model) => model.id === modelId);
}

export function createDefaultClaudeOptions(): ClaudeChatRequestOptions {
  return { model: DEFAULT_CLAUDE_MODEL };
}
