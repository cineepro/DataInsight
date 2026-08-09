//appwrite/functions/submit-scan/src/main.ts
import { Client, Databases, Query, ID } from 'node-appwrite';

type ScanCategory = 'RESTAURANT' | 'FASTFOOD' | 'PHARMACIE' | 'ENTREPRISE';

interface SubmitScanPayload {
  tenant_slug: string;
  category: ScanCategory;
  data: Record<string, unknown>;
}

function getISOYearWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week_number = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week_number, day_of_week: dayNum };
}

function collectionForCategory(category: ScanCategory): string {
  switch (category) {
    case 'RESTAURANT':
    case 'FASTFOOD':
      return process.env.APPWRITE_COLLECTION_SCANS_RESTAURANT!;
    case 'PHARMACIE':
      return process.env.APPWRITE_COLLECTION_SCANS_PHARMACIE!;
    case 'ENTREPRISE':
      return process.env.APPWRITE_COLLECTION_SCANS_ENTREPRISE!;
  }
}

/**
 * Alternative "serveur" à l'écriture directe depuis apps/collect :
 * valide que le tenant existe et est ACTIF/PILOTE avant d'insérer le scan.
 * Utile si tu veux bloquer les soumissions pour un tenant SUSPENDED sans
 * exposer cette logique côté client.
 */
export default async ({ req, res, log, error }: any) => {
  let body: SubmitScanPayload;

  try {
    body = JSON.parse(req.bodyText || '{}');
  } catch {
    return res.json({ error: 'Corps de requête invalide.' }, 400);
  }

  if (!body.tenant_slug || !body.category || !body.data) {
    return res.json({ error: 'Champs requis manquants.' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  const databases = new Databases(client);

  try {
    const tenantResult = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_COLLECTION_TENANTS!,
      [Query.equal('slug', body.tenant_slug), Query.limit(1)]
    );

    const tenant = tenantResult.documents[0] as any;
    if (!tenant) return res.json({ error: 'Structure introuvable.' }, 404);
    if (tenant.status === 'SUSPENDED') {
      return res.json({ error: 'Collecte suspendue pour cette structure.' }, 403);
    }

    const now = new Date();
    const { year, week_number, day_of_week } = getISOYearWeek(now);
    const collectionId = collectionForCategory(body.category);

    await databases.createDocument(process.env.APPWRITE_DATABASE_ID!, collectionId, ID.unique(), {
      ...body.data,
      tenant_id: body.tenant_slug,
      timestamp: now.toISOString(),
      year,
      week_number,
      day_of_week,
    });

    return res.json({ success: true }, 200);
  } catch (err) {
    error('Erreur submit-scan: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};