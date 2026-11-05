import { describe, expect, it } from 'vitest';
import { STANDARD_VEHICLES } from '../src/engine/catalog';
import { equipmentForShipment, isVehicleSnapshot, resultForVehicle } from '../src/engine/shipmentAdapter';
import type { Shipment } from '../src/suite/types';

const shipment = (equipmentId = 'dry-van-53'): Shipment => ({ id: 'shipment-equipment', inputRevision: 4, input: { equipmentId }, results: {} } as Shipment);
const custom = () => ({ ...structuredClone(STANDARD_VEHICLES[0]), id: 'operator-trailer-17', name: 'Measured scenario trailer 17', isCustom: true });

describe('Reviewed native equipment publication', () => {
  it('publishes the chosen exact full snapshot without substituting shipment equipment', () => {
    const vehicle = custom(); vehicle.interior.lengthFt = 47.125; vehicle.weight.maxPayloadLbs = 31234;
    const result = resultForVehicle(shipment(), vehicle);
    expect(result.details).toMatchObject({ equipmentId: vehicle.id, lengthIn: 565.5, payloadLbs: 31234, nativeVehicle: vehicle, reviewedBaseInputRevision: 4 });
    vehicle.weight.maxPayloadLbs = 99;
    expect((result.details.nativeVehicle as typeof vehicle).weight.maxPayloadLbs).toBe(31234);
  });

  it('keeps a valid selected custom snapshot after a different manifest field invalidates its observation', () => {
    const vehicle = custom(); const record = shipment(vehicle.id);
    record.results.asset = { ...resultForVehicle(record, vehicle), productId: 'product-04-asset-studio', inputRevision: 3, recordedAt: '2026-10-22T00:00:00Z' };
    expect(equipmentForShipment(record).vehicle).toEqual(vehicle);
  });

  it('leaves unknown equipment unresolved', () => {
    expect(equipmentForShipment(shipment('unknown-equipment'))).toEqual({ equipmentId: 'unknown-equipment', vehicle: null });
    expect(() => resultForVehicle(shipment(), null)).toThrow(/complete positive/);
  });

  it('does not replace a malformed saved specification with a same-ID catalog template', () => {
    const record = shipment();
    const vehicle = structuredClone(STANDARD_VEHICLES.find(v => v.id === record.input.equipmentId)!);
    delete (vehicle.exterior as Partial<typeof vehicle.exterior>).wheelbaseIn;
    record.results.asset = { ok: true, summary: 'Malformed preserved fixture', productId: 'product-04-asset-studio', inputRevision: 4, recordedAt: '2026-10-22T00:00:00Z', details: { nativeVehicle: vehicle } };
    expect(isVehicleSnapshot(vehicle)).toBe(false);
    expect(equipmentForShipment(record).vehicle).toBeNull();
  });

  it('never assigns a pricing category to an unsupported subtype by name guessing', () => {
    const vehicle = custom(); vehicle.subtype = 'electric_class8'; vehicle.name = 'Dry Van Electric';
    expect(resultForVehicle(shipment(), vehicle).details.pricingEquipmentCategory).toBeNull();
  });
});
