import React, { useState } from 'react';
import type {
  VehicleSpec,
  CargoPackageSpec,
  VehicleCategory,
  PackageCategory,
  PackageShape,
} from '../engine/types';

interface AssetForgeModalProps {
  initialTab?: 'vehicle' | 'package';
  onClose: () => void;
  onSaveVehicle: (v: VehicleSpec) => void;
  onSavePackage: (p: CargoPackageSpec) => void;
}

export const AssetForgeModal: React.FC<AssetForgeModalProps> = ({
  initialTab = 'vehicle',
  onClose,
  onSaveVehicle,
  onSavePackage,
}) => {
  const [tab, setTab] = useState<'vehicle' | 'package'>(initialTab);

  // Vehicle Form State
  const [vName, setVName] = useState('Custom 40ft Straight Box');
  const [vCode, setVCode] = useState('CB40');
  const [vCategory, setVCategory] = useState<VehicleCategory>('straight_truck_class_6_7');
  const [vExtL, setVExtL] = useState(48);
  const [vExtW, setVExtW] = useState(8.5);
  const [vExtH, setVExtH] = useState(13.0);
  const [vIntL, setVIntL] = useState(38);
  const [vIntW, setVIntW] = useState(8.2);
  const [vIntH, setVIntH] = useState(8.8);
  const [vDoorW, setVDoorW] = useState(8.0);
  const [vDoorH, setVDoorH] = useState(8.5);
  const [vCurbWt, setVCurbWt] = useState(24000);
  const [vGvwr, setVGvwr] = useState(54000);
  const [vMaxPayload, setVMaxPayload] = useState(30000);
  const [vHp, setVHp] = useState(380);
  const [vFuelType, setVFuelType] = useState<'diesel' | 'electric' | 'cng' | 'hydrogen'>('diesel');
  const [vFuelCap, setVFuelCap] = useState(120);
  const [vLoadedMpg, setVLoadedMpg] = useState(8.0);

  // Package Form State
  const [pName, setPName] = useState('Custom Industrial Tote / Crate');
  const [pCategory, setPCategory] = useState<PackageCategory>('industrial_crate');
  const [pShape, setPShape] = useState<PackageShape>('cuboid');
  const [pL, setPL] = useState(48);
  const [pW, setPW] = useState(40);
  const [pH, setPH] = useState(44);
  const [pGrossWt, setPGrossWt] = useState(1500);
  const [pStackTiers, setPStackTiers] = useState(2);
  const [pHazmat, setPHazmat] = useState('');
  const [pColor, setPColor] = useState('#0d9488');

  const handleSubmitVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const cuFt = vIntL * vIntW * vIntH;
    const cuM = Math.round(cuFt * 0.0283168 * 10) / 10;
    const palletFloor = Math.floor(vIntL / 4) * Math.floor(vIntW / 3.33);

    const newVehicle: VehicleSpec = {
      id: `custom-veh-${Date.now()}`,
      name: vName,
      code: vCode || 'CUST',
      category: vCategory,
      subtype: 'dry_van_53',
      description: 'User-authored custom cargo transport asset.',
      exterior: {
        lengthFt: Number(vExtL),
        widthFt: Number(vExtW),
        heightFt: Number(vExtH),
        wheelbaseIn: 220,
        groundClearanceIn: 12,
        turningRadiusFt: 40,
      },
      interior: {
        lengthFt: Number(vIntL),
        widthFt: Number(vIntW),
        heightFt: Number(vIntH),
        lengthMm: Math.round(vIntL * 304.8),
        widthMm: Math.round(vIntW * 304.8),
        heightMm: Math.round(vIntH * 304.8),
        doorWidthFt: Number(vDoorW),
        doorHeightFt: Number(vDoorH),
        floorHeightIn: 48,
      },
      weight: {
        curbWeightLbs: Number(vCurbWt),
        gvwrLbs: Number(vGvwr),
        maxPayloadLbs: Number(vMaxPayload),
        gcwrLbs: Number(vGvwr),
      },
      volumetric: {
        cubicFt: Math.round(cuFt),
        cubicMeters: cuM,
        standardGmaPalletFloorCap: Math.max(1, palletFloor),
        doubleStackPalletCap: Math.max(1, palletFloor * 2),
      },
      powertrain: {
        engineType: 'Commercial Spec Powertrain',
        horsepower: Number(vHp),
        torqueLbFt: 1400,
        axles: '6x4',
        transmission: 'Automated 12-Speed',
        maxGradeabilityPct: 18,
        topSpeedMph: 75,
      },
      fuelEnergy: {
        fuelType: vFuelType,
        capacity: Number(vFuelCap),
        capacityUnit: vFuelType === 'electric' ? 'kWh' : vFuelType === 'hydrogen' ? 'kg' : 'gal',
        loadedMpg: Number(vLoadedMpg),
        emptyMpg: Number(vLoadedMpg) * 1.25,
        loadedRangeMiles: Math.round(Number(vFuelCap) * Number(vLoadedMpg)),
        emptyRangeMiles: Math.round(Number(vFuelCap) * Number(vLoadedMpg) * 1.25),
        refuelTimeMinutes: 15,
        co2GramsPerMile: 1200,
      },
      regulatory: {
        dotClass: 'Class 8',
        bridgeLawAxleLimits: {
          steerLbs: 12000,
          driveTandemLbs: 34000,
          trailerTandemLbs: 34000,
        },
        tempControl: null,
        tieDownTracks: 4,
        floorRatingLbsPerSqFt: 600,
      },
      isCustom: true,
    };

    onSaveVehicle(newVehicle);
    onClose();
  };

  const handleSubmitPackage = (e: React.FormEvent) => {
    e.preventDefault();
    const cuFt = Math.round(((pL * pW * pH) / 1728) * 10) / 10;
    const cuM = Math.round(cuFt * 0.0283168 * 100) / 100;

    const newPkg: CargoPackageSpec = {
      id: `custom-pkg-${Date.now()}`,
      name: pName,
      category: pCategory,
      shape: pShape,
      description: 'User-authored custom cargo packaging unit.',
      dims: {
        lengthIn: Number(pL),
        widthIn: Number(pW),
        heightIn: Number(pH),
        diameterIn: pShape === 'cylinder' ? Number(pW) : undefined,
      },
      dimsMetric: {
        lengthMm: Math.round(pL * 25.4),
        widthMm: Math.round(pW * 25.4),
        heightMm: Math.round(pH * 25.4),
      },
      weight: {
        grossWeightLbs: Number(pGrossWt),
        tareWeightLbs: Math.round(Number(pGrossWt) * 0.05),
        grossWeightKg: Math.round(Number(pGrossWt) * 0.453592),
      },
      volumetricCuFt: cuFt,
      volumetricM3: cuM,
      maxStackTiers: Number(pStackTiers),
      fragility: 'normal',
      hazmatClass: pHazmat.trim() || null,
      tempRequirement: 'ambient',
      color: pColor,
      isCustom: true,
    };

    onSavePackage(newPkg);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h2>Asset Forge — Manual Asset Creator</h2>
            <span className="subtitle">Author custom commercial vehicles, containers, and packaging specifications</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>Close</button>
        </div>

        {/* Tab Switcher */}
        <div className="modal-tabs">
          <button
            className={`modal-tab-btn ${tab === 'vehicle' ? 'active' : ''}`}
            onClick={() => setTab('vehicle')}
          >
            New Custom Vehicle
          </button>
          <button
            className={`modal-tab-btn ${tab === 'package' ? 'active' : ''}`}
            onClick={() => setTab('package')}
          >
            New Custom Package / Container
          </button>
        </div>

        {tab === 'vehicle' ? (
          /* VEHICLE FORM */
          <form onSubmit={handleSubmitVehicle} className="forge-form">
            <div className="form-grid-two">
              <div className="form-group">
                <label>Vehicle Name</label>
                <input
                  type="text"
                  required
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Model Code</label>
                <input
                  type="text"
                  required
                  value={vCode}
                  onChange={(e) => setVCode(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Classification Category</label>
              <select
                value={vCategory}
                onChange={(e) => setVCategory(e.target.value as VehicleCategory)}
              >
                <option value="class_8_combination">Class 8 Tractor-Trailer Combination</option>
                <option value="straight_truck_class_6_7">Class 6/7 Commercial Straight Truck</option>
                <option value="light_commercial_van">Light Commercial Cargo Van / Cutaway</option>
                <option value="specialized_bulk">Specialized Bulk (Tanker / Hopper / Auto)</option>
                <option value="alternative_powertrain">Zero-Emission EV / Hydrogen Fuel Cell</option>
              </select>
            </div>

            <div className="form-section-title">Exterior Dimensions (Feet)</div>
            <div className="form-grid-three">
              <div className="form-group">
                <label>Overall Length (ft)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={vExtL}
                  onChange={(e) => setVExtL(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Overall Width (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={vExtW}
                  onChange={(e) => setVExtW(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Overall Height (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={vExtH}
                  onChange={(e) => setVExtH(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="form-section-title">Interior Loading Cavity (Feet)</div>
            <div className="form-grid-three">
              <div className="form-group">
                <label>Length (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={vIntL}
                  onChange={(e) => setVIntL(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Width (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={vIntW}
                  onChange={(e) => setVIntW(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Height (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={vIntH}
                  onChange={(e) => setVIntH(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="form-grid-two">
              <div className="form-group">
                <label>Door Aperture Width (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={vDoorW}
                  onChange={(e) => setVDoorW(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Door Aperture Height (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={vDoorH}
                  onChange={(e) => setVDoorH(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="form-section-title">Weight Ratings & Powertrain</div>
            <div className="form-grid-three">
              <div className="form-group">
                <label>Curb Weight (lbs)</label>
                <input
                  type="number"
                  required
                  value={vCurbWt}
                  onChange={(e) => setVCurbWt(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>GVWR (lbs)</label>
                <input
                  type="number"
                  required
                  value={vGvwr}
                  onChange={(e) => setVGvwr(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Max Payload (lbs)</label>
                <input
                  type="number"
                  required
                  value={vMaxPayload}
                  onChange={(e) => setVMaxPayload(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="form-grid-two">
              <div className="form-group">
                <label>Horsepower (HP)</label>
                <input
                  type="number"
                  required
                  value={vHp}
                  onChange={(e) => setVHp(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Fuel / Energy Type</label>
                <select
                  value={vFuelType}
                  onChange={(e) => setVFuelType(e.target.value as any)}
                >
                  <option value="diesel">Ultra-Low Sulfur Diesel</option>
                  <option value="electric">Battery Electric (EV)</option>
                  <option value="hydrogen">Hydrogen Fuel Cell (FCEV)</option>
                  <option value="cng">Compressed Natural Gas (CNG)</option>
                </select>
              </div>
            </div>

            <div className="form-grid-two">
              <div className="form-group">
                <label>Capacity ({vFuelType === 'electric' ? 'kWh' : vFuelType === 'hydrogen' ? 'kg' : 'gal'})</label>
                <input
                  type="number"
                  required
                  value={vFuelCap}
                  onChange={(e) => setVFuelCap(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Loaded Economy ({vFuelType === 'electric' ? 'mi/kWh' : 'MPG'})</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={vLoadedMpg}
                  onChange={(e) => setVLoadedMpg(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save & Forge Vehicle
              </button>
            </div>
          </form>
        ) : (
          /* PACKAGE FORM */
          <form onSubmit={handleSubmitPackage} className="forge-form">
            <div className="form-grid-two">
              <div className="form-group">
                <label>Package / Unit Name</label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={pCategory}
                  onChange={(e) => setPCategory(e.target.value as PackageCategory)}
                >
                  <option value="pallet">Logistics Pallet</option>
                  <option value="intermodal_container">Intermodal Shipping Container</option>
                  <option value="carton_box">Corrugated Box / Carton</option>
                  <option value="drum_tote">Drum / IBC Tote</option>
                  <option value="industrial_crate">Heavy Industrial Crate</option>
                  <option value="cylinder_coil">Cylindrical Coil / Gas Bottle</option>
                  <option value="bulk_bag">Flexible Bulk Bag (FIBC)</option>
                </select>
              </div>
            </div>

            <div className="form-grid-two">
              <div className="form-group">
                <label>Geometric Shape</label>
                <select
                  value={pShape}
                  onChange={(e) => setPShape(e.target.value as PackageShape)}
                >
                  <option value="cuboid">Cuboid / Rectangular Prism</option>
                  <option value="cylinder">Cylinder / Drum</option>
                  <option value="cage_tote">Cage Enclosed Tote</option>
                  <option value="stepped">Stepped / L-Shaped Skid</option>
                </select>
              </div>
              <div className="form-group">
                <label>Visual Color Code</label>
                <input
                  type="color"
                  value={pColor}
                  onChange={(e) => setPColor(e.target.value)}
                  className="color-picker-input"
                />
              </div>
            </div>

            <div className="form-section-title">Dimensions (Inches) & Weight</div>
            <div className="form-grid-three">
              <div className="form-group">
                <label>{pShape === 'cylinder' ? 'Diameter (in)' : 'Length (in)'}</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={pL}
                  onChange={(e) => setPL(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Width (in)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={pW}
                  onChange={(e) => setPW(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Height (in)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={pH}
                  onChange={(e) => setPH(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="form-grid-three">
              <div className="form-group">
                <label>Gross Weight (lbs)</label>
                <input
                  type="number"
                  required
                  value={pGrossWt}
                  onChange={(e) => setPGrossWt(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Max Stacking Tiers</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={pStackTiers}
                  onChange={(e) => setPStackTiers(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Hazmat Classification</label>
                <input
                  type="text"
                  placeholder="e.g. Class 3 Flammable"
                  value={pHazmat}
                  onChange={(e) => setPHazmat(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save & Forge Package
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
