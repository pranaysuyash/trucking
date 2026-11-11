// Pure formatting helpers. No DOM, no React. Testable in isolation.

/** Operator's local calendar date, not a UTC date inferred from an instant. */
export function calendarDateLocal(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function inr(value: number, opts?: { compact?: boolean }): string {
  if (!Number.isFinite(value)) return '—';
  const n = value;
  if (opts?.compact && Math.abs(n) >= 100000) {
    return '₹' + (n / 100000).toFixed(1) + 'L';
  }
  const digits = Number.isInteger(n) ? 0 : 2;
  return (n < 0 ? '-₹' : '₹') + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: 2 });
}

export function sqft(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return n.toLocaleString('en-IN') + ' sqft';
}

export function pct(value: number, digits = 0): string {
  const n = Number.isFinite(value) ? value : 0;
  return n.toFixed(digits) + '%';
}

export function dateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  if (dateOnly && d.toISOString().slice(0, 10) !== iso) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', ...(dateOnly ? { timeZone: 'UTC' } : {}) });
}

export function monthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function num(value: number, digits = 0): string {
  const n = Number.isFinite(value) ? value : 0;
  return n.toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}
