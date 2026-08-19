import { ID, Query } from 'appwrite';
import { databases, storage, functions } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';

export interface ImportedDocument {
  $id: string;
  file_name: string;
  file_id: string;
  source_label?: string;
  sector: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  entries_generated?: number;
  uploaded_by?: string;
  created_at: string;
}

const BUCKET_ID = import.meta.env.VITE_BUCKET_OFFICIAL_DOCUMENTS;

export async function listImportedDocuments(): Promise<ImportedDocument[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.IMPORTED_DOCUMENTS, [
    Query.orderDesc('created_at'),
    Query.limit(50),
  ]);
  return response.documents as unknown as ImportedDocument[];
}

/**
 * Upload le PDF dans Storage, crée le document de suivi en PENDING,
 * puis déclenche immédiatement la Function d'extraction. Le statut passe
 * à PROCESSED (ou FAILED) une fois la Function terminée — l'appelant peut
 * rafraîchir la liste pour suivre la progression.
 */
export async function uploadAndProcessDocument(
  file: File,
  sector: string,
  sourceLabel: string | undefined,
  uploadedBy: string
): Promise<void> {
  const uploadedFile = await storage.createFile(BUCKET_ID, ID.unique(), file);

  const document = await databases.createDocument(DATABASE_ID, COLLECTIONS.IMPORTED_DOCUMENTS, ID.unique(), {
    file_name: file.name,
    file_id: uploadedFile.$id,
    source_label: sourceLabel || undefined,
    sector,
    status: 'PENDING',
    uploaded_by: uploadedBy,
    created_at: new Date().toISOString(),
  });

  const functionId = import.meta.env.VITE_FUNCTION_EXTRACT_PDF_KNOWLEDGE;
  await functions.createExecution(functionId, JSON.stringify({ document_id: document.$id }), false);
}