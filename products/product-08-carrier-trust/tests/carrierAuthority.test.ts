import { describe, it, expect } from 'vitest';
import {
  evaluateOperatingAuthority,
  evaluateContactSecurity,
  evaluateAutomatedDnd,
} from '../src/engine/carrierAuthority';
import { SaferAuthorityFiling, ContactSecurityProfile, CarrierProfile } from '../src/engine/types';

describe('SAFER / L&I Authority & Contact Risk Engine', () => {
  describe('evaluateOperatingAuthority', () => {
    it('approves carrier with active common carrier authority and active BMC-91X filing', () => {
      const filings: SaferAuthorityFiling[] = [
        {
          authorityType: 'COMMON_CARRIER',
          formType: 'BMC-91X',
          filingStatus: 'ACTIVE',
          effectiveDate: '2023-01-15',
          coverageLimitUsd: 1000000,
          insuranceCompany: 'Travelers Casualty & Surety',
        },
      ];

      const result = evaluateOperatingAuthority(filings);
      expect(result.isLegallyAuthorized).toBe(true);
      expect(result.hasActiveBmc91AutoLiability).toBe(true);
      expect(result.blockers.length).toBe(0);
      expect(result.activeAuthorities).toContain('COMMON_CARRIER');
    });

    it('blocks carrier missing active BMC-91 statutory filing', () => {
      const filings: SaferAuthorityFiling[] = [
        {
          authorityType: 'COMMON_CARRIER',
          formType: 'BMC-34',
          filingStatus: 'ACTIVE',
          effectiveDate: '2023-01-15',
          coverageLimitUsd: 25000,
          insuranceCompany: 'Great American Ins',
        },
      ];

      const result = evaluateOperatingAuthority(filings);
      expect(result.isLegallyAuthorized).toBe(false);
      expect(result.hasActiveBmc91AutoLiability).toBe(false);
      expect(result.blockers).toContain('Missing active BMC-91/BMC-91X statutory liability filing with FMCSA.');
    });

    it('flags revoked regulatory filings as critical blockers', () => {
      const filings: SaferAuthorityFiling[] = [
        {
          authorityType: 'CONTRACT_CARRIER',
          formType: 'BMC-91X',
          filingStatus: 'REVOKED',
          effectiveDate: '2021-05-10',
          coverageLimitUsd: 750000,
          insuranceCompany: 'Old Republic',
        },
      ];

      const result = evaluateOperatingAuthority(filings);
      expect(result.isLegallyAuthorized).toBe(false);
      expect(result.blockers.some((b) => b.includes('revoked regulatory filing'))).toBe(true);
    });
  });

  describe('evaluateContactSecurity', () => {
    it('scores legitimate corporate contact profile as low risk', () => {
      const contact: ContactSecurityProfile = {
        phoneLineType: 'LANDLINE',
        telecomCarrier: 'AT&T Corp',
        voipRiskLevel: 'LOW',
        emailDomain: 'apexlogistics.com',
        emailDomainType: 'CORPORATE_MATCH',
        domainAgeDays: 1450,
        ipOriginCountry: 'US',
        ipCity: 'Chicago',
        isVpnOrProxy: false,
        ipGeolocationMismatch: false,
      };

      const result = evaluateContactSecurity(contact);
      expect(result.riskScore).toBe(0);
      expect(result.riskCategory).toBe('LOW');
      expect(result.requiresManualVerification).toBe(false);
    });

    it('flags VOIP + disposable domain + VPN proxy as critical fraud risk', () => {
      const contact: ContactSecurityProfile = {
        phoneLineType: 'VOIP_VIRTUAL',
        telecomCarrier: 'Bandwidth.com / TextNow',
        voipRiskLevel: 'CRITICAL',
        emailDomain: 'tempmail-dispatch.io',
        emailDomainType: 'DISPOSABLE',
        domainAgeDays: 12,
        ipOriginCountry: 'Armenia',
        ipCity: 'Yerevan',
        isVpnOrProxy: true,
        ipGeolocationMismatch: true,
      };

      const result = evaluateContactSecurity(contact);
      expect(result.riskScore).toBeGreaterThanOrEqual(70);
      expect(result.riskCategory).toBe('CRITICAL_FRAUD');
      expect(result.requiresManualVerification).toBe(true);
      expect(result.reasons.some((r) => r.includes('VOIP'))).toBe(true);
      expect(result.reasons.some((r) => r.includes('Disposable'))).toBe(true);
      expect(result.reasons.some((r) => r.includes('VPN'))).toBe(true);
    });
  });

  describe('evaluateAutomatedDnd', () => {
    it('automatically applies DND lockout for revoked authority or high double-brokering risk', () => {
      const carrier: Partial<CarrierProfile> = {
        legalName: 'Shady Freight LLC',
        operatingAuthority: 'REVOKED',
        safetyRating: 'NONE',
        fraudIndicators: {
          chameleonCarrierRisk: 'high',
          doubleBrokeringRisk: 'high',
          recentOwnershipChange: true,
          freightGuardReportsCount: 3,
          unauthorizedContactEmailDomain: true,
        },
      };

      const result = evaluateAutomatedDnd(carrier);
      expect(result.isDndLocked).toBe(true);
      expect(result.lockType).toBe('STATUTORY_REVOCATION');
      expect(result.reasons.length).toBeGreaterThanOrEqual(2);
    });

    it('leaves fully compliant carrier unlocked with empty reasons list', () => {
      const carrier: Partial<CarrierProfile> = {
        legalName: 'Apex Freight Lines',
        operatingAuthority: 'AUTHORIZED_FOR_HIRE',
        safetyRating: 'SATISFACTORY',
        insurancePolicies: [
          {
            type: 'commercial_auto',
            producer: 'Gallagher',
            underwriter: 'Travelers',
            amBestRating: 'A+',
            policyNumber: 'POL-1',
            effectiveDate: '2026-01-01',
            expirationDate: '2027-01-01',
            coverageLimitUsd: 1000000,
            requiredMinimumUsd: 1000000,
            isCompliant: true,
            daysUntilExpiration: 90,
          },
        ],
        fraudIndicators: {
          chameleonCarrierRisk: 'low',
          doubleBrokeringRisk: 'low',
          recentOwnershipChange: false,
          freightGuardReportsCount: 0,
          unauthorizedContactEmailDomain: false,
        },
      };

      const result = evaluateAutomatedDnd(carrier);
      expect(result.isDndLocked).toBe(false);
      expect(result.reasons.length).toBe(0);
    });

    it('distinguishes between inviolable statutory lock and multi-factor step-up verification tier', () => {
      // Tier 1: Inviolable statutory lockout
      const statutoryBlocked: Partial<CarrierProfile> = {
        operatingAuthority: 'REVOKED',
      };
      const statResult = evaluateAutomatedDnd(statutoryBlocked);
      expect(statResult.isDndLocked).toBe(true);
      expect(statResult.lockType).toBe('STATUTORY_REVOCATION');

      // Tier 2: Elevated contact risk requiring out-of-band Step-Up verification
      const elevatedContact: ContactSecurityProfile = {
        phoneLineType: 'VOIP_VIRTUAL',
        telecomCarrier: 'Google Voice',
        voipRiskLevel: 'LOW',
        emailDomain: 'apex-freight.com',
        emailDomainType: 'CORPORATE_MATCH',
        domainAgeDays: 60, // newly registered domain
        ipOriginCountry: 'US',
        ipCity: 'Chicago',
        isVpnOrProxy: false,
        ipGeolocationMismatch: false,
      };
      const contactEval = evaluateContactSecurity(elevatedContact);
      // Score = 25 (VOIP) + 35 (Domain <90d) = 60 (HIGH, but NOT critical fraud > 70)
      expect(contactEval.riskScore).toBe(60);
      expect(contactEval.riskCategory).toBe('HIGH');
      expect(contactEval.requiresManualVerification).toBe(true);
    });
  });
});
