//appwrite/functions/get-tenant-public-info/src/main.ts
import { Client, Databases, Query } from 'node-appwrite';

interface RequestPayload {
  slug: string;
}

interface TenantPublicInfo {
  name: string;
  logo_url?: string;
  category: string;
  menuItems?: string[];
}

export default async ({ req, res, log, error }: any) => {
  let body: RequestPayload;

  try {
    body = JSON.parse(req.bodyText || '{}');
  } catch {
    return res.json({ error: 'Corps de requête invalide.' }, 400);
  }

  if (!body.slug) {
    return res.json({ error: 'Paramètre "slug" manquant.' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  const databases = new Databases(client);
  const databaseId = process.env.APPWRITE_DATABASE_ID!;

  try {
    const result = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_TENANTS!, [
      Query.equal('slug', body.slug),
      Query.limit(1),
    ]);

    if (result.documents.length === 0) {
      return res.json({ error: 'Structure introuvable.' }, 404);
    }

    const doc = result.documents[0] as any;

    const publicInfo: TenantPublicInfo = {
      name: doc.name,
      logo_url: doc.logo_url,
      category: doc.category,
    };

    // Le menu n'est chargé que pour les catégories concernées, pour ne
    // pas faire de requête inutile sur pharmacie/entreprise.
    if (doc.category === 'RESTAURANT' || doc.category === 'FASTFOOD') {
      const menuResult = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_MENU_ITEMS!, [
        Query.equal('tenant_id', body.slug),
        Query.equal('active', true),
        Query.orderAsc('name'),
        Query.limit(200),
      ]);
      publicInfo.menuItems = menuResult.documents.map((item: any) => item.name);
    }

    return res.json(publicInfo, 200);
  } catch (err) {
    error('Erreur get-tenant-public-info: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};