import React from 'react';
import { BasicScore } from '../engine/types';

interface BasicPercentilesGridProps {
  basics: BasicScore[];
}

export const BasicPercentilesGrid: React.FC<BasicPercentilesGridProps> = ({ basics }) => {
  return (
    <div className="safety-card basics-card">
      <div className="card-header">
        <div className="title-with-subtitle">
          <h3> FMCSA Safety Measurement System (SMS) BASICs</h3>
          <span className="subtitle">Behavior Analysis and Safety Improvement Categories</span>
        </div>
        <span className="badge-threshold-info">Intervention Threshold: 65% / 80%</span>
      </div>

      <div className="basics-list">
        {basics.map((b) => {
          const isBreach = b.exceedsThreshold;
          let barColor = '#10b981'; // Green
          if (b.percentile >= b.interventionThreshold) barColor = '#ef4444'; // Red
          else if (b.percentile >= b.interventionThreshold - 15) barColor = '#f59e0b'; // Amber

          return (
            <div key={b.code} className={`basic-row ${isBreach ? 'breach' : ''}`}>
              <div className="basic-info-row">
                <span className="basic-name">
                  {b.name}
                  {isBreach && <span className="breach-pill">️ ALERT</span>}
                </span>
                <span className="basic-val" style={{ color: barColor }}>
                  <strong>{b.percentile}%</strong> <span className="threshold-sub">/ {b.interventionThreshold}% cap</span>
                </span>
              </div>

              <div className="basic-track">
                {/* Intervention Threshold Indicator Marker */}
                <div
                  className="threshold-marker"
                  style={{ left: `${b.interventionThreshold}%` }}
                  title={`Intervention Threshold: ${b.interventionThreshold}%`}
                />
                {/* Percentile bar */}
                <div
                  className="basic-bar-fill"
                  style={{
                    width: `${Math.min(100, b.percentile)}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>

              <div className="basic-violations-sub">
                <span>Violations (24 Mo): <strong>{b.totalViolations}</strong></span>
                <span>Acute/Critical: <strong>{b.seriousViolations}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
