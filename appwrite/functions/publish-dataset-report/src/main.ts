//appwrite/functions/publish-dataset-report/src/main.ts
import { Client, Databases, Query, Permission, Role } from 'node-appwrite';

interface RequestPayload {
  reportId: string;
  analystId: string;
}

/**
 * Équivalent de publish-weekly-report, mais pour dataset_reports.
 * Utilise une clé API (pas une session utilisateur), donc AUCUNE
 * restriction sur les Teams autorisées en permission — c'est justement
 * ce qui permet d'accorder l'accès à la Team du tenant (tenant_<slug>),
 * même si le compte qui déclenche l'action n'en est pas membre lui-même.
 */
export default async ({ req, res, log, error }: any) => {
  let body: RequestPayload;

  try {
    body = JSON.parse(req.bodyText || '{}');
  } catch {
    return res.json({ error: 'Corps de requête invalide.' }, 400);
  }

  if (!body.reportId || !body.analystId) {
    return res.json({ error: 'Champs requis manquants.' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  const databases = new Databases(client);
  const databaseId = process.env.APPWRITE_DATABASE_ID!;

  try {
    const report = (await databases.getDocument(
      databaseId,
      process.env.APPWRITE_COLLECTION_DATASET_REPORTS!,
      body.reportId
    )) as any;

    const tenantResult = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_TENANTS!, [
      Query.equal('slug', report.tenant_id),
      Query.limit(1),
    ]);
    const tenant = tenantResult.documents[0] as any;

    const permissions = [
      Permission.read(Role.team(process.env.APPWRITE_TEAM_ADMINS_ID!)),
      Permission.update(Role.team(process.env.APPWRITE_TEAM_ADMINS_ID!)),
      Permission.delete(Role.team(process.env.APPWRITE_TEAM_ADMINS_ID!)),
    ];

    if (process.env.APPWRITE_TEAM_ANALYSTS_ID) {
      permissions.push(Permission.read(Role.team(process.env.APPWRITE_TEAM_ANALYSTS_ID)));
      permissions.push(Permission.update(Role.team(process.env.APPWRITE_TEAM_ANALYSTS_ID)));
    }

    if (tenant?.client_team_id) {
      permissions.push(Permission.read(Role.team(tenant.client_team_id)));
    }

    const updated = await databases.updateDocument(
      databaseId,
      process.env.APPWRITE_COLLECTION_DATASET_REPORTS!,
      body.reportId,
      {
        status: 'PUBLISHED',
        analyst_id: body.analystId,
        published_at: new Date().toISOString(),
      },
      permissions
    );

    return res.json({ success: true, report: updated }, 200);
  } catch (err) {
    error('Erreur publish-dataset-report: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};