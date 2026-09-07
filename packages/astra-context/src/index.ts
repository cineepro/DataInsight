//packages/astra-context/src/index.ts
import { Query } from 'node-appwrite';

/**
 * Construction du contexte RAG pour Astra — extrait de ask-ai-lab et
 * api-ask-astra, qui contenaient chacun une copie identique de ces
 * fonctions. Toute correction (seuil d'anonymisation, secteurs couverts,
 * limite de constats partagés...) ne se fait donc plus qu'à un seul
 * endroit.
 *
 * `databases` est typé `any` volontairement : seule la forme de l'objet
 * compte ici (listDocuments avec la même signature que node-appwrite),
 * pas une dépendance stricte au type exact exporté par le SDK.
 */

export const MIN_TENANTS_FOR_BENCHMARK = 3;
export const MAX_FINDINGS_IN_CONTEXT = 12;

export const SECTOR_TO_TENANT_CATEGORIES: Record<string, string[]> = {
  RESTAURATION: ['RESTAURANT', 'FASTFOOD'],
  PHARMACIE: ['PHARMACIE'],
  COMMERCE_DETAIL: ['ENTREPRISE'],
  HOTELLERIE: [],
  GENERAL: [],
};

export interface SectorBenchmarkResult {
  text: string | null;
  distinctTenants: Set<string>;
}

/**
 * Variables d'environnement nécessaires — regroupées dans un objet
 * explicite plutôt que lues directement via process.env ici, pour que ce
 * package reste indépendant de tout runtime particulier et testable
 * facilement avec des valeurs arbitraires.
 */
export interface AstraContextEnv {
  scansRestaurantCollectionId: string;
  scansPharmacieCollectionId: string;
  scansEntrepriseCollectionId: string;
  weeklyReportsCollectionId: string;
  datasetReportsCollectionId: string;
  knowledgeBaseCollectionId: string;
}

export async function computeSectorBenchmark(
  databases: any,
  databaseId: string,
  sector: string,
  env: AstraContextEnv
): Promise<SectorBenchmarkResult> {
  const categories = SECTOR_TO_TENANT_CATEGORIES[sector] ?? [];
  const distinctTenants = new Set<string>();

  if (categories.length === 0) return { text: null, distinctTenants };

  const collectionMap: Record<string, string> = {
    RESTAURANT: env.scansRestaurantCollectionId,
    FASTFOOD: env.scansRestaurantCollectionId,
    PHARMACIE: env.scansPharmacieCollectionId,
    ENTREPRISE: env.scansEntrepriseCollectionId,
  };

  const satisfactionValues: number[] = [];
  let totalScans = 0;

  for (const category of categories) {
    const collectionId = collectionMap[category];
    if (!collectionId) continue;

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const result = await databases.listDocuments(databaseId, collectionId, [
      Query.greaterThan('timestamp', since),
      Query.limit(500),
    ]);

    for (const doc of result.documents as any[]) {
      distinctTenants.add(doc.tenant_id);
      totalScans++;
      if (typeof doc.satisfaction_global === 'number') {
        satisfactionValues.push(doc.satisfaction_global);
      }
    }
  }

  if (distinctTenants.size < MIN_TENANTS_FOR_BENCHMARK) {
    return { text: null, distinctTenants: new Set() };
  }

  const avgSatisfaction =
    satisfactionValues.length > 0
      ? (satisfactionValues.reduce((a, b) => a + b, 0) / satisfactionValues.length).toFixed(2)
      : null;

  const text = `Données agrégées et anonymisées de ${distinctTenants.size} structures du secteur (30 derniers jours) : ${totalScans} retours clients collectés${avgSatisfaction ? `, satisfaction moyenne de ${avgSatisfaction}/5` : ''}. Ces chiffres sont des moyennes globales, jamais liées à une structure identifiable.`;

  return { text, distinctTenants };
}

export async function fetchSectorFindings(
  databases: any,
  databaseId: string,
  eligibleTenantIds: Set<string>,
  env: AstraContextEnv
): Promise<string | null> {
  if (eligibleTenantIds.size < MIN_TENANTS_FOR_BENCHMARK) return null;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const allFindings: string[] = [];

  const weeklyResult = await databases.listDocuments(databaseId, env.weeklyReportsCollectionId, [
    Query.equal('status', 'PUBLISHED'),
    Query.greaterThan('published_at', since),
    Query.limit(100),
  ]);

  for (const report of weeklyResult.documents as any[]) {
    if (!eligibleTenantIds.has(report.tenant_id)) continue;
    try {
      const results = JSON.parse(report.analysis_result) as Array<{ keyFindings: string[] }>;
      for (const r of results) {
        if (Array.isArray(r.keyFindings)) allFindings.push(...r.keyFindings);
      }
    } catch {}
  }

  const datasetResult = await databases.listDocuments(databaseId, env.datasetReportsCollectionId, [
    Query.equal('status', 'PUBLISHED'),
    Query.greaterThan('published_at', since),
    Query.limit(100),
  ]);

  for (const report of datasetResult.documents as any[]) {
    if (!eligibleTenantIds.has(report.tenant_id)) continue;
    try {
      const results = JSON.parse(report.analysis_result) as Array<{ keyFindings: string[] }>;
      for (const r of results) {
        if (Array.isArray(r.keyFindings)) allFindings.push(...r.keyFindings);
      }
    } catch {}
  }

  if (allFindings.length === 0) return null;

  for (let i = allFindings.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allFindings[i], allFindings[j]] = [allFindings[j], allFindings[i]];
  }

  const sample = allFindings.slice(0, MAX_FINDINGS_IN_CONTEXT);

  return `Constats récents observés (mélangés entre plusieurs structures anonymes du secteur, ne jamais associer un constat à une structure précise) :\n${sample.map((f) => `- ${f}`).join('\n')}`;
}

export async function fetchKnowledgeBase(
  databases: any,
  databaseId: string,
  sector: string,
  env: AstraContextEnv
): Promise<string> {
  const result = await databases.listDocuments(databaseId, env.knowledgeBaseCollectionId, [
    Query.equal('sector', [sector, 'GENERAL']),
    Query.equal('status', 'PUBLISHED'),
    Query.limit(10),
  ]);

  if (result.documents.length === 0) return '';

  return result.documents.map((doc: any) => `### ${doc.title}\n${doc.content}`).join('\n\n');
}
