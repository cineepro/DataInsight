//appwrite/functions/publish-weekly-report/src/main.ts
import { Client, Databases, Messaging, Query, ID, Permission, Role } from 'node-appwrite';

interface RequestPayload {
  reportId: string;
  analystId: string;
}

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
  const messaging = new Messaging(client);
  const databaseId = process.env.APPWRITE_DATABASE_ID!;

  try {
    // Récupère d'abord le report pour connaître le tenant concerné
    const report = (await databases.getDocument(
      databaseId,
      process.env.APPWRITE_COLLECTION_WEEKLY_REPORTS!,
      body.reportId
    )) as any;

    const tenantResult = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_TENANTS!, [
      Query.equal('slug', report.tenant_id),
      Query.limit(1),
    ]);
    const tenant = tenantResult.documents[0] as any;

    // Permissions du document : admins/analysts gardent tout accès,
    // + lecture pour la Team du tenant SI l'accès client a été provisionné.
    const permissions = [
  Permission.read(Role.team(process.env.APPWRITE_TEAM_ADMINS_ID!)),
  Permission.read(Role.team(process.env.APPWRITE_TEAM_ANALYSTS_ID!)),
  Permission.update(Role.team(process.env.APPWRITE_TEAM_ADMINS_ID!)),
  Permission.update(Role.team(process.env.APPWRITE_TEAM_ANALYSTS_ID!)),
  Permission.delete(Role.team(process.env.APPWRITE_TEAM_ADMINS_ID!)),
];

    if (tenant?.client_team_id) {
      permissions.push(Permission.read(Role.team(tenant.client_team_id)));
    }

    const updated = await databases.updateDocument(
      databaseId,
      process.env.APPWRITE_COLLECTION_WEEKLY_REPORTS!,
      body.reportId,
      {
        status: 'PUBLISHED',
        analyst_id: body.analystId,
        published_at: new Date().toISOString(),
      },
      permissions
    );

    // Notification email best-effort, inchangée
    try {
      if (tenant?.contact_email) {
        await messaging.createEmail(
          ID.unique(),
          `Votre rapport hebdomadaire — Semaine ${report.week_number}`,
          `Bonjour,\n\nVotre nouveau rapport d'analyse (Semaine ${report.week_number} - ${report.year}) est disponible sur votre espace ASILLIA DataInsight.\n\nCordialement,\nL'équipe ASILLIA`,
          [],
          [],
          [],
          [tenant.contact_email]
        );
      }
    } catch (notifyErr) {
      error('Notification email non envoyée: ' + (notifyErr as Error).message);
    }

    return res.json({ success: true, report: updated }, 200);
  } catch (err) {
    error('Erreur publish-weekly-report: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};