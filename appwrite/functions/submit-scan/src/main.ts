// appwrite/functions/submit-scan/src/main.ts
import { Client, Databases, Query, ID } from 'node-appwrite';
import { hashVisitor, extractClientIp } from './hashVisitor';

type ScanCategory = 'RESTAURANT' | 'FASTFOOD' | 'PHARMACIE' | 'ENTREPRISE';

interface SubmitScanPayload {
  tenant_slug: string;
  category: ScanCategory;
  data: Record<string, unknown>;
  phone?: string;
  name?: string;
}

const RATE_LIMIT_MAX_PER_HOUR = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

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

function normalizePhone(phone: string): string {
  return phone.replace(/[\s.-]/g, '');
}

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
  const databaseId = process.env.APPWRITE_DATABASE_ID!;

  try {
    // --- 1. Vérifier que le tenant existe et accepte des soumissions ---
    const tenantResult = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_TENANTS!, [
      Query.equal('slug', body.tenant_slug),
      Query.limit(1),
    ]);
    const tenant = tenantResult.documents[0] as any;
    if (!tenant) return res.json({ error: 'Structure introuvable.' }, 404);
    if (tenant.status === 'SUSPENDED') {
      return res.json({ error: 'Collecte suspendue pour cette structure.' }, 403);
    }

    // --- 2. Calculer l'empreinte visiteur (jamais l'IP en clair) ---
    const ip = extractClientIp(req.headers ?? {});
    const userAgent = req.headers?.['user-agent'] ?? 'unknown';
    const visitorHash = hashVisitor(ip, body.tenant_slug, userAgent);

    // --- 3. Anti-abus : compter les soumissions récentes de cette empreinte ---
    const rateLimitCollectionId = process.env.APPWRITE_COLLECTION_RATE_LIMIT_EVENTS!;
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    const recentSubmissions = await databases.listDocuments(databaseId, rateLimitCollectionId, [
      Query.equal('tenant_id', body.tenant_slug),
      Query.equal('visitor_hash', visitorHash),
      Query.greaterThan('timestamp', windowStart),
      Query.limit(RATE_LIMIT_MAX_PER_HOUR + 1),
    ]);

    if (recentSubmissions.documents.length >= RATE_LIMIT_MAX_PER_HOUR) {
      return res.json({ error: 'Trop de soumissions récentes. Merci de réessayer plus tard.' }, 429);
    }

    await databases.createDocument(databaseId, rateLimitCollectionId, ID.unique(), {
      tenant_id: body.tenant_slug,
      visitor_hash: visitorHash,
      timestamp: new Date().toISOString(),
    });

    // --- 4. Résoudre ou créer le client (customer) ---
    const customersCollectionId = process.env.APPWRITE_COLLECTION_CUSTOMERS!;
    const now = new Date();
    let customerId: string | undefined;

    const normalizedPhone = body.phone ? normalizePhone(body.phone) : undefined;

    // Priorité au téléphone (signal fort et volontaire) s'il est fourni,
    // sinon on retombe sur l'empreinte visiteur (signal automatique).
    let existingCustomer: any = null;

    if (normalizedPhone) {
      const byPhone = await databases.listDocuments(databaseId, customersCollectionId, [
        Query.equal('tenant_id', body.tenant_slug),
        Query.equal('phone', normalizedPhone),
        Query.limit(1),
      ]);
      existingCustomer = byPhone.documents[0] ?? null;
    }

    if (!existingCustomer) {
      const byHash = await databases.listDocuments(databaseId, customersCollectionId, [
        Query.equal('tenant_id', body.tenant_slug),
        Query.equal('visitor_hash', visitorHash),
        Query.limit(1),
      ]);
      existingCustomer = byHash.documents[0] ?? null;
    }

    if (existingCustomer) {
      const updated = await databases.updateDocument(databaseId, customersCollectionId, existingCustomer.$id, {
        last_seen: now.toISOString(),
        visit_count: (existingCustomer.visit_count ?? 0) + 1,
        status: 'ACTIVE',
        // On complète le profil si le client donne enfin son nom/téléphone
        // sur une visite ultérieure, sans écraser des infos déjà connues.
        phone: normalizedPhone ?? existingCustomer.phone,
        name: body.name ?? existingCustomer.name,
      });
      customerId = updated.$id;
    } else {
      const created = await databases.createDocument(databaseId, customersCollectionId, ID.unique(), {
        tenant_id: body.tenant_slug,
        phone: normalizedPhone,
        name: body.name,
        visitor_hash: visitorHash,
        first_seen: now.toISOString(),
        last_seen: now.toISOString(),
        visit_count: 1,
        status: 'ACTIVE',
      });
      customerId = created.$id;
    }

    // --- 5. Insérer le scan, lié au customer ---
    const { year, week_number, day_of_week } = getISOYearWeek(now);
    const scanCollectionId = collectionForCategory(body.category);

    await databases.createDocument(databaseId, scanCollectionId, ID.unique(), {
      ...body.data,
      tenant_id: body.tenant_slug,
      customer_id: customerId,
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