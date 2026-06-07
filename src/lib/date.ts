/** Format a YYYY-MM-DD (or ISO) value as "Mon YYYY", e.g. "Jan 2026". */
export function formatMonth(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** Today's date as YYYY-MM-DD in the local timezone. */
export function todayISODate(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Format a YYYY-MM-DD (or ISO) value as "DD Mon YYYY", e.g. "15 Jan 2026". */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}
