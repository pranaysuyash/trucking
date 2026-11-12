import React, { useState } from 'react';
import { IconX, IconShieldAlert } from './icons';
import {
  SAMPLE_FREIGHTGUARD_REPORTS,
  auditCarrierIncidents,
  FreightGuardReport,
  FreightGuardIncidentCategory,
} from '../engine/freightGuardIncident';

export interface FreightGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  carrierDot?: string;
  carrierName?: string;
  onLockStatusChanged?: (isLocked: boolean) => void;
}

export const FreightGuardModal: React.FC<FreightGuardModalProps> = ({
  isOpen,
  onClose,
  carrierDot = '3948210',
  carrierName = 'AeroTrans Logistics Inc',
  onLockStatusChanged,
}) => {
  const [reports, setReports] = useState<FreightGuardReport[]>(SAMPLE_FREIGHTGUARD_REPORTS);
  const [isFilingReport, setIsFilingReport] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState<FreightGuardIncidentCategory>('UNAUTHORIZED_REBROKERING');
  const [newBrokerName, setNewBrokerName] = useState<string>('Apex Logistics Exchange');
  const [newDisputedAmount, setNewDisputedAmount] = useState<number>(1850);
  const [newDescription, setNewDescription] = useState<string>('');

  if (!isOpen) return null;

  const summary = auditCarrierIncidents(carrierDot, carrierName, reports);

  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) return;

    const newRpt: FreightGuardReport = {
      reportId: `FG-${Math.floor(1000 + Math.random() * 9000)}`,
      dotNumber: carrierDot,
      carrierLegalName: carrierName,
      reportingBrokerName: newBrokerName,
      reportingBrokerMc: 'MC-994012',
      incidentDate: new Date().toISOString().slice(0, 10),
      reportedDate: new Date().toISOString().slice(0, 10),
      category: newCategory,
      loadReferenceNumber: `LD-${Math.floor(1000 + Math.random() * 9000)}`,
      originCity: 'Chicago, IL',
      destinationCity: 'Atlanta, GA',
      disputedAmountDollars: newDisputedAmount,
      incidentDescription: newDescription,
      status: 'UNRESOLVED',
      hasPoliceReport: false,
    };

    setReports([newRpt, ...reports]);
    setIsFilingReport(false);
    setNewDescription('');

    if (onLockStatusChanged && (newCategory === 'HOSTAGE_LOAD_EXTORTION' || newCategory === 'FRAUDULENT_COI')) {
      onLockStatusChanged(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="freightguard-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(2, 6, 23, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '750px',
          backgroundColor: '#0b1329',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#f8fafc',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, #0b1329 0%, #111e38 100%)',
          }}
        >
          <div>
            <h3
              id="freightguard-title"
              style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <IconShieldAlert size={18} /> Carrier411 FreightGuard &amp; Double-Brokering Shield
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
              DOT: {carrierDot} · {carrierName} · Industry Incident Nexus
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary KPI Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px',
              background: '#0f172a',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid #1e293b',
            }}
          >
            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>NETWORK TRUST SCORE:</span>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color:
                    summary.networkTrustScore >= 80
                      ? '#10b981'
                      : summary.networkTrustScore >= 60
                      ? '#f59e0b'
                      : '#ef4444',
                }}
              >
                {summary.networkTrustScore} / 100
              </div>
            </div>

            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>DISPATCH STATUS:</span>
              <div style={{ marginTop: '2px' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    backgroundColor:
                      summary.embargoStatus === 'CLEAR_TO_DISPATCH'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : summary.embargoStatus === 'CAUTION_CONDITIONAL'
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                    color:
                      summary.embargoStatus === 'CLEAR_TO_DISPATCH'
                        ? '#10b981'
                        : summary.embargoStatus === 'CAUTION_CONDITIONAL'
                        ? '#f59e0b'
                        : '#ef4444',
                  }}
                >
                  {summary.embargoStatus.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>ACTIVE REPORTS:</span>
              <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', color: '#f8fafc' }}>
                {summary.unresolvedCount} Unresolved
              </div>
            </div>

            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>HIGH SEVERITY:</span>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: summary.highSeverityCount > 0 ? '#ef4444' : '#10b981',
                }}
              >
                {summary.highSeverityCount} Critical
              </div>
            </div>
          </div>

          {/* Embargo Warnings */}
          {summary.embargoReasons.length > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid #ef4444',
                padding: '12px 14px',
                borderRadius: '6px',
              }}
            >
              <strong style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginBottom: '4px' }}>
                AUTOMATED DISPATCH EMBARGO REASONS:
              </strong>
              {summary.embargoReasons.map((r, idx) => (
                <div key={idx} style={{ fontSize: '11px', color: '#fca5a5' }}>
                  • {r}
                </div>
              ))}
            </div>
          )}

          {/* Top Bar for Reports Feed & File Incident Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
              INCIDENT HISTORY RECORDS ({reports.length})
            </span>
            <button
              type="button"
              onClick={() => setIsFilingReport(!isFilingReport)}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isFilingReport ? 'Cancel Filing' : '+ File FreightGuard Report'}
            </button>
          </div>

          {/* Filing Form */}
          {isFilingReport && (
            <form
              onSubmit={handleAddReport}
              style={{
                background: '#090d1c',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#94a3b8' }}>INCIDENT CATEGORY:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as FreightGuardIncidentCategory)}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '11px',
                    }}
                  >
                    <option value="UNAUTHORIZED_REBROKERING">Unauthorized Re-brokering (Double Broker)</option>
                    <option value="HOSTAGE_LOAD_EXTORTION">Hostage Load Extortion</option>
                    <option value="BACK_SOLICITATION">Back-Solicitation of Shipper</option>
                    <option value="FRAUDULENT_COI">Fraudulent Certificate of Insurance</option>
                    <option value="MISSED_PICKUP_NO_CALL">Missed Pickup (No Call / No Show)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', color: '#94a3b8' }}>REPORTING BROKER / 3PL:</label>
                  <input
                    type="text"
                    value={newBrokerName}
                    onChange={(e) => setNewBrokerName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '11px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8' }}>DISPUTED AMOUNT ($):</label>
                <input
                  type="number"
                  min="0"
                  value={newDisputedAmount}
                  onChange={(e) => setNewDisputedAmount(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '140px',
                    padding: '6px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontSize: '11px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8' }}>INCIDENT NARRATIVE &amp; EVIDENCE:</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detail exact unauthorized broker posting or refusal to deliver..."
                  style={{
                    width: '100%',
                    padding: '6px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontSize: '11px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#ef4444',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Submit Incident Report
                </button>
              </div>
            </form>
          )}

          {/* List of Reports */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reports.map((rpt) => (
              <div
                key={rpt.reportId}
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 800,
                        backgroundColor:
                          rpt.category === 'HOSTAGE_LOAD_EXTORTION' || rpt.category === 'FRAUDULENT_COI'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(245, 158, 11, 0.2)',
                        color:
                          rpt.category === 'HOSTAGE_LOAD_EXTORTION' || rpt.category === 'FRAUDULENT_COI'
                            ? '#ef4444'
                            : '#f59e0b',
                      }}
                    >
                      {rpt.category.replace(/_/g, ' ')}
                    </span>
                    <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{rpt.reportId}</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Ref: {rpt.loadReferenceNumber}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: rpt.status === 'RESOLVED_SETTLED' ? '#10b981' : '#f59e0b',
                    }}
                  >
                    {rpt.status}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                  {rpt.incidentDescription}
                </p>

                {rpt.carrierRebuttalText && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderLeft: '3px solid #38bdf8',
                      padding: '6px 10px',
                      borderRadius: '0 4px 4px 0',
                      fontSize: '10px',
                      color: '#94a3b8',
                      fontStyle: 'italic',
                    }}
                  >
                    Carrier Rebuttal: "{rpt.carrierRebuttalText}"
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: '#64748b',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <span>
                    Reported by: <strong>{rpt.reportingBrokerName}</strong> ({rpt.reportingBrokerMc}) on {rpt.reportedDate}
                  </span>
                  <span>
                    Disputed: <strong>${rpt.disputedAmountDollars.toLocaleString()}</strong> · Route: {rpt.originCity} -&gt; {rpt.destinationCity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'flex-end',
            background: '#090d1c',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Close Incident Exchange
          </button>
        </div>
      </div>
    </div>
  );
};
