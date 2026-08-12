//apps/studio/src/features/datasets/utils/inferColumnType.ts
import type { ColumnDataType, ColumnRole } from '../../../engine/flexible/types';

interface InferredColumn {
  dataType: ColumnDataType;
  suggestedRole: ColumnRole;
}

const SAMPLE_SIZE = 20;
const CATEGORY_MAX_DISTINCT_RATIO = 0.5; // si <50% de valeurs distinctes sur l'échantillon, on suppose une catégorie

function isLikelyDate(value: unknown): boolean {
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value === 'string') {
    // Formats courants: 2026-01-15, 15/01/2026, 15-01-2026
    return /^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(value);
  }
  return false;
}

function isLikelyNumber(value: unknown): boolean {
  if (typeof value === 'number') return true;
  if (typeof value === 'string' && value.trim() !== '') {
    const cleaned = value.replace(/\s/g, '').replace(',', '.');
    return !Number.isNaN(Number(cleaned));
  }
  return false;
}

/**
 * Devine le type d'une colonne à partir d'un échantillon de valeurs —
 * exactement le réflexe qu'un analyste a en ouvrant un fichier pour la
 * première fois : "cette colonne, c'est du texte, un nombre, une date ?".
 * Le résultat n'est qu'une SUGGESTION — l'analyste valide ou corrige
 * ensuite dans ColumnMappingTable, rien n'est jamais appliqué à l'aveugle.
 */
export function inferColumnType(values: unknown[]): InferredColumn {
  const sample = values.slice(0, SAMPLE_SIZE).filter((v) => v !== '' && v !== null && v !== undefined);

  if (sample.length === 0) {
    return { dataType: 'TEXT', suggestedRole: 'IGNORE' };
  }

  const dateCount = sample.filter(isLikelyDate).length;
  if (dateCount / sample.length > 0.7) {
    return { dataType: 'DATE', suggestedRole: 'DATE' };
  }

  const numberCount = sample.filter(isLikelyNumber).length;
  if (numberCount / sample.length > 0.7) {
    return { dataType: 'NUMBER', suggestedRole: 'METRIC' };
  }

  const boolValues = new Set(sample.map((v) => String(v).toLowerCase()));
  const looksBoolean = [...boolValues].every((v) => ['oui', 'non', 'true', 'false', '0', '1', 'yes', 'no'].includes(v));
  if (looksBoolean && boolValues.size <= 2) {
    return { dataType: 'BOOLEAN', suggestedRole: 'DIMENSION' };
  }

  const distinctValues = new Set(sample.map((v) => String(v)));
  const distinctRatio = distinctValues.size / sample.length;

  if (distinctRatio <= CATEGORY_MAX_DISTINCT_RATIO) {
    return { dataType: 'CATEGORY', suggestedRole: 'DIMENSION' };
  }

  // Beaucoup de valeurs distinctes et du texte → probablement un
  // identifiant (nom, référence, email...) plutôt qu'une dimension à croiser.
  return { dataType: 'TEXT', suggestedRole: 'IDENTIFIER' };
}

export function slugifyColumnKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}