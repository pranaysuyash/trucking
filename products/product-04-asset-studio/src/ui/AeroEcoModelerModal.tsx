import React, { useState, useMemo } from 'react';
import { IconLeaf, IconX, IconCheck, IconAlertTriangle } from './icons';
import {
  evaluateAeroEcoConfiguration,
  SMARTWAY_AERO_FEATURES,
  AeroEcoEvaluation,
} from '../engine/aeroEcoModeler';

interface AeroEcoModelerModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleName?: string;
}

export const AeroEcoModelerModal: React.FC<AeroEcoModelerModalProps> = ({
  isOpen,
  onClose,
  vehicleName = 'Standard Class 8 Sleeper',
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([
    'AERO_SIDE_SKIRTS',
    'AERO_CAB_EXTENDERS',
  ]);
  const [annualMiles, setAnnualMiles] = useState<number>(100000);
  const [dieselPrice, setDieselPrice] = useState<number>(3.85);

  const evaluation: AeroEcoEvaluation = useMemo(() => {
    return evaluateAeroEcoConfiguration(selectedIds, 6.5, annualMiles, dieselPrice);
  }, [selectedIds, annualMiles, dieselPrice]);

  const toggleFeature = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="camera-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="aero-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="camera-modal-content"
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
            <h3 id="aero-modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconLeaf size={18} style={{ color: '#6ee7b7' }} />
              EPA SmartWay Aerodynamic Drag &amp; Eco-Equipment Modeler
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Simulate Cd aerodynamic fairings, super singles &amp; fuel/carbon ROI for {vehicleName}.
            </p>
          </div>
          <button
            onClick={onClose}
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
            <IconX size={18} />
          </button>
        </div>

        <div style={{ padding: '20px', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Executive Performance Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8, border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Effective Drag (Cd)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>
                {evaluation.effectiveCd}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Base: {evaluation.baselineCd}</div>
            </div>

            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8, border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Highway MPG</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>
                {evaluation.effectiveMpg} <span style={{ fontSize: '0.75rem' }}>MPG</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#4ade80' }}>+{evaluation.mpgImprovementPct}% lift</div>
            </div>

            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8, border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Annual Fuel Savings</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>
                ${evaluation.annualCostSavingsUsd.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>{evaluation.annualFuelSavedGallons.toLocaleString()} gal/yr</div>
            </div>

            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8, border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Payback Period</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: evaluation.simplePaybackMonths < 12 ? '#22c55e' : '#f59e0b' }}>
                {evaluation.simplePaybackMonths} <span style={{ fontSize: '0.75rem' }}>mo</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>CapEx: ${evaluation.totalCapitalCostUsd.toLocaleString()}</div>
            </div>
          </div>

          {/* SmartWay Badge & GLEC Carbon */}
          <div
            style={{
              background: evaluation.smartWayCertifiedFleet ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              border: `1px solid ${evaluation.smartWayCertifiedFleet ? '#22c55e' : '#f59e0b'}`,
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <strong style={{ color: evaluation.smartWayCertifiedFleet ? '#4ade80' : '#fcd34d', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {evaluation.smartWayCertifiedFleet ? <><IconCheck size={14} /> EPA SmartWay Verified Elite Tractor-Trailer Specification</> : <><IconAlertTriangle size={14} /> Standard Fleet Specification (SmartWay Uncertified)</>}
              </strong>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 2 }}>
                Reduces Scope 1 transport emissions by <strong>{evaluation.annualGlecCo2ReductionTonnes} metric tons CO2e/year</strong> per vehicle.
              </div>
            </div>
            {evaluation.netTareWeightChangeLb !== 0 && (
              <span style={{ fontSize: '0.75rem', color: evaluation.netTareWeightChangeLb < 0 ? '#4ade80' : '#fca5a5', fontWeight: 600 }}>
                {evaluation.netTareWeightChangeLb < 0 ? `${Math.abs(evaluation.netTareWeightChangeLb)} lbs Weight Saved!` : `+${evaluation.netTareWeightChangeLb} lbs Tare Added`}
              </span>
            )}
          </div>

          {/* Dials for Annual Mileage and Diesel Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, background: '#1e293b', padding: 12, borderRadius: 8, border: '1px solid #334155' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 }}>
                Annual Fleet Miles per Tractor: <strong>{annualMiles.toLocaleString()} mi</strong>
              </label>
              <input
                type="range"
                min={30000}
                max={180000}
                step={5000}
                value={annualMiles}
                onChange={(e) => setAnnualMiles(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 }}>
                EIA Weekly Retail Diesel Benchmark: <strong>${dieselPrice.toFixed(2)} / gal</strong>
              </label>
              <input
                type="range"
                min={2.5}
                max={6.0}
                step={0.05}
                value={dieselPrice}
                onChange={(e) => setDieselPrice(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Feature Selection Cards */}
          <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#94a3b8' }}>
            Toggle Aerodynamic &amp; Eco Hardware Components:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SMARTWAY_AERO_FEATURES.map((feature) => {
              const isSelected = selectedIds.includes(feature.id);
              return (
                <div
                  key={feature.id}
                  onClick={() => toggleFeature(feature.id)}
                  style={{
                    background: isSelected ? 'rgba(2, 132, 199, 0.15)' : '#1e293b',
                    border: `1px solid ${isSelected ? '#0284c7' : '#334155'}`,
                    borderRadius: 8,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by container
                      style={{ cursor: 'pointer', width: 16, height: 16 }}
                    />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                        {feature.name}
                        {feature.epaSmartWayVerified && (
                          <span style={{ marginLeft: 8, fontSize: '0.65rem', background: '#065f46', color: '#6ee7b7', padding: '1px 6px', borderRadius: 3 }}>
                            SmartWay Verified
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                        {feature.description}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: 140 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                      +{feature.fuelEconomyBenefitPct}% MPG Lift
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      ${feature.capitalCostUsd.toLocaleString()} CapEx
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            background: '#1e293b',
            borderTop: '1px solid #334155',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              borderRadius: 6,
              border: 'none',
              background: '#0284c7',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <IconLeaf size={14} />
            Apply Specification
          </button>
        </div>
      </div>
    </div>
  );
};
