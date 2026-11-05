import type {
  VehicleSpec,
  CargoPackageSpec,
  SpatialFitResult,
  GridPlacement,
} from './types';

export function computeSpatialFit(
  vehicle: VehicleSpec,
  pkg: CargoPackageSpec,
  quantityOverride?: number
): SpatialFitResult {
  const interiorLengthIn = vehicle.interior.lengthFt * 12;
  const interiorWidthIn = vehicle.interior.widthFt * 12;
  const interiorHeightIn = vehicle.interior.heightFt * 12;

  const doorWidthIn = vehicle.interior.doorWidthFt * 12;
  const doorHeightIn = vehicle.interior.doorHeightFt * 12;

  const pkgL = Math.max(1, pkg.dims.lengthIn);
  const pkgW = Math.max(1, pkg.dims.widthIn);
  const pkgH = Math.max(1, pkg.dims.heightIn);

  // Door clearance check
  const normalDoorFit = pkgW <= doorWidthIn && pkgH <= doorHeightIn;
  const turnedDoorFit = pkgL <= doorWidthIn && pkgH <= doorHeightIn;
  const fitsDoor = normalDoorFit || turnedDoorFit;

  const marginWidthIn = doorWidthIn - Math.min(pkgW, pkgL);
  const marginHeightIn = doorHeightIn - pkgH;

  const doorMessage = fitsDoor
    ? `Fits door aperture with ${marginWidthIn.toFixed(1)}" width and ${marginHeightIn.toFixed(1)}" height clearance.`
    : `EXCEEDS DOOR: Package (${pkgW.toFixed(1)}"W x ${pkgH.toFixed(1)}"H) exceeds door aperture (${doorWidthIn.toFixed(1)}"W x ${doorHeightIn.toFixed(1)}"H).`;

  // Height clearance inside
  const remainingHeightIn = interiorHeightIn - pkgH;
  const fitsHeight = remainingHeightIn >= 0;

  // Stacking calculation
  const maxTiersByHeight = Math.floor(interiorHeightIn / pkgH);
  const effectiveTiers = (fitsDoor && fitsHeight)
    ? Math.min(pkg.maxStackTiers, Math.max(0, maxTiersByHeight))
    : 0;

  // Orientation 1: normal (Length along trailer length, Width along trailer width)
  const cols1 = Math.floor(interiorWidthIn / pkgW);
  const rows1 = Math.floor(interiorLengthIn / pkgL);
  const floorUnits1 = Math.max(0, cols1 * rows1);

  // Orientation 2: turned 90 degrees (Length along trailer width, Width along trailer length)
  const cols2 = Math.floor(interiorWidthIn / pkgL);
  const rows2 = Math.floor(interiorLengthIn / pkgW);
  const floorUnits2 = Math.max(0, cols2 * rows2);

  // Choose best arrangement
  const useOrientation1 = floorUnits1 >= floorUnits2;
  const bestFloorUnits = (fitsDoor && fitsHeight) ? (useOrientation1 ? floorUnits1 : floorUnits2) : 0;
  const activeCols = useOrientation1 ? cols1 : cols2;
  const activeRows = useOrientation1 ? rows1 : rows2;
  const activeUnitWidth = useOrientation1 ? pkgW : pkgL;
  const activeUnitLength = useOrientation1 ? pkgL : pkgW;

  const maxStackedUnits = bestFloorUnits * effectiveTiers;

  // Weight payload limit
  const maxUnitsByWeight =
    pkg.weight.grossWeightLbs > 0
      ? Math.floor(vehicle.weight.maxPayloadLbs / pkg.weight.grossWeightLbs)
      : maxStackedUnits;

  // Actual placed units
  let placedUnits = Math.min(maxStackedUnits, maxUnitsByWeight);
  if (typeof quantityOverride === 'number' && quantityOverride >= 0) {
    placedUnits = Math.min(placedUnits, quantityOverride);
  }

  // Hard physical boundary: If package exceeds door aperture or interior height, 0 units can be placed.
  if (!fitsDoor || !fitsHeight) {
    placedUnits = 0;
  }

  // Determine limiting factor
  let limitingFactor: SpatialFitResult['limitingFactor'] = 'none';
  if (!fitsDoor) {
    limitingFactor = 'door_dimension';
  } else if (!fitsHeight) {
    limitingFactor = 'volume';
  } else if (placedUnits === maxUnitsByWeight && maxUnitsByWeight < maxStackedUnits) {
    limitingFactor = 'weight';
  } else if (placedUnits === maxStackedUnits) {
    limitingFactor = 'volume';
  }

  const totalVolumeCuFt = (placedUnits * (pkgL * pkgW * pkgH)) / 1728;
  const volumeUtilizationPct =
    vehicle.volumetric.cubicFt > 0
      ? Math.min(100, (totalVolumeCuFt / vehicle.volumetric.cubicFt) * 100)
      : 0;

  const totalWeightLbs = placedUnits * pkg.weight.grossWeightLbs;
  const weightUtilizationPct =
    vehicle.weight.maxPayloadLbs > 0
      ? Math.min(100, (totalWeightLbs / vehicle.weight.maxPayloadLbs) * 100)
      : 0;
  const isOverweight = totalWeightLbs > vehicle.weight.maxPayloadLbs;

  // Floor load rating (Average distributed across trailer floor)
  const floorAreaSqFt = vehicle.interior.lengthFt * vehicle.interior.widthFt;
  const lbsPerSqFt = floorAreaSqFt > 0 ? totalWeightLbs / floorAreaSqFt : 0;
  const withinRating = lbsPerSqFt <= vehicle.regulatory.floorRatingLbsPerSqFt;

  // Concentrated local footprint load (contact patch pressure of stacked column)
  const unitFootprintSqFt = (pkgL * pkgW) / 144;
  const stackedWeightPerColumn = pkg.weight.grossWeightLbs * (effectiveTiers > 0 ? effectiveTiers : 1);
  const concentratedLbsPerSqFt = unitFootprintSqFt > 0 ? stackedWeightPerColumn / unitFootprintSqFt : 0;
  const concentratedWithinRating = concentratedLbsPerSqFt <= vehicle.regulatory.floorRatingLbsPerSqFt;

  // Generate 3D grid placements
  const gridPlacements: GridPlacement[] = [];
  let unitIndex = 0;

  for (let tier = 0; tier < effectiveTiers && unitIndex < placedUnits; tier++) {
    for (let r = 0; r < activeRows && unitIndex < placedUnits; r++) {
      for (let c = 0; c < activeCols && unitIndex < placedUnits; c++) {
        const xIn = c * activeUnitWidth + activeUnitWidth / 2 - interiorWidthIn / 2;
        const zIn = r * activeUnitLength + activeUnitLength / 2 - interiorLengthIn / 2;
        const yIn = tier * pkgH;

        gridPlacements.push({
          id: `placement-${unitIndex}`,
          xIn,
          yIn,
          zIn,
          tier,
          row: r,
          col: c,
        });
        unitIndex++;
      }
    }
  }

  return {
    maxFloorUnits: bestFloorUnits,
    maxStackedUnits,
    maxUnitsByWeight,
    placedUnits,
    limitingFactor,
    totalVolumeCuFt: Math.round(totalVolumeCuFt * 10) / 10,
    volumeUtilizationPct: Math.round(volumeUtilizationPct * 10) / 10,
    totalWeightLbs: Math.round(totalWeightLbs),
    weightUtilizationPct: Math.round(weightUtilizationPct * 10) / 10,
    isOverweight,
    doorClearance: {
      fits: fitsDoor,
      marginWidthIn: Math.round(marginWidthIn * 10) / 10,
      marginHeightIn: Math.round(marginHeightIn * 10) / 10,
      message: doorMessage,
    },
    heightClearance: {
      fits: fitsHeight,
      remainingHeightIn: Math.round(remainingHeightIn * 10) / 10,
    },
    floorLoad: {
      lbsPerSqFt: Math.round(lbsPerSqFt * 10) / 10,
      concentratedLbsPerSqFt: Math.round(concentratedLbsPerSqFt * 10) / 10,
      maxRatingLbsPerSqFt: vehicle.regulatory.floorRatingLbsPerSqFt,
      withinRating,
      concentratedWithinRating,
    },
    gridPlacements,
  };
}
