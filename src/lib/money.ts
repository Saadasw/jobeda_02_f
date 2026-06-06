/**
 * Format a money value as Bangladeshi Taka.
 * Accepts numbers or numeric strings (the API returns numbers, but Decimal
 * fields can arrive as strings); null/undefined/blank render as an em dash.
 * Negatives render as "-৳1,234" (e.g. an overdrawn cash balance).
 */
export function formatMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '—';

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(n));

  return (n < 0 ? '-৳' : '৳') + formatted;
}
