//appwrite/functions/get-tenant-statistics/src/main.ts
import { Client, Databases, Users, Query } from 'node-appwrite';

interface RequestPayload {
  tenant_slug: string;
  block_start_year: number;
  block_start_week: number;
}

type ScanCategory = 'RESTAURANT' | 'FASTFOOD' | 'PHARMACIE' | 'ENTREPRISE';

// Approximation volontaire : on traite chaque année comme ayant 52 semaines
// pour le calcul de navigation par bloc. Les années à 53 semaines ISO
// (rares) décaleront le libellé d'une semaine autour du Nouvel An — impact
// cosmétique mineur, pas une erreur de données (les vraies semaines ISO
// des scans, elles, restent correctes puisqu'elles viennent de getISOYearWeek
// côté client au moment de la soumission).
const WEEKS_PER_YEAR = 52;

function computeBlockWeeks(startYear: number, startWeek: number): Array<{ year: number; week: number }> {
  const weeks: Array<{ year: number; week: number }> = [];
  let year = startYear;
  let week = startWeek;
  for (let i = 0; i < 4; i++) {
    weeks.push({ year, week });
    week++;
    if (week > WEEKS_PER_YEAR) {
      week = 1;
      year++;
    }
  }
  return weeks;
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

/**
 * Renvoie des statistiques déjà agrégées pour un tenant, sur un bloc de
 * 4 semaines ISO consécutives — jamais une ligne de scan individuelle.
 * Appelée aussi bien par le Studio (admin/analyste, accès à tous les
 * tenants) que par l'espace client (gérant, accès uniquement à son propre
 * tenant) — la distinction se fait via la vérification d'appartenance
 * aux Teams ci-dessous.
 */
export default async ({ req, res, log, error }: any) => {
  let body: RequestPayload;

  try {
    body = JSON.parse(req.bodyText || '{}');
  } catch {
    return res.json({ error: 'Corps de requête invalide.' }, 400);
  }

  if (!body.tenant_slug || !body.block_start_year || !body.block_start_week) {
    return res.json({ error: 'Paramètres manquants.' }, 400);
  }

  // Appwrite transmet l'ID de l'utilisateur authentifié qui a déclenché
  // l'exécution dans cet en-tête, lorsque la Function est appelée avec une
  // session active (execute: "users"). Si ce header n'est jamais rempli
  // dans ta version d'Appwrite, dis-le-moi — il faudra passer par le JWT
  // (x-appwrite-user-jwt) à la place, avec une vérification légèrement différente.
  const callerUserId = req.headers['x-appwrite-user-id'];

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

  try {
    // --- 1. Vérifier les droits de l'appelant sur CE tenant précis ---
    const memberships = await users.listMemberships(callerUserId);
    const teamNames = memberships.memberships.map((m: any) => m.teamName);
    const isAdminOrAnalyst = teamNames.includes('admins') || teamNames.includes('analysts');
    const isTenantMember = teamNames.includes(`tenant_${body.tenant_slug}`);

    if (!isAdminOrAnalyst && !isTenantMember) {
      return res.json({ error: 'Accès refusé pour cette structure.' }, 403);
    }

    // --- 2. Charger le tenant pour connaître sa catégorie ---
    const tenantResult = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_TENANTS!, [
      Query.equal('slug', body.tenant_slug),
      Query.limit(1),
    ]);
    const tenant = tenantResult.documents[0] as any;
    if (!tenant) return res.json({ error: 'Structure introuvable.' }, 404);

    const category = tenant.category as ScanCategory;
    const scanCollectionId = collectionForCategory(category);
    const blockWeeks = computeBlockWeeks(body.block_start_year, body.block_start_week);

    // --- 3. Récupérer tous les scans du bloc, semaine par semaine ---
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

    // --- 4. Volume par semaine ---
    const volume_by_week = blockWeeks.map(({ year, week }) => ({
      week,
      count: scansByWeek[`${year}-${week}`].length,
    }));

    // --- 5. Satisfaction moyenne par semaine (quand le champ existe) ---
    const avg_satisfaction_by_week = blockWeeks.map(({ year, week }) => {
      const scans = scansByWeek[`${year}-${week}`];
      const values = scans.map((s) => s.satisfaction_global).filter((v: any) => typeof v === 'number');
      const value =
        values.length > 0
          ? Number((values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(2))
          : null;
      return { week, value };
    });

    // --- 6. Graphiques spécifiques à la catégorie ---
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

    // --- 7. Performance : statuts des rapports hebdo PUBLIÉS sur le bloc ---
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
        // Rapport mal formé : ignoré silencieusement, n'interrompt pas le calcul global.
      }
    }

    const firstWeek = blockWeeks[0];
    const lastWeek = blockWeeks[blockWeeks.length - 1];

    return res.json(
      {
        category, // NOUVEAU — renvoyé directement, plus besoin de le deviner côté front
        block_label: `Semaines ${firstWeek.week}-${lastWeek.week} — ${firstWeek.year}`,
        weeks: blockWeeks.map((w) => w.week),
        performance,
        volume_by_week,
        avg_satisfaction_by_week,
        category_specific,
      },
      200
    );
  } catch (err) {
    error('Erreur get-tenant-statistics: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};