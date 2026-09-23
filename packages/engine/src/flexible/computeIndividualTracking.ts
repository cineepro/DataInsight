//packages/engine/src/flexible/computeIndividualTracking.ts
import type { DatasetRow, DatasetColumnDef } from './types';

export type TrackingStatus = 'ACTIVE' | 'AT_RISK';

export interface TrackedIndividualResult {
  identifierValue: string;
  /** Valeur d'une colonne "libellé" (ex: un nom), si désignée — sinon identique à identifierValue. */
  label: string;
  status: TrackingStatus;
  /** Dernière période (dans l'historique propre à cette personne) où une activité a été détectée. null si jamais active. */
  lastActivePeriod: string | null;
  /** Nombre de périodes consécutives sans activité, comptées uniquement sur les périodes où cette personne a une ligne — jamais sur des périodes où elle n'a structurellement aucune donnée (ex: parcours déjà terminé). */
  periodsSinceActive: number;
}

function rawValue(row: DatasetRow, columnKey: string): string {
  const raw = row.payload[columnKey];
  return raw === undefined || raw === null || raw === '' ? '(vide)' : String(raw);
}

/** Trie numériquement si toutes les valeurs le permettent, sinon alphabétiquement — même logique que analyzeTrendByPeriod, pour un tri de périodes cohérent partout dans le moteur. */
function sortPeriods(periods: string[]): string[] {
  const allNumeric = periods.every((p) => !Number.isNaN(Number(p)));
  if (allNumeric) return [...periods].sort((a, b) => Number(a) - Number(b));
  return [...periods].sort((a, b) => a.localeCompare(b));
}

/** Une valeur d'activité est considérée "positive" si c'est un nombre > 0, un booléen true, ou une chaîne usuelle affirmative. */
function isActiveValue(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'oui', 'yes', '1'].includes(normalized)) return true;
    const asNumber = Number(normalized.replace(',', '.'));
    if (!Number.isNaN(asNumber)) return asNumber > 0;
  }
  return false;
}

/**
 * Calcule, pour chaque personne identifiée par identifierColumn, son statut
 * de suivi (active / à risque) à partir de son historique propre de
 * présence sur periodColumn — le pendant, pour les données importées, de
 * ce que detectChurnRisk fait pour les clients issus des QR codes.
 *
 * Ne compte jamais une période comme "sans activité" si la personne n'a
 * structurellement aucune ligne pour cette période (parcours plus court
 * que d'autres, terminé plus tôt) — même précaution que le correctif
 * apporté à analyzeTrendByPeriod, appliquée ici au niveau de l'individu
 * plutôt qu'au niveau du groupe.
 */
export function computeIndividualTracking(
  rows: DatasetRow[],
  identifierColumn: DatasetColumnDef,
  periodColumn: DatasetColumnDef,
  activityColumn: DatasetColumnDef,
  inactivityThreshold: number,
  labelColumn?: DatasetColumnDef | null
): TrackedIndividualResult[] {
  const byIndividual = new Map<string, { period: string; active: boolean }[]>();
  const labels = new Map<string, string>();

  for (const row of rows) {
    const id = rawValue(row, identifierColumn.key);
    const period = rawValue(row, periodColumn.key);
    const active = isActiveValue(row.payload[activityColumn.key]);

    if (!byIndividual.has(id)) byIndividual.set(id, []);
    byIndividual.get(id)!.push({ period, active });

    if (labelColumn && !labels.has(id)) {
      labels.set(id, rawValue(row, labelColumn.key));
    }
  }

  const results: TrackedIndividualResult[] = [];

  for (const [id, entries] of byIndividual) {
    const orderedPeriods = sortPeriods([...new Set(entries.map((e) => e.period))]);
    const activeByPeriod = new Map(entries.map((e) => [e.period, e.active]));

    let lastActivePeriod: string | null = null;
    for (const period of orderedPeriods) {
      if (activeByPeriod.get(period)) lastActivePeriod = period;
    }

    let periodsSinceActive: number;
    if (lastActivePeriod === null) {
      periodsSinceActive = orderedPeriods.length;
    } else {
      const lastActiveIndex = orderedPeriods.indexOf(lastActivePeriod);
      periodsSinceActive = orderedPeriods.length - 1 - lastActiveIndex;
    }

    results.push({
      identifierValue: id,
      label: labels.get(id) ?? id,
      status: periodsSinceActive >= inactivityThreshold ? 'AT_RISK' : 'ACTIVE',
      lastActivePeriod,
      periodsSinceActive,
    });
  }

  return results.sort((a, b) => a.label.localeCompare(b.label));
}
