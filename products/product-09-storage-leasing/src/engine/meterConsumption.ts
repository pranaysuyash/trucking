import type { MeterSubReading } from './storageClient';

function validDate(value: string): boolean {
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function validatePeriod(start: string, end: string): void {
  if (!validDate(start) || !validDate(end) || start > end) throw new Error('Enter valid start and end dates for the consumption period.');
}

/** Add a period total. Undated legacy readings remain unchanged and cannot be reconciled automatically. */
export function addMeterConsumption(existing: MeterSubReading[], reading: MeterSubReading): MeterSubReading[] {
  if (!reading.spaceId.trim()) throw new Error('Select a space.');
  if (!Number.isFinite(reading.kwh) || reading.kwh < 0) throw new Error('Consumption must be a finite nonnegative value.');
  const start = reading.periodStart ?? '';
  const end = reading.periodEnd ?? '';
  validatePeriod(start, end);
  if (existing.some(item => item.spaceId === reading.spaceId && item.periodStart && item.periodEnd && start <= item.periodEnd && end >= item.periodStart)) {
    throw new Error('Consumption periods overlap for this space; review the existing reading.');
  }
  return [...existing, { ...reading, periodStart: start, periodEnd: end }];
}

export function allocateBillForPeriod(readings: MeterSubReading[], start: string, end: string, totalBill: number) {
  validatePeriod(start, end);
  if (!Number.isFinite(totalBill) || totalBill < 0) throw new Error('Bill amount must be finite and nonnegative.');
  const totalPaise = Math.round(totalBill * 100);
  if (!Number.isSafeInteger(totalPaise) || Math.abs(totalPaise - totalBill * 100) > 1e-7) throw new Error('Bill amount must be a valid amount in whole paise.');
  const matching = readings.filter(reading => reading.periodStart === start && reading.periodEnd === end);
  if (!matching.length) throw new Error('No readings match this period.');
  if (matching.some(reading => !reading.spaceId || !Number.isFinite(reading.kwh) || reading.kwh < 0)) throw new Error('Review invalid consumption values before allocating.');
  if (new Set(matching.map(reading => reading.spaceId)).size !== matching.length) throw new Error('Duplicate readings for a space need review before allocation.');
  if (matching.some(reading => readings.some(other => other !== reading && other.spaceId === reading.spaceId && other.periodStart && other.periodEnd && other.periodStart <= end && other.periodEnd >= start))) throw new Error('Overlapping readings for a space need review before allocation.');
  const totalKwh = matching.reduce((sum, reading) => sum + reading.kwh, 0);
  if (!Number.isFinite(totalKwh) || totalKwh <= 0) throw new Error('A bill cannot be allocated when total consumption is zero or invalid.');
  const rows = matching.map((reading, index) => {
    const exactPaise = totalPaise * (reading.kwh / totalKwh);
    const paise = Math.floor(exactPaise);
    return { ...reading, index, sharePct: Math.round(reading.kwh / totalKwh * 10000) / 100, paise, fraction: exactPaise - paise };
  });
  const remaining = totalPaise - rows.reduce((sum, row) => sum + row.paise, 0);
  if (remaining < 0 || remaining > rows.length) throw new Error('Allocation precision is insufficient; review the inputs.');
  const order = [...rows].sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let i = 0; i < remaining; i++) order[i].paise++;
  return rows.map(row => ({ spaceId: row.spaceId, kwh: row.kwh, sharePct: row.sharePct, allocated: row.paise / 100 }));
}
