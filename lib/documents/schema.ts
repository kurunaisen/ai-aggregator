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

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
