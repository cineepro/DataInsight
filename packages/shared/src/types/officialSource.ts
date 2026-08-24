//packages/shared/src/types/officialSource.ts
export type OfficialSourceStatus = 'NEGOTIATING' | 'ACTIVE' | 'PAUSED';

export interface OfficialSource {
  $id: string;
  name: string;
  description?: string;
  status: OfficialSourceStatus;
  sync_frequency?: string;
  last_synced_at?: string;
  sector: string;
}