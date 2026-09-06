//packages/shared/src/utils/weekNumber.ts
export interface YearWeek {
  year: number;
  week_number: number;
  day_of_week: number; // 1 = Lundi ... 7 = Dimanche
}

/**
 * Calcule l'année, le numéro de semaine (ISO-8601) et le jour de la semaine
 * pour une date donnée. À appeler à la soumission d'un scan pour remplir
 * automatiquement year / week_number / day_of_week avant l'écriture Appwrite.
 */
export function getISOYearWeek(date: Date = new Date()): YearWeek {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Dimanche = 7 au lieu de 0
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week_number = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return {
    year: d.getUTCFullYear(),
    week_number,
    day_of_week: dayNum,
  };
}

/**
 * Nombre de semaines ISO-8601 dans une année donnée : 52 la plupart du
 * temps, mais 53 lorsque le 1er janvier tombe un jeudi (ou un mercredi
 * une année bissextile). Utilisé pour naviguer correctement d'un bloc de
 * 4 semaines à l'autre au changement d'année, sans décalage.
 */
export function isoWeeksInYear(year: number): number {
  const p = (y: number) => (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;
  return p(year) === 4 || p(year - 1) === 3 ? 53 : 52;
}