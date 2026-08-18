//appwrite/functions/submit-knowledge-contribution/src/main.ts
import { Client, Databases, Query, ID } from 'node-appwrite';
import { hashVisitorToken } from './hashVisitor';

interface RequestPayload {
  title: string;
  sector: string;
  content: string;
  contributor_name?: string;
  contributor_contact?: string;
  visitor_token: string;
}

const VALID_SECTORS = ['GENERAL', 'RESTAURATION', 'HOTELLERIE', 'PHARMACIE', 'COMMERCE_DETAIL'];
const RATE_LIMIT_MAX_PER_DAY = 3; // plus strict que le chat — une contribution demande plus de réflexion qu'une question
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_TITLE_LENGTH = 128;
const MAX_CONTENT_LENGTH = 2000;
const MIN_CONTENT_LENGTH = 50; // évite les soumissions vides ou du spam d'une ligne

/**
 * Point de sécurité central : cette Function est le SEUL chemin par
 * lequel une contribution publique peut atteindre knowledge_base_entries.
 * Elle force systématiquement status="DRAFT" et origin="PUBLIC_CONTRIBUTION" —
 * ces valeurs ne sont jamais lues depuis le payload envoyé par le client,
 * pour qu'aucune manipulation du front-end ne puisse les contourner.
 */
export default async ({ req, res, log, error }: any) => {
  try {
    let body: RequestPayload;
    try {
      body = JSON.parse(req.bodyText || '{}');
    } catch {
      return res.json({ error: 'Corps de requête invalide.' }, 400);
    }

    if (!body.title || !body.sector || !body.content || !body.visitor_token) {
      return res.json({ error: 'Champs requis manquants.' }, 400);
    }

    if (!VALID_SECTORS.includes(body.sector)) {
      return res.json({ error: 'Secteur invalide.' }, 400);
    }

    if (body.title.length > MAX_TITLE_LENGTH) {
      return res.json({ error: `Titre trop long (${MAX_TITLE_LENGTH} caractères maximum).` }, 400);
    }

    if (body.content.length < MIN_CONTENT_LENGTH) {
      return res.json({ error: `Contenu trop court (${MIN_CONTENT_LENGTH} caractères minimum).` }, 400);
    }

    if (body.content.length > MAX_CONTENT_LENGTH) {
      return res.json({ error: `Contenu trop long (${MAX_CONTENT_LENGTH} caractères maximum).` }, 400);
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    const visitorHash = hashVisitorToken(body.visitor_token);

    // --- Anti-abus : quota quotidien par visiteur ---
    const rateLimitCollectionId = process.env.APPWRITE_COLLECTION_AI_LAB_RATE_LIMIT!;
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    const recent = await databases.listDocuments(databaseId, rateLimitCollectionId, [
      Query.equal('visitor_hash', `contrib_${visitorHash}`), // préfixe pour ne pas mélanger avec le quota du chat
      Query.greaterThan('timestamp', windowStart),
      Query.limit(RATE_LIMIT_MAX_PER_DAY + 1),
    ]);

    if (recent.documents.length >= RATE_LIMIT_MAX_PER_DAY) {
      return res.json(
        { error: `Limite de ${RATE_LIMIT_MAX_PER_DAY} contributions par jour atteinte. Merci de revenir demain.` },
        429
      );
    }

    await databases.createDocument(databaseId, rateLimitCollectionId, ID.unique(), {
      visitor_hash: `contrib_${visitorHash}`,
      timestamp: new Date().toISOString(),
    });

    // --- Création en DRAFT — jamais publié directement ---
    await databases.createDocument(databaseId, process.env.APPWRITE_COLLECTION_KNOWLEDGE_BASE!, ID.unique(), {
      title: body.title.trim(),
      sector: body.sector,
      content: body.content.trim(),
      status: 'DRAFT',
      origin: 'PUBLIC_CONTRIBUTION',
      contributor_name: body.contributor_name?.trim() || undefined,
      contributor_contact: body.contributor_contact?.trim() || undefined,
      created_at: new Date().toISOString(),
    });

    log('Contribution publique reçue, secteur=' + body.sector);

    return res.json({ success: true }, 200);
  } catch (err) {
    error('Erreur submit-knowledge-contribution: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};