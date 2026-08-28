//packages/shared/src/appwrite/config.ts
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export const COLLECTIONS = {
  TENANTS: import.meta.env.VITE_COLLECTION_TENANTS,
  SCANS_RESTAURANT: import.meta.env.VITE_COLLECTION_SCANS_RESTAURANT,
  SCANS_PHARMACIE: import.meta.env.VITE_COLLECTION_SCANS_PHARMACIE,
  SCANS_ENTREPRISE: import.meta.env.VITE_COLLECTION_SCANS_ENTREPRISE,
  OPERATIONAL_METRICS: import.meta.env.VITE_COLLECTION_OPERATIONAL_METRICS,
  WEEKLY_REPORTS: import.meta.env.VITE_COLLECTION_WEEKLY_REPORTS,
  CUSTOMERS: import.meta.env.VITE_COLLECTION_CUSTOMERS,
  RATE_LIMIT_EVENTS: import.meta.env.VITE_COLLECTION_RATE_LIMIT_EVENTS,
  SUBSCRIPTIONS: import.meta.env.VITE_COLLECTION_SUBSCRIPTIONS,
  PAYMENT_TRANSACTIONS: import.meta.env.VITE_COLLECTION_PAYMENT_TRANSACTIONS,
  ALERTS_LOG: import.meta.env.VITE_COLLECTION_ALERTS_LOG,
  MENU_ITEMS: import.meta.env.VITE_COLLECTION_MENU_ITEMS,
  DATASETS: import.meta.env.VITE_COLLECTION_DATASETS,
  DATASET_COLUMNS: import.meta.env.VITE_COLLECTION_DATASET_COLUMNS,
  DATASET_ROWS: import.meta.env.VITE_COLLECTION_DATASET_ROWS,
  DATASET_REPORTS: import.meta.env.VITE_COLLECTION_DATASET_REPORTS,
  KNOWLEDGE_BASE: import.meta.env.VITE_COLLECTION_KNOWLEDGE_BASE,
  AI_CHAT_LOGS: import.meta.env.VITE_COLLECTION_AI_CHAT_LOGS,
  AI_LAB_RATE_LIMIT: import.meta.env.VITE_COLLECTION_AI_LAB_RATE_LIMIT,
  ANALYSIS_THRESHOLDS: import.meta.env.VITE_COLLECTION_ANALYSIS_THRESHOLDS,
  ANNOUNCEMENTS: import.meta.env.VITE_COLLECTION_ANNOUNCEMENTS,
  IMPORTED_DOCUMENTS: import.meta.env.VITE_COLLECTION_IMPORTED_DOCUMENTS,
  OFFICIAL_SOURCES: import.meta.env.VITE_COLLECTION_OFFICIAL_SOURCES,
   API_KEYS: import.meta.env.VITE_COLLECTION_API_KEYS,
  API_USAGE_LOGS: import.meta.env.VITE_COLLECTION_API_USAGE_LOGS,
} as const;

// TEAMS : noms lisibles, utilisés uniquement pour COMPARER l'appartenance
// (ex: getCurrentSession() qui lit team.name depuis teams.list()).
export const TEAMS = {
  ADMINS: 'admins',
  ANALYSTS: 'analysts',
} as const;

// TEAM_IDS : identifiants techniques réels, seuls valides pour construire
// des permissions avec Role.team(id) — Appwrite refuse un nom, uniquement
// l'ID généré à la création de la Team (visible dans Auth → Teams → ouvrir
// la Team → copier l'ID affiché en haut de la page).
export const TEAM_IDS = {
  ADMINS: import.meta.env.VITE_TEAM_ADMINS_ID,
  ANALYSTS: import.meta.env.VITE_TEAM_ANALYSTS_ID,
} as const;

export function tenantTeamName(slug: string): string {
  return `tenant_${slug}`;
}