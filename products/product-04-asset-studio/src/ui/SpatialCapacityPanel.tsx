import React from 'react';
import type {
  VehicleSpec,
  CargoPackageSpec,
  SpatialFitResult,
} from '../engine/types';

interface SpatialCapacityPanelProps {
  vehicle: VehicleSpec;
  packageCatalog: CargoPackageSpec[];
  selectedPackage: CargoPackageSpec;
  quantityOverride: number | null;
  spatialFit: SpatialFitResult;
  onSelectPackage: (pkg: CargoPackageSpec) => void;
  onSetQuantity: (qty: number | null) => void;
  onOpenForgeModal: (tab: 'package') => void;
}

export const SpatialCapacityPanel: React.FC<SpatialCapacityPanelProps> = ({
  vehicle,
  packageCatalog,
  selectedPackage,
  quantityOverride,
  spatialFit,
  onSelectPackage,
  onSetQuantity,
  onOpenForgeModal,
}) => {
  const currentUnits = spatialFit.placedUnits;
  const isMaxUnits = quantityOverride === null || quantityOverride >= spatialFit.maxUnitsByWeight;

  return (
    <div className="spatial-panel-card">
      <div className="spatial-card-header">
        <div className="card-title-group">
          <h3>Spatial Cargo Fit & Clearance Engine</h3>
          <span className="subtitle">Real-time interior cavity collision & geometric packing</span>
        </div>
        <button
          className="btn-forge-quick"
          onClick={() => onOpenForgeModal('package')}
          title="Manually create a new custom package or container"
        >
          + Forge Custom Package
        </button>
      </div>

      {/* Package Selector */}
      <div className="form-row">
        <label htmlFor="package-select-dropdown" className="input-label">Select Packaging, Container or Pallet:</label>
        <select
          id="package-select-dropdown"
          aria-label="Select Packaging, Container or Pallet"
          className="select-dropdown"
          value={selectedPackage.id}
          onChange={(e) => {
            const found = packageCatalog.find((p) => p.id === e.target.value);
            if (found) {
              onSelectPackage(found);
              onSetQuantity(null); // Reset to full fit
            }
          }}
        >
          <optgroup label="Intermodal Shipping Containers">
            {packageCatalog
              .filter((p) => p.category === 'intermodal_container')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.dims.lengthIn}"L x {p.dims.widthIn}"W x {p.dims.heightIn}"H)
                </option>
              ))}
          </optgroup>
          <optgroup label="Standard Logistics Pallets">
            {packageCatalog
              .filter((p) => p.category === 'pallet')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.weight.grossWeightLbs} lbs)
                </option>
              ))}
          </optgroup>
          <optgroup label="Drums, Totes & Bulk Containers">
            {packageCatalog
              .filter((p) => p.category === 'drum_tote' || p.category === 'bulk_bag')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.shape.toUpperCase()})
                </option>
              ))}
          </optgroup>
          <optgroup label="Corrugated Cartons & Master Boxes">
            {packageCatalog
              .filter((p) => p.category === 'carton_box')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </optgroup>
          <optgroup label="Industrial Crates, Coils & Cylinders">
            {packageCatalog
              .filter((p) => p.category === 'industrial_crate' || p.category === 'cylinder_coil')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </optgroup>
        </select>
      </div>

      {/* Selected Package Details Chip */}
      <div className="package-spec-strip">
        <div className="spec-pill">
          <span className="pill-k">Shape:</span>
          <span className="pill-v uppercase">{selectedPackage.shape}</span>
        </div>
        <div className="spec-pill">
          <span className="pill-k">Dimensions:</span>
          <span className="pill-v">{selectedPackage.dims.lengthIn}" x {selectedPackage.dims.widthIn}" x {selectedPackage.dims.heightIn}"</span>
        </div>
        <div className="spec-pill">
          <span className="pill-k">Unit Weight:</span>
          <span className="pill-v">{selectedPackage.weight.grossWeightLbs.toLocaleString()} lbs ({selectedPackage.weight.grossWeightKg} kg)</span>
        </div>
        <div className="spec-pill">
          <span className="pill-k">Max Stack Tiers:</span>
          <span className="pill-v">{selectedPackage.maxStackTiers} high</span>
        </div>
        {selectedPackage.hazmatClass && (
          <div className="spec-pill hazmat-pill">
            <span className="pill-k">Hazmat:</span>
            <span className="pill-v">{selectedPackage.hazmatClass}</span>
          </div>
        )}
      </div>

      {/* Quantity Placement Slider */}
      <div className="quantity-slider-group">
        <div className="slider-label-row">
          <span>Loaded Units inside Cavity: <b>{currentUnits}</b></span>
          <div className="slider-action-links">
            <button
              className={`btn-text ${isMaxUnits ? 'active' : ''}`}
              onClick={() => onSetQuantity(null)}
            >
              Fill to Maximum Cap ({spatialFit.maxUnitsByWeight})
            </button>
            <button
              className="btn-text"
              onClick={() => onSetQuantity(Math.max(1, Math.floor(currentUnits / 2)))}
            >
              Half Load
            </button>
            <button
              className="btn-text"
              onClick={() => onSetQuantity(1)}
            >
              Single Unit
            </button>
          </div>
        </div>
        <input
          type="range"
          id="package-quantity-slider"
          aria-label="Package Quantity Override Slider"
          min="1"
          max={Math.max(1, spatialFit.maxUnitsByWeight * 1.2)}
          value={currentUnits}
          onChange={(e) => onSetQuantity(Number(e.target.value))}
          className="slider-input"
        />
      </div>

      {/* Geometric Clearance Checks */}
      <div className="clearance-alert-grid">
        {/* Door Clearance */}
        <div className={`clearance-badge ${spatialFit.doorClearance.fits ? 'pass' : 'fail'}`}>
          <div className="badge-icon">{spatialFit.doorClearance.fits ? 'PASS' : 'WARN'}</div>
          <div className="badge-content">
            <span className="badge-title">Door Aperture Entry</span>
            <span className="badge-desc">{spatialFit.doorClearance.message}</span>
          </div>
        </div>

        {/* Ceiling Headroom Clearance */}
        <div className={`clearance-badge ${spatialFit.heightClearance.fits ? 'pass' : 'fail'}`}>
          <div className="badge-icon">{spatialFit.heightClearance.fits ? 'PASS' : 'WARN'}</div>
          <div className="badge-content">
            <span className="badge-title">Vertical Ceiling Headroom</span>
            <span className="badge-desc">
              {spatialFit.heightClearance.fits
                ? `${spatialFit.heightClearance.remainingHeightIn.toFixed(1)}" remaining clearance to ceiling.`
                : 'EXCEEDS CEILING: Package is taller than trailer interior.'}
            </span>
          </div>
        </div>

        {/* Floor Load Rating */}
        <div className={`clearance-badge ${spatialFit.floorLoad.withinRating ? 'pass' : 'fail'}`}>
          <div className="badge-icon">{spatialFit.floorLoad.withinRating ? 'PASS' : 'WARN'}</div>
          <div className="badge-content">
            <span className="badge-title">Floor Loading Pressure</span>
            <span className="badge-desc">
              {spatialFit.floorLoad.lbsPerSqFt.toFixed(1)} lbs/sq ft (Rated: {spatialFit.floorLoad.maxRatingLbsPerSqFt} lbs/sq ft)
            </span>
          </div>
        </div>
      </div>

      {/* Utilization Progress Gauges */}
      <div className="utilization-metrics-row">
        {/* Volume Utilization */}
        <div className="util-gauge-card">
          <div className="gauge-header">
            <span>Interior Volume Filled</span>
            <strong>{spatialFit.volumeUtilizationPct}%</strong>
          </div>
          <div className="gauge-track">
            <div
              className={`gauge-fill ${spatialFit.volumeUtilizationPct > 90 ? 'bg-amber' : 'bg-cyan'}`}
              style={{ width: `${Math.min(100, spatialFit.volumeUtilizationPct)}%` }}
            />
          </div>
          <div className="gauge-footer">
            <span>{spatialFit.totalVolumeCuFt.toLocaleString()} / {vehicle.volumetric.cubicFt.toLocaleString()} cu ft</span>
          </div>
        </div>

        {/* Payload Weight Utilization */}
        <div className="util-gauge-card">
          <div className="gauge-header">
            <span>Max Payload Weight</span>
            <strong className={spatialFit.isOverweight ? 'text-rose' : ''}>
              {spatialFit.weightUtilizationPct}% {spatialFit.isOverweight && '(OVERWEIGHT)'}
            </strong>
          </div>
          <div className="gauge-track">
            <div
              className={`gauge-fill ${spatialFit.isOverweight ? 'bg-rose' : spatialFit.weightUtilizationPct > 85 ? 'bg-amber' : 'bg-emerald'}`}
              style={{ width: `${Math.min(100, spatialFit.weightUtilizationPct)}%` }}
            />
          </div>
          <div className="gauge-footer">
            <span>{spatialFit.totalWeightLbs.toLocaleString()} / {vehicle.weight.maxPayloadLbs.toLocaleString()} lbs</span>
          </div>
        </div>
      </div>
    </div>
  );
};
