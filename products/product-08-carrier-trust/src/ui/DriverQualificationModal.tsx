import React, { useState, useMemo } from 'react';
import {
  SAMPLE_DRIVER_ROSTER,
  auditDriverQualificationFile,
  DriverQualificationFile,
  DqfAuditResult,
} from '../engine/driverQualification';

interface DriverQualificationModalProps {
  carrierDot: string;
  carrierName: string;
  isOpen: boolean;
  onClose: () => void;
  onAssignDriver?: (driver: DriverQualificationFile) => void;
}

export const DriverQualificationModal: React.FC<DriverQualificationModalProps> = ({
  carrierDot,
  carrierName,
  isOpen,
  onClose,
  onAssignDriver,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(SAMPLE_DRIVER_ROSTER[0].driverId);

  const selectedDriver = useMemo(() => {
    return SAMPLE_DRIVER_ROSTER.find((d) => d.driverId === selectedDriverId) || SAMPLE_DRIVER_ROSTER[0];
  }, [selectedDriverId]);

  const audit: DqfAuditResult = useMemo(() => {
    return auditDriverQualificationFile(selectedDriver, '2026-10-30');
  }, [selectedDriver]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dqf-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: 720,
          background: '#0f172a',
          color: '#f8fafc',
          border: '1px solid #334155',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          className="modal-header"
          style={{
            background: '#1e293b',
            borderBottom: '1px solid #334155',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 id="dqf-modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              🧑‍✈️ Driver Qualification File (DQF) &amp; Clearinghouse Compliance
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              FMCSA 49 CFR Part 391 &amp; Part 382 driver statutory vetting for {carrierName} (DOT #{carrierDot}).
            </p>
          </div>
          <button
            onClick={onClose}
            className="modal-close"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px 8px',
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px', maxHeight: '74vh', overflowY: 'auto' }}>
          {/* Driver Selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
              Select Driver to Audit Qualification File:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {SAMPLE_DRIVER_ROSTER.map((drv) => {
                const isSelected = drv.driverId === selectedDriverId;
                const drvAudit = auditDriverQualificationFile(drv, '2026-10-30');

                return (
                  <div
                    key={drv.driverId}
                    onClick={() => setSelectedDriverId(drv.driverId)}
                    style={{
                      background: isSelected ? 'rgba(2, 132, 199, 0.2)' : '#1e293b',
                      border: `1px solid ${isSelected ? '#0284c7' : '#334155'}`,
                      borderRadius: 6,
                      padding: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <strong style={{ fontSize: '0.8rem', color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                        {drv.fullName}
                      </strong>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 3,
                          background: drvAudit.dispatchLockoutActive ? '#ef4444' : '#22c55e',
                          color: '#ffffff',
                        }}
                      >
                        {drvAudit.dispatchLockoutActive ? 'LOCKED' : 'QUALIFIED'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      CDL: {drv.cdlState}-{drv.cdlNumber.slice(-4)} · {drv.cdlClass}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DQF Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8, border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>DQF Compliance Score</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: audit.overallDqfScore >= 80 ? '#22c55e' : audit.overallDqfScore >= 60 ? '#f59e0b' : '#ef4444' }}>
                {audit.overallDqfScore} / 100
              </div>
            </div>

            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8, border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CDL Status</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: audit.daysUntilCdlExpires < 0 ? '#ef4444' : '#38bdf8' }}>
                {audit.daysUntilCdlExpires < 0 ? 'EXPIRED' : `${audit.daysUntilCdlExpires} Days`}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Exp: {selectedDriver.cdlExpirationDate}</div>
            </div>

            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8, border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>DOT Medical Card</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: audit.daysUntilMedCardExpires < 0 ? '#ef4444' : '#22c55e' }}>
                {audit.daysUntilMedCardExpires < 0 ? 'EXPIRED' : `${audit.daysUntilMedCardExpires} Days`}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>NRCME: {selectedDriver.medicalExaminerRegistryNumber}</div>
            </div>

            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8, border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Clearinghouse Query</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: selectedDriver.clearinghouseStatus === 'CLEARED' ? '#22c55e' : '#ef4444' }}>
                {selectedDriver.clearinghouseStatus}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>49 CFR Part 382</div>
            </div>
          </div>

          {/* Audit Violations Banner */}
          {audit.violations.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {audit.violations.map((v, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    marginBottom: 6,
                    background: v.severity === 'CRITICAL_OOS' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    borderLeft: `4px solid ${v.severity === 'CRITICAL_OOS' ? '#ef4444' : '#f59e0b'}`,
                    color: v.severity === 'CRITICAL_OOS' ? '#fca5a5' : '#fcd34d',
                  }}
                >
                  <strong>{v.severity === 'CRITICAL_OOS' ? '🚫 CRITICAL STATUTORY LOCKOUT' : '⚠️ COMPLIANCE WARNING'}:</strong>{' '}
                  {v.message}
                </div>
              ))}
            </div>
          )}

          {/* Detailed Verification Checklist */}
          <div style={{ background: '#1e293b', borderRadius: 8, padding: 16, border: '1px solid #334155', marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#38bdf8' }}>
              Mandatory DQF Document Inspection Ledger (49 CFR § 391.51):
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{selectedDriver.cdlClass === 'CLASS_A' ? '✅' : '❌'}</span>
                <div>
                  <strong>CDL Class &amp; State:</strong> {selectedDriver.cdlClass} ({selectedDriver.cdlState})
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{audit.daysUntilMedCardExpires >= 0 ? '✅' : '🚫'}</span>
                <div>
                  <strong>DOT Physical (MCSA-5876):</strong>{' '}
                  {audit.daysUntilMedCardExpires >= 0 ? 'Current on Registry' : 'Expired / Disqualified'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{!audit.mvrAnnualOverdue ? '✅' : '⚠️'}</span>
                <div>
                  <strong>Annual MVR Review:</strong>{' '}
                  {audit.mvrAnnualOverdue ? 'Overdue (>365 Days)' : `Current (${selectedDriver.lastAnnualMvrDate})`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{selectedDriver.clearinghouseStatus === 'CLEARED' ? '✅' : '🚫'}</span>
                <div>
                  <strong>Drug &amp; Alcohol Clearinghouse:</strong>{' '}
                  {selectedDriver.clearinghouseStatus === 'CLEARED' ? 'Annual Query Cleared' : 'PROHIBITED'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{selectedDriver.priorEmployerHistoryVerified ? '✅' : '⚠️'}</span>
                <div>
                  <strong>3-Year Safety History:</strong>{' '}
                  {selectedDriver.priorEmployerHistoryVerified ? 'Verified & On File' : 'Pending Investigation'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{selectedDriver.movingViolationsCount3Years <= 1 ? '✅' : '⚠️'}</span>
                <div>
                  <strong>3-Yr Moving Violations:</strong> {selectedDriver.movingViolationsCount3Years} Record(s)
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#1e293b',
            borderTop: '1px solid #334155',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: audit.dispatchLockoutActive ? '#f87171' : '#4ade80', fontWeight: 600 }}>
            {audit.auditSummary}
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid #475569',
                background: '#0f172a',
                color: '#94a3b8',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
            <button
              type="button"
              disabled={audit.dispatchLockoutActive}
              onClick={() => {
                if (onAssignDriver) onAssignDriver(selectedDriver);
                onClose();
              }}
              style={{
                padding: '8px 18px',
                borderRadius: 6,
                border: 'none',
                background: audit.dispatchLockoutActive ? '#475569' : '#16a34a',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: audit.dispatchLockoutActive ? 'not-allowed' : 'pointer',
              }}
            >
              {audit.dispatchLockoutActive ? 'Dispatch Prohibited 🚫' : 'Authorize Driver Load Assignment ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
