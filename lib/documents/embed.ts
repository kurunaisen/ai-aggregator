import { EMBEDDING_MODEL } from "@/lib/documents/constants";

const EMBED_URL = "https://api.openai.com/v1/embeddings";
const BATCH = 64;

export function formatVector(values: number[]): string {
  return `[${values.map((value) => value.toFixed(7)).join(",")}]`;
}

export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || texts.length === 0) return null;

  const vectors: number[][] = new Array(texts.length);

  try {
    for (let offset = 0; offset < texts.length; offset += BATCH) {
      const batch = texts.slice(offset, offset + BATCH).map((text) => text.slice(0, 8000));
      const response = await fetch(EMBED_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: batch,
        }),
      });

      const data = (await response.json()) as {
        error?: { message?: string };
        data?: { index: number; embedding: number[] }[];
      };

      if (!response.ok || !data.data?.length) {
        console.error("embedTexts:", data.error?.message ?? response.status);
        return null;
      }

      for (const item of data.data) {
        vectors[offset + item.index] = item.embedding;
      }
    }
  } catch (error) {
    console.error("embedTexts:", error instanceof Error ? error.message : error);
    return null;
  }

  if (vectors.some((vector) => !vector?.length)) return null;
  return vectors;
}
