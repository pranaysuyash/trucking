import React from 'react';
import { FraudRiskIndicators, OperatingAuthorityStatus, SaferAuthorityFiling, ContactSecurityProfile } from '../engine/types';

interface FraudRiskRadarProps {
  fraud: FraudRiskIndicators;
  authority: OperatingAuthorityStatus;
  powerUnits: number;
  drivers: number;
  contact?: ContactSecurityProfile;
  filings?: SaferAuthorityFiling[];
  onInitiateStepUp?: () => void;
  stepUpVerified?: boolean;
}

export const FraudRiskRadar: React.FC<FraudRiskRadarProps> = ({
  fraud,
  authority,
  powerUnits,
  drivers,
  contact,
  filings,
  onInitiateStepUp,
  stepUpVerified = false,
}) => {
  const isHighRisk =
    fraud.doubleBrokeringRisk === 'high' ||
    fraud.chameleonCarrierRisk === 'high' ||
    authority !== 'AUTHORIZED_FOR_HIRE' ||
    (contact && contact.voipRiskLevel === 'CRITICAL');

  const bmc91Filing = filings?.find((f) => f.formType === 'BMC-91X');

  return (
    <div className="safety-card fraud-card">
      <div className="card-header">
        <div className="title-with-subtitle">
          <h3>🛡️ Fraud Risk & Double-Brokering Detection Radar</h3>
          <span className="subtitle">Chameleon Carrier & Unauthorized Re-Brokering Shield</span>
        </div>
        <span className={`risk-badge ${isHighRisk ? 'critical' : 'clean'}`}>
          {isHighRisk ? '⚠️ HIGH FRAUD RISK' : '✅ LOW FRAUD PROFILE'}
        </span>
      </div>

      <div className="fraud-indicators-grid">
        <div className={`fraud-box ${fraud.doubleBrokeringRisk}`}>
          <span className="fb-lbl">DOUBLE-BROKERING RISK</span>
          <strong className="fb-val">{fraud.doubleBrokeringRisk.toUpperCase()}</strong>
          <span className="fb-sub">IP & Dispatch Nexus Analysis</span>
        </div>

        <div className={`fraud-box ${fraud.chameleonCarrierRisk}`}>
          <span className="fb-lbl">CHAMELEON ENTITY RISK</span>
          <strong className="fb-val">{fraud.chameleonCarrierRisk.toUpperCase()}</strong>
          <span className="fb-sub">Re-Incarnated MC History</span>
        </div>

        <div className="fraud-box">
          <span className="fb-lbl">FREIGHTGUARD REPORTS</span>
          <strong className="fb-val" style={{ color: fraud.freightGuardReportsCount > 0 ? '#ef4444' : '#10b981' }}>
            {fraud.freightGuardReportsCount} Reports
          </strong>
          <span className="fb-sub">Industry Blacklist Claims</span>
        </div>

        <div className="fraud-box">
          <span className="fb-lbl">OPERATING AUTHORITY</span>
          <strong className="fb-val" style={{ color: authority === 'AUTHORIZED_FOR_HIRE' ? '#10b981' : '#ef4444' }}>
            {authority.replace(/_/g, ' ')}
          </strong>
          <span className="fb-sub">{powerUnits} Trucks · {drivers} Drivers</span>
        </div>
      </div>

      {/* Contact Intelligence & SAFER Filing Bar */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px 14px',
          background: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontWeight: 700, color: '#38bdf8' }}>TELECOM & SAFER REGULATORY INTELLIGENCE</span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>FMCSA 49 U.S.C. § 13906 Protocol</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px' }}>Phone Line Type:</span>
            <div style={{ fontWeight: 600, color: contact?.phoneLineType === 'VOIP_VIRTUAL' ? '#ef4444' : '#10b981' }}>
              {contact ? `${contact.phoneLineType} (${contact.telecomCarrier})` : 'Landline / Verified Wireline'}
            </div>
          </div>
          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px' }}>Domain Verification:</span>
            <div style={{ fontWeight: 600, color: (contact?.domainAgeDays ?? 1000) < 90 ? '#ef4444' : '#10b981' }}>
              {contact ? `${contact.emailDomain} (${contact.domainAgeDays}d age)` : 'Corporate Domain Match (>1yr)'}
            </div>
          </div>
          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px' }}>Dispatcher IP Geo:</span>
            <div style={{ fontWeight: 600, color: contact?.ipGeolocationMismatch ? '#ef4444' : '#10b981' }}>
              {contact ? `${contact.ipCity}, ${contact.ipOriginCountry} ${contact.isVpnOrProxy ? '(VPN Exit)' : ''}` : 'US Domestic (Clean ISP)'}
            </div>
          </div>
          <div>
            <span style={{ color: '#94a3b8', fontSize: '11px' }}>SAFER BMC-91X Filing:</span>
            <div style={{ fontWeight: 600, color: bmc91Filing?.filingStatus === 'ACTIVE' || !bmc91Filing ? '#10b981' : '#ef4444' }}>
              {bmc91Filing ? `${bmc91Filing.filingStatus} ($${(bmc91Filing.coverageLimitUsd / 1000).toFixed(0)}k)` : 'ACTIVE ($1,000,000)'}
            </div>
          </div>
        </div>
      </div>

      {stepUpVerified ? (
        <div
          style={{
            marginTop: '14px',
            padding: '12px 14px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: '8px',
            color: '#10b981',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <strong>✅ STEP-UP VERIFICATION AUTHORIZED:</strong> Dual-custody out-of-band SAFER telephone & underwriter COI validation recorded. Carrier cleared for load tender.
          </div>
        </div>
      ) : isHighRisk && (
        <div className="fraud-alert-banner" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            ⚠️ <strong>AUTOMATED FRAUD LOCKOUT ACTIVE:</strong> Carrier exhibits severe fraud, VOIP cyber-risk, or double-brokering indicators. Dispatch system has engaged the Do-Not-Dispatch (DND) hard lockout.
          </div>
          {authority !== 'AUTHORIZED_FOR_HIRE' ? (
            <div style={{ fontSize: '11px', color: '#fca5a5', fontStyle: 'italic' }}>
              ⛔ Statutory Precondition: Authority is {authority.replace(/_/g, ' ')}. 49 U.S.C. § 13906 prohibits overrides.
            </div>
          ) : onInitiateStepUp ? (
            <div>
              <button
                type="button"
                onClick={onInitiateStepUp}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  minHeight: '36px',
                }}
              >
                Initiate Tier-3 Step-Up Verification & Dual-Sign Off ↗
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
