//appwrite/functions/check-realtime-alert/src/main.ts
import { Client, Databases, Messaging, Query, ID } from 'node-appwrite';

const STOCKOUT_WINDOW_MS = 60 * 60 * 1000; // 1h
const STOCKOUT_THRESHOLD = 3;

const SATISFACTION_WINDOW_MS = 2 * 60 * 60 * 1000; // 2h
const SATISFACTION_THRESHOLD_COUNT = 4;
const SATISFACTION_LOW_VALUE = 2;

const ALERT_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2h — évite de spammer la même alerte

/**
 * Déclenchée automatiquement à chaque création de document (event Appwrite).
 * On identifie de QUELLE collection vient le document via les variables
 * d'environnement injectées par Appwrite (APPWRITE_FUNCTION_EVENT_DATA)
 * et on ignore silencieusement tout ce qui n'est pas un scan.
 */
export default async ({ req, res, log, error }: any) => {
  const eventData = req.bodyJson ?? JSON.parse(req.bodyText || '{}');
  const collectionId = eventData?.$collectionId;
  const tenantId = eventData?.tenant_id;

  const scanRestaurantId = process.env.APPWRITE_COLLECTION_SCANS_RESTAURANT!;
  const scanPharmacieId = process.env.APPWRITE_COLLECTION_SCANS_PHARMACIE!;

  const isRestaurantScan = collectionId === scanRestaurantId;
  const isPharmacieScan = collectionId === scanPharmacieId;

  if (!tenantId || (!isRestaurantScan && !isPharmacieScan)) {
    // Pas un scan restaurant/pharmacie : rien à vérifier, sortie silencieuse.
    return res.json({ skipped: true }, 200);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  const databases = new Databases(client);
  const messaging = new Messaging(client);
  const databaseId = process.env.APPWRITE_DATABASE_ID!;
  const alertsCollectionId = process.env.APPWRITE_COLLECTION_ALERTS_LOG!;

  try {
    if (isPharmacieScan && eventData.product_availability === 'RUPTURE') {
      await checkStockoutAlert(databases, databaseId, alertsCollectionId, tenantId, log);
    }

    if (isRestaurantScan && eventData.satisfaction_global <= SATISFACTION_LOW_VALUE) {
      await checkSatisfactionDropAlert(databases, databaseId, alertsCollectionId, tenantId, log);
    }

    return res.json({ checked: true }, 200);
  } catch (err) {
    error('Erreur check-realtime-alert: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }

  async function checkStockoutAlert(
    db: Databases,
    dbId: string,
    alertsId: string,
    tenant: string,
    logFn: any
  ) {
    const windowStart = new Date(Date.now() - STOCKOUT_WINDOW_MS).toISOString();
    const scans = await db.listDocuments(dbId, scanPharmacieId, [
      Query.equal('tenant_id', tenant),
      Query.equal('product_availability', 'RUPTURE'),
      Query.greaterThan('timestamp', windowStart),
      Query.limit(STOCKOUT_THRESHOLD + 1),
    ]);

    if (scans.documents.length >= STOCKOUT_THRESHOLD) {
      await triggerAlert(db, dbId, alertsId, tenant, 'STOCKOUT_CRITICAL', {
        count: scans.documents.length,
        windowMinutes: STOCKOUT_WINDOW_MS / 60000,
      }, logFn);
    }
  }

  async function checkSatisfactionDropAlert(
    db: Databases,
    dbId: string,
    alertsId: string,
    tenant: string,
    logFn: any
  ) {
    const windowStart = new Date(Date.now() - SATISFACTION_WINDOW_MS).toISOString();
    const scans = await db.listDocuments(dbId, scanRestaurantId, [
      Query.equal('tenant_id', tenant),
      Query.lessThanEqual('satisfaction_global', SATISFACTION_LOW_VALUE),
      Query.greaterThan('timestamp', windowStart),
      Query.limit(SATISFACTION_THRESHOLD_COUNT + 1),
    ]);

    if (scans.documents.length >= SATISFACTION_THRESHOLD_COUNT) {
      await triggerAlert(db, dbId, alertsId, tenant, 'SATISFACTION_DROP', {
        count: scans.documents.length,
        windowHours: SATISFACTION_WINDOW_MS / 3600000,
      }, logFn);
    }
  }

  async function triggerAlert(
    db: Databases,
    dbId: string,
    alertsId: string,
    tenant: string,
    alertType: string,
    details: Record<string, unknown>,
    logFn: any
  ) {
    // Anti-spam : ne redéclenche pas la même alerte si une existe déjà
    // dans la fenêtre de cooldown pour ce tenant.
    const cooldownStart = new Date(Date.now() - ALERT_COOLDOWN_MS).toISOString();
    const recentAlerts = await db.listDocuments(dbId, alertsId, [
      Query.equal('tenant_id', tenant),
      Query.equal('alert_type', alertType),
      Query.greaterThan('triggered_at', cooldownStart),
      Query.limit(1),
    ]);

    if (recentAlerts.documents.length > 0) {
      logFn(`Alerte ${alertType} déjà déclenchée récemment pour ${tenant}, cooldown actif.`);
      return;
    }

    await db.createDocument(dbId, alertsId, ID.unique(), {
      tenant_id: tenant,
      alert_type: alertType,
      details: JSON.stringify(details),
      triggered_at: new Date().toISOString(),
      notified: false,
    });

    // Notification email best-effort à l'équipe ASILLIA (pas au client final)
    try {
      const adminEmail = process.env.ALERT_NOTIFICATION_EMAIL;
      if (adminEmail) {
        await messaging.createEmail(
          ID.unique(),
          `⚠️ Alerte ${alertType} — ${tenant}`,
          `Une alerte a été déclenchée pour la structure ${tenant}.\n\nType : ${alertType}\nDétails : ${JSON.stringify(details)}`,
          [],
          [],
          [],
          [adminEmail]
        );
      }
    } catch (notifyErr) {
      logFn('Notification alerte non envoyée: ' + (notifyErr as Error).message);
    }
  }
};