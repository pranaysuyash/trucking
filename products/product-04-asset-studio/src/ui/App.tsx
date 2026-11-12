import { useState, useMemo, useEffect } from 'react';
import {
  getVehicleCatalog,
  getPackageCatalog,
  saveCustomVehicle,
  saveCustomPackage,
} from '../engine/catalog';
import { computeSpatialFit } from '../engine/spatial';
import { simulateTemporalDynamics } from '../engine/temporal';
import type {
  VehicleSpec,
  CargoPackageSpec,
  ViewMode,
  RenderStyle3D,
} from '../engine/types';
import { Realtime3DCanvas } from './Realtime3DCanvas';
import { Interactive3DTeardown } from './Interactive3DTeardown';
import { IsometricVehicle25D } from './IsometricVehicle25D';
import { Blueprint2DView } from './Blueprint2DView';
import { SpatialCapacityPanel } from './SpatialCapacityPanel';
import { TemporalSimulatorPanel } from './TemporalSimulatorPanel';
import { MultiStopUnloadPanel } from './MultiStopUnloadPanel';
import { FleetSplitterPanel } from './FleetSplitterPanel';
import { CarbonInsettingPanel } from './CarbonInsettingPanel';
import { AssetForgeModal } from './AssetForgeModal';
import { AeroEcoModelerModal } from './AeroEcoModelerModal';
import { TrailerIoTSensorsModal } from './TrailerIoTSensorsModal';
import { ProjectBridgeBar } from './ProjectBridgeBar';
import { SuiteDock } from './SuiteDock';
import { IconLeaf, IconRadio } from './icons';
import { platformBus } from '../engine/platformBus';
import { useShipmentSession } from '../suite/ShipmentSession';
import { useShipmentDraft } from '../suite/useShipmentDraft';
import { StructuredValue } from '../suite/ShipmentInspector';
import { equipmentForShipment, resultForVehicle, type EquipmentDraft } from '../engine/shipmentAdapter';

export function App() {
  const session = useShipmentSession();
  const [sharedEquipment, setSharedEquipment] = useState<EquipmentDraft | null>(null);
  const [publicationMessage, setPublicationMessage] = useState('');
  const [vehicleCatalog, setVehicleCatalog] = useState<VehicleSpec[]>(() => getVehicleCatalog());
  const [packageCatalog, setPackageCatalog] = useState<CargoPackageSpec[]>(() => getPackageCatalog());

  // Active Vehicle & Package
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('dry-van-53');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pallet-gma-48x40');
  const [quantityOverride, setQuantityOverride] = useState<number | null>(null);

  // View Controls
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [renderStyle3D, setRenderStyle3D] = useState<RenderStyle3D>('cutaway');
  const [doorsOpen, setDoorsOpen] = useState<boolean>(true);
  const [isoCutaway, setIsoCutaway] = useState<boolean>(true);

  // Temporal Simulation Parameters
  const [distanceMiles, setDistanceMiles] = useState<number>(600);
  const [speedMph, setSpeedMph] = useState<number>(65);

  // Modal State
  const [isForgeModalOpen, setIsForgeModalOpen] = useState(false);
  const [forgeInitialTab, setForgeInitialTab] = useState<'vehicle' | 'package'>('vehicle');
  const [isAeroModalOpen, setIsAeroModalOpen] = useState(false);
  const [isTrailerIoTModalOpen, setIsTrailerIoTModalOpen] = useState(false);

  const selectedVehicle = useMemo(() => {
    return sharedEquipment?.equipmentId === selectedVehicleId ? sharedEquipment.vehicle : vehicleCatalog.find((v) => v.id === selectedVehicleId) ?? null;
  }, [vehicleCatalog, selectedVehicleId, sharedEquipment]);
  const draft = useShipmentDraft({ value: { equipmentId: selectedVehicleId, vehicle: selectedVehicle }, importValue: equipmentForShipment, applyValue: next => { setSelectedVehicleId(next.equipmentId); setSharedEquipment(next); setPublicationMessage(''); } });
  const reviewed = useMemo(() => {
    if (!session?.shipment) return null;
    try { return { result: resultForVehicle(session.shipment, selectedVehicle), error: '' }; }
    catch (error) { return { result: null, error: error instanceof Error ? error.message : 'Equipment cannot be published.' }; }
  }, [session?.shipment, selectedVehicle]);

  const selectedPackage = useMemo(() => {
    return packageCatalog.find((p) => p.id === selectedPackageId) || packageCatalog[0];
  }, [packageCatalog, selectedPackageId]);

  // Spatial Fit Calculation
  const spatialFit = useMemo(() => {
    return selectedVehicle ? computeSpatialFit(selectedVehicle, selectedPackage, quantityOverride ?? undefined) : null;
  }, [selectedVehicle, selectedPackage, quantityOverride]);

  // Temporal Simulation Calculation
  const temporalSimulation = useMemo(() => {
    if (!selectedVehicle || !spatialFit) return null;
    return simulateTemporalDynamics(
      selectedVehicle,
      spatialFit.totalWeightLbs,
      distanceMiles,
      speedMph,
      spatialFit.placedUnits,
      selectedPackage.category
    );
  }, [selectedVehicle, spatialFit, distanceMiles, speedMph, selectedPackage]);

  // Broadcast vehicle changes across the platform bus
  useEffect(() => {
    if (!selectedVehicle) return;
    platformBus.publish(
      'VEHICLE_CHANGED',
      {
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        maxPayloadLbs: selectedVehicle.weight.maxPayloadLbs,
        trailerLengthFt: selectedVehicle.interior.lengthFt,
        source: 'product-04-asset-studio',
      },
      { senderProduct: 'product-04-asset-studio', senderPort: 5176 }
    );
  }, [selectedVehicle]);

  // Handle URL Parameter Sync (if launched from other projects)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.has('shipment')) return;
    const vParam = params.get('vehicle');
    if (vParam) {
      const match = vehicleCatalog.find((v) => v.id === vParam || v.code.toLowerCase() === vParam.toLowerCase());
      if (match) setSelectedVehicleId(match.id);
    }
  }, [vehicleCatalog]);

  const handleSaveCustomVehicle = (newVehicle: VehicleSpec) => {
    saveCustomVehicle(newVehicle);
    setVehicleCatalog(getVehicleCatalog());
    setSharedEquipment(null); setSelectedVehicleId(newVehicle.id);
  };

  const handleSaveCustomPackage = (newPkg: CargoPackageSpec) => {
    saveCustomPackage(newPkg);
    setPackageCatalog(getPackageCatalog());
    setSelectedPackageId(newPkg.id);
    setQuantityOverride(null);
  };

  if (!selectedVehicle || !spatialFit || !temporalSimulation) return <div className="studio-app-container">
    <SuiteDock currentProductId="product-04-asset-studio" />
    <section className="shipment-native-panel" aria-label="Unresolved shipment equipment">
      <h1>Equipment needs an explicit selection</h1>
      <p role="status">The declared equipment ID “{selectedVehicleId}” has no complete native snapshot here. No replacement vehicle has been selected.</p>
      <label htmlFor="resolve-vehicle">Choose a declared catalog vehicle</label>
      <select id="resolve-vehicle" value="" onChange={event => { setSharedEquipment(null); setSelectedVehicleId(event.target.value); }}><option value="" disabled>Select equipment</option>{vehicleCatalog.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}</select>
      <button onClick={draft.loadCurrent}>Load current shared inputs</button>
      {session?.shipment && <button onClick={() => session.inspect('stage:asset')}>Saved equipment details</button>}
    </section>
  </div>;

  return (
    <div className="studio-app-container">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <SuiteDock currentProductId="product-04-asset-studio" />
      {session?.selectedId && <section className="shipment-native-panel" aria-label="Shipment equipment task">
        <div className="shipment-native-heading"><div><span className="shipment-native-kicker">EQUIPMENT DECISION</span><h2>{selectedVehicle.name}</h2></div><span>{draft.dirty ? 'Local selection changed' : 'Reviewed shared selection'}</span></div>
        <p>{selectedVehicle.interior.lengthFt} × {selectedVehicle.interior.widthFt} × {selectedVehicle.interior.heightFt} ft interior · {selectedVehicle.weight.maxPayloadLbs.toLocaleString()} lb declared payload · {selectedVehicle.fuelEnergy.loadedMpg} loaded energy efficiency</p>
        <p>Publishing equipment requires a new loading, receiving, dock and pricing review. Earlier decisions remain in shipment history. Package and axle calculations below remain local until published.</p>
        <div className="shipment-task-buttons">
          <button className="shipment-primary" disabled={!draft.canPublish || !reviewed?.result} onClick={async () => { if (!reviewed?.result || !draft.basis) return; const next = await session.submit('asset.publish', { equipmentId: selectedVehicle.id, result: reviewed.result }, draft.basis.revision); if (next) { draft.acknowledge(next, { equipmentId: selectedVehicleId, vehicle: selectedVehicle }); setPublicationMessage('Reviewed equipment snapshot published. Continue to Cargo Fit to review the affected loading plan.'); } }}>Publish reviewed equipment</button>
          <button onClick={() => session.inspect('stage:asset')}>Saved equipment details</button>
          <button disabled={session.busy || !session.online} onClick={draft.loadCurrent}>Load current shared inputs</button>
          <a href={session.productUrl('product-01-cargo-fit')}>Continue to Cargo Fit</a>
        </div>
        <p role="status">{session.shipment?.status !== 'draft' ? 'Planning is locked after dispatch. Saved equipment remains inspectable; local calculations do not change the shipment.' : draft.incoming ? 'The shipment changed. Your local selection is retained. Load current shared inputs before publishing.' : draft.error || reviewed?.error || publicationMessage || (session.online ? 'Review this declared vehicle before publishing its exact snapshot.' : 'Offline workspace. Reconnect and load shared inputs before publishing.')}</p>
        <details className="shipment-draft-fields"><summary>Reviewed vehicle specification, source and scope</summary><StructuredValue value={reviewed?.result?.details ?? selectedVehicle} /></details>
      </section>}
      {!session?.selectedId && <p className="native-local-note">{draft.detached ? 'Local equipment workspace. Your selection is retained; edits do not update a shipment.' : 'Independent asset studio. Catalog, custom assets and calculations work without a shared shipment.'}</p>}
      {/* Top Project Bridge Header */}
      <ProjectBridgeBar
        vehicle={selectedVehicle}
        selectedPackage={selectedPackage}
        spatialFit={spatialFit}
        simulation={temporalSimulation}
        distanceMiles={distanceMiles}
        speedMph={speedMph}
        onOpenForgeModal={() => {
          setForgeInitialTab('vehicle');
          setIsForgeModalOpen(true);
        }}
      />

      {/* Main Studio Body */}
      <div className="studio-main-layout">
        {/* LEFT COLUMN: VEHICLE CATALOG & SPEC SHEET */}
        <aside className="vehicle-selector-sidebar">
          <div className="sidebar-header">
            <h4>Commercial Vehicle Fleet</h4>
            <span className="count-badge">{vehicleCatalog.length} Units</span>
          </div>

          <div className="vehicle-category-list">
            <label htmlFor="vehicle-main-select" className="sidebar-group-label">Select Cargo Vehicle:</label>
            <select
              id="vehicle-main-select"
              aria-label="Select Commercial Cargo Vehicle"
              className="vehicle-main-select"
              value={selectedVehicleId}
              onChange={(e) => { setSharedEquipment(null); setSelectedVehicleId(e.target.value); setPublicationMessage(''); }}
            >
              {!vehicleCatalog.some(vehicle => vehicle.id === selectedVehicleId) && <option value={selectedVehicleId}>{selectedVehicle.name} (saved shipment specification)</option>}
              <optgroup label="Class 8 Combinations (Semi-Trucks)">
                {vehicleCatalog
                  .filter((v) => v.category === 'class_8_combination')
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Class 6/7 Commercial Straight Trucks">
                {vehicleCatalog
                  .filter((v) => v.category === 'straight_truck_class_6_7')
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Light Commercial Vans & Hotshots">
                {vehicleCatalog
                  .filter((v) => v.category === 'light_commercial_van')
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Specialized Bulk Carriers">
                {vehicleCatalog
                  .filter((v) => v.category === 'specialized_bulk')
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Zero-Emission & Alternative Powertrains">
                {vehicleCatalog
                  .filter((v) => v.category === 'alternative_powertrain')
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Active Vehicle Hero Card */}
          <div className="active-vehicle-card">
            <div className="card-top-row">
              <span className="code-badge">{selectedVehicle.code}</span>
              <span className="dot-badge">{selectedVehicle.regulatory.dotClass}</span>
            </div>
            <h3 className="vehicle-name">{selectedVehicle.name}</h3>
            <p className="vehicle-desc">{selectedVehicle.description}</p>

            {/* Quick Specs List */}
            <div className="specs-list">
              <div className="spec-row">
                <span className="spec-k">Max Legal Payload:</span>
                <strong className="spec-v text-emerald">{selectedVehicle.weight.maxPayloadLbs.toLocaleString()} lbs</strong>
              </div>
              <div className="spec-row">
                <span className="spec-k">Interior Cavity:</span>
                <strong className="spec-v">{selectedVehicle.interior.lengthFt}'L x {selectedVehicle.interior.widthFt}'W x {selectedVehicle.interior.heightFt}'H</strong>
              </div>
              <div className="spec-row">
                <span className="spec-k">Door Aperture:</span>
                <strong className="spec-v text-rose">{selectedVehicle.interior.doorWidthFt.toFixed(1)}'W x {selectedVehicle.interior.doorHeightFt.toFixed(1)}'H</strong>
              </div>
              <div className="spec-row">
                <span className="spec-k">Cargo Volume:</span>
                <strong className="spec-v">{selectedVehicle.volumetric.cubicFt.toLocaleString()} cu ft ({selectedVehicle.volumetric.cubicMeters} m³)</strong>
              </div>
              <div className="spec-row">
                <span className="spec-k">Powertrain:</span>
                <strong className="spec-v">{selectedVehicle.powertrain.horsepower} HP ({selectedVehicle.powertrain.axles})</strong>
              </div>
              <div className="spec-row">
                <span className="spec-k">Loaded Fuel Range:</span>
                <strong className="spec-v text-cyan">{selectedVehicle.fuelEnergy.loadedRangeMiles} mi ({selectedVehicle.fuelEnergy.loadedMpg} {selectedVehicle.fuelEnergy.fuelType === 'electric' ? 'mi/kWh' : selectedVehicle.fuelEnergy.fuelType === 'hydrogen' ? 'mi/kg' : 'MPG'})</strong>
              </div>
              <div className="spec-row">
                <span className="spec-k">Steer / Tandem Axle:</span>
                <strong className="spec-v">{selectedVehicle.regulatory.bridgeLawAxleLimits.steerLbs / 1000}k / {selectedVehicle.regulatory.bridgeLawAxleLimits.trailerTandemLbs / 1000}k lbs</strong>
              </div>
            </div>

            <button
              className="btn-add-vehicle-sidebar"
              onClick={() => {
                setForgeInitialTab('vehicle');
                setIsForgeModalOpen(true);
              }}
            >
              + Author Custom Vehicle
            </button>
          </div>
        </aside>

        {/* RIGHT / MAIN CONTENT: CANVAS VIEWS & ANALYTIC CONTROLS */}
        <main id="main-content" className="studio-canvas-stage" tabIndex={-1}>
          {/* View Mode Switcher Header */}
          <div className="view-mode-tabs-bar">
            <div className="tabs-left">
              <button
                className={`tab-btn ${viewMode === '3d' ? 'active' : ''}`}
                onClick={() => setViewMode('3d')}
              >
                3D Assembly Canvas
              </button>
              <button
                className={`tab-btn tab-btn-teardown ${viewMode === 'teardown' ? 'active' : ''}`}
                onClick={() => setViewMode('teardown')}
              >
                3D Teardown & Cutaway Lab
              </button>
              <button
                className={`tab-btn ${viewMode === '2.5d' ? 'active' : ''}`}
                onClick={() => setViewMode('2.5d')}
              >
                2.5D Isometric Technical
              </button>
              <button
                className={`tab-btn ${viewMode === '2d' ? 'active' : ''}`}
                onClick={() => setViewMode('2d')}
              >
                2D Orthographic CAD Blueprint
              </button>
            </div>

            <div className="tabs-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsAeroModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: '11px',
                  fontWeight: 600,
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  background: '#064e3b',
                  color: '#6ee7b7',
                  cursor: 'pointer',
                }}
              >
                <IconLeaf size={13} />
                SmartWay Aero Modeler
              </button>
              <button
                type="button"
                onClick={() => setIsTrailerIoTModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: '11px',
                  fontWeight: 600,
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  background: '#0c4a6e',
                  color: '#38bdf8',
                  cursor: 'pointer',
                }}
              >
                <IconRadio size={13} />
                Smart Trailer IoT
              </button>
              <span className="status-indicator">
                <span className="indicator-dot pulse-green" />
                Live Spatial Sync Active
              </span>
            </div>
          </div>

          {/* Active View Renderer */}
          <div className="canvas-viewport-box">
            {viewMode === '3d' && (
              <Realtime3DCanvas
                vehicle={selectedVehicle}
                selectedPackage={selectedPackage}
                placements={spatialFit.gridPlacements}
                renderStyle={renderStyle3D}
                doorsOpen={doorsOpen}
                onToggleDoors={() => setDoorsOpen(!doorsOpen)}
                onSetRenderStyle={setRenderStyle3D}
              />
            )}

            {viewMode === 'teardown' && (
              <Interactive3DTeardown
                vehicle={selectedVehicle}
                selectedPackage={selectedPackage}
                placements={spatialFit.gridPlacements}
              />
            )}

            {viewMode === '2.5d' && (
              <IsometricVehicle25D
                vehicle={selectedVehicle}
                selectedPackage={selectedPackage}
                placements={spatialFit.gridPlacements}
                cutaway={isoCutaway}
                onToggleCutaway={() => setIsoCutaway(!isoCutaway)}
              />
            )}

            {viewMode === '2d' && (
              <Blueprint2DView vehicle={selectedVehicle} />
            )}
          </div>

          {/* CONTROLS & ENGINES SECTION: SPATIAL & TEMPORAL */}
          <div className="controls-engines-grid">
            {/* SPATIAL CAPACITY & FIT PANEL */}
            <SpatialCapacityPanel
              vehicle={selectedVehicle}
              packageCatalog={packageCatalog}
              selectedPackage={selectedPackage}
              quantityOverride={quantityOverride}
              spatialFit={spatialFit}
              onSelectPackage={(pkg) => {
                setSelectedPackageId(pkg.id);
                setQuantityOverride(null);
              }}
              onSetQuantity={setQuantityOverride}
              onOpenForgeModal={(tab) => {
                setForgeInitialTab(tab);
                setIsForgeModalOpen(true);
              }}
            />

            {/* TEMPORAL SIMULATION PANEL */}
            <TemporalSimulatorPanel
              vehicle={selectedVehicle}
              simulation={temporalSimulation}
              distanceMiles={distanceMiles}
              speedMph={speedMph}
              onSetDistance={setDistanceMiles}
              onSetSpeed={setSpeedMph}
            />
          </div>

          {/* MULTI-STOP DROP SEQUENCE & DYNAMIC CG AXLE SIMULATOR */}
          <MultiStopUnloadPanel vehicle={selectedVehicle} />

          {/* MULTI-VEHICLE FLEET SPLITTER & DEMAND PARTITIONING */}
          <FleetSplitterPanel />

          {/* GLEC FRAMEWORK V3.0 / EPA SMARTWAY CARBON INSETTING */}
          <CarbonInsettingPanel defaultMiles={distanceMiles} vehicleName={selectedVehicle.name} />
        </main>
      </div>

      {/* Asset Forge Modal */}
      {isForgeModalOpen && (
        <AssetForgeModal
          initialTab={forgeInitialTab}
          onClose={() => setIsForgeModalOpen(false)}
          onSaveVehicle={handleSaveCustomVehicle}
          onSavePackage={handleSaveCustomPackage}
        />
      )}

      {/* SmartWay Aero & Eco Modeler Modal */}
      <AeroEcoModelerModal
        isOpen={isAeroModalOpen}
        onClose={() => setIsAeroModalOpen(false)}
        vehicleName={selectedVehicle.name}
      />

      {/* Smart Trailer IoT Sensors Modal */}
      <TrailerIoTSensorsModal
        isOpen={isTrailerIoTModalOpen}
        onClose={() => setIsTrailerIoTModalOpen(false)}
      />
    </div>
  );
}
