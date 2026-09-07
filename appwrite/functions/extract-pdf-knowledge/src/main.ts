//appwrite/functions/extract-pdf-knowledge/src/main.ts
import { Client, Databases, Storage, ID } from 'node-appwrite';
import pdfParse from 'pdf-parse';
import { extractKnowledgeFromText } from '@datainsight/knowledge-ingestion';

interface RequestPayload {
  document_id: string;
}

export default async ({ req, res, log, error }: any) => {
  try {
    let body: RequestPayload;
    try {
      body = JSON.parse(req.bodyText || '{}');
    } catch {
      return res.json({ error: 'Corps de requête invalide.' }, 400);
    }

    if (!body.document_id) {
      return res.json({ error: 'document_id manquant.' }, 400);
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const storage = new Storage(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    const bucketId = process.env.APPWRITE_BUCKET_OFFICIAL_DOCUMENTS!;

    const document = await databases.getDocument(databaseId, process.env.APPWRITE_COLLECTION_IMPORTED_DOCUMENTS!, body.document_id) as any;

    log('Téléchargement du fichier ' + document.file_name);
    const fileBuffer = await storage.getFileDownload(bucketId, document.file_id);

    log('Extraction du texte du PDF...');
    const pdfData = await pdfParse(Buffer.from(fileBuffer));
    const fullText = pdfData.text;

    if (!fullText || fullText.trim().length < 200) {
      await databases.updateDocument(databaseId, process.env.APPWRITE_COLLECTION_IMPORTED_DOCUMENTS!, body.document_id, {
        status: 'FAILED',
      });
      return res.json({ error: 'Le PDF ne contient pas assez de texte exploitable (peut-être un PDF scanné en image).' }, 400);
    }

    const proposals = await extractKnowledgeFromText(
      fullText,
      document.source_label,
      process.env.ANTHROPIC_API_KEY!,
      (i, total) => log(`Traitement du morceau ${i + 1}/${total}...`)
    );

    let totalGenerated = 0;
    for (const proposal of proposals) {
      await databases.createDocument(databaseId, process.env.APPWRITE_COLLECTION_KNOWLEDGE_BASE!, ID.unique(), {
        title: proposal.title,
        sector: document.sector,
        content: proposal.content,
        status: 'DRAFT',
        origin: 'OFFICIAL_SOURCE',
        source_document_name: document.file_name,
        created_at: new Date().toISOString(),
      });
      totalGenerated++;
    }

    await databases.updateDocument(databaseId, process.env.APPWRITE_COLLECTION_IMPORTED_DOCUMENTS!, body.document_id, {
      status: 'PROCESSED',
      entries_generated: totalGenerated,
    });

    log(`Terminé : ${totalGenerated} proposition(s) créée(s).`);
    return res.json({ success: true, entries_generated: totalGenerated }, 200);
  } catch (err) {
    error('Erreur extract-pdf-knowledge: ' + (err as Error).message);
    try {
      const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
        .setKey(process.env.APPWRITE_API_KEY!);
      const databases = new Databases(client);
      const body = JSON.parse(req.bodyText || '{}');
      if (body.document_id) {
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_COLLECTION_IMPORTED_DOCUMENTS!,
          body.document_id,
          { status: 'FAILED' }
        );
      }
    } catch {
      // best-effort — ne masque pas l'erreur d'origine si cette mise à jour échoue aussi
    }
    return res.json({ error: 'Erreur serveur: ' + (err as Error).message }, 500);
  }
};