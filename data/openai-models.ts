export type ReasoningEffort = "low" | "medium" | "high";

export type ResponseFormatType = "text" | "json_object" | "json_schema";

export type OpenAIModelOption = {
  id: string;
  label: string;
  reasoning: boolean;
};

/** Актуальные модели OpenAI для ChatGPT на сайте */
export const OPENAI_MODELS: OpenAIModelOption[] = [
  { id: "gpt-4.1", label: "GPT-4.1", reasoning: false },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", reasoning: false },
  { id: "gpt-4.1-nano", label: "GPT-4.1 Nano", reasoning: false },
  { id: "gpt-4o", label: "GPT-4o", reasoning: false },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", reasoning: false },
  { id: "gpt-5", label: "GPT-5", reasoning: true },
  { id: "gpt-5-mini", label: "GPT-5 Mini", reasoning: true },
  { id: "gpt-5-nano", label: "GPT-5 Nano", reasoning: true },
  { id: "o3", label: "o3", reasoning: true },
  { id: "o3-mini", label: "o3-mini", reasoning: true },
  { id: "o4-mini", label: "o4-mini", reasoning: true },
];

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export const DEFAULT_JSON_SCHEMA = `{
  "type": "object",
  "properties": {
    "answer": { "type": "string" }
  },
  "required": ["answer"],
  "additionalProperties": false
}`;

export type OpenAIChatRequestOptions = {
  model: string;
  responseFormat: ResponseFormatType;
  reasoningEffort?: ReasoningEffort;
  jsonSchema?: string;
};

export function getOpenAIModel(id: string): OpenAIModelOption | undefined {
  return OPENAI_MODELS.find((model) => model.id === id);
}

export function modelSupportsReasoning(modelId: string): boolean {
  return getOpenAIModel(modelId)?.reasoning ?? false;
}

export function isAllowedOpenAIModel(modelId: string): boolean {
  return OPENAI_MODELS.some((model) => model.id === modelId);
}
