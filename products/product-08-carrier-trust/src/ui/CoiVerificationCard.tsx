import React from 'react';
import { InsurancePolicy } from '../engine/types';

interface CoiVerificationCardProps {
  policies: InsurancePolicy[];
}

export const CoiVerificationCard: React.FC<CoiVerificationCardProps> = ({ policies }) => {
  const allCompliant = policies.every((p) => p.isCompliant);

  return (
    <div className="safety-card coi-card">
      <div className="card-header">
        <div className="title-with-subtitle">
          <h3>Declared Insurance Policies</h3>
          <span className="subtitle">Seeded scenario evidence evaluated against configured customer policy</span>
        </div>
        <span className={`status-pill ${allCompliant ? 'status-normal' : 'status-critical'}`}>
          {allCompliant ? 'DECLARED POLICY CHECKS PASS' : 'DECLARED COVERAGE DEFICIENT / EXPIRED'}
        </span>
      </div>

      <div className="policies-grid">
        {policies.map((p, idx) => {
          const isExpired = p.daysUntilExpiration <= 0;
          const isExpiringSoon = p.daysUntilExpiration > 0 && p.daysUntilExpiration <= 30;

          return (
            <div
              key={idx}
              className={`policy-item ${!p.isCompliant ? 'deficient' : isExpiringSoon ? 'expiring-soon' : 'verified'}`}
            >
              <div className="policy-type-header">
                <span className="policy-badge">{p.type.replace(/_/g, ' ').toUpperCase()}</span>
                <span className="ambest-rating">A.M. Best: {p.amBestRating}</span>
              </div>

              <div className="policy-limit-row">
                <span className="pol-lbl">COVERAGE LIMIT:</span>
                <strong className="pol-limit-val">
                  ${p.coverageLimitUsd.toLocaleString()}{' '}
                  <span className="required-sub">(Min: ${p.requiredMinimumUsd.toLocaleString()})</span>
                </strong>
              </div>

              <div className="policy-meta-details">
                <div>Underwriter: <strong>{p.underwriter}</strong></div>
                <div>Policy #: <span className="mono-num">{p.policyNumber}</span></div>
                <div>Expires: <strong>{p.expirationDate}</strong></div>
              </div>

              <div className="policy-status-footer">
                {isExpired ? (
                  <span className="tag-expired"> EXPIRED ({Math.abs(p.daysUntilExpiration)} days ago)</span>
                ) : isExpiringSoon ? (
                  <span className="tag-warning">️ EXPIRES IN {p.daysUntilExpiration} DAYS</span>
                ) : p.coverageLimitUsd < p.requiredMinimumUsd ? (
                  <span className="tag-expired"> UNDERINSURED (Below Required Cap)</span>
                ) : (
                  <span className="tag-active">DECLARED POLICY IN DATE</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
