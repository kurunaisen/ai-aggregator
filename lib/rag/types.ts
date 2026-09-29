export type StoredChunk = {
  id: string;
  text: string;
  clause: string | null;
  section: string | null;
  page: number | null;
  embedding: number[] | null;
};

export type StoredDocument = {
  id: string;
  title: string;
  filename: string;
  documentNumber: string | null;
  documentDate: string | null;
  uploadedAt: string;
  chunks: StoredChunk[];
};

export type StoreData = {
  documents: StoredDocument[];
};

export type DocumentSummary = {
  id: string;
  title: string;
  filename: string;
  documentNumber: string | null;
  documentDate: string | null;
  uploadedAt: string;
  chunkCount: number;
};

export type Citation = {
  documentTitle: string;
  filename: string;
  documentNumber: string | null;
  documentDate: string | null;
  clause: string | null;
  section: string | null;
  page: number | null;
  quote: string;
};

export type AskStatus = "answered" | "refused" | "no_documents" | "missing_key" | "error";

export type AskResponse = {
  status: AskStatus;
  answer: string;
  citations: Citation[];
};
