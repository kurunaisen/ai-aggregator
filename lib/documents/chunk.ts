import { CHUNK_OVERLAP, CHUNK_SIZE } from "@/lib/documents/constants";

export type ContextPiece = {
  id: string;
  filename: string;
  chunkIndex: number;
  content: string;
};

export function chunkText(
  text: string,
  size = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP,
): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!normalized) return [];
  if (normalized.length <= size) return [normalized];

  const step = Math.max(1, size - overlap);
  const chunks: string[] = [];
  const parts = normalized.split(/\n\n+/);
  let current = "";

  function pushHard(block: string) {
    for (let index = 0; index < block.length; index += step) {
      const slice = block.slice(index, index + size).trim();
      if (slice) chunks.push(slice);
      if (index + size >= block.length) break;
    }
  }

  for (const part of parts) {
    if (part.length > size) {
      if (current.trim()) {
        chunks.push(current.trim());
        current = "";
      }
      pushHard(part);
      continue;
    }

    const next = current ? `${current}\n\n${part}` : part;
    if (next.length > size) {
      chunks.push(current.trim());
      const tail = current.slice(-overlap).trim();
      current =
        tail && tail.length + part.length + 2 <= size ? `${tail}\n\n${part}` : part;
    } else {
      current = next;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function mergePieces(primary: ContextPiece[], extra: ContextPiece[]): ContextPiece[] {
  const seen = new Set<string>();
  const merged: ContextPiece[] = [];

  for (const piece of [...primary, ...extra]) {
    if (seen.has(piece.id)) continue;
    seen.add(piece.id);
    merged.push(piece);
  }

  return merged;
}

export function packPieces(pieces: ContextPiece[], maxChars: number): ContextPiece[] {
  const packed: ContextPiece[] = [];
  let used = 0;

  for (const piece of pieces) {
    const weight = piece.content.length + piece.filename.length + 40;
    if (packed.length > 0 && used + weight > maxChars) break;
    packed.push(piece);
    used += weight;
  }

  return packed;
}

export function formatContext(pieces: ContextPiece[]): string {
  return pieces
    .map(
      (piece) =>
        `[Файл: ${piece.filename}, фрагмент ${piece.chunkIndex + 1}]\n${piece.content}`,
    )
    .join("\n\n");
}
