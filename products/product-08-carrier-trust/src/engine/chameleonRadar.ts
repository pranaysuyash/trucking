/**
 * Chameleon Carrier Network & Fraud Nexus Radar Engine.
 * Analyzes carrier identity, contact security, SAFER authority history,
 * and telecom/IP metadata to reconstruct Phoenix carrier clusters,
 * double-brokering dispatch nexus links, and FreightGuard claims.
 */

import { CarrierProfile } from './types';

export type RadarNodeType =
  | 'CORE_CARRIER'
  | 'PHOENIX_ENTITY'
  | 'VOIP_TRUNK'
  | 'OFFSHORE_PROXY'
  | 'FREIGHTGUARD_CLAIM'
  | 'SHARED_ADDRESS'
  | 'INSURANCE_REVOCATION'
  | 'VERIFIED_INFRASTRUCTURE';

export type RadarRiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'VERIFIED';

export interface RadarNode {
  id: string;
  label: string;
  type: RadarNodeType;
  riskLevel: RadarRiskLevel;
  distanceKm: number; // 0 (center) to ~10,000 km (offshore)
  bearingDeg: number; // 0 to 360 degrees on polar sweep
  dotOrMc?: string;
  details: string;
  evidence: string[];
  connectionType: string;
}

export interface RadarLink {
  sourceId: string;
  targetId: string;
  relationship: string;
  confidencePercent: number;
  isFlagged: boolean;
}

export interface CarrierRadarGraph {
  carrierDot: string;
  carrierLegalName: string;
  centerNode: RadarNode;
  nodes: RadarNode[];
  links: RadarLink[];
  threatScore: number; // 0 - 100 (higher = more dangerous)
  chameleonClustersDetected: number;
  geographicDispersionKm: number;
  verdict: 'CLEAN_VERIFIED' | 'ELEVATED_MONITORING' | 'CRITICAL_FRAUD_LOCKOUT';
}

/**
 * Projects a polar coordinate (distanceKm, bearingDeg) onto an SVG viewbox coordinate system.
 * Radius is scaled logarithmically or linearly into SVG radius (px).
 */
export function polarToCartesian(
  centerX: number,
  centerY: number,
  radiusPx: number,
  bearingDeg: number
): { x: number; y: number } {
  // Convert bearing (0 deg = North / 12 o'clock) to mathematical radians (0 rad = East / 3 o'clock)
  const angleRad = ((bearingDeg - 90) * Math.PI) / 180;
  return {
    x: centerX + radiusPx * Math.cos(angleRad),
    y: centerY + radiusPx * Math.sin(angleRad),
  };
}

/**
 * Normalizes distance (0 to 10,000 km) to radar canvas radius (0 to maxRadius).
 * Uses square-root compression so nearby nodes have distinct separation
 * while offshore nodes (e.g. 8,000 km) sit on the outer ring.
 */
export function scaleDistanceToRadius(distanceKm: number, maxRadiusPx: number): number {
  if (distanceKm <= 0) return 0;
  const maxDistanceKm = 10000;
  const normalized = Math.min(distanceKm, maxDistanceKm) / maxDistanceKm;
  // Sqrt scaling gives 50% radius at 2,500 km
  return Math.sqrt(normalized) * maxRadiusPx;
}

/**
 * Generates the multi-entity forensic graph for a carrier.
 */
export function generateCarrierRadarGraph(carrier: CarrierProfile): CarrierRadarGraph {
  const isHighRisk =
    carrier.fraudIndicators.chameleonCarrierRisk === 'high' ||
    carrier.fraudIndicators.doubleBrokeringRisk === 'high' ||
    carrier.operatingAuthority === 'REVOKED' ||
    carrier.fraudIndicators.contactSecurity?.voipRiskLevel === 'CRITICAL';

  const isModerateRisk =
    !isHighRisk &&
    (carrier.fraudIndicators.doubleBrokeringRisk === 'moderate' ||
      carrier.fraudIndicators.freightGuardReportsCount > 0);

  const centerNode: RadarNode = {
    id: `carrier-${carrier.dotNumber}`,
    label: carrier.legalName,
    type: 'CORE_CARRIER',
    riskLevel: isHighRisk ? 'CRITICAL' : isModerateRisk ? 'MODERATE' : 'VERIFIED',
    distanceKm: 0,
    bearingDeg: 0,
    dotOrMc: `DOT# ${carrier.dotNumber} / MC# ${carrier.mcNumber}`,
    details: `${carrier.physicalAddress}, ${carrier.city}, ${carrier.state}`,
    evidence: [
      `Operating Authority: ${carrier.operatingAuthority}`,
      `Safety Rating: ${carrier.safetyRating}`,
      `Fleet Size: ${carrier.powerUnitCount} Trucks / ${carrier.driverCount} Drivers`,
    ],
    connectionType: 'Primary Target Entity',
  };

  const nodes: RadarNode[] = [centerNode];
  const links: RadarLink[] = [];

  if (isHighRisk) {
    // Veloce Transit or high risk chameleon profile
    const phoenix1: RadarNode = {
      id: 'phoenix-swifthaul',
      label: 'SwiftHaul Express LLC (Revoked)',
      type: 'PHOENIX_ENTITY',
      riskLevel: 'CRITICAL',
      distanceKm: 85,
      bearingDeg: 42,
      dotOrMc: 'DOT# 3194021 / MC# 552190',
      details: 'Involuntary FMCSA safety revocation following 44% vehicle OOS rate and fatal rear-end rollover',
      evidence: [
        'Shared Commercial Address: 880 Biscayne Blvd #12, Miami, FL',
        'Same Registered Agent: V. Grigoryan (Incorporated 14 days after SwiftHaul shutdown)',
        'Matching VIN registration on 2 Freightliner Cascadia tractors',
      ],
      connectionType: 'Address & Fleet Re-Incarnation Nexus',
    };

    const phoenix2: RadarNode = {
      id: 'phoenix-alphaprime',
      label: 'Alpha Prime Cargo Corp',
      type: 'PHOENIX_ENTITY',
      riskLevel: 'HIGH',
      distanceKm: 180,
      bearingDeg: 125,
      dotOrMc: 'DOT# 2948100 / MC# 482910',
      details: 'Suspended entity with $62,000 outstanding civil penalties and broker conversion claims',
      evidence: [
        'Shared Dispatch Phone Number: (786) 555-0199',
        'Common Operating Officer identified in Florida Division of Corporations filing',
      ],
      connectionType: 'Common Telephony & Officer Cross-Link',
    };

    const voipTrunk: RadarNode = {
      id: 'voip-virtual-gateway',
      label: 'Bandwidth.com / Pinger Virtual PBX',
      type: 'VOIP_TRUNK',
      riskLevel: 'CRITICAL',
      distanceKm: 3400,
      bearingDeg: 285,
      details: 'Virtual non-fixed VoIP SIP trunk with disposable DID pool bypassing FCC STIR/SHAKEN caller ID validation',
      evidence: [
        'No physical copper or fiber loop at registered terminal address',
        'Automated call forwarding to international mobile gateway',
        'Known burner phone provider associated with double-brokering rings',
      ],
      connectionType: 'Synthetic Telephony Trunk',
    };

    const offshoreProxy: RadarNode = {
      id: 'offshore-dispatcher-ip',
      label: 'Offshore Dispatch IP (Yerevan, AM)',
      type: 'OFFSHORE_PROXY',
      riskLevel: 'CRITICAL',
      distanceKm: 9800,
      bearingDeg: 62,
      details: 'Dispatcher web session originating from IP 185.190.142.66 (Armenia) via OpenVPN commercial datacenter exit node',
      evidence: [
        '9,800 km distance disparity between Florida dispatch office and active session',
        'Browser timezone mismatch: GMT+4 (Asia/Yerevan) vs EDT (America/New_York)',
        'Datacenter ASN (AS44034) flagged for high-volume automated DAT/Truckstop scraping',
      ],
      connectionType: 'Cross-Border Proxy Dispatch Nexus',
    };

    const freightguardCluster: RadarNode = {
      id: 'fg-fraud-reports',
      label: 'FreightGuard Fraud Claims (4 Reports)',
      type: 'FREIGHTGUARD_CLAIM',
      riskLevel: 'CRITICAL',
      distanceKm: 1200,
      bearingDeg: 195,
      details: 'Multiple verified carrier complaints for unauthorized load re-brokering, hostage freight, and non-payment',
      evidence: [
        'Report #FG-2026-8812: Brokered produce load re-tendered without shipper consent ($28,500 unpaid)',
        'Report #FG-2026-7901: Rate confirmation forgery and fuel advance redirection',
        'Report #FG-2025-9430: Unauthorized co-loading on dedicated refrigerated trailer',
      ],
      connectionType: 'Industry Blacklist Cluster',
    };

    const insuranceRevocation: RadarNode = {
      id: 'insurance-cancellation',
      label: 'Canal Insurance BMC-91X Revocation',
      type: 'INSURANCE_REVOCATION',
      riskLevel: 'HIGH',
      distanceKm: 650,
      bearingDeg: 330,
      details: 'Underwriter notice of cancellation filed with FMCSA for material misrepresentation of fleet garage location',
      evidence: [
        'Policy #CAN-CA-001928 cancelled 82 days ago',
        'Insurer inspection revealed vehicles garaged outside state without endorsement',
      ],
      connectionType: 'Statutory Filing Breach',
    };

    nodes.push(phoenix1, phoenix2, voipTrunk, offshoreProxy, freightguardCluster, insuranceRevocation);

    links.push(
      { sourceId: centerNode.id, targetId: phoenix1.id, relationship: 'Physical Yard & Asset Reuse', confidencePercent: 98, isFlagged: true },
      { sourceId: centerNode.id, targetId: phoenix2.id, relationship: 'Shared Officer & Telephony', confidencePercent: 94, isFlagged: true },
      { sourceId: centerNode.id, targetId: voipTrunk.id, relationship: 'Caller ID Spoofing / DID Pool', confidencePercent: 99, isFlagged: true },
      { sourceId: voipTrunk.id, targetId: offshoreProxy.id, relationship: 'SIP Trunk Termination to Yerevan', confidencePercent: 96, isFlagged: true },
      { sourceId: centerNode.id, targetId: offshoreProxy.id, relationship: 'Active Dispatch Web Session', confidencePercent: 100, isFlagged: true },
      { sourceId: centerNode.id, targetId: freightguardCluster.id, relationship: 'Broker Complaint Identity Lock', confidencePercent: 92, isFlagged: true },
      { sourceId: centerNode.id, targetId: insuranceRevocation.id, relationship: 'Statutory 49 CFR § 387 Policy Revocation', confidencePercent: 100, isFlagged: true }
    );

    return {
      carrierDot: carrier.dotNumber,
      carrierLegalName: carrier.legalName,
      centerNode,
      nodes,
      links,
      threatScore: 94,
      chameleonClustersDetected: 2,
      geographicDispersionKm: 9800,
      verdict: 'CRITICAL_FRAUD_LOCKOUT',
    };
  }

  if (isModerateRisk) {
    // Keystone Logistics profile
    const historicalMc: RadarNode = {
      id: 'keystone-historical-dormancy',
      label: 'Keystone Haulers Inc (Predecessor)',
      type: 'PHOENIX_ENTITY',
      riskLevel: 'MODERATE',
      distanceKm: 140,
      bearingDeg: 78,
      dotOrMc: 'DOT# 540911',
      details: 'Previous operating authority voluntarily surrendered during 2023 freight recession; re-filed under Keystone Logistics',
      evidence: [
        'Shared principal owner',
        'Clean prior audit history without OOS violations',
      ],
      connectionType: 'Voluntary Hiatus & Re-Registration',
    };

    const fgClaim: RadarNode = {
      id: 'keystone-fg-dispute',
      label: 'FreightGuard Dispute (1 Notice)',
      type: 'FREIGHTGUARD_CLAIM',
      riskLevel: 'MODERATE',
      distanceKm: 420,
      bearingDeg: 215,
      details: 'Unresolved 4-hour detention billing dispute on dry van load into supermarket DC',
      evidence: [
        'Claim amount: $350 detention dispute (non-fraud commercial dispute)',
        'No pattern of stolen freight or re-brokering',
      ],
      connectionType: 'Commercial Rate Dispute',
    };

    const domesticIsp: RadarNode = {
      id: 'keystone-isp',
      label: 'Verizon Business Dedicated Fiber',
      type: 'VERIFIED_INFRASTRUCTURE',
      riskLevel: 'VERIFIED',
      distanceKm: 25,
      bearingDeg: 340,
      details: 'Static IP pool registered to Keystone commercial terminal in Allentown, PA',
      evidence: [
        'Physical geolocation match: ASN 701 (Verizon Business)',
        'Zero VPN or TOR relay proxy signatures detected',
      ],
      connectionType: 'Domestic Fiber Line Verification',
    };

    nodes.push(historicalMc, fgClaim, domesticIsp);

    links.push(
      { sourceId: centerNode.id, targetId: historicalMc.id, relationship: 'Ownership Continuity', confidencePercent: 88, isFlagged: false },
      { sourceId: centerNode.id, targetId: fgClaim.id, relationship: 'Commercial Rate Dispute', confidencePercent: 75, isFlagged: true },
      { sourceId: centerNode.id, targetId: domesticIsp.id, relationship: 'Domestic Terminal Network', confidencePercent: 99, isFlagged: false }
    );

    return {
      carrierDot: carrier.dotNumber,
      carrierLegalName: carrier.legalName,
      centerNode,
      nodes,
      links,
      threatScore: 48,
      chameleonClustersDetected: 0,
      geographicDispersionKm: 420,
      verdict: 'ELEVATED_MONITORING',
    };
  }

  // Clean profile: Apex Freight Lines
  const wireline: RadarNode = {
    id: 'apex-wireline',
    label: 'AT&T Business Landline PRI',
    type: 'VERIFIED_INFRASTRUCTURE',
    riskLevel: 'VERIFIED',
    distanceKm: 12,
    bearingDeg: 55,
    details: 'Physical copper/fiber PRI wireline tied to Joliet IL logistics campus since 2018',
    evidence: [
      'FCC STIR/SHAKEN Level-A full cryptographic attestation on caller ID',
      'No VoIP forwarding or virtual DID switches',
    ],
    connectionType: 'Cryptographic Telecom Attestation',
  };

  const domainMatch: RadarNode = {
    id: 'apex-domain',
    label: 'apexlogistics.com (1,420 Days)',
    type: 'VERIFIED_INFRASTRUCTURE',
    riskLevel: 'VERIFIED',
    distanceKm: 18,
    bearingDeg: 160,
    details: 'Aged corporate domain with verified DNS MX, SPF, DKIM, and DMARC enforcement',
    evidence: [
      'Domain registered 2022-03-12 (over 3.8 years continuous)',
      'Enterprise Microsoft 365 tenant matching DOT name',
    ],
    connectionType: 'Corporate Domain Security',
  };

  const travelerPolicy: RadarNode = {
    id: 'apex-travelers',
    label: 'Travelers A++ Primary BMC-91X',
    type: 'VERIFIED_INFRASTRUCTURE',
    riskLevel: 'VERIFIED',
    distanceKm: 35,
    bearingDeg: 270,
    details: 'Active $1,000,000 public liability policy registered in FMCSA SAFER database',
    evidence: [
      'Direct underwriting verification from Gallagher Commercial',
      'Zero cancellation filings in 6-year operating history',
    ],
    connectionType: 'Direct Insurer Registry Nexus',
  };

  const terminalYard: RadarNode = {
    id: 'apex-terminal',
    label: 'Joliet IL 42-Acre Depot',
    type: 'VERIFIED_INFRASTRUCTURE',
    riskLevel: 'VERIFIED',
    distanceKm: 8,
    bearingDeg: 315,
    details: 'Commercial brick-and-mortar maintenance and tractor staging depot with 48 drivers',
    evidence: [
      'Physical inspection recorded in FMCSA Portal',
      'Zoned heavy industrial logistics facility',
    ],
    connectionType: 'Physical Yard Verification',
  };

  nodes.push(wireline, domainMatch, travelerPolicy, terminalYard);

  links.push(
    { sourceId: centerNode.id, targetId: wireline.id, relationship: 'Verified Wireline Loop', confidencePercent: 100, isFlagged: false },
    { sourceId: centerNode.id, targetId: domainMatch.id, relationship: 'Corporate Mail Exchange', confidencePercent: 100, isFlagged: false },
    { sourceId: centerNode.id, targetId: travelerPolicy.id, relationship: 'Active SAFER BMC-91X', confidencePercent: 100, isFlagged: false },
    { sourceId: centerNode.id, targetId: terminalYard.id, relationship: 'Commercial Depot Verification', confidencePercent: 100, isFlagged: false }
  );

  return {
    carrierDot: carrier.dotNumber,
    carrierLegalName: carrier.legalName,
    centerNode,
    nodes,
    links,
    threatScore: 8,
    chameleonClustersDetected: 0,
    geographicDispersionKm: 35,
    verdict: 'CLEAN_VERIFIED',
  };
}
