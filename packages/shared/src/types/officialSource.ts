//packages/shared/src/types/officialSource.ts
export type OfficialSourceStatus = 'NEGOTIATING' | 'ACTIVE' | 'PAUSED';
export type OfficialSourceType = 'PDF_FEED' | 'RSS' | 'WEBSITE' | 'API';

export interface OfficialSource {
  $id: string;
  name: string;
  description?: string;
  status: OfficialSourceStatus;
  sync_frequency?: string;
  /** Ne bouge que lorsqu'un nouveau contenu a réellement été trouvé et ingéré. */
  last_synced_at?: string;
  /** Bouge à chaque passage de la veille, même si rien de nouveau n'a été trouvé. */
  last_checked_at?: string;
  sector: string;
  /** Stratégie de lecture — détermine comment sync-official-sources traite cette source. */
  source_type?: OfficialSourceType;
  /** URL à surveiller (page listant des PDF, flux RSS, ou page web classique). */
  source_url?: string;
}
