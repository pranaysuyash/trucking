import React, { useState } from 'react';
import type { VehicleSpec } from '../engine/types';
import {
  simulateMultiStopUnload,
  type StopCargoGroup,
} from '../engine/multistop';

interface MultiStopUnloadPanelProps {
  vehicle: VehicleSpec;
}

const DEFAULT_3STOP_PRESET: StopCargoGroup[] = [
  {
    stopNumber: 1,
    stopName: 'Stop 1: Milwaukee Distribution Center (Rear Doors)',
    itemCount: 8,
    totalWeightLbs: 14000,
    zCenterInches: 520, // Loaded near rear doors (45ft to 52ft)
  },
  {
    stopNumber: 2,
    stopName: 'Stop 2: Chicago Regional Hub (Mid Trailer)',
    itemCount: 8,
    totalWeightLbs: 14000,
    zCenterInches: 320, // Loaded in mid section (25ft to 35ft)
  },
  {
    stopNumber: 3,
    stopName: 'Stop 3: Indianapolis Consignee (Nose Bulkhead)',
    itemCount: 8,
    totalWeightLbs: 14000,
    zCenterInches: 120, // Loaded near front bulkhead (5ft to 15ft)
  },
];

export const MultiStopUnloadPanel: React.FC<MultiStopUnloadPanelProps> = ({ vehicle }) => {
  const [stages] = useState(() => simulateMultiStopUnload(vehicle, DEFAULT_3STOP_PRESET));
  const [activeStageIdx, setActiveStageIdx] = useState(0);

  const activeStage = stages[activeStageIdx] || stages[0];
  const dist = activeStage.distribution;

  const steerCap = vehicle.regulatory.bridgeLawAxleLimits.steerLbs;
  const driveCap = vehicle.regulatory.bridgeLawAxleLimits.driveTandemLbs;
  const trailerCap = vehicle.regulatory.bridgeLawAxleLimits.trailerTandemLbs;

  return (
    <div className="multistop-panel-card">
      <div className="multistop-header">
        <div className="title-group">
          <h3>Multi-Stop Drop Sequence & Dynamic CG Axle Simulator</h3>
          <span className="subtitle">
            Estimated Axle Load (Simplified Beam Model) — Detects forward drive-axle overload hazards as rear freight is unloaded across delivery stops. Indicative static model, not certified scale weight.
          </span>
        </div>
        <div className="active-stage-chip">
          Stage {activeStage.stageIndex + 1} of {stages.length}
        </div>
      </div>

      {/* Stage Stepper Buttons */}
      <div className="stepper-buttons-row">
        {stages.map((st, idx) => (
          <button
            key={st.stageIndex}
            className={`stage-btn ${activeStageIdx === idx ? 'active' : ''} ${st.hazardDetected ? 'has-hazard' : ''}`}
            onClick={() => setActiveStageIdx(idx)}
          >
            <div className="btn-stage-num">
              Stage {idx}
            </div>
            <div className="btn-stage-label">
              {idx === 0 ? 'All 3 Stops Loaded' : idx === 1 ? 'Post-Drop Stop 1' : idx === 2 ? 'Post-Drop Stop 2' : 'Empty Return'}
            </div>
          </button>
        ))}
      </div>

      {/* Active Stage Description & Hazard Banner */}
      <div className={`stage-status-banner ${activeStage.hazardDetected ? 'hazard' : 'ok'}`}>
        <div className="status-head">
          <strong>{activeStage.stageName}</strong>
          <span>Payload on Board: <b>{activeStage.activePayloadLbs.toLocaleString()} lbs</b></span>
        </div>
        {activeStage.hazardDescription && (
          <div className="hazard-text">
            {activeStage.hazardDescription}
          </div>
        )}
      </div>

      {/* Axle Scales & CG Indicator */}
      <div className="axle-scales-grid">
        {/* Steer Axle */}
        <div className="axle-scale-card">
          <div className="axle-title">
            <span>Tractor Steer Axle</span>
            <span className="legal-cap">Cap: {steerCap.toLocaleString()} lbs</span>
          </div>
          <div className="scale-reading">
            <span className={`weight-num ${dist.steerLbs > steerCap ? 'text-rose' : 'text-emerald'}`}>
              {dist.steerLbs.toLocaleString()}
            </span>
            <span className="unit">lbs</span>
          </div>
          <div className="gauge-track">
            <div
              className={`gauge-fill ${dist.steerLbs > steerCap ? 'bg-rose' : 'bg-emerald'}`}
              style={{ width: `${Math.min(100, (dist.steerLbs / steerCap) * 100)}%` }}
            />
          </div>
          <span className="gauge-pct">{Math.round((dist.steerLbs / steerCap) * 100)}% Legal Limit</span>
        </div>

        {/* Tractor Drive Tandem (The critical point of failure when rear is unloaded!) */}
        <div className="axle-scale-card highlight-card">
          <div className="axle-title">
            <span>Tractor Drive Tandem</span>
            <span className="legal-cap">Cap: {driveCap.toLocaleString()} lbs</span>
          </div>
          <div className="scale-reading">
            <span className={`weight-num ${dist.driveTandemLbs > driveCap ? 'text-rose' : dist.driveTandemLbs > driveCap * 0.95 ? 'text-amber' : 'text-emerald'}`}>
              {dist.driveTandemLbs.toLocaleString()}
            </span>
            <span className="unit">lbs</span>
          </div>
          <div className="gauge-track">
            <div
              className={`gauge-fill ${dist.driveTandemLbs > driveCap ? 'bg-rose' : dist.driveTandemLbs > driveCap * 0.95 ? 'bg-amber' : 'bg-emerald'}`}
              style={{ width: `${Math.min(100, (dist.driveTandemLbs / driveCap) * 100)}%` }}
            />
          </div>
          <span className={`gauge-pct ${dist.driveTandemLbs > driveCap ? 'text-rose font-bold' : ''}`}>
            {Math.round((dist.driveTandemLbs / driveCap) * 100)}% Legal Limit {dist.driveTandemLbs > driveCap ? '(OVERLOAD)' : ''}
          </span>
        </div>

        {/* Trailer Tandem */}
        <div className="axle-scale-card">
          <div className="axle-title">
            <span>Trailer Tandem Bogie</span>
            <span className="legal-cap">Cap: {trailerCap.toLocaleString()} lbs</span>
          </div>
          <div className="scale-reading">
            <span className={`weight-num ${dist.trailerTandemLbs > trailerCap ? 'text-rose' : 'text-emerald'}`}>
              {dist.trailerTandemLbs.toLocaleString()}
            </span>
            <span className="unit">lbs</span>
          </div>
          <div className="gauge-track">
            <div
              className={`gauge-fill ${dist.trailerTandemLbs > trailerCap ? 'bg-rose' : 'bg-emerald'}`}
              style={{ width: `${Math.min(100, (dist.trailerTandemLbs / trailerCap) * 100)}%` }}
            />
          </div>
          <span className="gauge-pct">{Math.round((dist.trailerTandemLbs / trailerCap) * 100)}% Legal Limit</span>
        </div>

        {/* Center of Gravity (CG) Position */}
        <div className="axle-scale-card">
          <div className="axle-title">
            <span>Cargo Center of Mass (CG)</span>
            <span className="legal-cap">Measured from Nose</span>
          </div>
          <div className="scale-reading">
            <span className="weight-num text-cyan">
              {dist.cgPercentFromNose}%
            </span>
            <span className="unit">({dist.cgInchesFromNose}")</span>
          </div>
          <div className="gauge-track">
            <div
              className="gauge-fill bg-cyan"
              style={{ width: `${Math.min(100, dist.cgPercentFromNose)}%` }}
            />
          </div>
          <span className="gauge-pct text-cyan">
            {dist.cgPercentFromNose < 40 ? 'Nose Heavy' : dist.cgPercentFromNose > 60 ? 'Tail Heavy' : 'Balanced Load'}
          </span>
        </div>
      </div>
    </div>
  );
};
