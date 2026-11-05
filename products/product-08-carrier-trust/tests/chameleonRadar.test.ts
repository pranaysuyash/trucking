import { describe, it, expect } from 'vitest';
import {
  generateCarrierRadarGraph,
  polarToCartesian,
  scaleDistanceToRadius,
} from '../src/engine/chameleonRadar';
import { INITIAL_CARRIERS } from '../src/engine/carriers';

describe('Chameleon Carrier & Fraud Nexus Radar Engine', () => {
  const apexCarrier = INITIAL_CARRIERS.find((c) => c.dotNumber === '389211')!;
  const keystoneCarrier = INITIAL_CARRIERS.find((c) => c.dotNumber === '781902')!;
  const veloceCarrier = INITIAL_CARRIERS.find((c) => c.dotNumber === '410928')!;

  describe('High-Risk Chameleon Detection (Veloce Transit Solutions)', () => {
    it('detects high-risk chameleon carrier clusters and offshore dispatch proxy', () => {
      const graph = generateCarrierRadarGraph(veloceCarrier);

      expect(graph.threatScore).toBeGreaterThanOrEqual(90);
      expect(graph.verdict).toBe('CRITICAL_FRAUD_LOCKOUT');
      expect(graph.chameleonClustersDetected).toBeGreaterThanOrEqual(2);

      // Verify node entities
      const nodeTypes = graph.nodes.map((n) => n.type);
      expect(nodeTypes).toContain('CORE_CARRIER');
      expect(nodeTypes).toContain('PHOENIX_ENTITY');
      expect(nodeTypes).toContain('VOIP_TRUNK');
      expect(nodeTypes).toContain('OFFSHORE_PROXY');
      expect(nodeTypes).toContain('FREIGHTGUARD_CLAIM');
      expect(nodeTypes).toContain('INSURANCE_REVOCATION');

      // Verify offshore proxy distance
      const offshoreNode = graph.nodes.find((n) => n.type === 'OFFSHORE_PROXY');
      expect(offshoreNode).toBeDefined();
      expect(offshoreNode?.distanceKm).toBeGreaterThan(5000);
      expect(offshoreNode?.riskLevel).toBe('CRITICAL');

      // Verify links
      expect(graph.links.length).toBeGreaterThan(4);
      const flaggedLinks = graph.links.filter((l) => l.isFlagged);
      expect(flaggedLinks.length).toBe(graph.links.length); // all flagged in critical profile
    });
  });

  describe('Moderate-Risk Elevated Monitoring (Keystone Logistics)', () => {
    it('generates elevated monitoring verdict with commercial disputes and historical links', () => {
      const graph = generateCarrierRadarGraph(keystoneCarrier);

      expect(graph.verdict).toBe('ELEVATED_MONITORING');
      expect(graph.threatScore).toBeGreaterThanOrEqual(30);
      expect(graph.threatScore).toBeLessThan(70);

      const hasDispute = graph.nodes.some((n) => n.type === 'FREIGHTGUARD_CLAIM');
      expect(hasDispute).toBe(true);

      const hasPredecessor = graph.nodes.some((n) => n.type === 'PHOENIX_ENTITY');
      expect(hasPredecessor).toBe(true);
    });
  });

  describe('Clean Verified Profile (Apex Freight Lines)', () => {
    it('identifies verified infrastructure without chameleon fraud signals', () => {
      const graph = generateCarrierRadarGraph(apexCarrier);

      expect(graph.verdict).toBe('CLEAN_VERIFIED');
      expect(graph.threatScore).toBeLessThanOrEqual(15);
      expect(graph.chameleonClustersDetected).toBe(0);

      // Should only contain CORE_CARRIER and VERIFIED_INFRASTRUCTURE
      const nonCoreNodes = graph.nodes.filter((n) => n.type !== 'CORE_CARRIER');
      for (const node of nonCoreNodes) {
        expect(node.type).toBe('VERIFIED_INFRASTRUCTURE');
        expect(node.riskLevel).toBe('VERIFIED');
      }

      // No links should be flagged
      const flaggedLinks = graph.links.filter((l) => l.isFlagged);
      expect(flaggedLinks.length).toBe(0);
    });
  });

  describe('Polar Projection and Distance Geometry', () => {
    const centerX = 340;
    const centerY = 260;
    const maxRadius = 220;

    it('projects 0 degrees (North) directly along the negative Y axis', () => {
      const pt = polarToCartesian(centerX, centerY, 100, 0);
      expect(Math.round(pt.x)).toBe(340);
      expect(Math.round(pt.y)).toBe(160); // 260 - 100
    });

    it('projects 90 degrees (East) directly along the positive X axis', () => {
      const pt = polarToCartesian(centerX, centerY, 100, 90);
      expect(Math.round(pt.x)).toBe(440); // 340 + 100
      expect(Math.round(pt.y)).toBe(260);
    });

    it('projects 180 degrees (South) directly along the positive Y axis', () => {
      const pt = polarToCartesian(centerX, centerY, 100, 180);
      expect(Math.round(pt.x)).toBe(340);
      expect(Math.round(pt.y)).toBe(360); // 260 + 100
    });

    it('projects 270 degrees (West) directly along the negative X axis', () => {
      const pt = polarToCartesian(centerX, centerY, 100, 270);
      expect(Math.round(pt.x)).toBe(240); // 340 - 100
      expect(Math.round(pt.y)).toBe(260);
    });

    it('scales distance to radius using square-root compression', () => {
      expect(scaleDistanceToRadius(0, maxRadius)).toBe(0);
      const r2500 = scaleDistanceToRadius(2500, maxRadius);
      expect(Math.round(r2500)).toBe(110); // sqrt(2500/10000) * 220 = 0.5 * 220 = 110
      const r10000 = scaleDistanceToRadius(10000, maxRadius);
      expect(Math.round(r10000)).toBe(220); // sqrt(10000/10000) * 220 = 220
    });
  });
});
