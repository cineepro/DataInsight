//packages/shared/src/utils/formatters.ts
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

export function formatPercentage(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatWeekLabel(year: number, weekNumber: number): string {
  return `Semaine ${weekNumber} — ${year}`;
}