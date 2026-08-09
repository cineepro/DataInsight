//appwrite/functions/publish-weekly-report/src/main.ts
import { Client, Databases, Messaging, Query, ID } from 'node-appwrite';

interface RequestPayload {
  reportId: string;
  analystId: string;
}

/**
 * Marque un rapport comme PUBLISHED et, si le tenant a un contact_email,
 * envoie une notification par email via Appwrite Messaging.
 * L'envoi d'email est optionnel : s'il échoue ou si aucun provider n'est
 * configuré, la publication du rapport reste effective.
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
  const messaging = new Messaging(client);
  const databaseId = process.env.APPWRITE_DATABASE_ID!;

  try {
    const updated = await databases.updateDocument(
      databaseId,
      process.env.APPWRITE_COLLECTION_WEEKLY_REPORTS!,
      body.reportId,
      {
        status: 'PUBLISHED',
        analyst_id: body.analystId,
        published_at: new Date().toISOString(),
      }
    );

    const report = updated as any;

    // Notification email best-effort : ne bloque jamais la publication si elle échoue.
    try {
      const tenantResult = await databases.listDocuments(
        databaseId,
        process.env.APPWRITE_COLLECTION_TENANTS!,
        [Query.equal('slug', report.tenant_id), Query.limit(1)]
      );
      const tenant = tenantResult.documents[0] as any;

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