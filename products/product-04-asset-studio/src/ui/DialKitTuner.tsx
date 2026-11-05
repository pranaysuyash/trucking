import React, { useRef, useState } from 'react';
import type { CameraConfig } from '../engine/vectorIsometric';

interface DialKitTunerProps {
  camera: CameraConfig;
  explodePct: number;
  autoRotate: boolean;
  cutaway: boolean;
  onUpdateCamera: (partial: Partial<CameraConfig>) => void;
  onUpdateExplode: (val: number) => void;
  onToggleAutoRotate: () => void;
  onToggleCutaway: () => void;
  onApplyPreset: (presetName: string) => void;
}

export const DialKitTuner: React.FC<DialKitTunerProps> = ({
  camera,
  explodePct,
  autoRotate,
  cutaway,
  onUpdateCamera,
  onUpdateExplode,
  onToggleAutoRotate,
  onToggleCutaway,
  onApplyPreset,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'camera' | 'lighting' | 'presets'>('camera');
  const [copiedToast, setCopiedToast] = useState(false);

  // Rotary Knob Drag Handling for Azimuth
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDialDragging, setIsDialDragging] = useState(false);

  const handleDialPointerDown = (e: React.PointerEvent) => {
    setIsDialDragging(true);
    updateDialAngle(e.clientX, e.clientY);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDialPointerMove = (e: React.PointerEvent) => {
    if (!isDialDragging) return;
    updateDialAngle(e.clientX, e.clientY);
  };

  const handleDialPointerUp = (e: React.PointerEvent) => {
    setIsDialDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const updateDialAngle = (clientX: number, clientY: number) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    let rad = Math.atan2(dy, dx); // -PI to PI
    let deg = Math.round((rad * 180) / Math.PI) + 90; // Top is 0
    if (deg < 0) deg += 360;
    onUpdateCamera({ azimuthDeg: deg % 360 });
  };

  const handleCopyConfig = () => {
    const configExport = {
      azimuthDeg: camera.azimuthDeg,
      elevationDeg: camera.elevationDeg,
      scale: camera.scale,
      lightAzimuthDeg: camera.lightAzimuthDeg,
      lightElevationDeg: camera.lightElevationDeg,
      ambientLight: camera.ambientLight,
      enableBackfaceCulling: camera.enableBackfaceCulling,
      renderMode: camera.renderMode,
      explodePct,
      cutaway,
    };
    navigator.clipboard.writeText(JSON.stringify(configExport, null, 2));
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  return (
    <div className={`dialkit-floating-panel ${isOpen ? 'open' : 'minimized'}`}>
      {/* Panel Header */}
      <div className="dialkit-header">
        <div className="dialkit-title-group">
          <div className="dialkit-brand-icon">DK</div>
          <div>
            <span className="dialkit-badge">DIALKIT ENGINE</span>
            <h4>Vector Isometric Tuner</h4>
          </div>
        </div>
        <div className="dialkit-header-actions">
          <button
            className="dialkit-min-btn"
            onClick={() => setIsOpen(!isOpen)}
            title={isOpen ? 'Minimize Panel' : 'Expand Panel'}
          >
            {isOpen ? '—' : 'MAX'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="dialkit-body">
          {/* Navigation Tabs */}
          <div className="dialkit-tabs-bar">
            <button
              className={`d-tab-btn ${activeTab === 'camera' ? 'active' : ''}`}
              onClick={() => setActiveTab('camera')}
            >
              Camera & Mesh
            </button>
            <button
              className={`d-tab-btn ${activeTab === 'lighting' ? 'active' : ''}`}
              onClick={() => setActiveTab('lighting')}
            >
              Light & Style
            </button>
            <button
              className={`d-tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
              onClick={() => setActiveTab('presets')}
            >
              Presets
            </button>
          </div>

          {/* TAB 1: CAMERA & MESH KINEMATICS */}
          {activeTab === 'camera' && (
            <div className="dialkit-section">
              {/* Rotary Knob for Azimuth Yaw */}
              <div className="dialkit-knob-row">
                <div className="knob-container">
                  <div
                    ref={dialRef}
                    className="dialkit-rotary-dial"
                    onPointerDown={handleDialPointerDown}
                    onPointerMove={handleDialPointerMove}
                    onPointerUp={handleDialPointerUp}
                    title="Drag circular knob to orbit 3D azimuth"
                  >
                    <div
                      className="dial-pointer-needle"
                      style={{ transform: `rotate(${camera.azimuthDeg}deg)` }}
                    />
                    <div className="dial-center-cap">
                      <span>{camera.azimuthDeg}°</span>
                    </div>
                  </div>
                  <span className="dial-label">AZIMUTH ORBIT</span>
                </div>

                <div className="quick-angles-grid">
                  <span className="ctrl-micro-hdr">CARDINAL SNAP:</span>
                  <div className="angles-chips">
                    {[0, 30, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                      <button
                        key={angle}
                        className={`chip-angle ${camera.azimuthDeg === angle ? 'active' : ''}`}
                        onClick={() => onUpdateCamera({ azimuthDeg: angle })}
                      >
                        {angle}°
                      </button>
                    ))}
                  </div>

                  <button
                    className={`btn-turntable-toggle ${autoRotate ? 'active' : ''}`}
                    onClick={onToggleAutoRotate}
                  >
                    {autoRotate ? 'Stop SVG Turntable' : 'Run 60fps Turntable'}
                  </button>
                </div>
              </div>

              {/* Explode Kinematics Slider */}
              <div className="dialkit-control-group">
                <div className="d-label-row">
                  <span className="d-label">EXPLODED VIEW KINEMATICS:</span>
                  <strong className="d-val text-amber">{explodePct}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={explodePct}
                  onChange={(e) => onUpdateExplode(Number(e.target.value))}
                  className="dialkit-slider explode-slider"
                />
                <div className="slider-tick-labels">
                  <button type="button" onClick={() => onUpdateExplode(0)}>0% Fitted</button>
                  <button type="button" onClick={() => onUpdateExplode(35)}>35% Inspection</button>
                  <button type="button" onClick={() => onUpdateExplode(70)}>70% Separation</button>
                  <button type="button" onClick={() => onUpdateExplode(100)}>100% Exploded</button>
                </div>
              </div>

              {/* Elevation (Pitch) Tilt Slider */}
              <div className="dialkit-control-group">
                <div className="d-label-row">
                  <span className="d-label">ELEVATION TILT (PITCH):</span>
                  <strong className="d-val">{camera.elevationDeg}°</strong>
                </div>
                <input
                  type="range"
                  min="15"
                  max="75"
                  value={camera.elevationDeg}
                  onChange={(e) => onUpdateCamera({ elevationDeg: Number(e.target.value) })}
                  className="dialkit-slider"
                />
              </div>

              {/* Zoom Scale */}
              <div className="dialkit-control-group">
                <div className="d-label-row">
                  <span className="d-label">ZOOM SCALE (PX / FT):</span>
                  <strong className="d-val">{camera.scale.toFixed(1)} px</strong>
                </div>
                <input
                  type="range"
                  min="8"
                  max="22"
                  step="0.5"
                  value={camera.scale}
                  onChange={(e) => onUpdateCamera({ scale: Number(e.target.value) })}
                  className="dialkit-slider"
                />
              </div>

              {/* Backface Culling & Cutaway Toggles */}
              <div className="dialkit-toggles-row">
                <button
                  className={`btn-d-toggle ${camera.enableBackfaceCulling ? 'active' : ''}`}
                  onClick={() =>
                    onUpdateCamera({ enableBackfaceCulling: !camera.enableBackfaceCulling })
                  }
                  title="Eliminates polygons facing away from camera using 2D winding cross-product"
                >
                  <span className="dot" />
                  Backface Culling: {camera.enableBackfaceCulling ? 'ON' : 'OFF'}
                </button>

                <button
                  className={`btn-d-toggle ${cutaway ? 'active' : ''}`}
                  onClick={onToggleCutaway}
                  title="Toggle translucent cutaway hull to inspect interior pallet load"
                >
                  <span className="dot" />
                  Cutaway Cargo Hold: {cutaway ? 'ON' : 'SOLID'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LIGHTING & RENDER STYLES */}
          {activeTab === 'lighting' && (
            <div className="dialkit-section">
              {/* Render Style Mode Selector */}
              <div className="dialkit-control-group">
                <span className="d-label">VECTOR RENDERING STYLE:</span>
                <div className="render-style-grid">
                  {(
                    [
                      { id: 'shaded', label: 'Dynamic Shaded', desc: 'Sunlight normals & diffuse gradient' },
                      { id: 'blueprint', label: 'Zafar Blueprint', desc: 'Cyan vector strokes & CAD grid' },
                      { id: 'wireframe', label: 'CAD Wireframe', desc: 'Pure vector wireframe paths' },
                      { id: 'flat', label: 'Technical Flat', desc: 'Flat architectural elevations' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      className={`btn-style-tile ${camera.renderMode === m.id ? 'active' : ''}`}
                      onClick={() => onUpdateCamera({ renderMode: m.id })}
                    >
                      <span className="style-title">{m.label}</span>
                      <span className="style-desc">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Directional Sun Angle */}
              <div className="dialkit-control-group">
                <div className="d-label-row">
                  <span className="d-label">SUNLIGHT AZIMUTH:</span>
                  <strong className="d-val">{camera.lightAzimuthDeg}°</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={camera.lightAzimuthDeg}
                  onChange={(e) => onUpdateCamera({ lightAzimuthDeg: Number(e.target.value) })}
                  className="dialkit-slider"
                />
              </div>

              {/* Ambient Illumination */}
              <div className="dialkit-control-group">
                <div className="d-label-row">
                  <span className="d-label">AMBIENT ILLUMINATION:</span>
                  <strong className="d-val">{Math.round(camera.ambientLight * 100)}%</strong>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={camera.ambientLight}
                  onChange={(e) => onUpdateCamera({ ambientLight: Number(e.target.value) })}
                  className="dialkit-slider"
                />
              </div>
            </div>
          )}

          {/* TAB 3: PRESETS & EXPORT */}
          {activeTab === 'presets' && (
            <div className="dialkit-section">
              <span className="d-label">CURATED AESTHETIC PRESETS:</span>
              <div className="presets-list">
                <button
                  className="btn-preset-card"
                  onClick={() => onApplyPreset('classic-iso')}
                >
                  <span className="preset-name">Classic 30° Axonometric</span>
                  <span className="preset-desc">Pure isometric 45° azimuth, 30° elevation with natural skylight</span>
                </button>

                <button
                  className="btn-preset-card"
                  onClick={() => onApplyPreset('zafar-blueprint')}
                >
                  <span className="preset-name">Zafar Lab Engineering Blueprint</span>
                  <span className="preset-desc">High-contrast cyan line-art with dimension leader lines & technical pins</span>
                </button>

                <button
                  className="btn-preset-card"
                  onClick={() => onApplyPreset('exploded-lab')}
                >
                  <span className="preset-name">Full Exploded Separation</span>
                  <span className="preset-desc">75% kinematic explosion showcasing Detroit DD15, cab tilt, and pallets</span>
                </button>

                <button
                  className="btn-preset-card"
                  onClick={() => onApplyPreset('golden-hour')}
                >
                  <span className="preset-name">Golden Hour Contrast</span>
                  <span className="preset-desc">Low angle dramatic directional sunlight with rich cast facet shading</span>
                </button>

                <button
                  className="btn-preset-card"
                  onClick={() => onApplyPreset('top-plan')}
                >
                  <span className="preset-name">Orthogonal Top Plan View</span>
                  <span className="preset-desc">70° steep pitch to inspect interior pallet row and tier distribution</span>
                </button>
              </div>

              {/* Export JSON Button */}
              <div className="dialkit-export-box">
                <button
                  className="btn-export-config"
                  onClick={handleCopyConfig}
                >
                  {copiedToast ? 'Copied to Clipboard!' : 'Copy Camera Config JSON'}
                </button>
                <span className="export-hint">Export parameters directly to production code or specs</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
