export function isMissingDocumentsSchema(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("document_bases") ||
    lower.includes("source_documents") ||
    lower.includes("document_chunks") ||
    lower.includes("match_document_chunks") ||
    lower.includes("schema cache")
  );
}

export function isOptionalSearchError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("match_document_chunks_semantic") ||
    lower.includes("expand_document_chunk_neighbors") ||
    lower.includes("embedding") ||
    lower.includes("vector") ||
    lower.includes("could not find the function")
  );
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
