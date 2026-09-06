//appwrite/functions/get-tenant-statistics/src/main.ts
import { Client, Databases, Users, Query } from 'node-appwrite';

interface RequestPayload {
  tenant_slug: string;
  block_start_year: number;
  block_start_week: number;
}

type ScanCategory = 'RESTAURANT' | 'FASTFOOD' | 'PHARMACIE' | 'ENTREPRISE';

/**
 * Nombre de semaines ISO dans une année : 52 la plupart du temps, 53
 * certaines années (même formule que packages/shared/src/utils/weekNumber.ts —
 * dupliquée ici volontairement plutôt que d'ajouter une dépendance au
 * package partagé et le bundling qui irait avec, pour 3 lignes de calcul).
 */
function isoWeeksInYear(year: number): number {
  const p = (y: number) => (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;
  return p(year) === 4 || p(year - 1) === 3 ? 53 : 52;
}

function computeBlockWeeks(startYear: number, startWeek: number): Array<{ year: number; week: number }> {
  const weeks: Array<{ year: number; week: number }> = [];
  let year = startYear;
  let week = startWeek;
  for (let i = 0; i < 4; i++) {
    weeks.push({ year, week });
    week++;
    if (week > isoWeeksInYear(year)) {
      week = 1;
      year++;
    }
  }
  return weeks;
}

// Calcule le lundi d'une semaine ISO donnée (algorithme standard ISO-8601).
function mondayOfISOWeek(year: number, week: number): Date {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dayOfWeek = simple.getUTCDay() || 7;
  const monday = new Date(simple);
  if (dayOfWeek <= 4) {
    monday.setUTCDate(simple.getUTCDate() - dayOfWeek + 1);
  } else {
    monday.setUTCDate(simple.getUTCDate() + 8 - dayOfWeek);
  }
  return monday;
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

async function fetchAllForWeek(
  databases: Databases,
  databaseId: string,
  collectionId: string,
  tenantSlug: string,
  year: number,
  week: number
): Promise<any[]> {
  const documents: any[] = [];
  let cursor: string | undefined;

  while (true) {
    const queries = [
      Query.equal('tenant_id', tenantSlug),
      Query.equal('year', year),
      Query.equal('week_number', week),
      Query.limit(100),
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const response = await databases.listDocuments(databaseId, collectionId, queries);
    documents.push(...response.documents);

    if (response.documents.length < 100) break;
    cursor = response.documents[response.documents.length - 1].$id;
  }

  return documents;
}

function distributionOf(
  scans: any[],
  field: string,
  labels: Record<string, string> | null
): Array<{ label: string; value: number }> {
  const counts = new Map<string, number>();

  for (const scan of scans) {
    const raw = scan[field];
    if (raw === undefined || raw === null || raw === '') continue;
    const key = String(raw);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([key, value]) => ({ label: labels?.[key] ?? key, value }))
    .sort((a, b) => b.value - a.value);
}

export default async ({ req, res, log, error }: any) => {
  try {
    let body: RequestPayload;
    try {
      body = JSON.parse(req.bodyText || '{}');
    } catch {
      return res.json({ error: 'Corps de requête invalide.' }, 400);
    }

    if (!body.tenant_slug || !body.block_start_year || !body.block_start_week) {
      return res.json({ error: 'Paramètres manquants.' }, 400);
    }

    const headers = req.headers ?? {};
    const callerUserId = headers['x-appwrite-user-id'];

    if (!callerUserId) {
      return res.json({ error: 'Authentification requise.' }, 401);
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const users = new Users(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID!;

    // --- 1. Vérifier les droits de l'appelant ---
    const memberships = await users.listMemberships(callerUserId);
    const teamNames = memberships.memberships.map((m: any) => m.teamName);
    const isAdminOrAnalyst = teamNames.includes('admins') || teamNames.includes('analysts');
    const isTenantMember = teamNames.includes(`tenant_${body.tenant_slug}`);

    if (!isAdminOrAnalyst && !isTenantMember) {
      return res.json({ error: 'Accès refusé pour cette structure.' }, 403);
    }

    // --- 2. Charger le tenant ---
    const tenantResult = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_TENANTS!, [
      Query.equal('slug', body.tenant_slug),
      Query.limit(1),
    ]);
    const tenant = tenantResult.documents[0] as any;
    if (!tenant) return res.json({ error: 'Structure introuvable.' }, 404);

    const category = tenant.category as ScanCategory;
    const scanCollectionId = collectionForCategory(category);
    const blockWeeks = computeBlockWeeks(body.block_start_year, body.block_start_week);

    // --- 3. Scans du bloc (données QR Code) ---
    const scansByWeek: Record<string, any[]> = {};
    for (const { year, week } of blockWeeks) {
      scansByWeek[`${year}-${week}`] = await fetchAllForWeek(
        databases,
        databaseId,
        scanCollectionId,
        body.tenant_slug,
        year,
        week
      );
    }
    const allScans = Object.values(scansByWeek).flat();

    const volume_by_week = blockWeeks.map(({ year, week }) => ({
      week,
      count: scansByWeek[`${year}-${week}`].length,
    }));

    const avg_satisfaction_by_week = blockWeeks.map(({ year, week }) => {
      const scans = scansByWeek[`${year}-${week}`];
      const values = scans.map((s) => s.satisfaction_global).filter((v: any) => typeof v === 'number');
      const value =
        values.length > 0
          ? Number((values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(2))
          : null;
      return { week, value };
    });

    const category_specific: Record<string, unknown> = {};

    if (category === 'RESTAURANT' || category === 'FASTFOOD') {
      category_specific.wait_time_distribution = distributionOf(allScans, 'wait_time_bucket', {
        LT15: '< 15 min',
        '15_30': '15-30 min',
        GT30: '> 30 min',
      });
      category_specific.visit_type_distribution = distributionOf(allScans, 'visit_type', {
        SOLO: 'Solo',
        DEJEUNER_PRO: 'Déjeuner pro',
        FAMILLE: 'Famille',
        AMIS: 'Amis',
      });
    } else if (category === 'PHARMACIE') {
      category_specific.stockout_rate_by_week = blockWeeks.map(({ year, week }) => {
        const scans = scansByWeek[`${year}-${week}`];
        const total = scans.length;
        const stockouts = scans.filter((s: any) => s.product_availability === 'RUPTURE').length;
        return { week, rate: total > 0 ? Number(((stockouts / total) * 100).toFixed(1)) : 0 };
      });
      category_specific.visit_reason_distribution = distributionOf(allScans, 'visit_reason', {
        ORDONNANCE: 'Ordonnance',
        PARAPHARMACIE: 'Parapharmacie',
        DEPANNAGE: 'Dépannage',
        CONSEIL: 'Conseil',
      });
    } else {
      category_specific.interaction_type_distribution = distributionOf(allScans, 'interaction_type', null);
    }

    // --- 4. Performance des rapports hebdomadaires publiés sur le bloc ---
    const performance = { optimal: 0, warning: 0, critical: 0 };

    for (const { year, week } of blockWeeks) {
      const reportResult = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_WEEKLY_REPORTS!, [
        Query.equal('tenant_id', body.tenant_slug),
        Query.equal('year', year),
        Query.equal('week_number', week),
        Query.equal('status', 'PUBLISHED'),
        Query.limit(1),
      ]);
      const report = reportResult.documents[0] as any;
      if (!report) continue;

      try {
        const results = JSON.parse(report.analysis_result) as Array<{ status: string }>;
        for (const r of results) {
          if (r.status === 'OPTIMAL') performance.optimal++;
          else if (r.status === 'WARNING') performance.warning++;
          else if (r.status === 'CRITICAL') performance.critical++;
        }
      } catch {
        // Rapport mal formé : ignoré.
      }
    }

    // --- 5. NOUVEAU — Performance des analyses de données brutes (dataset_reports) ---
    const dataset_performance = { optimal: 0, warning: 0, critical: 0 };
    const datasets_breakdown: Array<{
      dataset_name: string;
      period_label: string;
      optimal: number;
      warning: number;
      critical: number;
    }> = [];

    const firstWeek = blockWeeks[0];
    const lastWeek = blockWeeks[blockWeeks.length - 1];

    const blockStartDate = mondayOfISOWeek(firstWeek.year, firstWeek.week);
    const blockEndDate = mondayOfISOWeek(lastWeek.year, lastWeek.week);
    blockEndDate.setUTCDate(blockEndDate.getUTCDate() + 6);
    blockEndDate.setUTCHours(23, 59, 59, 999);

    log('Fenêtre de dates pour les datasets: ' + blockStartDate.toISOString() + ' -> ' + blockEndDate.toISOString());

    const datasetReportsResult = await databases.listDocuments(
      databaseId,
      process.env.APPWRITE_COLLECTION_DATASET_REPORTS!,
      [
        Query.equal('tenant_id', body.tenant_slug),
        Query.equal('status', 'PUBLISHED'),
        Query.greaterThanEqual('published_at', blockStartDate.toISOString()),
        Query.lessThanEqual('published_at', blockEndDate.toISOString()),
        Query.limit(50),
      ]
    );

    if (datasetReportsResult.documents.length > 0) {
      // Récupère les noms/périodes des datasets concernés en une seule passe.
      const datasetIds = [...new Set(datasetReportsResult.documents.map((r: any) => r.dataset_id))];
      const datasetInfoMap = new Map<string, { name: string; period_label?: string }>();

      for (const datasetId of datasetIds) {
        try {
          const datasetDoc = await databases.getDocument(databaseId, process.env.APPWRITE_COLLECTION_DATASETS!, datasetId);
          datasetInfoMap.set(datasetId, { name: (datasetDoc as any).name, period_label: (datasetDoc as any).period_label });
        } catch {
          datasetInfoMap.set(datasetId, { name: 'Dataset supprimé', period_label: undefined });
        }
      }

      for (const report of datasetReportsResult.documents as any[]) {
        const info = datasetInfoMap.get(report.dataset_id) ?? { name: 'Dataset', period_label: undefined };
        const entry = { dataset_name: info.name, period_label: info.period_label ?? '', optimal: 0, warning: 0, critical: 0 };

        try {
          const results = JSON.parse(report.analysis_result) as Array<{ status: string }>;
          for (const r of results) {
            if (r.status === 'OPTIMAL') {
              dataset_performance.optimal++;
              entry.optimal++;
            } else if (r.status === 'WARNING') {
              dataset_performance.warning++;
              entry.warning++;
            } else if (r.status === 'CRITICAL') {
              dataset_performance.critical++;
              entry.critical++;
            }
          }
        } catch {
          // Rapport mal formé : ignoré.
        }

        datasets_breakdown.push(entry);
      }
    }

    log('Datasets trouvés dans le bloc: ' + datasets_breakdown.length);

    return res.json(
      {
        category,
        block_label: `Semaines ${firstWeek.week}-${lastWeek.week} — ${firstWeek.year}`,
        weeks: blockWeeks.map((w) => w.week),
        performance,
        volume_by_week,
        avg_satisfaction_by_week,
        category_specific,
        dataset_performance,
        datasets_breakdown,
      },
      200
    );
  } catch (err) {
    error('Erreur get-tenant-statistics: ' + (err as Error).message + ' | stack: ' + (err as Error).stack);
    return res.json({ error: 'Erreur serveur: ' + (err as Error).message }, 500);
  }
};