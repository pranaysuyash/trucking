/**
 * Domain types for Product 04: Fleet & Cargo Asset Studio.
 * Unified specifications for commercial cargo vehicles, containers, pallets,
 * packaging units, 3D/2.5D/2D views, spatial fit checks, and temporal dynamics.
 */

export type VehicleCategory =
  | 'class_8_combination'
  | 'straight_truck_class_6_7'
  | 'light_commercial_van'
  | 'specialized_bulk'
  | 'alternative_powertrain';

export type VehicleSubtype =
  | 'dry_van_53'
  | 'reefer_53'
  | 'flatbed_48'
  | 'step_deck_48'
  | 'lowboy_rgn'
  | 'chemical_tanker'
  | 'pneumatic_hopper'
  | 'auto_hauler'
  | 'conestoga'
  | 'chassis_intermodal'
  | 'twin_pups'
  | 'logging_trailer'
  | 'box_truck_26'
  | 'reefer_straight_24'
  | 'stakebed_20'
  | 'sprinter_van'
  | 'cube_step_van'
  | 'hotshot_gooseneck'
  | 'electric_class8'
  | 'hydrogen_fcev';

export type PackageCategory =
  | 'intermodal_container'
  | 'pallet'
  | 'carton_box'
  | 'drum_tote'
  | 'industrial_crate'
  | 'cylinder_coil'
  | 'bulk_bag';

export type PackageShape = 'cuboid' | 'cylinder' | 'stepped' | 'cage_tote';

export interface VehicleExteriorDims {
  lengthFt: number;
  widthFt: number;
  heightFt: number;
  wheelbaseIn: number;
  groundClearanceIn: number;
  turningRadiusFt: number;
}

export interface VehicleInteriorDims {
  lengthFt: number;
  widthFt: number;
  heightFt: number;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  doorWidthFt: number;
  doorHeightFt: number;
  floorHeightIn: number;
}

export interface VehicleWeightSpec {
  curbWeightLbs: number;
  gvwrLbs: number;
  maxPayloadLbs: number;
  gcwrLbs: number;
}

export interface VehicleVolumetricSpec {
  cubicFt: number;
  cubicMeters: number;
  standardGmaPalletFloorCap: number;
  doubleStackPalletCap: number;
}

export interface VehiclePowertrainSpec {
  engineType: string;
  horsepower: number;
  torqueLbFt: number;
  axles: '6x4' | '6x2' | '4x2' | '8x4';
  transmission: string;
  maxGradeabilityPct: number;
  topSpeedMph: number;
}

export interface VehicleFuelEnergySpec {
  fuelType: 'diesel' | 'electric' | 'cng' | 'hydrogen';
  capacity: number; // gal, kWh, or kg
  capacityUnit: 'gal' | 'kWh' | 'kg';
  loadedMpg: number; // or miles/kWh, miles/kg
  emptyMpg: number;
  loadedRangeMiles: number;
  emptyRangeMiles: number;
  refuelTimeMinutes: number;
  co2GramsPerMile: number;
}

export interface VehicleRegulatorySpec {
  dotClass: 'Class 8' | 'Class 7' | 'Class 6' | 'Class 3' | 'Class 2b';
  bridgeLawAxleLimits: {
    steerLbs: number;
    driveTandemLbs: number;
    trailerTandemLbs: number;
  };
  tempControl: {
    minTempF: number;
    maxTempF: number;
    burnGalPerHour: number;
  } | null;
  tieDownTracks: number;
  floorRatingLbsPerSqFt: number;
}

export interface VehicleSpec {
  id: string;
  name: string;
  code: string;
  category: VehicleCategory;
  subtype: VehicleSubtype;
  description: string;
  exterior: VehicleExteriorDims;
  interior: VehicleInteriorDims;
  weight: VehicleWeightSpec;
  volumetric: VehicleVolumetricSpec;
  powertrain: VehiclePowertrainSpec;
  fuelEnergy: VehicleFuelEnergySpec;
  regulatory: VehicleRegulatorySpec;
  isCustom?: boolean;
}

export interface CargoPackageSpec {
  id: string;
  name: string;
  category: PackageCategory;
  shape: PackageShape;
  description: string;
  dims: {
    lengthIn: number;
    widthIn: number;
    heightIn: number;
    diameterIn?: number;
  };
  dimsMetric: {
    lengthMm: number;
    widthMm: number;
    heightMm: number;
  };
  weight: {
    grossWeightLbs: number;
    tareWeightLbs: number;
    grossWeightKg: number;
  };
  volumetricCuFt: number;
  volumetricM3: number;
  maxStackTiers: number;
  fragility: 'rugged' | 'normal' | 'fragile';
  hazmatClass: string | null;
  tempRequirement: 'ambient' | 'refrigerated' | 'frozen' | 'controlled_room_temp';
  color: string;
  isCustom?: boolean;
}

export interface GridPlacement {
  id: string;
  xIn: number;
  yIn: number;
  zIn: number;
  tier: number;
  row: number;
  col: number;
}

export interface SpatialFitResult {
  maxFloorUnits: number;
  maxStackedUnits: number;
  maxUnitsByWeight: number;
  placedUnits: number;
  limitingFactor: 'volume' | 'weight' | 'door_dimension' | 'none';
  totalVolumeCuFt: number;
  volumeUtilizationPct: number;
  totalWeightLbs: number;
  weightUtilizationPct: number;
  isOverweight: boolean;
  doorClearance: {
    fits: boolean;
    marginWidthIn: number;
    marginHeightIn: number;
    message: string;
  };
  heightClearance: {
    fits: boolean;
    remainingHeightIn: number;
  };
  floorLoad: {
    lbsPerSqFt: number;
    concentratedLbsPerSqFt: number;
    maxRatingLbsPerSqFt: number;
    withinRating: boolean;
    concentratedWithinRating: boolean;
  };
  gridPlacements: GridPlacement[];
}

export interface TemporalSimulation {
  distanceMiles: number;
  speedMph: number;
  drivingTimeHours: number;
  effectiveMpg: number;
  fuelBurned: number;
  remainingFuel: number;
  fuelPercent: number;
  estimatedRangeRemaining: number;
  requiresRefuelStop: boolean;
  refuelStopsCount?: number;
  refuelDwellHours?: number;
  fuelDepletionWarning?: string;
  reeferFuelBurnedGal: number;
  totalFuelCostEst: number;
  co2EmittedLbs: number;
  loadingDockTimeHours: number;
  unloadingDockTimeHours: number;
  totalTurnaroundHours: number;
}

export type ViewMode = '3d' | 'teardown' | '2.5d' | '2d';
export type RenderStyle3D = 'solid' | 'cutaway' | 'wireframe';
