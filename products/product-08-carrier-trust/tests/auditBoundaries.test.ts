import { describe, expect, it, vi } from 'vitest';
import { querySaferRegistry } from '../src/engine/saferClient';
import { INITIAL_CARRIERS } from '../src/engine/carriers';
import { buildPricingSafetyBridgeUrl } from '../src/engine/bridges';
import { auditDriverQualificationFile, SAMPLE_DRIVER_ROSTER } from '../src/engine/driverQualification';

describe('audit trust boundaries', () => {
  it('never contacts FMCSA by default for a scenario lookup', async () => {
    const previous = globalThis.fetch;
    const fetchSpy = vi.fn(async () => { throw new Error('unexpected network access'); });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    try {
      const record = await querySaferRegistry('389211');
      expect(record.source).toBe('SCENARIO_ROSTER');
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(record.isCompliantForDispatch).toBe(false);
    } finally { globalThis.fetch = previous; }
  });
  it('does not invent insurance, authority or approval from an injected QCMobile payload', async () => {
    const record = await querySaferRegistry('1234567', async () => ({ ok: true, json: async () => ({content: {carrier: {dotNumber: '1234567', legalName: 'Example', allowedToOperate: 'Y'}}}) }));
    expect(record.authorityFilings).toEqual([]);
    expect(record.operatingAuthority).toBe('UNKNOWN');
    expect(record.isCompliantForDispatch).toBe(false);
  });
  it('does not bridge conditional or sample eligibility as operational permission', () => {
    const carrier = { ...INITIAL_CARRIERS[0], dispatchEligibility: 'CONDITIONAL_REVIEW' as const };
    const params = new URL(buildPricingSafetyBridgeUrl(carrier)).searchParams;
    expect(params.get('dispatchAllowed')).toBe('false');
    expect(params.get('insuranceVerified')).toBe('false');
    expect(params.get('eligibility')).toBe('CONDITIONAL_REVIEW');
  });
  it('labels qualification conclusions as scenarios rather than statutory authorization', () => {
    const result = auditDriverQualificationFile(SAMPLE_DRIVER_ROSTER[0], '2026-10-30');
    expect(result.auditSummary.toLowerCase()).toContain('scenario');
    expect(result.auditSummary.toLowerCase()).not.toContain('meets all statutory');
  });
});

describe('invalid and mismatched observations', () => {
  it('does not treat a different DOT in an injected response as the requested carrier', async () => {
    const record = await querySaferRegistry('1234567', async () => ({ ok: true, json: async () => ({ content: { carrier: { dotNumber: '7654321', legalName: 'Other Carrier', allowedToOperate: 'Y' } } }) }));
    expect(record.source).toBe('UNAVAILABLE');
    expect(record.isCompliantForDispatch).toBe(false);
    expect(record.operatingAuthority).toBe('UNKNOWN');
  });
  it('does not treat missing, future or pending driver evidence as qualifying', () => {
    const driver = SAMPLE_DRIVER_ROSTER[0];
    for (const patch of [{medicalCardExpirationDate: 'invalid'}, {lastAnnualMvrDate: '2027-01-01'}, {clearinghouseStatus: 'QUERY_PENDING' as const}]) {
      const review = auditDriverQualificationFile({ ...driver, ...patch }, '2026-10-30');
      expect(review.isQualifiedForDispatch).toBe(false);
      expect(review.violations.some(v => v.code === 'DATA_INCOMPLETE')).toBe(true);
    }
  });
});

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FraudRiskRadar } from '../src/ui/FraudRiskRadar';
import { DriverQualificationModal } from '../src/ui/DriverQualificationModal';

describe('scenario presentation', () => {
  it('retains risk warnings after a self-attested scenario record', () => {
    const carrier = INITIAL_CARRIERS[2];
    const html = renderToStaticMarkup(React.createElement(FraudRiskRadar, { fraud: carrier.fraudIndicators, authority: carrier.operatingAuthority, powerUnits: carrier.powerUnitCount, drivers: carrier.driverCount, stepUpVerified: true }));
    expect(html).toContain('SELF-ATTESTED SCENARIO RECORDED');
    expect(html).toContain('SCENARIO RISK FLAG');
    expect(html).not.toContain('Carrier cleared for load tender');
    expect(html).toContain('Not supplied');
  });
  it('does not offer a no-op assignment or claim unrelated sample drivers belong to the carrier', () => {
    const html = renderToStaticMarkup(React.createElement(DriverQualificationModal, { carrierDot: '389211', carrierName: 'Example carrier', isOpen: true, onClose: () => {} }));
    expect(html).not.toContain('Authorize Driver Load Assignment');
    expect(html).toContain('Sample drivers are not associated');
    expect(html).toContain('No registry checks or assignment are performed');
  });
});

import { StepUpVerificationModal } from '../src/ui/StepUpVerificationModal';
it('presents step-up assertions as self-attested and does not request a PIN', () => {
  const html = renderToStaticMarkup(React.createElement(StepUpVerificationModal, { carrier: INITIAL_CARRIERS[0], isOpen: true, onClose: () => {}, onVerified: () => {} }));
  expect(html).toContain('unverified operator assertions');
  expect(html).toContain('not signatures');
  expect(html).not.toContain('Sign &amp; Authorize Load Tender');
  expect(html).toContain('NO PIN');
});
