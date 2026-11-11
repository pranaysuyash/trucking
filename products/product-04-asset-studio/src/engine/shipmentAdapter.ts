import { getVehicleCatalog } from './catalog';
import type { Shipment, ShipmentAdapter, StageResult } from '../suite/types';
import type { VehicleSpec } from './types';

export interface EquipmentDraft { equipmentId: string; vehicle: VehicleSpec | null }
const positive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;

/** Reject incomplete persisted snapshots before they can reach native renderers. */
export function isVehicleSnapshot(value: unknown): value is VehicleSpec {
  if (!value || typeof value !== 'object') return false;
  const v = value as VehicleSpec;
  const fields = [v.exterior, v.interior, v.weight, v.volumetric, v.powertrain, v.fuelEnergy, v.regulatory];
  if (!v.id || !v.name || !v.code || !v.category || !v.subtype || fields.some(field => !field || typeof field !== 'object')) return false;
  if (!v.regulatory.bridgeLawAxleLimits || !['lengthFt', 'widthFt', 'heightFt', 'doorWidthFt', 'doorHeightFt'].every(key => positive(v.interior[key as keyof VehicleSpec['interior']]))) return false;
  if (!positive(v.weight.maxPayloadLbs) || !positive(v.fuelEnergy.loadedMpg)) return false;
  const requiredNumbers: [object, string[]][] = [
    [v.exterior, ['lengthFt', 'widthFt', 'heightFt', 'wheelbaseIn', 'groundClearanceIn', 'turningRadiusFt']],
    [v.interior, ['lengthMm', 'widthMm', 'heightMm', 'floorHeightIn']],
    [v.weight, ['curbWeightLbs', 'gvwrLbs', 'gcwrLbs']],
    [v.volumetric, ['cubicFt', 'cubicMeters', 'standardGmaPalletFloorCap', 'doubleStackPalletCap']],
    [v.powertrain, ['horsepower', 'torqueLbFt', 'maxGradeabilityPct', 'topSpeedMph']],
    [v.fuelEnergy, ['capacity', 'emptyMpg', 'loadedRangeMiles', 'emptyRangeMiles', 'refuelTimeMinutes', 'co2GramsPerMile']],
    [v.regulatory, ['tieDownTracks', 'floorRatingLbsPerSqFt']],
    [v.regulatory.bridgeLawAxleLimits, ['steerLbs', 'driveTandemLbs', 'trailerTandemLbs']],
  ];
  if (!requiredNumbers.every(([entry, keys]) => keys.every(key => typeof (entry as Record<string, unknown>)[key] === 'number' && Number.isFinite((entry as Record<string, number>)[key])))) return false;
  if (v.regulatory.tempControl !== null && (!v.regulatory.tempControl || !Object.values(v.regulatory.tempControl).every(Number.isFinite))) return false;
  if (!v.powertrain.engineType || !v.powertrain.transmission || !v.powertrain.axles || !v.fuelEnergy.fuelType || !v.fuelEnergy.capacityUnit || !v.regulatory.dotClass) return false;
  const finiteNumbers = (entry: unknown): boolean => typeof entry === 'number' ? Number.isFinite(entry) : !entry || typeof entry !== 'object' || Object.values(entry).every(finiteNumbers);
  return finiteNumbers(v);
}

export function equipmentForShipment(shipment: Shipment): EquipmentDraft {
  const saved = shipment.results.asset;
  // Preserve the original legacy record for re-review while publishing unknown subtype to consumers.
  const nativeVehicle = saved?.details.originalVehicle ?? saved?.details.nativeVehicle;
  // A stale observation still preserves the chosen specification; its publication
  // status remains owned by the shipment revision, never by this native import.
  const declaresSelected = nativeVehicle && typeof nativeVehicle === 'object' && 'id' in nativeVehicle && nativeVehicle.id === shipment.input.equipmentId;
  const vehicle = declaresSelected
    ? isVehicleSnapshot(nativeVehicle) ? nativeVehicle : null
    : getVehicleCatalog().find(v => v.id === shipment.input.equipmentId) ?? null;
  return { equipmentId: shipment.input.equipmentId, vehicle: vehicle ? structuredClone(vehicle) : null };
}

/** Full reviewed vehicle retained; package simulators remain independent. */
export function resultForVehicle(shipment: Shipment, vehicle: VehicleSpec | null): StageResult {
  if (!isVehicleSnapshot(vehicle)) throw new Error('Select equipment with complete positive interior, door, payload and fuel declarations. Unknown or incomplete equipment cannot be published.');
  const legacyCustomSubtype = vehicle.isCustom && vehicle.subtypeSource !== 'operator_declared';
  const publishedVehicle = legacyCustomSubtype ? { ...structuredClone(vehicle), subtype: 'unknown' as const } : structuredClone(vehicle);
  return {
    ok: true, summary: `${vehicle.name}: declared interior, door and payload snapshot ready.`,
    details: {
      equipmentId: vehicle.id, name: vehicle.name,
      lengthIn: vehicle.interior.lengthFt * 12, widthIn: vehicle.interior.widthFt * 12, heightIn: vehicle.interior.heightFt * 12,
      doorWidthIn: vehicle.interior.doorWidthFt * 12, doorHeightIn: vehicle.interior.doorHeightFt * 12,
      payloadLbs: vehicle.weight.maxPayloadLbs, loadedMpg: vehicle.fuelEnergy.loadedMpg,
      pricingEquipmentCategory: ({ dry_van_53: 'dry_van', reefer_53: 'reefer', flatbed_48: 'flatbed', step_deck_48: 'step_deck' } as Record<string, string>)[publishedVehicle.subtype] ?? null,
      source: vehicle.isCustom ? 'Operator-authored scenario specification; physical equipment measurement remains separate' : 'Catalog scenario template; actual equipment measurement remains separate',
      nativeVehicle: publishedVehicle, ...(legacyCustomSubtype ? { originalVehicle: structuredClone(vehicle) } : {}), reviewedShipmentId: shipment.id,
      reviewedBaseInputRevision: shipment.inputRevision, priorEquipmentId: shipment.input.equipmentId,
      scope: 'Declared equipment specification only. Native package, fuel and axle simulations are exploratory; Cargo Fit owns the identified mixed-unit loading plan.',
    },
  };
}

export const shipmentAdapter: ShipmentAdapter = {
  stage: 'asset',
  evaluate(shipment) {
    return resultForVehicle(shipment, equipmentForShipment(shipment).vehicle);
  },
};
