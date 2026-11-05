import React, { useState } from 'react';
import type {
  VehicleSpec,
  CargoPackageSpec,
  SpatialFitResult,
  TemporalSimulation,
} from '../engine/types';
import {
  buildCargoFitBridgeUrl,
  buildFreightPricingBridgeUrl,
  buildHosPlannerBridgeUrl,
  exportOpenLogisticsAssetJson,
  exportSpecCsv,
} from '../engine/bridges';
import { isProductLicensed } from './SuiteDock';
import { useShipmentSession } from '../suite/ShipmentSession';

interface ProjectBridgeBarProps {
  vehicle: VehicleSpec;
  selectedPackage: CargoPackageSpec;
  spatialFit: SpatialFitResult;
  simulation: TemporalSimulation;
  distanceMiles: number;
  speedMph: number;
  onOpenForgeModal: () => void;
}

export const ProjectBridgeBar: React.FC<ProjectBridgeBarProps> = ({
  vehicle,
  selectedPackage,
  spatialFit,
  simulation,
  distanceMiles,
  speedMph,
  onOpenForgeModal,
}) => {
  const session = useShipmentSession();
  const connected = Boolean(session?.selectedId);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const handleSendToCargoFit = () => {
    if (isProductLicensed('product-01-cargo-fit')) {
      const url = connected ? session!.productUrl('product-01-cargo-fit') : buildCargoFitBridgeUrl(vehicle, selectedPackage, spatialFit.placedUnits);
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      handleExportJson();
      setCopyFeedback('Product 01 is an add-on module. Exported Open Logistics Asset JSON.');
      setTimeout(() => setCopyFeedback(null), 4000);
    }
  };

  const handleSendToFreightPricing = () => {
    if (isProductLicensed('product-02-freight-pricing')) {
      const url = connected ? session!.productUrl('product-02-freight-pricing') : buildFreightPricingBridgeUrl(
        vehicle,
        spatialFit.totalWeightLbs,
        distanceMiles,
        Boolean(selectedPackage.hazmatClass)
      );
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      handleExportJson();
      setCopyFeedback('Product 02 is an add-on module. Exported Open Logistics Asset JSON.');
      setTimeout(() => setCopyFeedback(null), 4000);
    }
  };

  const handleSendToHosPlanner = () => {
    if (isProductLicensed('product-03-hos-planner')) {
      const url = connected ? session!.productUrl('product-03-hos-planner') : buildHosPlannerBridgeUrl(vehicle, distanceMiles, speedMph);
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      handleExportJson();
      setCopyFeedback('Product 03 is an add-on module. Exported Open Logistics Asset JSON.');
      setTimeout(() => setCopyFeedback(null), 4000);
    }
  };

  const handleExportJson = () => {
    const jsonStr = exportOpenLogisticsAssetJson(vehicle, selectedPackage, spatialFit, simulation);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vehicle.code}_${selectedPackage.id}_asset_spec.json`;
    a.click();
    URL.revokeObjectURL(url);

    setCopyFeedback('JSON Downloaded');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const handleExportCsv = () => {
    const csvStr = exportSpecCsv(vehicle);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vehicle.code}_specifications.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setCopyFeedback('CSV Downloaded');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  return (
    <header className="bridge-bar-header">
      <div className="header-top-row">
        <div className="brand-group">
          <div className="brand-logo">AS</div>
          <div>
            <div className="brand-title">
              TRUCKING <span className="product-tag">Product 04</span>
            </div>
            <div className="brand-subtitle">Fleet & Cargo Asset Studio · 3D / 2.5D / CAD Engine</div>
          </div>
        </div>
      </div>

      {/* Action Feeds Strip */}
      <div className="header-action-row">
        <div className="action-buttons-group">
          <button
            className="bridge-btn btn-cargofit"
            onClick={handleSendToCargoFit}
            title={connected ? 'Open this shared shipment. Publish the reviewed equipment above to change its declared specification.' : 'Feed equipment dimensions & cargo rows into Product 01 (Cargo Fit)'}
          >
            {connected ? '↗ Open shipment in Cargo Fit (P01)' : '↗ Send to Cargo Fit (P01)'}
          </button>
          <button
            className="bridge-btn btn-pricing"
            onClick={handleSendToFreightPricing}
            title={connected ? 'Open this shared shipment. Local package simulations do not change its accepted pricing inputs.' : 'Feed vehicle tare, fuel MPG & payload weight into Product 02 (Freight Pricing HUD)'}
          >
            {connected ? '↗ Open shipment in Pricing (P02)' : '↗ Dispatch to Freight Pricing (P02)'}
          </button>
          <button
            className="bridge-btn btn-hos"
            onClick={handleSendToHosPlanner}
            title={connected ? 'Open this shared shipment with its canonical lane and driver declaration.' : 'Feed vehicle range, driving speed & fuel stops into Product 03 (HOS Planner)'}
          >
            {connected ? '↗ Open shipment in HOS (P03)' : '↗ Plan Corridor in HOS (P03)'}
          </button>
        </div>

        <div className="export-buttons-group">
          <button className="btn-secondary-chip" onClick={handleExportJson}>
            {copyFeedback === 'JSON Downloaded' ? copyFeedback : 'Export JSON'}
          </button>
          <button className="btn-secondary-chip" onClick={handleExportCsv}>
            {copyFeedback === 'CSV Downloaded' ? copyFeedback : 'Export CSV'}
          </button>
          <button className="btn-forge-highlight" onClick={onOpenForgeModal}>
            + Forge Asset
          </button>
        </div>
      </div>
    </header>
  );
};
