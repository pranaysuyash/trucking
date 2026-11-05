import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { VehicleSpec, CargoPackageSpec, GridPlacement } from '../engine/types';
import {
  type CameraConfig,
  buildVehicleVectorScene,
  projectSceneFaces,
  buildBlueprintAnnotations,
} from '../engine/vectorIsometric';
import { DialKitTuner } from './DialKitTuner';

interface IsometricVehicle25DProps {
  vehicle: VehicleSpec;
  selectedPackage: CargoPackageSpec;
  placements: GridPlacement[];
  cutaway: boolean;
  onToggleCutaway: () => void;
}

export const IsometricVehicle25D: React.FC<IsometricVehicle25DProps> = ({
  vehicle,
  selectedPackage,
  placements,
  cutaway,
  onToggleCutaway,
}) => {
  // Exploded View Kinematics (0% - 100%)
  const [explodePct, setExplodePct] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  // Camera Configuration (DialKit Controllable)
  const [camera, setCamera] = useState<CameraConfig>({
    azimuthDeg: 45, // Classic 45° isometric yaw
    elevationDeg: 30, // True 30° axonometric elevation
    scale: 13.5, // 13.5 px per foot
    originX: 470,
    originY: 280,
    centerTarget: [14, 7, 0], // Center on truck/trailer centroid
    lightAzimuthDeg: 60,
    lightElevationDeg: 45,
    ambientLight: 0.38,
    enableBackfaceCulling: true,
    renderMode: 'shaded',
  });

  // Canvas Drag & Orbit Controls
  const svgRef = useRef<SVGSVGElement>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag on canvas background, not on UI controls
    if ((e.target as HTMLElement).closest('.dialkit-floating-panel')) return;
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    if (svgRef.current) {
      svgRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setCamera((prev) => {
      let newAzimuth = (prev.azimuthDeg - dx * 0.5) % 360;
      if (newAzimuth < 0) newAzimuth += 360;
      const newElevation = Math.max(15, Math.min(80, prev.elevationDeg + dy * 0.4));
      return {
        ...prev,
        azimuthDeg: Math.round(newAzimuth),
        elevationDeg: Math.round(newElevation),
      };
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      if (svgRef.current) {
        svgRef.current.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.8 : -0.8;
    setCamera((prev) => ({
      ...prev,
      scale: Math.max(8, Math.min(24, prev.scale + zoomDelta)),
    }));
  };

  // 60 FPS Turntable Rotation Loop
  useEffect(() => {
    if (!autoRotate) return;
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      setCamera((prev) => ({
        ...prev,
        azimuthDeg: (prev.azimuthDeg + 24 * dt) % 360,
      }));
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [autoRotate]);

  // Generate 3D polygonal faces & depth-sort into projected 2D SVG polygons
  const { projectedFaces, dimensionLines, technicalPins } = useMemo(() => {
    const rawFaces = buildVehicleVectorScene(
      vehicle,
      selectedPackage,
      placements,
      explodePct,
      cutaway
    );

    const faces2D = projectSceneFaces(rawFaces, camera);
    const annotations = buildBlueprintAnnotations(vehicle, camera);

    return {
      projectedFaces: faces2D,
      dimensionLines: annotations.dimensionLines,
      technicalPins: annotations.technicalPins,
    };
  }, [vehicle, selectedPackage, placements, explodePct, cutaway, camera]);

  const handleApplyPreset = (presetName: string) => {
    switch (presetName) {
      case 'classic-iso':
        setCamera((prev) => ({
          ...prev,
          azimuthDeg: 45,
          elevationDeg: 30,
          scale: 13.5,
          lightAzimuthDeg: 60,
          lightElevationDeg: 45,
          ambientLight: 0.38,
          renderMode: 'shaded',
        }));
        setExplodePct(0);
        break;
      case 'zafar-blueprint':
        setCamera((prev) => ({
          ...prev,
          azimuthDeg: 38,
          elevationDeg: 28,
          scale: 14.0,
          renderMode: 'blueprint',
        }));
        setExplodePct(0);
        break;
      case 'exploded-lab':
        setCamera((prev) => ({
          ...prev,
          azimuthDeg: 55,
          elevationDeg: 32,
          scale: 12.0,
          renderMode: 'shaded',
        }));
        setExplodePct(65);
        break;
      case 'golden-hour':
        setCamera((prev) => ({
          ...prev,
          azimuthDeg: 45,
          elevationDeg: 25,
          scale: 13.5,
          lightAzimuthDeg: 15,
          lightElevationDeg: 18,
          ambientLight: 0.25,
          renderMode: 'shaded',
        }));
        break;
      case 'top-plan':
        setCamera((prev) => ({
          ...prev,
          azimuthDeg: 45,
          elevationDeg: 68,
          scale: 15.0,
          renderMode: 'shaded',
        }));
        break;
    }
  };

  const isBlueprint = camera.renderMode === 'blueprint';

  return (
    <div className="iso-25d-wrapper vector-engine-root">
      {/* Top Interactive HUD Bar */}
      <div className="iso-controls-bar vector-hud-bar">
        <div className="iso-title">
          <span className="engine-chip">SVG 3D Vector Engine</span>
          <span className="projection-label">
            Axonometric {camera.azimuthDeg.toFixed(0)}° Azimuth · {camera.elevationDeg.toFixed(0)}° Elevation
          </span>
          {hoveredPart && (
            <span className="hovered-part-tag">
              Part: <strong>{hoveredPart}</strong>
            </span>
          )}
        </div>

        <div className="quick-actions-bar">
          <button
            className={`btn-hud-pill ${camera.renderMode === 'shaded' ? 'active' : ''}`}
            onClick={() => setCamera((c) => ({ ...c, renderMode: 'shaded' }))}
          >
            Shaded
          </button>
          <button
            className={`btn-hud-pill ${camera.renderMode === 'blueprint' ? 'active blueprint' : ''}`}
            onClick={() => setCamera((c) => ({ ...c, renderMode: 'blueprint' }))}
          >
            Blueprint
          </button>
          <button
            className={`btn-hud-pill ${explodePct > 0 ? 'active amber' : ''}`}
            onClick={() => setExplodePct(explodePct > 0 ? 0 : 50)}
          >
            Explode {explodePct}%
          </button>
          <button
            className={`btn-hud-pill ${autoRotate ? 'active cyan' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
          >
            {autoRotate ? 'Stop' : 'Spin'}
          </button>
          <span className="poly-count-badge">
            {projectedFaces.length} Faces · Pure SVG
          </span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="iso-svg-container vector-canvas-container" onWheel={handleWheel}>
        <svg
          ref={svgRef}
          viewBox="0 0 940 520"
          className={`iso-svg vector-svg ${isBlueprint ? 'blueprint-theme' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <defs>
            {/* Shaded Mode Ground Radial Gradient */}
            <radialGradient id="groundShadowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0, 0, 0, 0.6)" />
              <stop offset="60%" stopColor="rgba(0, 0, 0, 0.25)" />
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
            </radialGradient>

            {/* Blueprint Grid Pattern */}
            <pattern id="cadGridSmall" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="0.8" />
            </pattern>
            <pattern id="cadGridLarge" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#cadGridSmall)" />
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1.2" />
            </pattern>

            {/* Glowing Arrow Markers for Dimension Lines */}
            <marker
              id="dimArrowStart"
              markerWidth="8"
              markerHeight="8"
              refX="1"
              refY="4"
              orient="auto"
            >
              <polygon points="8,1 1,4 8,7" fill="#38bdf8" />
            </marker>
            <marker
              id="dimArrowEnd"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <polygon points="0,1 7,4 0,7" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Background Canvas: Blueprint Grid or Technical Dark Atmosphere */}
          {isBlueprint ? (
            <>
              <rect width="100%" height="100%" fill="#031926" />
              <rect width="100%" height="100%" fill="url(#cadGridLarge)" />
            </>
          ) : (
            <>
              <rect width="100%" height="100%" fill="#050914" />
              {/* Ground Shadow Ellipse */}
              <ellipse
                cx="470"
                cy="410"
                rx="410"
                ry="75"
                fill="url(#groundShadowGrad)"
              />
            </>
          )}

          {/* ======================================================== */}
          {/* 3D -> 2D PROJECTED POLYGONS (DEPTH-SORTED PAINTER'S ORDER) */}
          {/* ======================================================== */}
          <g className="projected-faces-group">
            {projectedFaces.map((face) => (
              <polygon
                key={face.id}
                points={face.pointsStr}
                fill={face.fillColor}
                stroke={face.strokeColor}
                strokeWidth={face.strokeWidth}
                strokeLinejoin="round"
                opacity={face.opacity}
                className="vector-face-poly"
                onMouseEnter={() => setHoveredPart(face.partName)}
                onMouseLeave={() => setHoveredPart(null)}
              />
            ))}
          </g>

          {/* ======================================================== */}
          {/* BLUEPRINT DIMENSION LINES & TECHNICAL CALLOUT PINS       */}
          {/* ======================================================== */}
          {isBlueprint && (
            <g className="blueprint-overlay-group">
              {/* Leader Dimension Lines */}
              {dimensionLines.map((dim) => (
                <g key={dim.id} className="dimension-line-item">
                  {/* Extension Ticks */}
                  <line
                    x1={dim.tickStart1[0]}
                    y1={dim.tickStart1[1]}
                    x2={dim.tickStart2[0]}
                    y2={dim.tickStart2[1]}
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                  />
                  <line
                    x1={dim.tickEnd1[0]}
                    y1={dim.tickEnd1[1]}
                    x2={dim.tickEnd2[0]}
                    y2={dim.tickEnd2[1]}
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                  />
                  {/* Dimension Shaft with Arrowheads */}
                  <line
                    x1={dim.start[0]}
                    y1={dim.start[1]}
                    x2={dim.end[0]}
                    y2={dim.end[1]}
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    markerStart="url(#dimArrowStart)"
                    markerEnd="url(#dimArrowEnd)"
                  />
                  {/* Dimension Text Pill */}
                  <rect
                    x={dim.mid[0] - 45}
                    y={dim.mid[1] - 10}
                    width="90"
                    height="18"
                    rx="4"
                    fill="rgba(3, 25, 38, 0.88)"
                    stroke="rgba(56, 189, 248, 0.4)"
                    strokeWidth="1"
                  />
                  <text
                    x={dim.mid[0]}
                    y={dim.mid[1] + 3}
                    textAnchor="middle"
                    fill="#38bdf8"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {dim.label}
                  </text>
                </g>
              ))}

              {/* Technical Inspection Pins (Zafar Lab Style) */}
              {technicalPins.map((pin) => (
                <g key={pin.id} className="technical-pin-item">
                  {/* Radar Target Pulse Rings */}
                  <circle
                    cx={pin.position[0]}
                    cy={pin.position[1]}
                    r="6"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={pin.position[0]}
                    cy={pin.position[1]}
                    r="2"
                    fill="#38bdf8"
                  />
                  {/* Dogleg Leader Line */}
                  <polyline
                    points={`${pin.position[0]},${pin.position[1]} ${pin.pinEnd[0]},${pin.pinEnd[1]} ${pin.pinEnd[0] + (pin.pinEnd[0] > pin.position[0] ? 40 : -40)},${pin.pinEnd[1]}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    strokeDasharray="2,2"
                  />
                  {/* Callout Label Tag */}
                  <rect
                    x={pin.pinEnd[0] + (pin.pinEnd[0] > pin.position[0] ? 0 : -140)}
                    y={pin.pinEnd[1] - 22}
                    width="140"
                    height="20"
                    rx="3"
                    fill="rgba(3, 25, 38, 0.9)"
                    stroke="#38bdf8"
                    strokeWidth="1"
                  />
                  <text
                    x={pin.pinEnd[0] + (pin.pinEnd[0] > pin.position[0] ? 6 : -134)}
                    y={pin.pinEnd[1] - 8}
                    fill="#f8fafc"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {pin.label}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* Compass Rose & Coordinate Radar */}
          <g className="vector-compass-rose" transform="translate(60, 470)">
            <circle cx="0" cy="0" r="24" fill="none" stroke="rgba(56, 189, 248, 0.3)" strokeDasharray="3,3" />
            <line
              x1="0"
              y1="0"
              x2={20 * Math.sin((camera.azimuthDeg * Math.PI) / 180)}
              y2={-20 * Math.cos((camera.azimuthDeg * Math.PI) / 180)}
              stroke="#38bdf8"
              strokeWidth="2"
            />
            <circle cx="0" cy="0" r="3" fill="#38bdf8" />
            <text x="0" y="-28" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">N</text>
            <text x="32" y="4" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">AZ: {camera.azimuthDeg}°</text>
          </g>
        </svg>

        {/* DialKit Floating Parameter Tuner Overlay */}
        <DialKitTuner
          camera={camera}
          explodePct={explodePct}
          autoRotate={autoRotate}
          cutaway={cutaway}
          onUpdateCamera={(partial) => setCamera((prev) => ({ ...prev, ...partial }))}
          onUpdateExplode={setExplodePct}
          onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
          onToggleCutaway={onToggleCutaway}
          onApplyPreset={handleApplyPreset}
        />
      </div>
    </div>
  );
};
