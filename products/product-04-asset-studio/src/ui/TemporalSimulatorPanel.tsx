import React from 'react';
import type {
  VehicleSpec,
  TemporalSimulation,
} from '../engine/types';

interface TemporalSimulatorPanelProps {
  vehicle: VehicleSpec;
  simulation: TemporalSimulation;
  distanceMiles: number;
  speedMph: number;
  onSetDistance: (dist: number) => void;
  onSetSpeed: (speed: number) => void;
}

export const TemporalSimulatorPanel: React.FC<TemporalSimulatorPanelProps> = ({
  vehicle,
  simulation,
  distanceMiles,
  speedMph,
  onSetDistance,
  onSetSpeed,
}) => {
  const isElectric = vehicle.fuelEnergy.fuelType === 'electric';
  const isHydrogen = vehicle.fuelEnergy.fuelType === 'hydrogen';
  const fuelUnit = vehicle.fuelEnergy.capacityUnit;

  const handleCorridorSelect = (miles: number) => {
    onSetDistance(miles);
  };

  return (
    <div className="temporal-panel-card">
      <div className="temporal-card-header">
        <div className="card-title-group">
          <h3>Temporal Fuel Burn & Range Dynamics</h3>
          <span className="subtitle">Transit timeline, speed-drag penalties, and energy depletion</span>
        </div>
        <div className="corridor-presets">
          <span className="preset-label">Corridors:</span>
          <button className="btn-preset-chip" onClick={() => handleCorridorSelect(150)}>
            Regional (150 mi)
          </button>
          <button className="btn-preset-chip" onClick={() => handleCorridorSelect(500)}>
            Midwest (500 mi)
          </button>
          <button className="btn-preset-chip" onClick={() => handleCorridorSelect(920)}>
            CHI → DAL (920 mi)
          </button>
          <button className="btn-preset-chip" onClick={() => handleCorridorSelect(1135)}>
            LA → SEA (1,135 mi)
          </button>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="temporal-sliders-grid">
        {/* Distance Slider */}
        <div className="slider-control-block">
          <div className="slider-header">
            <label htmlFor="corridor-distance-slider">Corridor Route Distance:</label>
            <strong className="text-cyan font-mono">{distanceMiles} Miles</strong>
          </div>
          <input
            id="corridor-distance-slider"
            aria-label="Corridor Route Distance in Miles"
            type="range"
            min="25"
            max="1400"
            step="25"
            value={distanceMiles}
            onChange={(e) => onSetDistance(Number(e.target.value))}
            className="slider-input"
          />
        </div>

        {/* Speed Slider */}
        <div className="slider-control-block">
          <div className="slider-header">
            <label htmlFor="cruising-speed-slider">Cruising Speed:</label>
            <strong className="text-amber font-mono">{speedMph} MPH</strong>
          </div>
          <input
            id="cruising-speed-slider"
            aria-label="Cruising Speed in Miles Per Hour"
            type="range"
            min="35"
            max="75"
            step="5"
            value={speedMph}
            onChange={(e) => onSetSpeed(Number(e.target.value))}
            className="slider-input"
          />
        </div>
      </div>

      {/* Live Energy & Range Telemetry Gauges */}
      <div className="telemetry-cards-grid">
        {/* Fuel / Battery Gauge */}
        <div className="telemetry-card">
          <div className="card-top">
            <span className="telemetry-label">
              {isElectric ? 'Battery State of Charge' : isHydrogen ? 'Hydrogen Tank' : 'Diesel Fuel Tank'}
            </span>
            <span className={`badge-fuel ${simulation.fuelPercent < 15 ? 'badge-critical' : simulation.fuelPercent < 30 ? 'badge-warn' : 'badge-ok'}`}>
              {simulation.fuelPercent}% Remaining
            </span>
          </div>

          <div className="tank-progress-track">
            <div
              className={`tank-progress-fill ${simulation.fuelPercent < 15 ? 'bg-rose' : simulation.fuelPercent < 30 ? 'bg-amber' : 'bg-emerald'}`}
              style={{ width: `${Math.min(100, simulation.fuelPercent)}%` }}
            />
          </div>

          <div className="telemetry-meta-row">
            <span>Burned: <b>{simulation.fuelBurned} {fuelUnit}</b></span>
            <span>Tank Cap: <b>{vehicle.fuelEnergy.capacity} {fuelUnit}</b></span>
          </div>
        </div>

        {/* Estimated Range Countdown */}
        <div className="telemetry-card">
          <div className="card-top">
            <span className="telemetry-label">Remaining Driving Range</span>
            <span className="telemetry-sub">Based on current payload</span>
          </div>
          <div className="telemetry-hero-stat">
            <span className={`hero-val ${simulation.requiresRefuelStop ? 'text-rose' : 'text-emerald'}`}>
              {simulation.estimatedRangeRemaining}
            </span>
            <span className="hero-unit">Miles</span>
          </div>
          <div className="telemetry-meta-row">
            <span>Effective Economy: <b>{simulation.effectiveMpg} {isElectric ? 'mi/kWh' : isHydrogen ? 'mi/kg' : 'MPG'}</b></span>
            {simulation.requiresRefuelStop && (
              <span className="text-rose font-bold">Refuel Stop Required</span>
            )}
          </div>
        </div>

        {/* Transit Timeline & Turnaround */}
        <div className="telemetry-card">
          <div className="card-top">
            <span className="telemetry-label">Total Operational Turnaround</span>
            <span className="telemetry-sub">Road transit + Dock load/unload</span>
          </div>
          <div className="telemetry-hero-stat">
            <span className="hero-val text-purple">{simulation.totalTurnaroundHours}</span>
            <span className="hero-unit">Hours</span>
          </div>
          <div className="telemetry-meta-row">
            <span>Road Driving: <b>{simulation.drivingTimeHours}h</b></span>
            <span>Dock Handling: <b>{(simulation.loadingDockTimeHours + simulation.unloadingDockTimeHours).toFixed(1)}h</b></span>
          </div>
        </div>

        {/* Cost & Carbon Emissions */}
        <div className="telemetry-card">
          <div className="card-top">
            <span className="telemetry-label">Cost & Carbon Footprint</span>
            <span className="telemetry-sub">Corridor environmental impact</span>
          </div>
          <div className="telemetry-cost-grid">
            <div className="cost-item">
              <span className="cost-k">Fuel Expense:</span>
              <strong className="cost-v text-emerald">${simulation.totalFuelCostEst.toLocaleString()}</strong>
            </div>
            {vehicle.regulatory.tempControl && (
              <div className="cost-item">
                <span className="cost-k">Reefer Fuel:</span>
                <strong className="cost-v text-cyan">{simulation.reeferFuelBurnedGal} gal</strong>
              </div>
            )}
            <div className="cost-item">
              <span className="cost-k">CO₂ Emitted:</span>
              <strong className="cost-v text-slate">{simulation.co2EmittedLbs.toLocaleString()} lbs</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
