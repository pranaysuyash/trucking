/**
 * Scenario roster and explicitly injected QCMobile-shaped observation adapter.
 * No network or old unverified cache is accessed implicitly. No observation here
 * establishes operating authority, insurance coverage or permission to dispatch.
 */
import type { OperatingAuthorityStatus, SafetyRating, SaferAuthorityFiling, DispatchEligibility } from './types';
import { INITIAL_CARRIERS } from './carriers';

export interface SaferLookupResult {
  dotNumber: string;
  mcNumber?: string;
  legalName: string;
  dbaName?: string;
  physicalAddress: string;
  operatingAuthority: OperatingAuthorityStatus | 'UNKNOWN';
  safetyRating: SafetyRating | 'UNKNOWN';
  powerUnits: number | null;
  drivers: number | null;
  mcs150Outdated: boolean | null;
  authorityFilings: SaferAuthorityFiling[];
  source: 'INJECTED_RESPONSE' | 'SCENARIO_ROSTER' | 'UNAVAILABLE';
  observedAt: string | null;
  allowedToOperateReported: string | null;
  scenarioEligibility: DispatchEligibility | null;
  isCompliantForDispatch: false;
  reasons: string[];
}

type Fetcher = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;
const count = (value: unknown) => {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
};

export async function querySaferRegistry(dotNumber: string, customFetch?: Fetcher): Promise<SaferLookupResult> {
  const cleanDot = dotNumber.trim();
  if (!/^\d+$/.test(cleanDot)) throw new Error('Enter a USDOT number using digits only.');
  if (customFetch) {
    try {
      const response = await customFetch(`https://mobile.fmcsa.dot.gov/qc/services/carriers/${cleanDot}`);
      if (response.ok) {
        const payload = await response.json() as { content?: { carrier?: Record<string, unknown> } };
        const c = payload?.content?.carrier;
        if (c && String(c.dotNumber ?? '') === cleanDot && typeof c.legalName === 'string' && c.legalName.trim()) {
          const value = (v: unknown) => typeof v === 'string' ? v : '';
          return {
            dotNumber: cleanDot, mcNumber: value(c.docketNumber) || undefined, legalName: c.legalName,
            dbaName: value(c.dbaName) || undefined,
            physicalAddress: [c.phyStreet, c.phyCity, c.phyState].filter(x => typeof x === 'string' && x.trim()).join(', ') || 'Not supplied',
            operatingAuthority: 'UNKNOWN', safetyRating: c.safetyRating === 'S' ? 'SATISFACTORY' : c.safetyRating === 'C' ? 'CONDITIONAL' : c.safetyRating === 'U' ? 'UNSATISFACTORY' : 'UNKNOWN',
            powerUnits: count(c.totalPowerUnits), drivers: count(c.totalDrivers), mcs150Outdated: null,
            authorityFilings: [], source: 'INJECTED_RESPONSE', observedAt: new Date().toISOString(),
            allowedToOperateReported: value(c.allowToOperate) || value(c.allowedToOperate) || null, scenarioEligibility: null, isCompliantForDispatch: false,
            reasons: ['Injected response has not been authenticated or freshness-verified; authority, insurance and dispatch approval are unknown.'],
          };
        }
      }
    } catch { /* Explicit injected observation failed; retain the scenario fallback. */ }
  }
  const matched = INITIAL_CARRIERS.find(c => c.dotNumber === cleanDot);
  if (matched) return {
    dotNumber: matched.dotNumber, mcNumber: matched.mcNumber, legalName: matched.legalName, dbaName: matched.dbaName,
    physicalAddress: `${matched.physicalAddress}, ${matched.city}, ${matched.state} ${matched.zip}`,
    operatingAuthority: matched.operatingAuthority, safetyRating: matched.safetyRating, powerUnits: matched.powerUnitCount,
    drivers: matched.driverCount, mcs150Outdated: null, authorityFilings: structuredClone(matched.authorityFilings ?? []),
    source: 'SCENARIO_ROSTER', observedAt: null, allowedToOperateReported: null, scenarioEligibility: matched.dispatchEligibility,
    isCompliantForDispatch: false, reasons: ['Seeded scenario only; no live authority, insurance or dispatch verification.', ...matched.blockers],
  };
  return {
    dotNumber: cleanDot, legalName: 'Unknown carrier', physicalAddress: 'Not supplied', operatingAuthority: 'UNKNOWN', safetyRating: 'UNKNOWN',
    powerUnits: null, drivers: null, mcs150Outdated: null, authorityFilings: [], source: 'UNAVAILABLE', observedAt: null,
    allowedToOperateReported: null, scenarioEligibility: null, isCompliantForDispatch: false,
    reasons: ['No matching scenario or validated observation. This is not a registry search result.'],
  };
}
