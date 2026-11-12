import React, { useState } from 'react';
import { IconRadio, IconX, IconPackage, IconAlertTriangle, IconThermometer, IconSun } from './icons';
import {
  buildTrailerTelemetrySnapshot,
} from '../engine/trailerIoTSensors';

export interface TrailerIoTSensorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerUnitNumber?: string;
}

export const TrailerIoTSensorsModal: React.FC<TrailerIoTSensorsModalProps> = ({
  isOpen,
  onClose,
  trailerUnitNumber = 'TR-53819',
}) => {
  const [cargoFillPct, setCargoFillPct] = useState<number>(82);
  const [doorOpen, setDoorOpen] = useState<boolean>(false);
  const [insideGeofence, setInsideGeofence] = useState<boolean>(true);
  const [brakeStrokeIn, setBrakeStrokeIn] = useState<number>(1.75);
  const [hubTempF, setHubTempF] = useState<number>(134);

  if (!isOpen) return null;

  const snapshot = buildTrailerTelemetrySnapshot(
    trailerUnitNumber,
    cargoFillPct,
    doorOpen,
    insideGeofence,
    brakeStrokeIn,
    hubTempF
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trailer-iot-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(2, 6, 23, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '740px',
          backgroundColor: '#0b1329',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#f8fafc',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, #0b1329 0%, #111e38 100%)',
          }}
        >
          <div>
            <h3
              id="trailer-iot-title"
              style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <IconRadio size={17} />
              Smart Trailer IoT Sensor Topology &amp; Fullness
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
              Unit: {trailerUnitNumber} · FleetPulse / Cargo Connect Chassis Telemetry
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Row: Overall Health & Interactive Controls */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#0f172a',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #1e293b',
              gap: '12px',
            }}
          >
            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>CHASSIS HEALTH:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    backgroundColor:
                      snapshot.overallHealthStatus === 'OPTIMAL'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : snapshot.overallHealthStatus === 'ADVISORY'
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                    color:
                      snapshot.overallHealthStatus === 'OPTIMAL'
                        ? '#10b981'
                        : snapshot.overallHealthStatus === 'ADVISORY'
                        ? '#f59e0b'
                        : '#ef4444',
                  }}
                >
                  {snapshot.overallHealthStatus}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {snapshot.activeAlerts.length} Active Alert(s)
                </span>
              </div>
            </div>

            {/* Live Toggle Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDoorOpen(!doorOpen)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid #334155',
                  backgroundColor: doorOpen ? 'rgba(239, 68, 68, 0.2)' : '#1e293b',
                  color: doorOpen ? '#ef4444' : '#f8fafc',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Rear Doors: {doorOpen ? 'OPEN' : 'CLOSED'}
              </button>

              <button
                type="button"
                onClick={() => setInsideGeofence(!insideGeofence)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid #334155',
                  backgroundColor: insideGeofence ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: insideGeofence ? '#10b981' : '#f59e0b',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Geofence: {insideGeofence ? 'INSIDE YARD' : 'OUTSIDE / HIGHWAY'}
              </button>
            </div>
          </div>

          {/* Ultrasonic Fullness Card */}
          <div
            style={{
              background: '#090d1c',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #1e293b',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <IconPackage size={14} /> Ultrasonic Cargo Volume Fullness (% Cube)
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                State: <strong>{snapshot.cargoFullness.cargoState}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={cargoFillPct}
                onChange={(e) => setCargoFillPct(parseInt(e.target.value, 10))}
                style={{ flex: 1 }}
              />
              <strong style={{ fontSize: '16px', fontFamily: 'monospace', color: '#f8fafc', width: '50px' }}>
                {cargoFillPct}%
              </strong>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '11px',
              }}
            >
              <div>
                <span style={{ color: '#94a3b8' }}>Linear Footage Used:</span>
                <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>
                  {snapshot.cargoFullness.linearFloorLengthUsedFt} / {snapshot.cargoFullness.trailerLengthFt} ft
                </div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Nose Ceiling Clearance:</span>
                <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>
                  {snapshot.cargoFullness.sensorReadings.noseZoneDepthInches.toFixed(1)}"
                </div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Mid / Rear Clearance:</span>
                <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>
                  {snapshot.cargoFullness.sensorReadings.rearZoneDepthInches.toFixed(1)}"
                </div>
              </div>
            </div>
          </div>

          {/* Chassis Telemetry Grid: Brake Stroke, Solar Power, Wheel Hubs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Air Brake Stroke Card */}
            <div
              style={{
                background: '#0f172a',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #1e293b',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <IconAlertTriangle size={13} style={{ color: '#f59e0b' }} /> Air Brake Chamber Pushrod Stroke
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: '3px',
                    backgroundColor:
                      snapshot.brakeStroke.cvsaCompliance === 'LEGAL_IN_SERVICE'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                    color:
                      snapshot.brakeStroke.cvsaCompliance === 'LEGAL_IN_SERVICE'
                        ? '#10b981'
                        : '#ef4444',
                  }}
                >
                  {snapshot.brakeStroke.cvsaCompliance}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  step="0.05"
                  min="1.0"
                  max="3.0"
                  value={brakeStrokeIn}
                  onChange={(e) => setBrakeStrokeIn(parseFloat(e.target.value) || 1.5)}
                  style={{
                    width: '80px',
                    padding: '4px 6px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  inches (CVSA Limit: <strong>{snapshot.brakeStroke.ratedMaxStrokeInches}"</strong>)
                </span>
              </div>
            </div>

            {/* Wheel Hub Temperature Card */}
            <div
              style={{
                background: '#0f172a',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #1e293b',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <IconThermometer size={13} style={{ color: '#38bdf8' }} /> Wheel-End Hub Bearing Temperature
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: '3px',
                    backgroundColor: hubTempF > 185 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: hubTempF > 185 ? '#ef4444' : '#10b981',
                  }}
                >
                  {hubTempF > 185 ? 'OVERHEAT' : 'NORMAL'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="60"
                  max="260"
                  value={hubTempF}
                  onChange={(e) => setHubTempF(parseInt(e.target.value, 10) || 120)}
                  style={{
                    width: '80px',
                    padding: '4px 6px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  °F (Max Limit: <strong>185°F</strong>)
                </span>
              </div>
            </div>
            <div
              style={{
                background: '#0f172a',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #1e293b',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <IconSun size={13} style={{ color: '#f59e0b' }} /> Solar Roof &amp; Auxiliary 12V Battery
                </span>
                <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 700 }}>
                  {snapshot.solarPower.isCharging ? 'CHARGING' : 'STANDBY'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>Panel Output:</span>
                  <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>
                    {snapshot.solarPower.solarPanelWatts} W
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Battery Voltage:</span>
                  <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: '#38bdf8' }}>
                    {snapshot.solarPower.auxiliaryBatteryVolts} V ({snapshot.solarPower.batteryStateOfChargePct}%)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Alerts Banner */}
          {snapshot.activeAlerts.length > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid #ef4444',
                padding: '12px 16px',
                borderRadius: '8px',
              }}
            >
              <strong style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginBottom: '4px' }}>
                CRITICAL CHASSIS SAFETY ALERTS:
              </strong>
              {snapshot.activeAlerts.map((a, idx) => (
                <div key={idx} style={{ fontSize: '11px', color: '#fca5a5' }}>
                  • {a}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            background: '#090d1c',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Close Telemetry HUD
          </button>
        </div>
      </div>
    </div>
  );
};
