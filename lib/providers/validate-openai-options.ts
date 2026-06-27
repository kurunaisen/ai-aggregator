import {
  DEFAULT_OPENAI_MODEL,
  getOpenAIModel,
  isAllowedOpenAIModel,
  modelSupportsReasoning,
  type OpenAIChatRequestOptions,
  type ReasoningEffort,
  type ResponseFormatType,
} from "@/data/openai-models";

const REASONING_EFFORTS = new Set<ReasoningEffort>(["low", "medium", "high"]);
const RESPONSE_FORMATS = new Set<ResponseFormatType>(["text", "json_object", "json_schema"]);
const MAX_SCHEMA_LENGTH = 8000;

export type ValidatedOpenAIOptions = OpenAIChatRequestOptions & {
  parsedSchema?: Record<string, unknown>;
};

export function validateOpenAIOptions(
  raw: Partial<OpenAIChatRequestOptions> | undefined,
): ValidatedOpenAIOptions | string {
  const model =
    typeof raw?.model === "string" && raw.model.trim()
      ? raw.model.trim()
      : DEFAULT_OPENAI_MODEL;

  if (!isAllowedOpenAIModel(model)) {
    return "Недопустимая модель OpenAI.";
  }

  const responseFormat =
    raw?.responseFormat && RESPONSE_FORMATS.has(raw.responseFormat)
      ? raw.responseFormat
      : "text";

  let reasoningEffort: ReasoningEffort | undefined;
  if (raw?.reasoningEffort && REASONING_EFFORTS.has(raw.reasoningEffort)) {
    reasoningEffort = raw.reasoningEffort;
  }

  if (modelSupportsReasoning(model)) {
    reasoningEffort = reasoningEffort ?? "medium";
  } else {
    reasoningEffort = undefined;
  }

  let parsedSchema: Record<string, unknown> | undefined;

  if (responseFormat === "json_schema") {
    const jsonSchema = raw?.jsonSchema?.trim();
    if (!jsonSchema) {
      return "Укажите JSON Schema для формата «Схема».";
    }

    if (jsonSchema.length > MAX_SCHEMA_LENGTH) {
      return `JSON Schema слишком длинная (макс. ${MAX_SCHEMA_LENGTH} символов).`;
    }

    try {
      parsedSchema = JSON.parse(jsonSchema) as Record<string, unknown>;
    } catch {
      return "JSON Schema должна быть валидным JSON.";
    }

    if (!parsedSchema || typeof parsedSchema !== "object" || Array.isArray(parsedSchema)) {
      return "JSON Schema должна описывать объект.";
    }
  }

  return {
    model,
    responseFormat,
    reasoningEffort,
    jsonSchema: raw?.jsonSchema,
    parsedSchema,
  };
}

export function getDefaultOpenAIOptions(): OpenAIChatRequestOptions {
  const model = getOpenAIModel(DEFAULT_OPENAI_MODEL)!;

  return {
    model: model.id,
    responseFormat: "text",
    reasoningEffort: model.reasoning ? "medium" : undefined,
  };
}
