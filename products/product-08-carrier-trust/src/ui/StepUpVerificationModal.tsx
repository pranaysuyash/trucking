import React, { useState } from 'react';
import type { CarrierProfile } from '../engine/types';
import { platformBus } from '../engine/platformBus';
import { useModalDialog } from './useModalDialog';

export interface StepUpAuditReceipt {
  dotNumber: string;
  legalName: string;
  timestamp: string;
  dispatcherName: string;
  dispatcherId: string;
  safetyDirectorName: string;
  safetyDirectorId: string;
  outOfBandPhoneVerified: boolean;
  underwriterCoiVerified: boolean;
  driverHandshakeVerified: boolean;
  justificationNotes: string;
  recordId: string;
  provenance: 'self_attested_scenario';
  authenticatedApproval: false;
}

interface StepUpVerificationModalProps {
  carrier: CarrierProfile;
  isOpen: boolean;
  onClose: () => void;
  onVerified: (receipt: StepUpAuditReceipt) => void;
}

export const StepUpVerificationModal: React.FC<StepUpVerificationModalProps> = ({
  carrier,
  isOpen,
  onClose,
  onVerified,
}) => {
  const [outOfBandPhoneVerified, setOutOfBandPhoneVerified] = useState(false);
  const [underwriterCoiVerified, setUnderwriterCoiVerified] = useState(false);
  const [driverHandshakeVerified, setDriverHandshakeVerified] = useState(false);
  const [dispatcherName, setDispatcherName] = useState('');
  const [dispatcherId, setDispatcherId] = useState('');
  const [safetyDirectorName, setSafetyDirectorName] = useState('');
  const [safetyDirectorId, setSafetyDirectorId] = useState('');
  const [justificationNotes, setJustificationNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const dialog = useModalDialog(isOpen);

  if (!isOpen) return null;

  // Tier 1 Statutory Precondition: Under 49 U.S.C. § 13906, revoked authority or lapsed BMC-91X cannot be overridden.
  const isStatutoryRevoked =
    carrier.operatingAuthority !== 'AUTHORIZED_FOR_HIRE' ||
    carrier.safetyRating === 'UNSATISFACTORY';

  const canSubmit =
    !isStatutoryRevoked &&
    outOfBandPhoneVerified &&
    underwriterCoiVerified &&
    driverHandshakeVerified &&
    dispatcherName.trim().length > 1 &&
    dispatcherId.trim().length > 1 &&
    safetyDirectorName.trim().length > 1 &&
    safetyDirectorId.trim().length > 1 &&
    justificationNotes.trim().length >= 15;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setErrorMsg('Complete the scenario checkboxes, names, IDs and notes. These entries do not authenticate anyone.');
      return;
    }

    const receipt: StepUpAuditReceipt = {
      dotNumber: carrier.dotNumber,
      legalName: carrier.legalName,
      timestamp: new Date().toISOString(),
      dispatcherName: dispatcherName.trim(),
      dispatcherId: dispatcherId.trim(),
      safetyDirectorName: safetyDirectorName.trim(),
      safetyDirectorId: safetyDirectorId.trim(),
      outOfBandPhoneVerified,
      underwriterCoiVerified,
      driverHandshakeVerified,
      justificationNotes: justificationNotes.trim(),
      recordId: crypto.randomUUID(),
      provenance: 'self_attested_scenario',
      authenticatedApproval: false,
    };

    // Preserve all legacy entries; do not report success if persistence failed.
    try {
      const stored = localStorage.getItem('trucking-carrier-step-up-audits-v1');
      const list: unknown = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) throw new Error('Stored records are not a list.');
      localStorage.setItem('trucking-carrier-step-up-audits-v1', JSON.stringify([...list, receipt]));
    } catch {
      setErrorMsg('Could not save the scenario record. Existing records were left unchanged.');
      return;
    }
    platformBus.publish('CARRIER_SCENARIO_ATTESTED', { dotNumber: carrier.dotNumber, evidenceSource: 'self_attested_scenario', timestamp: receipt.timestamp });

    onVerified(receipt);
    onClose();
  };

  return (
    <dialog
      ref={dialog}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      aria-labelledby="stepup-title"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%', height: '100%', maxWidth: 'none', maxHeight: 'none', margin: 0, border: 0, boxSizing: 'border-box',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          color: '#0f172a',
          borderRadius: '12px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #cbd5e1',
          padding: '24px',
          fontFamily: 'Instrument Sans, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700 }}>
              Tier-3 Governance Protocol
            </div>
            <h2 id="stepup-title" style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              Carrier Scenario Attestation
            </h2>
            <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
              {carrier.legalName} · USDOT #{carrier.dotNumber} · MC #{carrier.mcNumber}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {isStatutoryRevoked ? (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              marginBottom: '20px',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            <strong>⛔ SCENARIO PRECONDITION:</strong>
            <p style={{ margin: '6px 0 0 0' }}>
              The sample operating authority is <strong>{carrier.operatingAuthority}</strong> or Safety Rating is <strong>{carrier.safetyRating}</strong>. <strong>This tool cannot authorize dispatch or override a scenario blocker.</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#1e40af',
                marginBottom: '16px',
                lineHeight: 1.45,
              }}
            >
              ℹ️ <strong>Self-attested scenario record:</strong> These entries are unverified operator assertions. They do not authenticate either person, verify evidence, clear blockers or authorize a load tender.
            </div>

            <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <legend style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b', padding: '0 6px' }}>
                1. Declared scenario checks
              </legend>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={outOfBandPhoneVerified}
                  onChange={(e) => setOutOfBandPhoneVerified(e.target.checked)}
                  style={{ marginTop: '3px', width: '16px', height: '16px' }}
                />
                <div style={{ fontSize: '12px', color: '#334155' }}>
                  <strong>Out-of-Band SAFER Voice Verification:</strong> Directly called the official phone number registered on the federal FMCSA SAFER docket (number independently obtained by operator), verifying authorized dispatcher identity and confirming load booking authorization.
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={underwriterCoiVerified}
                  onChange={(e) => setUnderwriterCoiVerified(e.target.checked)}
                  style={{ marginTop: '3px', width: '16px', height: '16px' }}
                />
                <div style={{ fontSize: '12px', color: '#334155' }}>
                  <strong>Underwriter Direct Policy Verification:</strong> Validated Certificate of Insurance directly with the issuing insurance producer or NAIC database. Confirmed active Auto Liability (≥$1,000,000) and Cargo (≥$100,000) with 30-day cancellation notice endorsement.
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={driverHandshakeVerified}
                  onChange={(e) => setDriverHandshakeVerified(e.target.checked)}
                  style={{ marginTop: '3px', width: '16px', height: '16px' }}
                />
                <div style={{ fontSize: '12px', color: '#334155' }}>
                  <strong>Assigned Driver & Equipment Binding:</strong> Verified assigned driver CDL identity and tractor VIN registration against carrier power-unit roster to ensure freight is not trans-loaded or re-brokered.
                </div>
              </label>
            </fieldset>

            <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <legend style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b', padding: '0 6px' }}>
                2. Entered scenario names and IDs (not signatures)
              </legend>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label htmlFor="scenario-dispatcher-name" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                    ASSIGNED DISPATCHER NAME *
                  </label>
                  <input id="scenario-dispatcher-name"
                    type="text"
                    required
                    value={dispatcherName}
                    onChange={(e) => setDispatcherName(e.target.value)}
                    placeholder="e.g. Marcus Vance"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label htmlFor="scenario-dispatcher-id" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                    DISPATCHER EMPLOYEE ID *
                  </label>
                  <input id="scenario-dispatcher-id"
                    type="text"
                    required
                    value={dispatcherId}
                    onChange={(e) => setDispatcherId(e.target.value)}
                    placeholder="e.g. EMP-4412"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label htmlFor="scenario-director-name" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                    SAFETY DIRECTOR / RISK OFFICER NAME *
                  </label>
                  <input id="scenario-director-name"
                    type="text"
                    required
                    value={safetyDirectorName}
                    onChange={(e) => setSafetyDirectorName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label htmlFor="scenario-director-id" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                    SAFETY OFFICER SCENARIO ID (NO PIN) *
                  </label>
                  <input id="scenario-director-id"
                    type="text"
                    required
                    value={safetyDirectorId}
                    onChange={(e) => setSafetyDirectorId(e.target.value)}
                    placeholder="e.g. RISK-099"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="scenario-notes" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                  STEP-UP AUDIT JUSTIFICATION & EVIDENCE NOTES (MIN 15 CHARACTERS) *
                </label>
                <textarea id="scenario-notes"
                  rows={2}
                  required
                  value={justificationNotes}
                  onChange={(e) => setJustificationNotes(e.target.value)}
                  placeholder="Document specific evidence (e.g. Spoke directly with owner Dale Bradley on SAFER line; verified Policy #TRK-9921 with Travelers Insurance)."
                  style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </fieldset>

            {errorMsg && (
              <div style={{ color: '#b91c1c', fontSize: '12px', marginBottom: '12px', fontWeight: 600 }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  minHeight: '44px',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: canSubmit ? '#2563eb' : '#94a3b8',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  minHeight: '44px',
                  boxShadow: canSubmit ? '0 4px 6px -1px rgba(37, 99, 235, 0.3)' : 'none',
                }}
              >
                Save self-attested scenario
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
};
