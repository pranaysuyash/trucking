/**
 * Smart Commercial Trailer IoT Sensor Topology & Ultrasonic Volume Fullness Engine.
 * 
 * Models smart commercial trailer telemetry (Great Dane FleetPulse / Wabash Cargo Connect):
 * 1. Ultrasonic / Optical Cargo Volume Fullness (% Cube & Linear Footprint)
 * 2. Rear Door Magnetic Reed Switches & Geofence Security Locks
 * 3. Air Brake Chamber Pushrod Stroke Sensors (CVSA 49 CFR Part 393 Compliance)
 * 4. Solar Roof Charging & Auxiliary Telematics Battery Voltage
 * 5. Wheel-End Thermal Hub Sensors
 */

export interface CargoFullnessTelemetry {
  percentCubeFilled: number; // 0 to 100%
  linearFloorLengthUsedFt: number; // e.g., 53.0 ft
  trailerLengthFt: number;
  cargoState: 'EMPTY_AVAILABLE' | 'PARTIALLY_LOADED' | 'FULLY_LOADED' | 'OVER_CUBED';
  sensorReadings: {
    noseZoneDepthInches: number; // Distance from ceiling to cargo (0 = touching roof)
    midZoneDepthInches: number;
    rearZoneDepthInches: number;
  };
}

export interface DoorSecurityTelemetry {
  rearDoorStatus: 'DOOR_CLOSED_LOCKED' | 'DOOR_OPEN_AUTHORIZED' | 'UNAUTHORIZED_BREACH';
  insideGeofence: boolean;
  tamperSwitchArmed: boolean;
  lastEventTimestamp: string;
}

export interface BrakeStrokeTelemetry {
  chamberType: 'TYPE_30_STANDARD' | 'TYPE_30_LONG_STROKE';
  ratedMaxStrokeInches: number;
  measuredStrokeInches: number;
  cvsaCompliance: 'LEGAL_IN_SERVICE' | 'MARGINAL_ADJUST_REQUIRED' | 'CRITICAL_OUT_OF_SERVICE';
}

export interface SolarPowerTelemetry {
  solarPanelWatts: number;
  auxiliaryBatteryVolts: number;
  batteryStateOfChargePct: number;
  isCharging: boolean;
}

export interface TrailerTelemetrySnapshot {
  trailerUnitNumber: string;
  timestamp: string;
  cargoFullness: CargoFullnessTelemetry;
  doorSecurity: DoorSecurityTelemetry;
  brakeStroke: BrakeStrokeTelemetry;
  solarPower: SolarPowerTelemetry;
  wheelHubTempMaxF: number;
  overallHealthStatus: 'OPTIMAL' | 'ADVISORY' | 'CRITICAL_OOS';
  activeAlerts: string[];
}

/**
 * Calculates cargo cube fullness based on ceiling ultrasonic sensor depths.
 */
export function calculateCargoFullness(
  trailerLengthFt: number,
  ceilingHeightInches: number,
  noseDepthIn: number,
  midDepthIn: number,
  rearDepthIn: number
): CargoFullnessTelemetry {
  // If sensor measures full ceiling height, zone is empty (0% filled)
  // If sensor measures 0 inches, zone is filled to the roof (100% filled)
  const noseFill = Math.max(0, Math.min(100, ((ceilingHeightInches - noseDepthIn) / ceilingHeightInches) * 100));
  const midFill = Math.max(0, Math.min(100, ((ceilingHeightInches - midDepthIn) / ceilingHeightInches) * 100));
  const rearFill = Math.max(0, Math.min(100, ((ceilingHeightInches - rearDepthIn) / ceilingHeightInches) * 100));

  const avgFill = Math.round(((noseFill + midFill + rearFill) / 3) * 10) / 10;
  const linearFt = Math.round(((avgFill / 100) * trailerLengthFt) * 10) / 10;

  let cargoState: CargoFullnessTelemetry['cargoState'] = 'EMPTY_AVAILABLE';
  if (avgFill >= 95) {
    cargoState = 'FULLY_LOADED';
  } else if (avgFill > 10) {
    cargoState = 'PARTIALLY_LOADED';
  }

  return {
    percentCubeFilled: avgFill,
    linearFloorLengthUsedFt: linearFt,
    trailerLengthFt,
    cargoState,
    sensorReadings: {
      noseZoneDepthInches: noseDepthIn,
      midZoneDepthInches: midDepthIn,
      rearZoneDepthInches: rearDepthIn,
    },
  };
}

/**
 * Evaluates air brake pushrod stroke against CVSA Out-of-Service criteria.
 * For Type 30 standard clamp chambers, statutory limit is 2.0 inches (50.8 mm).
 * For Type 30 long stroke chambers, statutory limit is 2.5 inches (63.5 mm).
 */
export function evaluateBrakeStroke(
  chamberType: BrakeStrokeTelemetry['chamberType'],
  strokeInches: number
): BrakeStrokeTelemetry {
  const maxStroke = chamberType === 'TYPE_30_LONG_STROKE' ? 2.5 : 2.0;

  let compliance: BrakeStrokeTelemetry['cvsaCompliance'] = 'LEGAL_IN_SERVICE';
  if (strokeInches > maxStroke) {
    compliance = 'CRITICAL_OUT_OF_SERVICE';
  } else if (strokeInches >= maxStroke - 0.2) {
    compliance = 'MARGINAL_ADJUST_REQUIRED';
  }

  return {
    chamberType,
    ratedMaxStrokeInches: maxStroke,
    measuredStrokeInches: strokeInches,
    cvsaCompliance: compliance,
  };
}

/**
 * Builds a comprehensive trailer IoT snapshot and audits safety alerts.
 */
export function buildTrailerTelemetrySnapshot(
  unitNumber: string = 'TR-53819',
  cargoFullnessPct: number = 84,
  doorOpen: boolean = false,
  insideGeofence: boolean = true,
  brakeStrokeIn: number = 1.75,
  hubTempF: number = 132
): TrailerTelemetrySnapshot {
  const ceilingHeight = 110; // 110" standard interior height
  const depth = ceilingHeight * (1 - cargoFullnessPct / 100);
  const fullness = calculateCargoFullness(53.0, ceilingHeight, depth, depth, depth);
  const brake = evaluateBrakeStroke('TYPE_30_STANDARD', brakeStrokeIn);

  let doorStatus: DoorSecurityTelemetry['rearDoorStatus'] = 'DOOR_CLOSED_LOCKED';
  if (doorOpen) {
    doorStatus = insideGeofence ? 'DOOR_OPEN_AUTHORIZED' : 'UNAUTHORIZED_BREACH';
  }

  const door: DoorSecurityTelemetry = {
    rearDoorStatus: doorStatus,
    insideGeofence,
    tamperSwitchArmed: true,
    lastEventTimestamp: new Date().toISOString(),
  };

  const solar: SolarPowerTelemetry = {
    solarPanelWatts: 42.5,
    auxiliaryBatteryVolts: 12.8,
    batteryStateOfChargePct: 92,
    isCharging: true,
  };

  const alerts: string[] = [];
  let health: TrailerTelemetrySnapshot['overallHealthStatus'] = 'OPTIMAL';

  if (doorStatus === 'UNAUTHORIZED_BREACH') {
    alerts.push('SECURITY BREACH: Rear cargo doors opened outside authorized facility geofence!');
    health = 'CRITICAL_OOS';
  }

  if (brake.cvsaCompliance === 'CRITICAL_OUT_OF_SERVICE') {
    alerts.push(`CVSA OOS VIOLATION: Brake pushrod stroke (${brakeStrokeIn}") exceeds ${brake.ratedMaxStrokeInches}" statutory limit!`);
    health = 'CRITICAL_OOS';
  } else if (brake.cvsaCompliance === 'MARGINAL_ADJUST_REQUIRED') {
    alerts.push(`Brake adjustment required: pushrod stroke (${brakeStrokeIn}") near maximum limit.`);
    if (health === 'OPTIMAL') health = 'ADVISORY';
  }

  if (hubTempF > 185) {
    alerts.push(`CRITICAL HUB OVERHEAT: Wheel bearing temperature reached ${hubTempF}°F (limit 185°F)!`);
    health = 'CRITICAL_OOS';
  }

  return {
    trailerUnitNumber: unitNumber,
    timestamp: new Date().toISOString(),
    cargoFullness: fullness,
    doorSecurity: door,
    brakeStroke: brake,
    solarPower: solar,
    wheelHubTempMaxF: hubTempF,
    overallHealthStatus: health,
    activeAlerts: alerts,
  };
}
