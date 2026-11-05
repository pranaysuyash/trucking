import { describe, it, expect } from 'vitest';
import { querySaferRegistry } from '../src/engine/saferClient';

describe('FMCSA SAFER & L&I Public Registry Adapter', () => {
  it('resolves compliant carrier from seeded roster when offline', async () => {
    const result = await querySaferRegistry('389211'); // Apex Freight Lines
    expect(result.legalName).toContain('Apex Freight Lines');
    expect(result.operatingAuthority).toBe('AUTHORIZED_FOR_HIRE');
    expect(result.isCompliantForDispatch).toBe(true);
    expect(result.source).toBe('SCENARIO_ROSTER');
    expect(result.authorityFilings.length).toBeGreaterThan(0);
  });

  it('correctly blocks revoked carrier from seeded roster', async () => {
    const result = await querySaferRegistry('410928'); // Veloce Transit Solutions LLC (Revoked)
    expect(result.legalName).toContain('Veloce Transit');
    expect(result.operatingAuthority).toBe('REVOKED');
    expect(result.isCompliantForDispatch).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('parses live FMCSA QCMobile API response structure cleanly', async () => {
    const mockFetcher = async () => ({
      ok: true,
      json: async () => ({
        content: {
          carrier: {
            dotNumber: '1234567',
            legalName: 'Live Cloud Transport Corp',
            allowedToOperate: 'Y',
            safetyRating: 'S',
            totalPowerUnits: '25',
            totalDrivers: '28',
            phyStreet: '100 Interstate Pkwy',
            phyCity: 'Dallas',
            phyState: 'TX',
          },
        },
      }),
    });

    const result = await querySaferRegistry('1234567', mockFetcher);
    expect(result.legalName).toBe('Live Cloud Transport Corp');
    expect(result.operatingAuthority).toBe('AUTHORIZED_FOR_HIRE');
    expect(result.safetyRating).toBe('SATISFACTORY');
    expect(result.powerUnits).toBe(25);
    expect(result.source).toBe('FMCSA_SAFER_LIVE');
    expect(result.isCompliantForDispatch).toBe(true);
  });

  it('returns explicit unauthorized status for completely unknown DOT numbers', async () => {
    const result = await querySaferRegistry('999999999');
    expect(result.isCompliantForDispatch).toBe(false);
    expect(result.operatingAuthority).toBe('NOT_AUTHORIZED');
    expect(result.reasons[0]).toContain('not found');
  });
});
