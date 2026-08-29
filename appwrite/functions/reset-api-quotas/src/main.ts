//appwrite/functions/reset-api-quotas/src/main.ts
import { Client, Databases, Query } from 'node-appwrite';

/**
 * Remet à zéro le compteur mensuel de chaque clé API active, et avance
 * sa date de reset au mois suivant. Ne touche jamais les clés REVOKED —
 * pas la peine de les faire vivre à nouveau.
 */
export default async ({ req, res, log, error }: any) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    const collectionId = process.env.APPWRITE_COLLECTION_API_KEYS!;

    let resetCount = 0;
    let cursor: string | undefined;

    while (true) {
      const queries = [Query.notEqual('status', 'REVOKED'), Query.limit(100)];
      if (cursor) queries.push(Query.cursorAfter(cursor));

      const result = await databases.listDocuments(databaseId, collectionId, queries);

      for (const key of result.documents as any[]) {
        const nextReset = new Date();
        nextReset.setMonth(nextReset.getMonth() + 1);
        nextReset.setDate(1);
        nextReset.setHours(2, 0, 0, 0);

        await databases.updateDocument(databaseId, collectionId, key.$id, {
          requests_used: 0,
          period_reset_at: nextReset.toISOString(),
        });
        resetCount++;
      }

      if (result.documents.length < 100) break;
      cursor = result.documents[result.documents.length - 1].$id;
    }

    log(`${resetCount} clé(s) réinitialisée(s).`);
    return res.json({ success: true, reset_count: resetCount }, 200);
  } catch (err) {
    error('Erreur reset-api-quotas: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};