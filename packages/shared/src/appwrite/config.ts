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
} as const;

export const TEAMS = {
  ADMINS: 'admins',
  ANALYSTS: 'analysts',
} as const;

export function tenantTeamName(slug: string): string {
  return `tenant_${slug}`;
}