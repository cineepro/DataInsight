//appwrite/functions/recompute-churn-status/src/main.ts
import { Client, Databases, Query } from 'node-appwrite';
import { detectChurnRisk, getDefaultThresholds, type Customer } from '@datainsight/engine';

/**
 * Tâche planifiée (quotidienne) : recalcule le statut de fidélité
 * (ACTIVE / AT_RISK / CHURNED) de tous les clients, pour toutes les
 * structures, et persiste le résultat.
 *
 * Avant cette fonction, le statut n'était mis à jour qu'à deux moments :
 * à chaque nouvelle visite (remis à ACTIVE), ou manuellement depuis
 * Studio ("Recalculer les statuts"). Un client qui cesse de revenir sans
 * qu'un analyste ne relance jamais le calcul pouvait donc rester marqué
 * ACTIVE indéfiniment. Cette tâche comble cet écart.
 */
export default async ({ req, res, log, error }: any) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    const tenantsCollectionId = process.env.APPWRITE_COLLECTION_TENANTS!;
    const customersCollectionId = process.env.APPWRITE_COLLECTION_CUSTOMERS!;
    const thresholdsCollectionId = process.env.APPWRITE_COLLECTION_ANALYSIS_THRESHOLDS!;

    // --- 1. Seuils : configuration éventuellement personnalisée, sinon les valeurs par défaut du moteur ---
    const defaults = getDefaultThresholds('common.churn_risk');
    let thresholds = defaults;
    try {
      const thresholdDoc = await databases.listDocuments(databaseId, thresholdsCollectionId, [
        Query.equal('function_id', 'common.churn_risk'),
        Query.limit(1),
      ]);
      const stored = thresholdDoc.documents[0] as any;
      if (stored?.config) {
        thresholds = { ...defaults, ...JSON.parse(stored.config) };
      }
    } catch (thresholdErr) {
      log('Seuils personnalisés introuvables ou invalides, utilisation des valeurs par défaut: ' + (thresholdErr as Error).message);
    }

    // --- 2. Toutes les structures, toutes catégories confondues ---
    const tenants: Array<{ $id: string; slug: string }> = [];
    {
      let cursor: string | undefined;
      while (true) {
        const queries = [Query.limit(100)];
        if (cursor) queries.push(Query.cursorAfter(cursor));
        const result = await databases.listDocuments(databaseId, tenantsCollectionId, queries);
        tenants.push(...(result.documents as any[]).map((t) => ({ $id: t.$id, slug: t.slug })));
        if (result.documents.length < 100) break;
        cursor = result.documents[result.documents.length - 1].$id;
      }
    }

    let tenantsProcessed = 0;
    let customersChecked = 0;
    let customersUpdated = 0;

    // --- 3. Pour chaque structure : recalcule et persiste les statuts qui ont changé ---
    for (const tenant of tenants) {
      const customers: Customer[] = [];
      let cursor: string | undefined;
      while (true) {
        const queries = [Query.equal('tenant_id', tenant.slug), Query.limit(100)];
        if (cursor) queries.push(Query.cursorAfter(cursor));
        const result = await databases.listDocuments(databaseId, customersCollectionId, queries);
        customers.push(...(result.documents as unknown as Customer[]));
        if (result.documents.length < 100) break;
        cursor = result.documents[result.documents.length - 1].$id;
      }

      if (customers.length === 0) continue;
      tenantsProcessed++;

      const analysis = detectChurnRisk(customers, thresholds);

      for (const entry of analysis) {
        customersChecked++;
        const customer = customers.find((c) => c.$id === entry.customerId);
        if (customer && customer.status !== entry.riskLevel) {
          await databases.updateDocument(databaseId, customersCollectionId, entry.customerId, {
            status: entry.riskLevel,
          });
          customersUpdated++;
        }
      }
    }

    log(`${tenantsProcessed} structure(s) traitée(s), ${customersChecked} client(s) vérifié(s), ${customersUpdated} statut(s) mis à jour.`);

    return res.json(
      { success: true, tenants_processed: tenantsProcessed, customers_checked: customersChecked, customers_updated: customersUpdated },
      200
    );
  } catch (err) {
    error('Erreur recompute-churn-status: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};
