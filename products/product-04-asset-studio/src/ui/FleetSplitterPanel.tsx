import React, { useState } from 'react';
import {
  splitCargoDemandAcrossFleet,
  DEFAULT_SPLITTER_VEHICLE_IDS,
  FleetSplitResult,
} from '../engine/fleetSplitter';

export const FleetSplitterPanel: React.FC = () => {
  const [palletCount, setPalletCount] = useState<number>(48);
  const [palletWeightLbs, setPalletWeightLbs] = useState<number>(1500); // 1,500 lbs/pallet = 72,000 lbs
  const [includeSprinters, setIncludeSprinters] = useState<boolean>(true);

  const totalDemandWeight = palletCount * palletWeightLbs;

  const allowedVehicles = includeSprinters
    ? DEFAULT_SPLITTER_VEHICLE_IDS
    : DEFAULT_SPLITTER_VEHICLE_IDS.filter((id) => id !== 'sprinter-van');

  const splitResult: FleetSplitResult = splitCargoDemandAcrossFleet({
    items: [
      {
        packageId: 'pallet-gma-48x40',
        quantity: palletCount,
        customWeightLbs: palletWeightLbs,
      },
    ],
    allowedVehicleIds: allowedVehicles,
  });

  const loadPreset = (pallets: number, weightPerPallet: number) => {
    setPalletCount(pallets);
    setPalletWeightLbs(weightPerPallet);
  };

  return (
    <div className="spatial-panel-card">
      <div className="spatial-card-header">
        <div className="card-title-group">
          <h3>Multi-Vehicle Fleet Splitter & Allocation Heuristic</h3>
          <span className="subtitle">
            Partitions manifests exceeding 45,000 lbs or 26 GMA pallets into optimal vehicle combinations
          </span>
        </div>
        <div className="splitter-header-badges">
          <span className="badge-primary">{splitResult.totalVehicles} Vehicles Allocated</span>
          <span className="badge-secondary">{totalDemandWeight.toLocaleString()} lbs Total Demand</span>
        </div>
      </div>

      {/* Preset selector bar */}
      <div className="preset-bar" style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8', alignSelf: 'center', fontWeight: 600 }}>PRESETS:</span>
        <button
          className="btn-preset"
          onClick={() => loadPreset(48, 1500)}
          style={{ fontSize: '11px', padding: '4px 10px', background: '#334155', border: '1px solid #475569', borderRadius: '4px', color: '#f8fafc', cursor: 'pointer' }}
        >
          48 Pallets / 72,000 lbs (Dual Semi/Straight)
        </button>
        <button
          className="btn-preset"
          onClick={() => loadPreset(32, 1300)}
          style={{ fontSize: '11px', padding: '4px 10px', background: '#334155', border: '1px solid #475569', borderRadius: '4px', color: '#f8fafc', cursor: 'pointer' }}
        >
          32 Pallets / 41,600 lbs (Single 53' + Sprinter)
        </button>
        <button
          className="btn-preset"
          onClick={() => loadPreset(78, 1400)}
          style={{ fontSize: '11px', padding: '4px 10px', background: '#334155', border: '1px solid #475569', borderRadius: '4px', color: '#f8fafc', cursor: 'pointer' }}
        >
          78 Pallets / 109,200 lbs (Tri-Vehicle Fleet)
        </button>
      </div>

      {/* Demand sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: '#0f172a', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
            Manifest Pallets: <strong style={{ color: '#38bdf8' }}>{palletCount} pallets</strong>
          </label>
          <input
            type="range"
            min={1}
            max={120}
            step={1}
            value={palletCount}
            onChange={(e) => setPalletCount(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
            Average Pallet Weight: <strong style={{ color: '#38bdf8' }}>{palletWeightLbs.toLocaleString()} lbs</strong>
          </label>
          <input
            type="range"
            min={300}
            max={2500}
            step={50}
            value={palletWeightLbs}
            onChange={(e) => setPalletWeightLbs(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="chk-sprinters"
            checked={includeSprinters}
            onChange={(e) => setIncludeSprinters(e.target.checked)}
          />
          <label htmlFor="chk-sprinters" style={{ fontSize: '11px', color: '#cbd5e1', cursor: 'pointer' }}>
            Allow Sprinter / Box Trucks for Right-Sizing
          </label>
        </div>
      </div>

      {/* Summary Box */}
      <div style={{ padding: '10px 14px', background: '#1e293b', borderLeft: '4px solid #38bdf8', borderRadius: '4px', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5 }}>
          <strong>Partitioning Plan:</strong> {splitResult.summary}
        </p>
      </div>

      {/* Allocated Vehicles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {splitResult.partitions.map((part, idx) => (
          <div
            key={idx}
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', background: '#2563eb', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 700 }}>
                  TRUCK #{idx + 1}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {part.vehicle.category.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#f8fafc' }}>
                {part.vehicle.name}
              </h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#64748b' }}>
                {part.vehicle.interior.lengthFt}ft Interior · {part.vehicle.weight.maxPayloadLbs.toLocaleString()} lbs Max Payload
              </p>

              {/* Metrics */}
              <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Payload:</span>
                    <span><strong>{part.totalWeightLbs.toLocaleString()}</strong> / {part.vehicle.weight.maxPayloadLbs.toLocaleString()} lbs</span>
                  </div>
                  <div style={{ background: '#1e293b', height: '6px', borderRadius: '3px', overflow: 'hidden', marginTop: '2px' }}>
                    <div style={{ background: part.weightUtilizationPct > 95 ? '#ef4444' : '#10b981', width: `${Math.min(100, part.weightUtilizationPct)}%`, height: '100%' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Pallets Allocated:</span>
                    <span><strong>{part.totalPalletEquivalent}</strong> pallets</span>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Cube Volume:</span>
                    <span><strong>{part.totalVolumeCuFt.toLocaleString()}</strong> / {part.vehicle.volumetric.cubicFt.toLocaleString()} cu ft ({part.volumeUtilizationPct}%)</span>
                  </div>
                  <div style={{ background: '#1e293b', height: '6px', borderRadius: '3px', overflow: 'hidden', marginTop: '2px' }}>
                    <div style={{ background: '#38bdf8', width: `${Math.min(100, part.volumeUtilizationPct)}%`, height: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Deep link button */}
            <a
              href={part.cargoFitBridgeUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '6px 10px',
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #0284c7',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                textDecoration: 'none',
                marginTop: '8px',
              }}
            >
              Pack Load in Product 01 (Cargo Fit 3D) →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
