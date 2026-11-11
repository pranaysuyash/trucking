import React from 'react';
import { DispatchEligibility } from '../engine/types';

interface CarrierScoreDialProps {
  score: number;
  eligibility: DispatchEligibility;
  safetyRating: string;
}

export const CarrierScoreDial: React.FC<CarrierScoreDialProps> = ({
  score,
  eligibility,
  safetyRating,
}) => {
  const pct = Math.min(100, Math.max(0, score));

  // Determine score color
  let dialColor = '#10b981'; // Green (Preferred)
  if (eligibility === 'BLOCKED_DO_NOT_DISPATCH') dialColor = '#ef4444'; // Red (DND)
  else if (score < 75 || eligibility === 'CONDITIONAL_REVIEW') dialColor = '#f59e0b'; // Amber (Review)
  else if (score < 90) dialColor = '#38bdf8'; // Cyan (Standard)

  return (
    <div className="safety-card dial-card">
      <div className="card-header">
        <h3>️ Scenario Carrier Safety Score</h3>
        <span className={`eligibility-badge ${eligibility}`}>
          {eligibility.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="dial-container">
        <div className="dial-graphic-box">
          <svg viewBox="0 0 120 120" className="dial-svg">
            {/* Background track */}
            <circle cx="60" cy="60" r="48" className="dial-bg-circle" />
            {/* Progress arc (270 degrees = 301.6 circumference) */}
            <circle
              cx="60"
              cy="60"
              r="48"
              className="dial-fill-circle"
              style={{
                strokeDasharray: '301.6',
                strokeDashoffset: 301.6 - (301.6 * (pct * 0.75)) / 100,
                stroke: dialColor,
              }}
            />
          </svg>
          <div className="dial-content-center">
            <span className="score-num" style={{ color: dialColor }}>{score}</span>
            <span className="score-denom">/ 100</span>
          </div>
        </div>

        <div className="dial-meta-column">
          <div className="meta-row">
            <span className="meta-lbl">SAMPLE SAFETY RATING:</span>
            <strong className={`rating-tag ${safetyRating.toLowerCase()}`}>
              {safetyRating}
            </strong>
          </div>
          <div className="meta-row">
            <span className="meta-lbl">SCENARIO OUTCOME:</span>
            <strong style={{ color: dialColor }}>
              {eligibility === 'APPROVED' ? 'Scenario policy passes' : eligibility === 'CONDITIONAL_REVIEW' ? 'Scenario review required' : 'Scenario blocked'}
            </strong>
          </div>
          <div className="meta-row">
            <span className="meta-lbl">SAFETY TIER:</span>
            <span>{score >= 90 ? 'Tier 1 (Preferred Carrier)' : score >= 75 ? 'Tier 2 (Standard Commercial)' : score >= 50 ? 'Tier 3 (Conditional Risk)' : 'Tier 4 (High Liability Risk)'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
