import { describe, it, expect } from 'vitest';
import {
  auditCarrierCompliance,
  BASIC_DEFINITIONS,
  CUSTOMER_INSURANCE_REQUIREMENTS,
} from '../src/engine/scoring';
import { INITIAL_CARRIERS } from '../src/engine/carriers';
import {
  buildPricingSafetyBridgeUrl,
  buildHosSafetyBridgeUrl,
  buildCommandCenterSafetyBridgeUrl,
} from '../src/engine/bridges';
import { platformBus } from '../src/engine/platformBus';
import { CarrierProfile } from '../src/engine/types';

describe('Product 08 — Carrier Trust & Anti-Fraud Shield', () => {
  describe('FMCSA SMS BASIC Definitions & Thresholds', () => {
    it('defines all 7 FMCSA BASIC categories with configured general-freight intervention thresholds', () => {
      expect(BASIC_DEFINITIONS.length).toBe(7);
      const unsafeDriving = BASIC_DEFINITIONS.find((b) => b.code === 'unsafe_driving');
      expect(unsafeDriving?.interventionThreshold).toBe(65);

      const vehicleMaint = BASIC_DEFINITIONS.find((b) => b.code === 'vehicle_maint');
      expect(vehicleMaint?.interventionThreshold).toBe(80);

      const crashInd = BASIC_DEFINITIONS.find((b) => b.code === 'crash_indicator');
      expect(crashInd?.interventionThreshold).toBe(65);
    });

    it('defines configured customer insurance policy thresholds', () => {
      expect(CUSTOMER_INSURANCE_REQUIREMENTS.commercial_auto).toBe(1_000_000);
      expect(CUSTOMER_INSURANCE_REQUIREMENTS.motor_truck_cargo).toBe(100_000);
      expect(CUSTOMER_INSURANCE_REQUIREMENTS.general_liability).toBe(1_000_000);
    });
  });

  describe('Carrier Safety Scoring & Audit Engine', () => {
    it('accurately audits Apex Freight Lines as APPROVED', () => {
      const apex = INITIAL_CARRIERS.find((c) => c.dotNumber === '389211')!;
      expect(apex).toBeDefined();

      const audit = auditCarrierCompliance(apex);
      expect(audit.dispatchEligibility).toBe('APPROVED');
      expect(audit.compositeSafetyScore).toBeGreaterThanOrEqual(90);
      expect(audit.blockers.length).toBe(0);
      expect(audit.warnings.length).toBe(0);
    });

    it('accurately audits Keystone Logistics as CONDITIONAL_REVIEW due to BASIC breaches', () => {
      const keystone = INITIAL_CARRIERS.find((c) => c.dotNumber === '781902')!;
      expect(keystone).toBeDefined();

      const audit = auditCarrierCompliance(keystone);
      expect(audit.dispatchEligibility).toBe('CONDITIONAL_REVIEW');
      expect(audit.warnings.length).toBeGreaterThan(0);
      expect(audit.warnings.some((w) => w.includes('Hours-of-Service'))).toBe(true);
    });

    it('accurately locks out Veloce Transport as BLOCKED_DO_NOT_DISPATCH', () => {
      const veloce = INITIAL_CARRIERS.find((c) => c.dotNumber === '410928')!;
      expect(veloce).toBeDefined();

      const audit = auditCarrierCompliance(veloce);
      expect(audit.dispatchEligibility).toBe('BLOCKED_DO_NOT_DISPATCH');
      expect(audit.blockers.length).toBeGreaterThan(0);
      expect(audit.blockers.some((b) => b.includes('Operating Authority is REVOKED') || b.includes('double-brokering'))).toBe(true);
    });

    it('blocks carrier if Operating Authority is NOT authorized for hire', () => {
      const testCarrier: CarrierProfile = {
        ...INITIAL_CARRIERS[0],
        operatingAuthority: 'SUSPENDED',
      };
      const audit = auditCarrierCompliance(testCarrier);
      expect(audit.dispatchEligibility).toBe('BLOCKED_DO_NOT_DISPATCH');
      expect(audit.blockers.some((b) => b.includes('Operating Authority is SUSPENDED'))).toBe(true);
    });

    it('blocks carrier if Auto Liability insurance is below customer policy minimum ($1M)', () => {
      const underinsuredCarrier: CarrierProfile = {
        ...INITIAL_CARRIERS[0],
        insurancePolicies: [
          {
            type: 'commercial_auto',
            producer: 'Test Producer',
            underwriter: 'Test Ins',
            policyNumber: 'TEST-123',
            effectiveDate: '2026-01-01',
            expirationDate: '2027-01-01',
            coverageLimitUsd: 750_000, // Deficient
            requiredMinimumUsd: 1_000_000,
            amBestRating: 'A',
            isCompliant: false,
            daysUntilExpiration: 200,
          },
        ],
      };
      const audit = auditCarrierCompliance(underinsuredCarrier);
      expect(audit.dispatchEligibility).toBe('BLOCKED_DO_NOT_DISPATCH');
      expect(audit.blockers.some((b) => b.includes('Auto Liability ($750,000) is below configured customer policy minimum of $1,000,000'))).toBe(true);
    });

    it('blocks carrier if insurance policy is expired', () => {
      const expiredCarrier: CarrierProfile = {
        ...INITIAL_CARRIERS[0],
        insurancePolicies: [
          {
            type: 'commercial_auto',
            producer: 'Test Producer',
            underwriter: 'Test Ins',
            policyNumber: 'TEST-EXP',
            effectiveDate: '2025-01-01',
            expirationDate: '2026-01-01',
            coverageLimitUsd: 1_000_000,
            requiredMinimumUsd: 1_000_000,
            amBestRating: 'A',
            isCompliant: false,
            daysUntilExpiration: -10, // Expired
          },
        ],
      };
      const audit = auditCarrierCompliance(expiredCarrier);
      expect(audit.dispatchEligibility).toBe('BLOCKED_DO_NOT_DISPATCH');
      expect(audit.blockers.some((b) => b.includes('expired'))).toBe(true);
    });
  });

  describe('Cross-Project Safety Integration Bridges', () => {
    it('constructs verified URL for Product 02 Freight Pricing safety verification', () => {
      const carrier = INITIAL_CARRIERS[0];
      const url = buildPricingSafetyBridgeUrl(carrier);
      expect(url).toContain('http://localhost:5174/?source=product-08-carrier-trust');
      expect(url).toContain(`dotNumber=${carrier.dotNumber}`);
      expect(url).toContain('safetyTier=preferred');
      expect(url).toContain('dispatchAllowed=true');
    });

    it('constructs verified URL for Product 03 HOS Planner safety audit', () => {
      const carrier = INITIAL_CARRIERS[1];
      const url = buildHosSafetyBridgeUrl(carrier);
      expect(url).toContain('http://localhost:5175/?source=product-08-carrier-trust');
      expect(url).toContain(`dotNumber=${carrier.dotNumber}`);
      expect(url).toContain('carrierName=Keystone+Logistics+Transport+Inc');
      expect(url).toContain('hosBasicPercentile=74');
    });

    it('constructs verified URL for Command Center Portal dispatch gate', () => {
      const carrier = INITIAL_CARRIERS[2];
      const url = buildCommandCenterSafetyBridgeUrl(carrier);
      expect(url).toContain('http://localhost:5170/?source=product-08-carrier-trust');
      expect(url).toContain(`carrierDot=${carrier.dotNumber}`);
      expect(url).toContain('eligibility=BLOCKED_DO_NOT_DISPATCH');
    });
  });

  describe('Platform Event Bus Integration', () => {
    it('publishes and receives CARRIER_VETTED events across the platform bus', () => {
      let receivedCarrierDot: string | null = null;

      const unsubscribe = platformBus.subscribe('CARRIER_VETTED', (payload: any) => {
        receivedCarrierDot = payload.dotNumber;
      });

      platformBus.publish('CARRIER_VETTED', {
        dotNumber: '389211',
        legalName: 'Apex Freight Lines LLC',
        eligibility: 'APPROVED',
        score: 96,
      });

      expect(receivedCarrierDot).toBe('389211');
      unsubscribe();
    });
  });
});
