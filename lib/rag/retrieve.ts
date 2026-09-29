import type { StoredDocument } from "@/lib/rag/types";

const STOP = new Set([
  "и",
  "в",
  "во",
  "на",
  "по",
  "для",
  "что",
  "как",
  "это",
  "или",
  "не",
  "от",
  "до",
  "при",
  "из",
  "за",
  "к",
  "ко",
  "с",
  "со",
  "а",
  "но",
  "же",
  "ли",
  "бы",
  "то",
  "все",
  "его",
  "ее",
  "их",
  "быть",
  "о",
  "об",
  "про",
  "также",
  "этот",
  "эта",
  "эти",
  "том",
  "уже",
  "еще",
  "только",
  "можно",
  "нужно",
  "должен",
  "должна",
  "должно",
  "какие",
  "какая",
  "какой",
  "какое",
  "чем",
  "чего",
  "где",
  "когда",
  "этот",
]);

export type RankedChunk = {
  document: StoredDocument;
  chunkId: string;
  text: string;
  clause: string | null;
  section: string | null;
  page: number | null;
  score: number;
};

export function tokenize(text: string): string[] {
  return (
    text
      .toLowerCase()
      .replace(/ё/g, "е")
      .match(/[a-zа-я0-9]+(?:\.[0-9]+)*/g)
      ?.filter((token) => (token.length >= 3 || /\d/.test(token)) && !STOP.has(token)) ?? []
  );
}

export function cosine(left: number[], right: number[]): number {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }
  if (leftNorm === 0 || rightNorm === 0) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function keywordScore(query: string, text: string, clause: string | null): number {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;
  const haystack = new Set(tokenize(text));
  let hits = 0;
  for (const token of tokens) {
    if (haystack.has(token)) hits += 1;
  }
  let score = hits / tokens.length;
  if (clause && query.includes(clause)) score = Math.min(1, score + 0.35);
  return score;
}

export function retrieve(query: string, documents: StoredDocument[], queryVector: number[], limit = 5): RankedChunk[] {
  const candidates = documents.flatMap((document) =>
    document.chunks
      .filter((chunk) => chunk.embedding && chunk.embedding.length === queryVector.length)
      .map((chunk) => ({
        document,
        chunkId: chunk.id,
        text: chunk.text,
        clause: chunk.clause,
        section: chunk.section,
        page: chunk.page,
        semantic: cosine(queryVector, chunk.embedding ?? []),
        lexical: keywordScore(query, `${chunk.section ?? ""}\n${chunk.clause ?? ""}\n${chunk.text}`, chunk.clause),
      })),
  );

  if (candidates.length === 0) return [];

  const semanticValues = candidates.map((candidate) => candidate.semantic);
  const minSemantic = Math.min(...semanticValues);
  const maxSemantic = Math.max(...semanticValues);

  const ranked = candidates
    .map((candidate) => {
      const semantic =
        maxSemantic === minSemantic
          ? 1
          : (candidate.semantic - minSemantic) / (maxSemantic - minSemantic);
      return {
        document: candidate.document,
        chunkId: candidate.chunkId,
        text: candidate.text,
        clause: candidate.clause,
        section: candidate.section,
        page: candidate.page,
        score: 0.72 * semantic + 0.28 * candidate.lexical,
      };
    })
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit);
}
