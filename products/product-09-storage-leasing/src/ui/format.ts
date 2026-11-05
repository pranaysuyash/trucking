// Pure formatting helpers. No DOM, no React. Testable in isolation.

export function inr(value: number, opts?: { compact?: boolean }): string {
  const n = Number.isFinite(value) ? value : 0;
  if (opts?.compact && Math.abs(n) >= 100000) {
    return '₹' + (n / 100000).toFixed(1) + 'L';
  }
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
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
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function monthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function num(value: number, digits = 0): string {
  const n = Number.isFinite(value) ? value : 0;
  return n.toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}