import React from 'react';
import type { VehicleSpec } from '../engine/types';

interface Blueprint2DViewProps {
  vehicle: VehicleSpec;
}

export const Blueprint2DView: React.FC<Blueprint2DViewProps> = ({ vehicle }) => {
  const extL = vehicle.exterior.lengthFt;
  const extW = vehicle.exterior.widthFt;
  const extH = vehicle.exterior.heightFt;

  const intL = vehicle.interior.lengthFt;
  const intW = vehicle.interior.widthFt;
  const intH = vehicle.interior.heightFt;

  const doorW = vehicle.interior.doorWidthFt;
  const doorH = vehicle.interior.doorHeightFt;

  return (
    <div className="blueprint-2d-wrapper">
      <div className="blueprint-header">
        <div className="blueprint-title">
          <span className="cad-badge">CAD 2D</span>
          <span>Orthographic Engineering Drafting Blueprints (3-View Standard)</span>
        </div>
        <div className="blueprint-meta">
          <span>Scale: 1:48</span>
          <span>• Projection: Third Angle</span>
          <span>• Units: Imperial (Ft/In) & Metric (mm)</span>
        </div>
      </div>

      <div className="blueprint-grid-canvas">
        {/* VIEW 1: SIDE ELEVATION */}
        <div className="cad-view-block">
          <div className="cad-view-label">VIEW A: SIDE ELEVATION (PROFILE)</div>
          <svg viewBox="0 0 860 220" className="cad-svg">
            <defs>
              <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#070c18" />
            <rect width="100%" height="100%" fill="url(#cadGrid)" />

            {/* Pavement Ground Line */}
            <line x1="40" y1="180" x2="820" y2="180" stroke="#475569" strokeWidth="2" />

            {/* Wheels */}
            <circle cx="720" cy="165" r="15" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="720" cy="165" r="5" fill="#38bdf8" />
            <circle cx="675" cy="165" r="15" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="675" cy="165" r="5" fill="#38bdf8" />

            <circle cx="160" cy="165" r="15" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="160" cy="165" r="5" fill="#38bdf8" />
            <circle cx="205" cy="165" r="15" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="205" cy="165" r="5" fill="#38bdf8" />

            {/* Tractor Cab Profile */}
            <path
              d="M 590 160 L 760 160 L 760 120 L 730 115 L 700 70 L 610 70 L 590 85 Z"
              fill="rgba(56, 189, 248, 0.08)"
              stroke="#38bdf8"
              strokeWidth="2"
            />

            {/* Trailer Body Profile */}
            <rect
              x="120"
              y="55"
              width="470"
              height="105"
              fill="rgba(56, 189, 248, 0.05)"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            {/* Interior Cavity Dotted Line */}
            <rect
              x="125"
              y="60"
              width="460"
              height="95"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />

            {/* Landing Gear Legs */}
            <line x1="480" y1="160" x2="480" y2="180" stroke="#38bdf8" strokeWidth="2" />
            <line x1="475" y1="180" x2="485" y2="180" stroke="#38bdf8" strokeWidth="2" />

            {/* Dimension Lines */}
            {/* Total Length */}
            <line x1="120" y1="25" x2="760" y2="25" stroke="#94a3b8" strokeWidth="1" />
            <line x1="120" y1="20" x2="120" y2="30" stroke="#94a3b8" strokeWidth="1" />
            <line x1="760" y1="20" x2="760" y2="30" stroke="#94a3b8" strokeWidth="1" />
            <text x="410" y="20" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">
              OVERALL LENGTH: {extL}' 0" ({Math.round(extL * 304.8)} mm)
            </text>

            {/* Total Height */}
            <line x1="90" y1="55" x2="90" y2="180" stroke="#94a3b8" strokeWidth="1" />
            <line x1="85" y1="55" x2="95" y2="55" stroke="#94a3b8" strokeWidth="1" />
            <line x1="85" y1="180" x2="95" y2="180" stroke="#94a3b8" strokeWidth="1" />
            <text x="80" y="120" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono" textAnchor="end">
              {extH}' 0" HT
            </text>

            {/* Center of Gravity Crosshair */}
            <circle cx="380" cy="110" r="8" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
            <line x1="380" y1="98" x2="380" y2="122" stroke="#f59e0b" strokeWidth="1.5" />
            <line x1="368" y1="110" x2="392" y2="110" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="395" y="114" fill="#f59e0b" fontSize="10" fontFamily="JetBrains Mono">
              CG (Center of Mass)
            </text>
          </svg>
        </div>

        {/* TWO-COLUMN: TOP PLAN & REAR ELEVATION */}
        <div className="cad-two-col">
          {/* VIEW 2: TOP PLAN VIEW */}
          <div className="cad-view-block">
            <div className="cad-view-label">VIEW B: TOP PLAN VIEW (OVERHEAD CAD)</div>
            <svg viewBox="0 0 540 180" className="cad-svg">
              <rect width="100%" height="100%" fill="#070c18" />
              <rect width="100%" height="100%" fill="url(#cadGrid)" />

              {/* Vehicle Outline */}
              <rect
                x="40"
                y="50"
                width="440"
                height="80"
                fill="rgba(56, 189, 248, 0.05)"
                stroke="#38bdf8"
                strokeWidth="2"
              />
              {/* Internal Cavity */}
              <rect
                x="45"
                y="55"
                width="310"
                height="70"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.2"
                strokeDasharray="4 3"
              />

              {/* Tractor Hood in Front */}
              <rect
                x="355"
                y="54"
                width="125"
                height="72"
                fill="rgba(56, 189, 248, 0.08)"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />

              {/* Kingpin Fifth Wheel Marker */}
              <circle cx="360" cy="90" r="5" fill="#ec4899" />
              <text x="370" y="93" fill="#ec4899" fontSize="10" fontFamily="JetBrains Mono">
                Kingpin
              </text>

              {/* Dimensions */}
              <line x1="40" y1="35" x2="480" y2="35" stroke="#94a3b8" strokeWidth="1" />
              <text x="260" y="30" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                EXT: {extL}' 0" | INT: {intL}'L x {intW}'W x {intH}'H
              </text>

              <line x1="25" y1="50" x2="25" y2="130" stroke="#94a3b8" strokeWidth="1" />
              <text x="20" y="93" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="end">
                {extW}' 0" W
              </text>
            </svg>
          </div>

          {/* VIEW 3: REAR ELEVATION / DOOR APERTURE */}
          <div className="cad-view-block">
            <div className="cad-view-label">VIEW C: REAR ELEVATION (LOADING DOCK)</div>
            <svg viewBox="0 0 280 180" className="cad-svg">
              <rect width="100%" height="100%" fill="#070c18" />
              <rect width="100%" height="100%" fill="url(#cadGrid)" />

              {/* Ground Line */}
              <line x1="20" y1="160" x2="260" y2="160" stroke="#475569" strokeWidth="2" />

              {/* Rear Tires */}
              <rect x="60" y="145" width="18" height="15" fill="#1e293b" stroke="#38bdf8" />
              <rect x="202" y="145" width="18" height="15" fill="#1e293b" stroke="#38bdf8" />

              {/* Outer Trailer Frame */}
              <rect
                x="50"
                y="35"
                width="180"
                height="115"
                fill="rgba(56, 189, 248, 0.05)"
                stroke="#38bdf8"
                strokeWidth="2"
              />

              {/* Door Opening Aperture */}
              <rect
                x="58"
                y="45"
                width="164"
                height="100"
                fill="rgba(244, 63, 94, 0.08)"
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />

              {/* Underride Guard Bumper */}
              <rect x="55" y="152" width="170" height="5" fill="#e2e8f0" />

              {/* Door Dimension Labels */}
              <text x="140" y="95" fill="#f43f5e" fontSize="11" fontWeight="600" fontFamily="JetBrains Mono" textAnchor="middle">
                DOOR APERTURE
              </text>
              <text x="140" y="112" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                {doorW.toFixed(2)}' W x {doorH.toFixed(2)}' H
              </text>
            </svg>
          </div>
        </div>
      </div>

      <div className="blueprint-specs-summary">
        <div className="spec-item">
          <span className="spec-name">Interior Volume</span>
          <span className="spec-val">{vehicle.volumetric.cubicFt.toLocaleString()} cu ft ({vehicle.volumetric.cubicMeters} m³)</span>
        </div>
        <div className="spec-item">
          <span className="spec-name">Curb / Tare Weight</span>
          <span className="spec-val">{vehicle.weight.curbWeightLbs.toLocaleString()} lbs</span>
        </div>
        <div className="spec-item">
          <span className="spec-name">Max Legal Payload</span>
          <span className="spec-val text-emerald">{vehicle.weight.maxPayloadLbs.toLocaleString()} lbs</span>
        </div>
        <div className="spec-item">
          <span className="spec-name">Federal Bridge Steer Axle</span>
          <span className="spec-val">{vehicle.regulatory.bridgeLawAxleLimits.steerLbs.toLocaleString()} lbs</span>
        </div>
        <div className="spec-item">
          <span className="spec-name">Federal Bridge Drive Tandem</span>
          <span className="spec-val">{vehicle.regulatory.bridgeLawAxleLimits.driveTandemLbs.toLocaleString()} lbs</span>
        </div>
        <div className="spec-item">
          <span className="spec-name">Federal Bridge Trailer Tandem</span>
          <span className="spec-val">{vehicle.regulatory.bridgeLawAxleLimits.trailerTandemLbs.toLocaleString()} lbs</span>
        </div>
      </div>
    </div>
  );
};
