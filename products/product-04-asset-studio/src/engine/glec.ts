/**
 * GLEC Framework v3.0 & EPA SmartWay Carbon Insetting Engine.
 * Product 04 — Fleet & Cargo Asset Studio
 *
 * Implements ISO 14083 & GLEC (Global Logistics Emissions Council) v3.0 calculation:
 * - Well-to-Wheel (WTW) = Well-to-Tank (WTT) + Tank-to-Wheel (TTW)
 * - Scope 1 (Direct tailpipe) & Scope 3 (Carrier supply chain upstream)
 * - Energy vectors: Ultra-Low Sulfur Diesel (ULSD), HVO 100 Renewable Diesel, Bio-CNG (RNG), Battery Electric (BEV)
 * - Allocation of empty repositioning (deadhead miles) per GLEC principles
 */

export type FuelEnergyType = 'diesel_ulsd' | 'hvo100' | 'bio_cng' | 'battery_electric';

export interface FuelEmissionsFactor {
  name: string;
  energyType: FuelEnergyType;
  unit: string;
  // Emissions in gCO2e per fuel unit (gallon or kWh)
  ttwGramsPerUnit: number; // Tank-to-Wheel (Tailpipe)
  wttGramsPerUnit: number; // Well-to-Tank (Upstream feedstock, refining, logistics)
  wtwGramsPerUnit: number; // Total Well-to-Wheel
  co2ReductionVsDieselPct: number;
}

export const GLEC_EMISSION_FACTORS: Record<FuelEnergyType, FuelEmissionsFactor> = {
  diesel_ulsd: {
    name: 'Ultra-Low Sulfur Diesel (Fossil)',
    energyType: 'diesel_ulsd',
    unit: 'gallons',
    ttwGramsPerUnit: 10210, // ~10.21 kg CO2e / gal
    wttGramsPerUnit: 2650,  // ~2.65 kg CO2e / gal
    wtwGramsPerUnit: 12860, // 12.86 kg CO2e / gal total
    co2ReductionVsDieselPct: 0,
  },
  hvo100: {
    name: 'HVO 100 Renewable Diesel (Hydrotreated Vegetable Oil)',
    energyType: 'hvo100',
    unit: 'gallons',
    ttwGramsPerUnit: 0,     // Biogenic carbon neutral closed-loop tailpipe
    wttGramsPerUnit: 1650,  // Feedstock collection & hydrogenation
    wtwGramsPerUnit: 1650,  // ~87% reduction vs fossil diesel
    co2ReductionVsDieselPct: 87.2,
  },
  bio_cng: {
    name: 'Renewable Natural Gas / Bio-CNG (Dairy/Landfill Methane)',
    energyType: 'bio_cng',
    unit: 'DGE (Diesel Gallon Equivalent)',
    ttwGramsPerUnit: 2150,
    wttGramsPerUnit: 1200,
    wtwGramsPerUnit: 3350,  // ~74% reduction vs fossil diesel
    co2ReductionVsDieselPct: 73.9,
  },
  battery_electric: {
    name: 'Class 8 Battery Electric (US Grid Mix 380g/kWh)',
    energyType: 'battery_electric',
    unit: 'kWh',
    ttwGramsPerUnit: 0,
    wttGramsPerUnit: 380,   // US Grid Mix average: 380 gCO2e/kWh
    wtwGramsPerUnit: 380,
    co2ReductionVsDieselPct: 59.7, // ~60% reduction vs fossil diesel baseline at 2.1 kWh/mi vs 6.5 MPG
  },
};

export interface CarbonTripInput {
  loadedMiles: number;
  emptyDeadheadMiles: number;
  cargoPayloadTons: number; // US short tons (2,000 lbs)
  fuelEconomyMpg: number; // MPG for liquid/gas fuels, or kWh/mi for BEV
  kwhPerMile?: number; // Electric truck consumption rate (default: 2.1 kWh/mi)
  selectedFuel: FuelEnergyType;
  isReeferActive?: boolean;
  reeferHours?: number;
}

export interface CarbonFootprintResult {
  fuelType: FuelEnergyType;
  fuelName: string;
  totalMiles: number;
  totalPayloadTonMiles: number;
  fuelConsumedTotal: number; // gallons or kWh
  fuelUnit: string;

  // Mass emissions in kg CO2e
  ttwKgCO2e: number; // Scope 1 tailpipe
  wttKgCO2e: number; // Scope 3 upstream
  wtwKgCO2e: number; // Total footprint

  // Insetting metrics vs baseline diesel
  baselineDieselWtwKgCO2e: number;
  avoidedScope3KgCO2e: number;
  insettingReductionPct: number;

  // Normalized intensity metrics
  gramsCO2ePerTonMile: number;
  gramsCO2ePerTonneKm: number;

  // Scenario Classification (Indicative — Software cannot self-award statutory certifications)
  smartWayPartnerCategory: 'Indicative High-Reduction Scenario (Not EPA Award)' | 'Standard Baseline Scenario';
  indicativeScenarioCategory: 'Substantial Decarbonization Scenario (≥50%)' | 'Baseline Emissions Scenario';
  verificationStandard: string;
}

/**
 * Calculates GLEC v3.0-aligned indicative freight emissions scenarios and insetting estimates.
 * Software calculations are scenario estimates and do not constitute third-party
 * ISO 14083 verification or official EPA SmartWay High Performer awards.
 */
export function calculateCarbonFootprint(input: CarbonTripInput): CarbonFootprintResult {
  const totalMiles = input.loadedMiles + input.emptyDeadheadMiles;
  const payloadTons = Math.max(0.1, input.cargoPayloadTons);
  // Total ton-miles is calculated on loaded cargo movement
  const totalPayloadTonMiles = input.loadedMiles * payloadTons;

  const factor = GLEC_EMISSION_FACTORS[input.selectedFuel];
  const baselineDiesel = GLEC_EMISSION_FACTORS['diesel_ulsd'];

  // Base traction fuel/energy consumption
  let fuelConsumedTotal = 0;
  if (input.selectedFuel === 'battery_electric') {
    // For Class 8 BEV: total energy (kWh) = totalMiles * kWh/mile (multiplication, not division)
    const kwhPerMile = input.kwhPerMile ?? (input.fuelEconomyMpg || 2.1);
    fuelConsumedTotal = totalMiles * kwhPerMile;
    // Auxiliary electric reefer standby draw (~3.5 kW electric standby)
    if (input.isReeferActive && input.reeferHours && input.reeferHours > 0) {
      fuelConsumedTotal += input.reeferHours * 3.5;
    }
  } else {
    // Liquid / gaseous fuels: totalMiles / MPG
    fuelConsumedTotal = totalMiles / Math.max(1.0, input.fuelEconomyMpg);
    // Add auxiliary reefer fuel (approx 0.6 gal/hr diesel for 53' reefer)
    if (input.isReeferActive && input.reeferHours && input.reeferHours > 0) {
      fuelConsumedTotal += input.reeferHours * 0.6;
    }
  }
  fuelConsumedTotal = Number(fuelConsumedTotal.toFixed(2));

  // Baseline fossil diesel fuel consumption (same distance & standard 6.5 MPG baseline)
  const baselineDieselMpg = input.selectedFuel === 'battery_electric' ? 6.5 : Math.max(1.0, input.fuelEconomyMpg);
  let baselineFuelGal = totalMiles / baselineDieselMpg;
  if (input.isReeferActive && input.reeferHours && input.reeferHours > 0) {
    baselineFuelGal += input.reeferHours * 0.6;
  }
  const baselineDieselWtwKgCO2e = Number(((baselineFuelGal * baselineDiesel.wtwGramsPerUnit) / 1000).toFixed(1));

  // Actual emissions
  const ttwKgCO2e = Number(((fuelConsumedTotal * factor.ttwGramsPerUnit) / 1000).toFixed(1));
  const wttKgCO2e = Number(((fuelConsumedTotal * factor.wttGramsPerUnit) / 1000).toFixed(1));
  const wtwKgCO2e = Number((ttwKgCO2e + wttKgCO2e).toFixed(1));

  const avoidedScope3KgCO2e = Math.max(0, Number((baselineDieselWtwKgCO2e - wtwKgCO2e).toFixed(1)));
  const insettingReductionPct = baselineDieselWtwKgCO2e > 0
    ? Number(((avoidedScope3KgCO2e / baselineDieselWtwKgCO2e) * 100).toFixed(1))
    : 0;

  // Normalized intensity in grams CO2e / ton-mile and g CO2e / tonne-km
  // 1 ton-mile = 1.459972 tonne-km
  const gramsCO2ePerTonMile = totalPayloadTonMiles > 0
    ? Number(((wtwKgCO2e * 1000) / totalPayloadTonMiles).toFixed(1))
    : 0;
  const gramsCO2ePerTonneKm = Number((gramsCO2ePerTonMile / 1.459972).toFixed(1));

  const isSubstantialReduction = insettingReductionPct >= 50;

  return {
    fuelType: input.selectedFuel,
    fuelName: factor.name,
    totalMiles,
    totalPayloadTonMiles,
    fuelConsumedTotal,
    fuelUnit: factor.unit,
    ttwKgCO2e,
    wttKgCO2e,
    wtwKgCO2e,
    baselineDieselWtwKgCO2e,
    avoidedScope3KgCO2e,
    insettingReductionPct,
    gramsCO2ePerTonMile,
    gramsCO2ePerTonneKm,
    smartWayPartnerCategory: isSubstantialReduction
      ? 'Indicative High-Reduction Scenario (Not EPA Award)'
      : 'Standard Baseline Scenario',
    indicativeScenarioCategory: isSubstantialReduction
      ? 'Substantial Decarbonization Scenario (≥50%)'
      : 'Baseline Emissions Scenario',
    verificationStandard: 'GLEC v3.0-Aligned Scenario Estimator (Indicative — Not ISO 14083 / EPA Certified)',
  };
}
