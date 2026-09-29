export type RagConfig = {
  apiKey: string;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
  configured: boolean;
};

export function getRagConfig(): RagConfig {
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );

  return {
    apiKey,
    baseUrl,
    chatModel: process.env.RAG_CHAT_MODEL?.trim() || "gpt-4o-mini",
    embeddingModel: process.env.RAG_EMBEDDING_MODEL?.trim() || "text-embedding-3-small",
    configured: apiKey.length > 0,
  };
}
