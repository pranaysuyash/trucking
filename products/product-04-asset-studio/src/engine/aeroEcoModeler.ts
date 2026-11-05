/**
 * EPA SmartWay Aerodynamic Drag & Eco-Equipment Modeler
 *
 * Models the aerodynamic coefficient of drag (Cd) reductions, rolling resistance improvements,
 * fuel economy (MPG) lift, fuel cost savings, and GLEC Scope 1 carbon emission reductions
 * achieved by equipping Class 8 commercial vehicles with verified aerodynamic technologies.
 */

export interface AeroPackageFeature {
  id: string;
  name: string;
  category: 'aero_fairings' | 'tires_wheels' | 'idle_reduction';
  description: string;
  cdReduction: number;
  crrReductionPct: number;
  fuelEconomyBenefitPct: number;
  capitalCostUsd: number;
  weightChangeLb: number; // Positive = added tare, Negative = weight saved
  epaSmartWayVerified: boolean;
}

export const SMARTWAY_AERO_FEATURES: AeroPackageFeature[] = [
  {
    id: 'AERO_SIDE_SKIRTS',
    name: 'Advanced Trailer Side Skirts',
    category: 'aero_fairings',
    description: 'Composite aerodynamic side skirts under trailer chassis preventing underbody crosswind turbulence.',
    cdReduction: 0.042,
    crrReductionPct: 0,
    fuelEconomyBenefitPct: 4.8,
    capitalCostUsd: 1250,
    weightChangeLb: 195,
    epaSmartWayVerified: true,
  },
  {
    id: 'AERO_BOAT_TAIL',
    name: 'Trailer Rear Boat-Tail (Fairing)',
    category: 'aero_fairings',
    description: 'Foldable rear door aerodynamic tail panels mitigating low-pressure suction wake behind trailer.',
    cdReduction: 0.034,
    crrReductionPct: 0,
    fuelEconomyBenefitPct: 3.6,
    capitalCostUsd: 1400,
    weightChangeLb: 125,
    epaSmartWayVerified: true,
  },
  {
    id: 'AERO_CAB_EXTENDERS',
    name: 'Cab Roof Deflector & Gap Reducer',
    category: 'aero_fairings',
    description: 'Roof fairing streamlining air onto trailer nose and vertical cab extenders closing tractor-trailer gap.',
    cdReduction: 0.038,
    crrReductionPct: 0,
    fuelEconomyBenefitPct: 4.2,
    capitalCostUsd: 1100,
    weightChangeLb: 85,
    epaSmartWayVerified: true,
  },
  {
    id: 'TIRE_SUPER_SINGLES',
    name: 'Wide-Base Super Single Tires & Alcoa Wheels',
    category: 'tires_wheels',
    description: 'Replaces 8 dual tire assemblies with 4 wide-base singles, dropping rolling resistance and tare weight.',
    cdReduction: 0.008,
    crrReductionPct: 11.5,
    fuelEconomyBenefitPct: 3.2,
    capitalCostUsd: 2800,
    weightChangeLb: -760, // 760 lbs lighter payload gain
    epaSmartWayVerified: true,
  },
  {
    id: 'TIRE_ATIS',
    name: 'Automatic Tire Inflation System (ATIS)',
    category: 'tires_wheels',
    description: 'Continuous wheel-end pressurization keeping all 18 tires locked at exact 105 PSI cold spec.',
    cdReduction: 0.0,
    crrReductionPct: 4.5,
    fuelEconomyBenefitPct: 1.4,
    capitalCostUsd: 950,
    weightChangeLb: 45,
    epaSmartWayVerified: true,
  },
  {
    id: 'APU_ELECTRIC',
    name: 'Electric Auxiliary Power Unit (eAPU)',
    category: 'idle_reduction',
    description: 'Lithium battery-powered cab HVAC eliminating main engine idling during 10-hour statutory sleeper rests.',
    cdReduction: 0.0,
    crrReductionPct: 0,
    fuelEconomyBenefitPct: 6.5, // Equivalent fuel burn reduction from anti-idling
    capitalCostUsd: 4200,
    weightChangeLb: 310,
    epaSmartWayVerified: true,
  },
];

export interface AeroEcoEvaluation {
  baselineCd: number;
  effectiveCd: number;
  baselineMpg: number;
  effectiveMpg: number;
  mpgImprovementPct: number;
  netTareWeightChangeLb: number;
  totalCapitalCostUsd: number;
  annualMiles: number;
  dieselPricePerGalUsd: number;
  baselineAnnualFuelGallons: number;
  effectiveAnnualFuelGallons: number;
  annualFuelSavedGallons: number;
  annualCostSavingsUsd: number;
  annualGlecCo2ReductionTonnes: number;
  simplePaybackMonths: number;
  smartWayCertifiedFleet: boolean;
}

/**
 * Evaluates aerodynamic & eco package performance against baseline Class 8 vehicle.
 */
export function evaluateAeroEcoConfiguration(
  selectedFeatureIds: string[],
  baselineMpg: number = 6.5,
  annualMiles: number = 100000,
  dieselPricePerGalUsd: number = 3.85
): AeroEcoEvaluation {
  const baselineCd = 0.62;
  const activeFeatures = SMARTWAY_AERO_FEATURES.filter((f) => selectedFeatureIds.includes(f.id));

  const totalCdReduction = activeFeatures.reduce((acc, f) => acc + f.cdReduction, 0);
  const effectiveCd = Number(Math.max(0.42, baselineCd - totalCdReduction).toFixed(3));

  // Combined fuel economy benefit calculation (compounded)
  let totalBenefitMultiplier = 1.0;
  for (const f of activeFeatures) {
    totalBenefitMultiplier *= 1.0 + f.fuelEconomyBenefitPct / 100;
  }
  const mpgImprovementPct = Number(((totalBenefitMultiplier - 1.0) * 100).toFixed(1));
  const effectiveMpg = Number((baselineMpg * totalBenefitMultiplier).toFixed(2));

  const netTareWeightChangeLb = activeFeatures.reduce((acc, f) => acc + f.weightChangeLb, 0);
  const totalCapitalCostUsd = activeFeatures.reduce((acc, f) => acc + f.capitalCostUsd, 0);

  // Annual consumption and savings
  const baselineAnnualFuelGallons = Math.round(annualMiles / baselineMpg);
  const effectiveAnnualFuelGallons = Math.round(annualMiles / effectiveMpg);
  const annualFuelSavedGallons = Math.max(0, baselineAnnualFuelGallons - effectiveAnnualFuelGallons);
  const annualCostSavingsUsd = Math.round(annualFuelSavedGallons * dieselPricePerGalUsd);

  // GLEC Scope 1 Carbon Emissions: 10.21 kg CO2e per gallon of ULSD diesel
  const annualGlecCo2ReductionTonnes = Number(((annualFuelSavedGallons * 10.21) / 1000).toFixed(2));

  // Payback period
  let simplePaybackMonths = 0;
  if (totalCapitalCostUsd > 0 && annualCostSavingsUsd > 0) {
    simplePaybackMonths = Number(((totalCapitalCostUsd / annualCostSavingsUsd) * 12).toFixed(1));
  }

  // SmartWay certified fleet criteria: At least side skirts + 1 other verified aero/tire feature
  const hasSkirts = selectedFeatureIds.includes('AERO_SIDE_SKIRTS');
  const smartWayCertifiedFleet = hasSkirts && activeFeatures.length >= 2;

  return {
    baselineCd,
    effectiveCd,
    baselineMpg,
    effectiveMpg,
    mpgImprovementPct,
    netTareWeightChangeLb,
    totalCapitalCostUsd,
    annualMiles,
    dieselPricePerGalUsd,
    baselineAnnualFuelGallons,
    effectiveAnnualFuelGallons,
    annualFuelSavedGallons,
    annualCostSavingsUsd,
    annualGlecCo2ReductionTonnes,
    simplePaybackMonths,
    smartWayCertifiedFleet,
  };
}
