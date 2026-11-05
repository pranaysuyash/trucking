import React, { useState, useEffect } from 'react';
import { CarrierProfile } from '../engine/types';
import {
  generateCarrierRadarGraph,
  polarToCartesian,
  scaleDistanceToRadius,
  RadarNode,
  CarrierRadarGraph,
} from '../engine/chameleonRadar';

interface ChameleonNetworkRadarCanvasProps {
  carrier: CarrierProfile;
  onInspectNode?: (node: RadarNode) => void;
}

export const ChameleonNetworkRadarCanvas: React.FC<ChameleonNetworkRadarCanvasProps> = ({
  carrier,
  onInspectNode,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'CHAMELEON' | 'CYBER' | 'STATUTORY'>('ALL');
  const [sweepSpeed, setSweepSpeed] = useState<number>(1); // 0 = paused, 1 = normal, 2 = fast
  const [sweepAngle, setSweepAngle] = useState<number>(0);

  const graph: CarrierRadarGraph = React.useMemo(() => {
    return generateCarrierRadarGraph(carrier);
  }, [carrier]);

  // Set center node selected by default if nothing selected
  useEffect(() => {
    setSelectedNodeId(graph.centerNode.id);
  }, [carrier.dotNumber, graph.centerNode.id]);

  // Animate the radar sweep line smoothly
  useEffect(() => {
    if (sweepSpeed === 0) return;
    const interval = setInterval(() => {
      setSweepAngle((prev) => (prev + 1.2 * sweepSpeed) % 360);
    }, 25);
    return () => clearInterval(interval);
  }, [sweepSpeed]);

  const centerX = 340;
  const centerY = 260;
  const maxRadius = 220;

  // Filter nodes according to selected mode
  const filteredNodes = graph.nodes.filter((node) => {
    if (node.id === graph.centerNode.id) return true;
    if (filterType === 'ALL') return true;
    if (filterType === 'CHAMELEON') {
      return node.type === 'PHOENIX_ENTITY' || node.type === 'SHARED_ADDRESS';
    }
    if (filterType === 'CYBER') {
      return node.type === 'VOIP_TRUNK' || node.type === 'OFFSHORE_PROXY';
    }
    if (filterType === 'STATUTORY') {
      return node.type === 'INSURANCE_REVOCATION' || node.type === 'FREIGHTGUARD_CLAIM';
    }
    return true;
  });

  const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId) || graph.centerNode;

  // Helper for node coloring
  const getNodeColor = (node: RadarNode): { stroke: string; fill: string; glow: string } => {
    switch (node.riskLevel) {
      case 'CRITICAL':
        return { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.25)', glow: 'rgba(239, 68, 68, 0.6)' };
      case 'HIGH':
        return { stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.25)', glow: 'rgba(249, 115, 22, 0.5)' };
      case 'MODERATE':
        return { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.25)', glow: 'rgba(245, 158, 11, 0.5)' };
      case 'VERIFIED':
      case 'LOW':
      default:
        return { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.25)', glow: 'rgba(16, 185, 129, 0.5)' };
    }
  };

  const sweepVector = polarToCartesian(centerX, centerY, maxRadius, sweepAngle);

  // Sweep gradient wedge (30 deg behind the sweep line)
  const sweepLagVector = polarToCartesian(centerX, centerY, maxRadius, (sweepAngle - 35 + 360) % 360);

  return (
    <div
      className="chameleon-radar-container"
      style={{
        background: 'linear-gradient(180deg, #090e1a 0%, #050811 100%)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: '12px',
        padding: '16px',
        color: '#f8fafc',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        marginTop: '16px',
        position: 'relative',
      }}
    >
      {/* Radar Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '12px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: graph.verdict === 'CRITICAL_FRAUD_LOCKOUT' ? '#ef4444' : graph.verdict === 'ELEVATED_MONITORING' ? '#f59e0b' : '#10b981',
              boxShadow: `0 0 10px ${graph.verdict === 'CRITICAL_FRAUD_LOCKOUT' ? '#ef4444' : '#10b981'}`,
              animation: 'pulse 1.8s infinite',
            }}
          />
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, letterSpacing: '0.5px', color: '#38bdf8' }}>
              📡 CHAMELEON ENTITY & CYBER FRAUD NEXUS RADAR
            </h4>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Graph Topology & Geolocation Dispersion Analysis · 49 U.S.C. § 13902 Antifraud Protocol
            </div>
          </div>
        </div>

        {/* Verdict Badge */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '6px',
              background:
                graph.verdict === 'CRITICAL_FRAUD_LOCKOUT'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : graph.verdict === 'ELEVATED_MONITORING'
                  ? 'rgba(245, 158, 11, 0.2)'
                  : 'rgba(16, 185, 129, 0.2)',
              color:
                graph.verdict === 'CRITICAL_FRAUD_LOCKOUT'
                  ? '#ef4444'
                  : graph.verdict === 'ELEVATED_MONITORING'
                  ? '#f59e0b'
                  : '#10b981',
              border: `1px solid ${
                graph.verdict === 'CRITICAL_FRAUD_LOCKOUT'
                  ? '#ef4444'
                  : graph.verdict === 'ELEVATED_MONITORING'
                  ? '#f59e0b'
                  : '#10b981'
              }`,
            }}
          >
            {graph.verdict === 'CRITICAL_FRAUD_LOCKOUT'
              ? '⛔ CRITICAL FRAUD LOCKOUT'
              : graph.verdict === 'ELEVATED_MONITORING'
              ? '⚠️ ELEVATED MONITORING'
              : '✅ CLEAN IDENTITY NEXUS'}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            THREAT: <strong style={{ color: graph.threatScore > 50 ? '#ef4444' : '#10b981' }}>{graph.threatScore}/100</strong>
          </span>
        </div>
      </div>

      {/* Filter and Sweep Controls Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px',
          fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>NEXUS FILTER:</span>
          {(['ALL', 'CHAMELEON', 'CYBER', 'STATUTORY'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterType(mode)}
              style={{
                background: filterType === mode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: filterType === mode ? '#38bdf8' : '#94a3b8',
                border: filterType === mode ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '4px',
                padding: '3px 8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '10px',
              }}
            >
              {mode === 'ALL' ? 'ALL NODES' : mode}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>SWEEP RATE:</span>
          {[
            { label: 'PAUSE', speed: 0 },
            { label: '1X', speed: 1 },
            { label: '2X', speed: 2 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setSweepSpeed(item.speed)}
              style={{
                background: sweepSpeed === item.speed ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: sweepSpeed === item.speed ? '#38bdf8' : '#94a3b8',
                border: sweepSpeed === item.speed ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '4px',
                padding: '3px 8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '10px',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Radar Scope on Left (SVG) + Forensic Dossier on Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 680px) 1fr',
          gap: '16px',
          alignItems: 'start',
        }}
      >
        {/* Radar Scope SVG */}
        <div
          style={{
            position: 'relative',
            background: 'radial-gradient(circle at 50% 50%, #0d192e 0%, #060a12 100%)',
            borderRadius: '10px',
            border: '1px solid rgba(56, 189, 248, 0.15)',
            overflow: 'hidden',
          }}
        >
          <svg
            viewBox="0 0 680 520"
            style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none' }}
            aria-label="Chameleon Carrier Network Radar Scope"
          >
            <defs>
              {/* Sweep gradient wedge */}
              <linearGradient id="radarSweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>

              {/* Glowing filters for critical threats */}
              <filter id="threatGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Radar Scope Crosshairs */}
            <line x1={centerX - maxRadius - 10} y1={centerY} x2={centerX + maxRadius + 10} y2={centerY} stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1={centerX} y1={centerY - maxRadius - 10} x2={centerX} y2={centerY + maxRadius + 10} stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1" strokeDasharray="3 3" />

            {/* Diagonal Bearing Guideline Grids */}
            {[45, 135, 225, 315].map((deg) => {
              const pt1 = polarToCartesian(centerX, centerY, maxRadius, deg);
              const pt2 = polarToCartesian(centerX, centerY, maxRadius, (deg + 180) % 360);
              return (
                <line
                  key={deg}
                  x1={pt1.x}
                  y1={pt1.y}
                  x2={pt2.x}
                  y2={pt2.y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Concentric Range Rings */}
            {[
              { rKm: 100, label: '100 KM' },
              { rKm: 1000, label: '1,000 KM' },
              { rKm: 4000, label: '4,000 KM' },
              { rKm: 10000, label: '10,000 KM (GLOBAL)' },
            ].map((ring) => {
              const rPx = scaleDistanceToRadius(ring.rKm, maxRadius);
              return (
                <g key={ring.label}>
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={rPx}
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.18)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={centerX + 6}
                    y={centerY - rPx + 12}
                    fill="rgba(56, 189, 248, 0.5)"
                    fontSize="8.5"
                    fontFamily="monospace"
                  >
                    {ring.label}
                  </text>
                </g>
              );
            })}

            {/* Degree Cardinal Annotations */}
            <text x={centerX} y={centerY - maxRadius - 6} fill="#38bdf8" fontSize="9" fontWeight="700" textAnchor="middle">0° N</text>
            <text x={centerX + maxRadius + 16} y={centerY + 3} fill="#38bdf8" fontSize="9" fontWeight="700" textAnchor="start">90° E</text>
            <text x={centerX} y={centerY + maxRadius + 16} fill="#38bdf8" fontSize="9" fontWeight="700" textAnchor="middle">180° S</text>
            <text x={centerX - maxRadius - 16} y={centerY + 3} fill="#38bdf8" fontSize="9" fontWeight="700" textAnchor="end">270° W</text>

            {/* Animated Radar Sweep Cone / Wedge */}
            <path
              d={`M ${centerX} ${centerY} L ${sweepVector.x} ${sweepVector.y} A ${maxRadius} ${maxRadius} 0 0 0 ${sweepLagVector.x} ${sweepLagVector.y} Z`}
              fill="url(#radarSweepGrad)"
            />

            {/* Rotating Sweep Beam */}
            <line
              x1={centerX}
              y1={centerY}
              x2={sweepVector.x}
              y2={sweepVector.y}
              stroke="#38bdf8"
              strokeWidth="2"
              filter="url(#threatGlow)"
            />

            {/* Connection Links */}
            {graph.links.map((link, idx) => {
              const srcNode = graph.nodes.find((n) => n.id === link.sourceId);
              const tgtNode = graph.nodes.find((n) => n.id === link.targetId);
              if (!srcNode || !tgtNode) return null;

              // Only render if target node passes filter
              if (!filteredNodes.some((n) => n.id === tgtNode.id)) return null;

              const srcR = scaleDistanceToRadius(srcNode.distanceKm, maxRadius);
              const tgtR = scaleDistanceToRadius(tgtNode.distanceKm, maxRadius);
              const p1 = polarToCartesian(centerX, centerY, srcR, srcNode.bearingDeg);
              const p2 = polarToCartesian(centerX, centerY, tgtR, tgtNode.bearingDeg);

              return (
                <g key={`link-${idx}`}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={link.isFlagged ? 'rgba(239, 68, 68, 0.6)' : 'rgba(56, 189, 248, 0.4)'}
                    strokeWidth={link.isFlagged ? 1.8 : 1.2}
                    strokeDasharray={link.isFlagged ? '4 3' : '2 2'}
                  />
                  {/* Midpoint relationship tag */}
                  <circle
                    cx={(p1.x + p2.x) / 2}
                    cy={(p1.y + p2.y) / 2}
                    r="2.5"
                    fill={link.isFlagged ? '#ef4444' : '#38bdf8'}
                  />
                </g>
              );
            })}

            {/* Render Nodes */}
            {filteredNodes.map((node) => {
              const rPx = scaleDistanceToRadius(node.distanceKm, maxRadius);
              const { x, y } = polarToCartesian(centerX, centerY, rPx, node.bearingDeg);
              const isSelected = selectedNodeId === node.id;
              const isCenter = node.id === graph.centerNode.id;
              const colors = getNodeColor(node);

              return (
                <g
                  key={node.id}
                  onClick={() => {
                    setSelectedNodeId(node.id);
                    onInspectNode?.(node);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer selection ring */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r={isCenter ? 24 : 18}
                      fill="none"
                      stroke={colors.stroke}
                      strokeWidth="2"
                      strokeDasharray="3 2"
                      style={{ animation: 'spin 8s linear infinite' }}
                    />
                  )}

                  {/* Pulsing glow aura for critical threats */}
                  {node.riskLevel === 'CRITICAL' && (
                    <circle
                      cx={x}
                      cy={y}
                      r={isCenter ? 20 : 14}
                      fill={colors.fill}
                      filter="url(#threatGlow)"
                    />
                  )}

                  {/* Node icon body */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isCenter ? 14 : 9}
                    fill={isCenter ? '#0f172a' : colors.fill}
                    stroke={colors.stroke}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />

                  {/* Center Node icon or glyph */}
                  {isCenter ? (
                    <text
                      x={x}
                      y={y + 4}
                      fill="#fff"
                      fontSize="10"
                      fontWeight="900"
                      textAnchor="middle"
                    >
                      HQ
                    </text>
                  ) : (
                    <circle cx={x} cy={y} r="3" fill={colors.stroke} />
                  )}

                  {/* Node Label Leader Text */}
                  <text
                    x={x}
                    y={y + (isCenter ? 32 : 18)}
                    fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                    fontSize="9"
                    fontWeight={isSelected ? 700 : 500}
                    textAnchor="middle"
                    style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                  >
                    {node.label.length > 24 ? `${node.label.slice(0, 22)}…` : node.label}
                  </text>

                  {/* Sub-label for distance */}
                  {!isCenter && (
                    <text
                      x={x}
                      y={y + 28}
                      fill="#94a3b8"
                      fontSize="7.5"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {node.distanceKm > 0 ? `${node.distanceKm.toLocaleString()} km` : 'Local Terminal'}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Scope Telemetry Overlay Badge (Bottom Left) */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '12px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '10px',
              fontFamily: 'monospace',
              color: '#94a3b8',
              lineHeight: 1.4,
            }}
          >
            <div>SWEEP AZIMUTH: <span style={{ color: '#38bdf8' }}>{sweepAngle.toFixed(1)}°</span></div>
            <div>NODES MAPPED: <span style={{ color: '#fff' }}>{filteredNodes.length} / {graph.nodes.length}</span></div>
            <div>CLUSTER NEXUS: <span style={{ color: graph.chameleonClustersDetected > 0 ? '#ef4444' : '#10b981' }}>{graph.chameleonClustersDetected} Phoenix Clusters</span></div>
          </div>
        </div>

        {/* Forensic Dossier & Node Inspector (Right Side) */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
            <span style={{ fontWeight: 700, color: '#38bdf8' }}>🔬 FORENSIC NODE DOSSIER</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: getNodeColor(selectedNode).fill,
                color: getNodeColor(selectedNode).stroke,
                border: `1px solid ${getNodeColor(selectedNode).stroke}`,
              }}
            >
              {selectedNode.riskLevel}
            </span>
          </div>

          <div>
            <h5 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 700 }}>
              {selectedNode.label}
            </h5>
            {selectedNode.dotOrMc && (
              <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>
                {selectedNode.dotOrMc}
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '6px' }}>
            <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 600 }}>NEXUS CLASSIFICATION:</div>
            <div style={{ color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>{selectedNode.connectionType}</div>
            <div style={{ color: '#cbd5e1', fontSize: '11px', marginTop: '4px', lineHeight: 1.4 }}>
              {selectedNode.details}
            </div>
          </div>

          {/* Evidence Checklist */}
          <div>
            <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.5px' }}>
              DOCUMENTED AUDIT EVIDENCE:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selectedNode.evidence.map((ev, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    fontSize: '11px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    borderLeft: `3px solid ${getNodeColor(selectedNode).stroke}`,
                  }}
                >
                  <span style={{ color: getNodeColor(selectedNode).stroke }}>▸</span>
                  <span style={{ color: '#e2e8f0', lineHeight: 1.35 }}>{ev}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Geographic Dispersion Metric */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
            }}
          >
            <span style={{ color: '#94a3b8' }}>Geographic Radius:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: selectedNode.distanceKm > 2000 ? '#ef4444' : '#10b981' }}>
              {selectedNode.distanceKm.toLocaleString()} KM ({Math.round(selectedNode.distanceKm * 0.621371).toLocaleString()} MILES)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
