//appwrite/functions/compute-week-number/src/main.ts
import { Client, Databases, Query } from 'node-appwrite';

function getISOYearWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week_number = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week_number, day_of_week: dayNum };
}

const SCAN_COLLECTIONS = [
  () => process.env.APPWRITE_COLLECTION_SCANS_RESTAURANT!,
  () => process.env.APPWRITE_COLLECTION_SCANS_PHARMACIE!,
  () => process.env.APPWRITE_COLLECTION_SCANS_ENTREPRISE!,
];

/**
 * Tâche de maintenance planifiée (cron, tous les jours à 3h du matin).
 * Filet de sécurité : si un document a été créé sans year/week_number
 * correctement calculés (bug front, import manuel, migration...), cette
 * Function les recalcule à partir de `timestamp` et corrige le document.
 * En fonctionnement normal, elle ne trouve rien à corriger.
 */
export default async ({ req, res, log, error }: any) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  const databases = new Databases(client);
  const databaseId = process.env.APPWRITE_DATABASE_ID!;
  let totalFixed = 0;

  for (const getCollectionId of SCAN_COLLECTIONS) {
    const collectionId = getCollectionId();
    let cursor: string | undefined;

    while (true) {
      const queries = [Query.isNull('week_number'), Query.limit(100)];
      if (cursor) queries.push(Query.cursorAfter(cursor));

      const result = await databases.listDocuments(databaseId, collectionId, queries);
      if (result.documents.length === 0) break;

      for (const doc of result.documents as any[]) {
        try {
          const { year, week_number, day_of_week } = getISOYearWeek(new Date(doc.timestamp));
          await databases.updateDocument(databaseId, collectionId, doc.$id, {
            year,
            week_number,
            day_of_week,
          });
          totalFixed++;
        } catch (err) {
          error(`Erreur correction document ${doc.$id}: ${(err as Error).message}`);
        }
      }

      if (result.documents.length < 100) break;
      cursor = result.documents[result.documents.length - 1].$id;
    }
  }

  log(`compute-week-number: ${totalFixed} document(s) corrigé(s).`);
  return res.json({ fixed: totalFixed }, 200);
};