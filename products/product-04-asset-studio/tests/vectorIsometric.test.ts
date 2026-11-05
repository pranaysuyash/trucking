import { describe, it, expect } from 'vitest';
import {
  type CameraConfig,
  projectVec3,
  computeFaceNormal,
  calculateWindingArea2D,
  shadeHexColor,
  projectSceneFaces,
  createCuboidFaces,
  buildVehicleVectorScene,
  buildBlueprintAnnotations,
} from '../src/engine/vectorIsometric';
import { STANDARD_VEHICLES, STANDARD_PACKAGES } from '../src/engine/catalog';

describe('Pure-Vector 3D to 2D SVG Isometric Engine', () => {
  const defaultCamera: CameraConfig = {
    azimuthDeg: 45,
    elevationDeg: 30,
    scale: 12.0,
    originX: 470,
    originY: 280,
    centerTarget: [14, 7, 0],
    lightAzimuthDeg: 60,
    lightElevationDeg: 45,
    ambientLight: 0.4,
    enableBackfaceCulling: true,
    renderMode: 'shaded',
  };

  it('projects 3D coordinates into consistent 2D screen coordinates with depth', () => {
    const p1 = projectVec3([0, 0, 0], defaultCamera);
    const p2 = projectVec3([10, 0, 0], defaultCamera);
    expect(p1.pt).toHaveLength(2);
    expect(typeof p1.pt[0]).toBe('number');
    expect(typeof p1.pt[1]).toBe('number');
    expect(typeof p1.depth).toBe('number');
    // Translating along X should alter both screen coordinates under 45° azimuth
    expect(p2.pt[0]).not.toBe(p1.pt[0]);
  });

  it('computes accurate 3D face normals for polygon winding', () => {
    // CCW triangle on XY plane facing +Z
    const normal = computeFaceNormal([
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
    ]);
    expect(normal[0]).toBeCloseTo(0, 3);
    expect(normal[1]).toBeCloseTo(0, 3);
    expect(normal[2]).toBeCloseTo(1, 3);
  });

  it('calculates 2D winding area correctly for SVG backface culling', () => {
    // Clockwise vs Counter-clockwise winding
    const ccwTriangle: [number, number][] = [
      [0, 0],
      [10, 0],
      [0, 10],
    ];
    const cwTriangle: [number, number][] = [
      [0, 0],
      [0, 10],
      [10, 0],
    ];
    const areaCCW = calculateWindingArea2D(ccwTriangle);
    const areaCW = calculateWindingArea2D(cwTriangle);
    expect(areaCCW).toBeGreaterThan(0);
    expect(areaCW).toBeLessThan(0);
  });

  it('applies directional lighting shading to hex colors', () => {
    const bright = shadeHexColor('#38bdf8', 1.0);
    const dark = shadeHexColor('#38bdf8', 0.5);
    expect(bright.toLowerCase()).toBe('#38bdf8');
    expect(dark).toMatch(/^#[0-9a-f]{6}$/i);
    expect(dark).not.toBe(bright);
  });

  it('generates 3D cuboid with 6 properly oriented polygon faces', () => {
    const faces = createCuboidFaces('test-box', 'Engine Unit', [0, 5, 0], [4, 4, 4], '#0284c7');
    expect(faces).toHaveLength(6);
    for (const f of faces) {
      expect(f.vertices).toHaveLength(4);
      expect(f.partName).toBe('Engine Unit');
      expect(f.baseColor).toBeTruthy();
    }
  });

  it('projects and depth-sorts scene faces using Painter algorithm', () => {
    const boxFaces = createCuboidFaces('test-box', 'Trailer', [10, 5, 0], [20, 8, 8], '#f1f5f9');
    const projected = projectSceneFaces(boxFaces, defaultCamera);

    // With backface culling enabled, back-facing 3 faces should be culled
    expect(projected.length).toBeLessThanOrEqual(6);
    expect(projected.length).toBeGreaterThanOrEqual(2);

    // Verify depth sorting: array must be sorted in ascending depth order
    for (let i = 0; i < projected.length - 1; i++) {
      expect(projected[i].depth).toBeLessThanOrEqual(projected[i + 1].depth);
    }
  });

  it('builds complete procedural vehicle & cargo vector scene with explode kinematics', () => {
    const dryVan = STANDARD_VEHICLES.find((v) => v.id === 'dry-van-53')!;
    const gmaPallet = STANDARD_PACKAGES.find((p) => p.id === 'pallet-gma-48x40')!;

    const fittedScene = buildVehicleVectorScene(dryVan, gmaPallet, [], 0, false);
    const explodedScene = buildVehicleVectorScene(dryVan, gmaPallet, [], 100, false);

    expect(fittedScene.length).toBeGreaterThan(50);
    expect(explodedScene.length).toBeGreaterThan(50);

    // Exploded engine block should have a higher Y position than fitted
    const fittedEngineFace = fittedScene.find((f) => f.id === 'eng-block-top')!;
    const explodedEngineFace = explodedScene.find((f) => f.id === 'eng-block-top')!;
    expect(explodedEngineFace.vertices[0][1]).toBeGreaterThan(fittedEngineFace.vertices[0][1]);
  });

  it('generates Zafar Lab-style technical blueprint dimension lines and radar pins', () => {
    const dryVan = STANDARD_VEHICLES.find((v) => v.id === 'dry-van-53')!;
    const annotations = buildBlueprintAnnotations(dryVan, defaultCamera);

    expect(annotations.dimensionLines.length).toBeGreaterThanOrEqual(4);
    expect(annotations.technicalPins.length).toBeGreaterThanOrEqual(4);

    for (const dim of annotations.dimensionLines) {
      expect(dim.label).toBeTruthy();
      expect(dim.start).toHaveLength(2);
      expect(dim.end).toHaveLength(2);
    }

    for (const pin of annotations.technicalPins) {
      expect(pin.label).toBeTruthy();
      expect(pin.position).toHaveLength(2);
      expect(pin.pinEnd).toHaveLength(2);
    }
  });
});
