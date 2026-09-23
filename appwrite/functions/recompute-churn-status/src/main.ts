//appwrite/functions/recompute-churn-status/src/main.ts
import { Client, Databases, Query, ID } from 'node-appwrite';
import { detectChurnRisk, getDefaultThresholds, computeIndividualTracking, type Customer, type DatasetColumnDef, type DatasetRow } from '@datainsight/engine';

/**
 * Tâche planifiée (quotidienne) : recalcule automatiquement trois statuts
 * qui, avant cette fonction, ne changeaient jamais tout seuls :
 *
 * 1. Le statut de fidélité client (ACTIVE / AT_RISK / CHURNED) — n'était
 *    mis à jour qu'à chaque nouvelle visite (remis à ACTIVE) ou
 *    manuellement depuis Studio ("Recalculer les statuts").
 * 2. Le statut de paiement d'un abonnement (TRIAL / PAID / OVERDUE /
 *    CANCELLED) — un essai qui expire sans paiement, ou une échéance
 *    dépassée sans nouveau règlement, restait affiché tel quel
 *    indéfiniment, sans jamais basculer en OVERDUE.
 * 3. Le statut de suivi individuel des datasets importés (ACTIVE /
 *    AT_RISK) — le pendant du n°1, mais pour les structures qui
 *    n'utilisent pas les QR codes (ex: G.N.A Consult) et n'ont donc
 *    aucun client suivi via ce mécanisme.
 *
 * Les trois corrections suivent le même principe : un champ de statut
 * affiché à l'écran doit être régulièrement recalculé contre l'horloge,
 * pas seulement mis à jour au moment de sa création.
 */
export default async ({ req, res, log, error }: any) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID!;

    const churnResult = await recomputeChurnStatuses(databases, databaseId, log);
    const billingResult = await recomputeSubscriptionStatuses(databases, databaseId, log);
    const trackingResult = await recomputeDatasetTracking(databases, databaseId, log);

    log(
      `Clients — ${churnResult.tenantsProcessed} structure(s), ${churnResult.customersChecked} client(s) vérifié(s), ${churnResult.customersUpdated} statut(s) mis à jour. ` +
      `Abonnements — ${billingResult.subscriptionsChecked} vérifié(s), ${billingResult.subscriptionsUpdated} passé(s) en retard. ` +
      `Suivi datasets — ${trackingResult.datasetsProcessed} dataset(s), ${trackingResult.individualsChecked} personne(s) vérifiée(s), ${trackingResult.newAlerts} nouvelle(s) alerte(s).`
    );

    return res.json({ success: true, churn: churnResult, billing: billingResult, tracking: trackingResult }, 200);
  } catch (err) {
    error('Erreur recompute-churn-status: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};

// ---------------------------------------------------------------------
// 1. Statut de fidélité client
// ---------------------------------------------------------------------
async function recomputeChurnStatuses(databases: Databases, databaseId: string, log: any) {
  const tenantsCollectionId = process.env.APPWRITE_COLLECTION_TENANTS!;
  const customersCollectionId = process.env.APPWRITE_COLLECTION_CUSTOMERS!;
  const thresholdsCollectionId = process.env.APPWRITE_COLLECTION_ANALYSIS_THRESHOLDS!;

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

  return { tenantsProcessed, customersChecked, customersUpdated };
}

// ---------------------------------------------------------------------
// 2. Statut de paiement d'abonnement
// ---------------------------------------------------------------------
async function recomputeSubscriptionStatuses(databases: Databases, databaseId: string, log: any) {
  const subscriptionsCollectionId = process.env.APPWRITE_COLLECTION_SUBSCRIPTIONS!;
  const now = new Date();

  let subscriptionsChecked = 0;
  let subscriptionsUpdated = 0;
  let cursor: string | undefined;

  while (true) {
    const queries = [
      // Seuls TRIAL et PAID peuvent glisser vers OVERDUE — CANCELLED et
      // OVERDUE sont déjà dans leur état final ou déjà signalés.
      Query.equal('payment_status', ['TRIAL', 'PAID']),
      Query.limit(100),
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const result = await databases.listDocuments(databaseId, subscriptionsCollectionId, queries);

    for (const sub of result.documents as any[]) {
      subscriptionsChecked++;

      const isTrialExpired = sub.payment_status === 'TRIAL' && sub.trial_end_date && new Date(sub.trial_end_date) < now;
      const isPaymentOverdue = sub.payment_status === 'PAID' && sub.next_due_date && new Date(sub.next_due_date) < now;

      if (isTrialExpired || isPaymentOverdue) {
        await databases.updateDocument(databaseId, subscriptionsCollectionId, sub.$id, {
          payment_status: 'OVERDUE',
        });
        subscriptionsUpdated++;
      }
    }

    if (result.documents.length < 100) break;
    cursor = result.documents[result.documents.length - 1].$id;
  }

  return { subscriptionsChecked, subscriptionsUpdated };
}

// ---------------------------------------------------------------------
// 3. Suivi individuel des datasets importés (hors QR code)
// ---------------------------------------------------------------------
async function recomputeDatasetTracking(databases: Databases, databaseId: string, log: any) {
  const configsCollectionId = process.env.APPWRITE_COLLECTION_DATASET_TRACKING_CONFIGS!;
  const individualsCollectionId = process.env.APPWRITE_COLLECTION_DATASET_TRACKED_INDIVIDUALS!;
  const columnsCollectionId = process.env.APPWRITE_COLLECTION_DATASET_COLUMNS!;
  const rowsCollectionId = process.env.APPWRITE_COLLECTION_DATASET_ROWS!;
  const alertsCollectionId = process.env.APPWRITE_COLLECTION_ALERTS_LOG!;

  const configs: any[] = [];
  {
    let cursor: string | undefined;
    while (true) {
      const queries = [Query.equal('enabled', true), Query.limit(100)];
      if (cursor) queries.push(Query.cursorAfter(cursor));
      const result = await databases.listDocuments(databaseId, configsCollectionId, queries);
      configs.push(...result.documents);
      if (result.documents.length < 100) break;
      cursor = result.documents[result.documents.length - 1].$id;
    }
  }

  let datasetsProcessed = 0;
  let individualsChecked = 0;
  let newAlerts = 0;

  for (const config of configs) {
    // Colonnes du dataset, pour reconstituer les DatasetColumnDef attendus par le moteur.
    const columnsResult = await databases.listDocuments(databaseId, columnsCollectionId, [
      Query.equal('dataset_id', config.dataset_id),
      Query.limit(200),
    ]);
    const columns = columnsResult.documents as unknown as DatasetColumnDef[];
    const findCol = (key: string) => columns.find((c) => c.key === key) ?? null;

    const identifierCol = findCol(config.identifier_column_key);
    const periodCol = findCol(config.period_column_key);
    const activityCol = findCol(config.activity_column_key);
    const labelCol = config.label_column_key ? findCol(config.label_column_key) : null;
    if (!identifierCol || !periodCol || !activityCol) {
      log(`Suivi ignoré pour le dataset ${config.dataset_id} : colonnes introuvables (mapping modifié depuis ?).`);
      continue;
    }

    // Lignes du dataset (payload stocké en JSON string, à parser).
    const rows: DatasetRow[] = [];
    {
      let cursor: string | undefined;
      while (true) {
        const queries = [Query.equal('dataset_id', config.dataset_id), Query.limit(100)];
        if (cursor) queries.push(Query.cursorAfter(cursor));
        const result = await databases.listDocuments(databaseId, rowsCollectionId, queries);
        rows.push(
          ...(result.documents as any[]).map((doc) => ({
            $id: doc.$id,
            dataset_id: doc.dataset_id,
            row_index: doc.row_index,
            payload: JSON.parse(doc.payload) as Record<string, unknown>,
          }))
        );
        if (result.documents.length < 100) break;
        cursor = result.documents[result.documents.length - 1].$id;
      }
    }
    if (rows.length === 0) continue;
    datasetsProcessed++;

    const results = computeIndividualTracking(rows, identifierCol, periodCol, activityCol, config.inactivity_threshold ?? 3, labelCol);

    // Fiches déjà connues pour ce dataset, pour mettre à jour plutôt que dupliquer.
    const existingResult = await databases.listDocuments(databaseId, individualsCollectionId, [
      Query.equal('dataset_id', config.dataset_id),
      Query.limit(500),
    ]);
    const existingByIdentifier = new Map((existingResult.documents as any[]).map((d) => [d.identifier_value, d]));

    for (const entry of results) {
      individualsChecked++;
      const existing = existingByIdentifier.get(entry.identifierValue);
      const payload = {
        dataset_id: config.dataset_id,
        tenant_id: config.tenant_id,
        identifier_value: entry.identifierValue,
        label: entry.label,
        status: entry.status,
        last_active_period: entry.lastActivePeriod,
        periods_since_active: entry.periodsSinceActive,
        updated_at: new Date().toISOString(),
      };

      const wasAtRisk = existing?.status === 'AT_RISK';
      const becomesAtRisk = entry.status === 'AT_RISK';

      if (existing) {
        await databases.updateDocument(databaseId, individualsCollectionId, existing.$id, payload);
      } else {
        await databases.createDocument(databaseId, individualsCollectionId, ID.unique(), payload);
      }

      // On n'alerte qu'à l'ENTRÉE dans l'état à risque, jamais tant qu'on y reste déjà — sinon la même personne redéclenche une alerte chaque jour.
      if (becomesAtRisk && !wasAtRisk) {
        await databases.createDocument(databaseId, alertsCollectionId, ID.unique(), {
          tenant_id: config.tenant_id,
          alert_type: 'DATASET_TRACKING_AT_RISK',
          details: JSON.stringify({ dataset_id: config.dataset_id, identifier: entry.identifierValue, label: entry.label, periodsSinceActive: entry.periodsSinceActive }),
          triggered_at: new Date().toISOString(),
          notified: false,
        });
        newAlerts++;
      }
    }
  }

  return { datasetsProcessed, individualsChecked, newAlerts };
}
