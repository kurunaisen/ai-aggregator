import assert from "node:assert/strict";
import { chunkText, mergePieces, packPieces, type ContextPiece } from "./chunk";

const parts = chunkText(`${"Абзац договора.\n\n".repeat(20)}${"Длиннаястрокабезпробелов".repeat(200)}`);
assert.ok(parts.length > 1);
assert.ok(parts.every((part) => part.length <= 1800));

const long = "слово ".repeat(3000);
const chunks = chunkText(long, 500, 50);
assert.ok(chunks.length > 2);
assert.ok(chunks.every((part) => part.length <= 500));

const primary: ContextPiece[] = [
  { id: "a", filename: "Договор.pdf", chunkIndex: 2, content: "сумма 100" },
];
const extra: ContextPiece[] = [
  { id: "a", filename: "Договор.pdf", chunkIndex: 2, content: "дубль" },
  { id: "b", filename: "Проект.docx", chunkIndex: 0, content: "объект" },
];
const merged = mergePieces(primary, extra);
assert.equal(merged.length, 2);
assert.equal(merged[0].content, "сумма 100");

const packed = packPieces(
  [
    { id: "1", filename: "a.txt", chunkIndex: 0, content: "x".repeat(100) },
    { id: "2", filename: "b.txt", chunkIndex: 0, content: "y".repeat(100) },
  ],
  160,
);
assert.equal(packed.length, 1);

console.log("document chunk checks ok", { parts: parts.length, chunks: chunks.length });
