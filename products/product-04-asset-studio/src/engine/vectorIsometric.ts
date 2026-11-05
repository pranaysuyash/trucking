/**
 * Pure-Vector 3D to 2D SVG Isometric Engine
 * Inspired by Li Yuxuan (@xmliszt - laundro.cafe), Zafar Lab (@zafarlab), and 0x_fokki.
 *
 * Implements:
 * 1. True 3D coordinates (x, y, z) projected to 2D SVG paths (u, v)
 * 2. Real-time Azimuth (yaw) & Elevation (pitch) camera rotation
 * 3. Backface culling via 2D polygon winding order dot-product
 * 4. Painter's algorithm depth sorting for artifact-free rendering
 * 5. Dynamic directional sunlight shading & ambient illumination
 * 6. 0-100% Exploded View kinematics in pure SVG
 * 7. Zafar Lab-style technical blueprint line-art and dimension leader lines
 */

import type { VehicleSpec, CargoPackageSpec, GridPlacement } from './types';

export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

export interface Face3D {
  id: string;
  partName: string;
  vertices: Vec3[];
  baseColor: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  isTransparent?: boolean;
  isWireframeOnly?: boolean;
}

export interface CameraConfig {
  azimuthDeg: number;   // 0 - 360 rotation around Y axis (default 45° for isometric)
  elevationDeg: number; // 10 - 80 tilt angle (default 30° for true 30° isometric or 35.264°)
  scale: number;        // Zoom scale in pixels per foot
  originX: number;      // SVG center X
  originY: number;      // SVG center Y
  centerTarget: Vec3;   // 3D point camera is looking at
  lightAzimuthDeg: number;
  lightElevationDeg: number;
  ambientLight: number; // 0.1 to 0.9 (default 0.4)
  enableBackfaceCulling: boolean;
  renderMode: 'shaded' | 'blueprint' | 'wireframe' | 'flat';
}

export interface ProjectedFace2D {
  id: string;
  partName: string;
  pointsStr: string;
  points: Vec2[];
  depth: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  isBackface: boolean;
  normal: Vec3;
}

export interface DimensionLine2D {
  id: string;
  label: string;
  start: Vec2;
  end: Vec2;
  tickStart1: Vec2;
  tickStart2: Vec2;
  tickEnd1: Vec2;
  tickEnd2: Vec2;
  mid: Vec2;
}

export interface TechnicalPin2D {
  id: string;
  label: string;
  category: string;
  position: Vec2;
  pinEnd: Vec2;
}

// -------------------------------------------------------------
// VECTOR MATH HELPERS
// -------------------------------------------------------------

export function vec3Sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function vec3Cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function vec3Dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function vec3Normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 1, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

export function parseHexColor(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 100, g: 150, b: 200 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function shadeHexColor(hex: string, intensity: number): string {
  const { r, g, b } = parseHexColor(hex);
  return rgbToHex(r * intensity, g * intensity, b * intensity);
}

// -------------------------------------------------------------
// 3D -> 2D PROJECTION & DEPTH SORTING
// -------------------------------------------------------------

export function projectVec3(
  p: Vec3,
  camera: CameraConfig
): { pt: Vec2; depth: number } {
  const radA = (camera.azimuthDeg * Math.PI) / 180;
  const radE = (camera.elevationDeg * Math.PI) / 180;

  // Translate to center target
  const dx = p[0] - camera.centerTarget[0];
  const dy = p[1] - camera.centerTarget[1];
  const dz = p[2] - camera.centerTarget[2];

  // Rotate around Y axis (Azimuth)
  const x1 = dx * Math.cos(radA) - dz * Math.sin(radA);
  const z1 = dx * Math.sin(radA) + dz * Math.cos(radA);
  const y1 = dy;

  // Project onto 2D isometric screen with Elevation tilt
  const u = x1 * camera.scale + camera.originX;
  const v = (-z1 * Math.sin(radE) - y1 * Math.cos(radE)) * camera.scale + camera.originY;

  // Camera depth (distance from camera plane for depth sorting)
  const depth = z1 * Math.cos(radE) - y1 * Math.sin(radE);

  return { pt: [u, v], depth };
}

export function computeFaceNormal(v: Vec3[]): Vec3 {
  if (v.length < 3) return [0, 1, 0];
  const e1 = vec3Sub(v[1], v[0]);
  const e2 = vec3Sub(v[2], v[0]);
  return vec3Normalize(vec3Cross(e1, e2));
}

export function calculateWindingArea2D(pts: Vec2[]): number {
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  return area / 2;
}

export function projectSceneFaces(
  faces: Face3D[],
  camera: CameraConfig
): ProjectedFace2D[] {
  // Directional Light Vector
  const lightA = (camera.lightAzimuthDeg * Math.PI) / 180;
  const lightE = (camera.lightElevationDeg * Math.PI) / 180;
  const lightDir: Vec3 = vec3Normalize([
    Math.cos(lightA) * Math.cos(lightE),
    Math.sin(lightE),
    Math.sin(lightA) * Math.cos(lightE),
  ]);

  const projected: ProjectedFace2D[] = [];

  for (const face of faces) {
    const normal = face.vertices.length >= 3 ? computeFaceNormal(face.vertices) : ([0, 1, 0] as Vec3);
    const pts2D: Vec2[] = [];
    let depthSum = 0;

    for (const v of face.vertices) {
      const { pt, depth } = projectVec3(v, camera);
      pts2D.push(pt);
      depthSum += depth;
    }

    const avgDepth = pts2D.length > 0 ? depthSum / pts2D.length : 0;
    const area2D = calculateWindingArea2D(pts2D);

    // Backface culling in SVG:
    // Polygons with clockwise winding in SVG screen space are facing away
    const isBackface = area2D <= 0;

    if (camera.enableBackfaceCulling && isBackface && !face.isWireframeOnly) {
      continue;
    }

    // Dynamic directional face shading
    let fillColor = face.baseColor;
    let strokeColor = face.strokeColor || '#1e293b';
    let strokeWidth = face.strokeWidth ?? 1;

    if (camera.renderMode === 'blueprint') {
      fillColor = 'rgba(14, 116, 144, 0.25)';
      strokeColor = '#38bdf8';
      strokeWidth = 1.2;
    } else if (camera.renderMode === 'wireframe') {
      fillColor = 'none';
      strokeColor = '#06b6d4';
      strokeWidth = 1;
    } else if (camera.renderMode === 'shaded') {
      // Lambertian diffuse + ambient lighting
      const dot = Math.max(0, vec3Dot(normal, lightDir));
      const intensity = camera.ambientLight + (1 - camera.ambientLight) * dot;
      fillColor = shadeHexColor(face.baseColor, intensity);

      // Distinct highlight for top surfaces
      if (normal[1] > 0.75) {
        fillColor = shadeHexColor(fillColor, 1.15);
      }
    }

    const pointsStr = pts2D.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

    projected.push({
      id: face.id,
      partName: face.partName,
      pointsStr,
      points: pts2D,
      depth: avgDepth,
      fillColor,
      strokeColor,
      strokeWidth,
      opacity: face.opacity ?? 1,
      isBackface,
      normal,
    });
  }

  // Painter's Algorithm: Sort faces from furthest back (lowest depth) to closest front (highest depth)
  projected.sort((a, b) => a.depth - b.depth);

  return projected;
}

// -------------------------------------------------------------
// TECHNICAL DIMENSION LINE PROJECTIONS (ZAFAR LAB STYLE)
// -------------------------------------------------------------

export function projectDimensionLine(
  start3D: Vec3,
  end3D: Vec3,
  label: string,
  camera: CameraConfig,
  tickSizePx = 6
): DimensionLine2D {
  const pStart = projectVec3(start3D, camera).pt;
  const pEnd = projectVec3(end3D, camera).pt;

  const dx = pEnd[0] - pStart[0];
  const dy = pEnd[1] - pStart[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  const perpX = len > 0 ? -dy / len : 0;
  const perpY = len > 0 ? dx / len : 0;

  return {
    id: `dim-${label.replace(/[^a-zA-Z0-9]/g, '')}`,
    label,
    start: pStart,
    end: pEnd,
    mid: [(pStart[0] + pEnd[0]) / 2, (pStart[1] + pEnd[1]) / 2],
    tickStart1: [pStart[0] + perpX * tickSizePx, pStart[1] + perpY * tickSizePx],
    tickStart2: [pStart[0] - perpX * tickSizePx, pStart[1] - perpY * tickSizePx],
    tickEnd1: [pEnd[0] + perpX * tickSizePx, pEnd[1] + perpY * tickSizePx],
    tickEnd2: [pEnd[0] - perpX * tickSizePx, pEnd[1] - perpY * tickSizePx],
  };
}

// -------------------------------------------------------------
// PROCEDURAL 3D VEHICLE & CARGO MESH GENERATION
// -------------------------------------------------------------

/**
 * Creates a cuboid box in 3D coordinate space with 6 properly oriented polygon faces.
 */
export function createCuboidFaces(
  idPrefix: string,
  partName: string,
  pos: Vec3,
  dims: Vec3,
  baseColor: string,
  options: {
    strokeColor?: string;
    strokeWidth?: number;
    opacity?: number;
    isWireframe?: boolean;
    skipFaces?: ('top' | 'bottom' | 'front' | 'back' | 'left' | 'right')[];
  } = {}
): Face3D[] {
  const [x, y, z] = pos;
  const [dx, dy, dz] = dims;
  const hx = dx / 2;
  const hy = dy / 2;
  const hz = dz / 2;

  // 8 Vertices
  const v000: Vec3 = [x - hx, y - hy, z - hz];
  const v100: Vec3 = [x + hx, y - hy, z - hz];
  const v110: Vec3 = [x + hx, y + hy, z - hz];
  const v010: Vec3 = [x - hx, y + hy, z - hz];
  const v001: Vec3 = [x - hx, y - hy, z + hz];
  const v101: Vec3 = [x + hx, y - hy, z + hz];
  const v111: Vec3 = [x + hx, y + hy, z + hz];
  const v011: Vec3 = [x - hx, y + hy, z + hz];

  const skip = new Set(options.skipFaces || []);
  const faces: Face3D[] = [];

  // Top Face (Normal +Y) - Winding CCW when viewed from above
  if (!skip.has('top')) {
    faces.push({
      id: `${idPrefix}-top`,
      partName,
      vertices: [v011, v111, v110, v010],
      baseColor,
      strokeColor: options.strokeColor,
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
      isWireframeOnly: options.isWireframe,
    });
  }

  // Bottom Face (Normal -Y)
  if (!skip.has('bottom')) {
    faces.push({
      id: `${idPrefix}-bot`,
      partName,
      vertices: [v000, v100, v101, v001],
      baseColor: shadeHexColor(baseColor, 0.6),
      strokeColor: options.strokeColor,
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
      isWireframeOnly: options.isWireframe,
    });
  }

  // Left Face (Normal +Z) - Viewer Left in Iso
  if (!skip.has('left')) {
    faces.push({
      id: `${idPrefix}-left`,
      partName,
      vertices: [v001, v101, v111, v011],
      baseColor: shadeHexColor(baseColor, 0.88),
      strokeColor: options.strokeColor,
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
      isWireframeOnly: options.isWireframe,
    });
  }

  // Right Face (Normal -Z)
  if (!skip.has('right')) {
    faces.push({
      id: `${idPrefix}-right`,
      partName,
      vertices: [v100, v000, v010, v110],
      baseColor: shadeHexColor(baseColor, 0.72),
      strokeColor: options.strokeColor,
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
      isWireframeOnly: options.isWireframe,
    });
  }

  // Front Face (Normal +X)
  if (!skip.has('front')) {
    faces.push({
      id: `${idPrefix}-front`,
      partName,
      vertices: [v101, v100, v110, v111],
      baseColor: shadeHexColor(baseColor, 0.95),
      strokeColor: options.strokeColor,
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
      isWireframeOnly: options.isWireframe,
    });
  }

  // Back Face (Normal -X)
  if (!skip.has('back')) {
    faces.push({
      id: `${idPrefix}-back`,
      partName,
      vertices: [v000, v001, v011, v010],
      baseColor: shadeHexColor(baseColor, 0.8),
      strokeColor: options.strokeColor,
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
      isWireframeOnly: options.isWireframe,
    });
  }

  return faces;
}

/**
 * Builds the complete commercial vehicle & palletized cargo scene in pure 3D vector geometry.
 */
export function buildVehicleVectorScene(
  vehicle: VehicleSpec,
  selectedPackage: CargoPackageSpec,
  placements: GridPlacement[],
  explodePct: number,
  cutaway: boolean
): Face3D[] {
  const faces: Face3D[] = [];
  const factor = explodePct / 100; // 0.0 to 1.0

  const isFlatbed = vehicle.subtype.includes('flatbed') || vehicle.subtype.includes('step_deck');
  const isTanker = vehicle.subtype.includes('tanker');
  const isElectric = vehicle.fuelEnergy.fuelType === 'electric';

  const cabColor = isElectric ? '#0284c7' : '#1d4ed8'; // Royal blue
  const chassisColor = '#1e293b'; // Slate dark
  const trailerWallColor = '#f1f5f9'; // High-gloss carrier white
  const engineColor = '#0369a1'; // Detroit diesel blue

  // 1. TRACTOR CAB (Translates forward & tilts forward on hinge pin during explode)
  const cabOffsetX = -factor * 6;
  const cabOffsetY = factor * 3.5;
  const cabTiltAngle = -factor * 0.35; // Forward tilt in radians

  // Helper to rotate point around hinge pin [-20, 2, 0]
  const rotateCabPt = (p: Vec3): Vec3 => {
    if (factor === 0) return p;
    const hx = -20;
    const hy = 2;
    const dx = p[0] - hx;
    const dy = p[1] - hy;
    const rotX = dx * Math.cos(cabTiltAngle) - dy * Math.sin(cabTiltAngle) + hx + cabOffsetX;
    const rotY = dx * Math.sin(cabTiltAngle) + dy * Math.cos(cabTiltAngle) + hy + cabOffsetY;
    return [rotX, rotY, p[2]];
  };

  // Cab Lower Hood & Bumper
  const rawHood = createCuboidFaces('cab-hood', 'Tractor Hood', [-21, 4.5, 0], [7, 3.8, 8.2], cabColor);
  faces.push(...rawHood.map((f) => ({ ...f, vertices: f.vertices.map(rotateCabPt) })));

  // Cab Sleeper Cabin & Roof Fairing
  const rawCabin = createCuboidFaces('cab-sleep', 'Sleeper Cabin', [-14, 7.5, 0], [8, 9.5, 8.2], cabColor);
  faces.push(...rawCabin.map((f) => ({ ...f, vertices: f.vertices.map(rotateCabPt) })));

  // Windshield & Glazing
  const rawGlass = createCuboidFaces('cab-glass', 'Windshield Glass', [-18, 8.5, 0], [0.8, 3.2, 7.6], '#38bdf8', {
    opacity: 0.7,
  });
  faces.push(...rawGlass.map((f) => ({ ...f, vertices: f.vertices.map(rotateCabPt) })));

  // 2. DETROIT DD15 ENGINE BLOCK & TURBO (Lifts vertically on explode)
  const engYOffset = factor * 5;
  faces.push(
    ...createCuboidFaces(
      'eng-block',
      'Detroit DD15 Engine',
      [-18, 4.5 + engYOffset, 0],
      [6.2, 4.0, 3.2],
      engineColor,
      { strokeColor: '#38bdf8' }
    )
  );

  // Turbocharger
  faces.push(
    ...createCuboidFaces(
      'eng-turbo',
      'Turbocharger',
      [-17, 6.2 + engYOffset, 1.8],
      [2.2, 1.8, 2.0],
      '#d97706',
      { strokeColor: '#f59e0b' }
    )
  );

  // 3. TRACTOR CHASSIS RAILS & 5TH WHEEL
  faces.push(
    ...createCuboidFaces('chassis-rails', 'Chassis Frame', [-10, 2.8, 0], [28, 1.4, 3.2], chassisColor)
  );

  // Dual 150-Gal Fuel Tanks (Left & Right)
  faces.push(
    ...createCuboidFaces('fuel-left', 'Fuel Tank (Left)', [-11, 2.5, 4.0], [7.5, 2.6, 2.6], '#94a3b8')
  );
  faces.push(
    ...createCuboidFaces('fuel-right', 'Fuel Tank (Right)', [-11, 2.5, -4.0], [7.5, 2.6, 2.6], '#94a3b8')
  );

  // Fontaine 5th Wheel Plate
  faces.push(
    ...createCuboidFaces('fifth-wheel', '5th Wheel Coupling', [0, 4.0, 0], [3.2, 0.8, 3.4], '#334155', {
      strokeColor: '#10b981',
    })
  );

  // 4. WHEELS & TIRES (Steer + Dual Tandems)
  const addWheelBox = (id: string, name: string, x: number, y: number, z: number) => {
    faces.push(
      ...createCuboidFaces(id, name, [x, y, z], [3.2, 3.2, 1.4], '#0f172a', {
        strokeColor: '#64748b',
      })
    );
  };

  // Front Steer Wheels
  addWheelBox('whl-steer-l', 'Steer Wheel (L)', -20, 2.0, 4.3);
  addWheelBox('whl-steer-r', 'Steer Wheel (R)', -20, 2.0, -4.3);

  // Tractor Tandem Wheels
  addWheelBox('whl-drv1-l', 'Drive Axle 1 (L)', -4, 2.0, 4.3);
  addWheelBox('whl-drv1-r', 'Drive Axle 1 (R)', -4, 2.0, -4.3);
  addWheelBox('whl-drv2-l', 'Drive Axle 2 (L)', 0.5, 2.0, 4.3);
  addWheelBox('whl-drv2-r', 'Drive Axle 2 (R)', 0.5, 2.0, -4.3);

  // 5. TRAILER ASSEMBLY (53ft Dry Van or Specialized Body)
  const trailerLen = vehicle.interior.lengthFt || 53;
  const trailerWidth = 8.4;
  const trailerHeight = 9.2;
  const trailerCenterX = 28;

  // Trailer Floor Bed (Always visible)
  faces.push(
    ...createCuboidFaces(
      'trl-floor',
      'Trailer Floor Bed',
      [trailerCenterX, 5.0, 0],
      [trailerLen, 0.9, trailerWidth],
      '#334155',
      { strokeColor: '#0284c7' }
    )
  );

  // Landing Gear Legs
  faces.push(
    ...createCuboidFaces('trl-lg-l', 'Landing Gear (L)', [8, 2.6, 3.6], [0.8, 4.2, 0.8], '#475569')
  );
  faces.push(
    ...createCuboidFaces('trl-lg-r', 'Landing Gear (R)', [8, 2.6, -3.6], [0.8, 4.2, 0.8], '#475569')
  );

  // Nose Thermo King Reefer Unit
  if (vehicle.subtype.includes('reefer') || !isFlatbed) {
    faces.push(
      ...createCuboidFaces('trl-reefer', 'Thermo King Reefer', [2.8, 10.5, 0], [2.2, 6.2, 7.2], '#ffffff', {
        strokeColor: '#06b6d4',
      })
    );
  }

  // Trailer Walls & Roof (Displace laterally / vertically on explode, or cutaway)
  const wallLateralDisplacement = factor * 7.5;
  const roofVerticalDisplacement = factor * 9.0;

  if (!isFlatbed && !isTanker) {
    // Left Wall
    if (!cutaway || factor > 0.05) {
      faces.push(
        ...createCuboidFaces(
          'trl-wall-l',
          'Trailer Left Wall',
          [trailerCenterX, 10.0, trailerWidth / 2 + wallLateralDisplacement],
          [trailerLen, trailerHeight, 0.3],
          trailerWallColor,
          {
            strokeColor: '#38bdf8',
            opacity: cutaway ? 0.35 : 0.95,
          }
        )
      );
    }

    // Right Wall
    faces.push(
      ...createCuboidFaces(
        'trl-wall-r',
        'Trailer Right Wall',
        [trailerCenterX, 10.0, -trailerWidth / 2 - wallLateralDisplacement],
        [trailerLen, trailerHeight, 0.3],
        trailerWallColor,
        { strokeColor: '#38bdf8' }
      )
    );

    // Roof
    if (!cutaway || factor > 0.05) {
      faces.push(
        ...createCuboidFaces(
          'trl-roof',
          'Trailer Roof Skin',
          [trailerCenterX, 14.8 + roofVerticalDisplacement, 0],
          [trailerLen, 0.3, trailerWidth],
          trailerWallColor,
          {
            strokeColor: '#38bdf8',
            opacity: cutaway ? 0.35 : 0.95,
          }
        )
      );
    }

    // Rear Barn Doors (Swings open on explode)
    const doorAngle = factor * 1.57; // 90 degrees outward swing
    const doorPivotX = trailerCenterX + trailerLen / 2;
    const doorPivotZ = trailerWidth / 2;

    const rotateDoorL = (p: Vec3): Vec3 => {
      if (factor === 0) return p;
      const dx = p[0] - doorPivotX;
      const dz = p[2] - doorPivotZ;
      const rx = dx * Math.cos(doorAngle) - dz * Math.sin(doorAngle) + doorPivotX;
      const rz = dx * Math.sin(doorAngle) + dz * Math.cos(doorAngle) + doorPivotZ;
      return [rx, p[1], rz];
    };

    const leftDoorFaces = createCuboidFaces(
      'trl-door-l',
      'Rear Barn Door (L)',
      [doorPivotX, 10.0, trailerWidth / 4],
      [0.3, trailerHeight, trailerWidth / 2],
      '#0f172a'
    );
    faces.push(...leftDoorFaces.map((f) => ({ ...f, vertices: f.vertices.map(rotateDoorL) })));
  }

  // 6. SLIDING TRAILER TANDEM BOGIE (Translates rearward on explode)
  const bogieDisplacementX = factor * 6.5;
  const bogieX1 = 46 + bogieDisplacementX;
  const bogieX2 = 50.5 + bogieDisplacementX;

  addWheelBox('whl-trl1-l', 'Trailer Bogie 1 (L)', bogieX1, 2.0, 4.3);
  addWheelBox('whl-trl1-r', 'Trailer Bogie 1 (R)', bogieX1, 2.0, -4.3);
  addWheelBox('whl-trl2-l', 'Trailer Bogie 2 (L)', bogieX2, 2.0, 4.3);
  addWheelBox('whl-trl2-r', 'Trailer Bogie 2 (R)', bogieX2, 2.0, -4.3);

  // 7. CARGO PALLET PLACEMENTS (Stepped coordinate floating during explode)
  const palletBaseColor = selectedPackage?.color || '#b45309'; // Default rich pallet amber
  const pLen = Math.max(2.4, (selectedPackage?.dims.lengthIn || 48) / 12);
  const pWd = Math.max(2.2, (selectedPackage?.dims.widthIn || 40) / 12);
  const pHt = Math.max(2.4, (selectedPackage?.dims.heightIn || 48) / 12);

  if (placements && placements.length > 0) {
    placements.slice(0, 36).forEach((p, idx) => {
      // Float tiers upward on explode for spectacular exploded inspection!
      const tierFloatY = p.tier * factor * 4.5 + factor * 1.5;
      const xPos = 4.5 + p.xIn / 12;
      const yPos = 5.6 + p.yIn / 12 + pHt / 2 + tierFloatY;
      const zPos = -3.6 + p.zIn / 12 + pWd / 2;

      faces.push(
        ...createCuboidFaces(
          `cargo-${idx}`,
          `${selectedPackage.name} #${idx + 1}`,
          [xPos, yPos, zPos],
          [pLen, pHt, pWd],
          palletBaseColor,
          { strokeColor: '#f59e0b', strokeWidth: 0.8 }
        )
      );
    });
  } else {
    // Default 22 pallets
    for (let i = 0; i < 20; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const xPos = 6.5 + row * 4.5;
      const yPos = 7.8 + factor * 2.0;
      const zPos = col === 0 ? 1.8 : -1.8;

      faces.push(
        ...createCuboidFaces(
          `default-pallet-${i}`,
          `GMA Pallet #${i + 1}`,
          [xPos, yPos, zPos],
          [4.0, 4.4, 3.3],
          palletBaseColor,
          { strokeColor: '#f59e0b', strokeWidth: 0.8 }
        )
      );
    }
  }

  return faces;
}

// -------------------------------------------------------------
// TECHNICAL BLUEPRINT LEADER LINES & RADAR CALLOUTS
// -------------------------------------------------------------

export function buildBlueprintAnnotations(
  vehicle: VehicleSpec,
  camera: CameraConfig
): {
  dimensionLines: DimensionLine2D[];
  technicalPins: TechnicalPin2D[];
} {
  const dimensionLines: DimensionLine2D[] = [];
  const technicalPins: TechnicalPin2D[] = [];

  const trailerLen = vehicle.interior.lengthFt || 53;
  const totalLength = trailerLen + 20; // Tractor + Trailer

  // Overall Corridor Length Leader Line
  dimensionLines.push(
    projectDimensionLine(
      [-24, -1.0, 5.5],
      [trailerLen + 2, -1.0, 5.5],
      `OAL: ${totalLength.toFixed(1)}' (Comb)`,
      camera,
      8
    )
  );

  // Trailer Length Leader Line
  dimensionLines.push(
    projectDimensionLine(
      [2.5, 16.5, 0],
      [trailerLen + 2.5, 16.5, 0],
      `TRAILER: ${trailerLen}'0" (16.15m)`,
      camera,
      6
    )
  );

  // Exterior Height Leader Line
  dimensionLines.push(
    projectDimensionLine(
      [-25, 0.5, 0],
      [-25, 14.5, 0],
      `OAH: 13'6" (4.11m)`,
      camera,
      6
    )
  );

  // Exterior Width Leader Line
  dimensionLines.push(
    projectDimensionLine(
      [trailerLen + 3, 10.0, -4.2],
      [trailerLen + 3, 10.0, 4.2],
      `OAW: 102" (2.59m)`,
      camera,
      6
    )
  );

  // Technical Callout Pins (Zafar Lab Style)
  const pin1 = projectVec3([-18, 9.0, 0], camera).pt;
  technicalPins.push({
    id: 'pin-dd15',
    label: 'Detroit DD15 505 HP',
    category: 'Powertrain',
    position: pin1,
    pinEnd: [pin1[0] - 50, pin1[1] - 40],
  });

  const pin2 = projectVec3([0, 4.5, 0], camera).pt;
  technicalPins.push({
    id: 'pin-fw',
    label: 'Fontaine 5th Wheel (41\' Bridge)',
    category: 'Coupling',
    position: pin2,
    pinEnd: [pin2[0] + 40, pin2[1] - 50],
  });

  const pin3 = projectVec3([2.8, 11.0, 0], camera).pt;
  technicalPins.push({
    id: 'pin-reefer',
    label: 'Thermo King S-700 (-20°F)',
    category: 'Reefer Unit',
    position: pin3,
    pinEnd: [pin3[0] + 55, pin3[1] - 40],
  });

  const pin4 = projectVec3([48, 2.0, 4.3], camera).pt;
  technicalPins.push({
    id: 'pin-bogie',
    label: 'Meritor Tandem (34,000 lbs Cap)',
    category: 'Running Gear',
    position: pin4,
    pinEnd: [pin4[0] + 60, pin4[1] + 35],
  });

  return { dimensionLines, technicalPins };
}
