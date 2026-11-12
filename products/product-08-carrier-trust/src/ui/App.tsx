import { useState, useMemo, useEffect } from 'react';
import { INITIAL_CARRIERS } from '../engine/carriers';
import { CarrierProfile } from '../engine/types';
import { platformBus } from '../engine/platformBus';
import {
  buildPricingSafetyBridgeUrl,
  buildHosSafetyBridgeUrl,
  buildCommandCenterSafetyBridgeUrl,
} from '../engine/bridges';
import { CarrierScoreDial } from './CarrierScoreDial';
import { BasicPercentilesGrid } from './BasicPercentilesGrid';
import { CoiVerificationCard } from './CoiVerificationCard';
import { FraudRiskRadar } from './FraudRiskRadar';
import { ChameleonNetworkRadarCanvas } from './ChameleonNetworkRadarCanvas';
import { StepUpVerificationModal, type StepUpAuditReceipt } from './StepUpVerificationModal';
import { DriverQualificationModal } from './DriverQualificationModal';
import { FreightGuardModal } from './FreightGuardModal';
import { SuiteDock } from './SuiteDock';
import { useShipmentSession } from '../suite/ShipmentSession';
import { useShipmentDraft } from '../suite/useShipmentDraft';
import { StructuredValue } from '../suite/ShipmentInspector';
import { carrierForShipment, resultForCarrier, reviewCarrier, type CarrierDraft } from '../engine/shipmentAdapter';

export function App() {
  const session = useShipmentSession();
  const [selection, setSelection] = useState<CarrierDraft>(() => ({ carrierDot: INITIAL_CARRIERS[0].dotNumber, review: reviewCarrier(INITIAL_CARRIERS[0].dotNumber) }));
  const [clock, setClock] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 30000); return () => window.clearInterval(timer); }, []);
  const [publicationMessage, setPublicationMessage] = useState('');
  const [carriers] = useState<CarrierProfile[]>(INITIAL_CARRIERS);
  const selectedDot = selection.carrierDot;
  const setSelectedDot = (carrierDot: string) => { setSelection({ carrierDot, review: reviewCarrier(carrierDot) }); setPublicationMessage(''); };
  const draft = useShipmentDraft({ value: selection, importValue: carrierForShipment, applyValue: next => { setSelection(next); setPublicationMessage(''); } });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isStepUpOpen, setIsStepUpOpen] = useState(false);
  const [isDqfOpen, setIsDqfOpen] = useState(false);
  const [isFreightGuardOpen, setIsFreightGuardOpen] = useState(false);
  const [verifiedDots, setVerifiedDots] = useState<Record<string, StepUpAuditReceipt>>({});

  const activeCarrier = useMemo(() => {
    return selection.review?.profile ?? null;
  }, [selection]);

  useEffect(() => {
    if (!activeCarrier) return;
    platformBus.publish('CARRIER_SCENARIO_REVIEWED', { dotNumber: activeCarrier.dotNumber, eligibility: activeCarrier.dispatchEligibility, evidenceSource: 'seeded_scenario', timestamp: new Date().toISOString() });
  }, [activeCarrier]);
  const reviewed = useMemo(() => {
    if (!session?.shipment) return null;
    try { return { result: resultForCarrier(session.shipment, selection), error: '' }; }
    catch (error) { return { result: null, error: error instanceof Error ? error.message : 'Carrier evidence cannot be published.' }; }
  }, [session?.shipment, selection, clock]);

  const filteredCarriers = useMemo(() => {
    if (!searchQuery.trim()) return carriers;
    const q = searchQuery.toLowerCase();
    return carriers.filter(
      (c) =>
        c.legalName.toLowerCase().includes(q) ||
        c.dotNumber.includes(q) ||
        c.mcNumber.includes(q)
    );
  }, [carriers, searchQuery]);

  const p02Url = session?.selectedId ? session.productUrl('product-02-freight-pricing') : activeCarrier ? buildPricingSafetyBridgeUrl(activeCarrier) : '#';
  const p03Url = session?.selectedId ? session.productUrl('product-03-hos-planner') : activeCarrier ? buildHosSafetyBridgeUrl(activeCarrier) : '#';
  const portalUrl = session?.selectedId ? session.productUrl('command-center-portal') : activeCarrier ? buildCommandCenterSafetyBridgeUrl(activeCarrier) : '#';

  return (
    <div className="safety-app-root">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <SuiteDock currentProductId="product-08-carrier-trust" />
      {session?.selectedId && <section className="shipment-native-panel" aria-label="Shipment carrier task">
        <div className="shipment-native-heading"><div><span className="shipment-native-kicker">CARRIER POLICY DECISION</span><h2>{activeCarrier?.legalName ?? `Unknown DOT ${selectedDot}`}</h2></div><span>{draft.dirty ? 'Local carrier review changed' : 'Reviewed shared carrier'}</span></div>
        <p>{selection.review ? `${selection.review.audit.dispatchEligibility} · reviewed ${selection.review.evaluatedAt} · scenario evidence expires ${selection.review.expiresAt}` : 'No profile or approval is inferred for this identity.'}</p>
        <p>Changing the carrier requires pricing review. This observation uses the explicit seeded roster and configured customer policy; it does not verify a live carrier or insurer.</p>
        <div className="shipment-task-buttons">
          <button className="shipment-primary" disabled={!draft.canPublish || !reviewed?.result} onClick={async () => { if (!reviewed?.result || !draft.basis) return; const next = await session.submit('carrier.publish', { carrierDot: selectedDot, result: reviewed.result }, draft.basis.revision); if (next) { draft.acknowledge(next, selection); setPublicationMessage('Exact reviewed carrier profile, policy audit and observation expiry saved.'); } }}>Publish reviewed carrier policy</button>
          <button onClick={() => session.inspect('stage:carrier')}>Saved carrier details</button>
          <button onClick={() => setSelectedDot(selectedDot)}>Refresh scenario evidence</button>
          <button disabled={session.busy || !session.online} onClick={draft.loadCurrent}>Load current shared inputs</button>
          <a href={session.productUrl('command-center-portal')}>Review dispatch readiness</a>
        </div>
        <p role="status">{session.shipment?.status !== 'draft' ? 'Planning is locked after dispatch. Saved policy evidence remains inspectable; local review does not change it.' : draft.incoming ? 'The shipment changed. Your local carrier review is retained. Load current shared inputs before publishing.' : draft.error || reviewed?.error || publicationMessage || (session.online ? 'Review the exact policy outcome before publication. A blocked decision remains blocked.' : 'Offline local review. Reconnect and load shared inputs before publishing.')}</p>
        <details className="shipment-draft-fields"><summary>Reviewed carrier, policy, audit and evidence source</summary><StructuredValue value={reviewed?.result?.details ?? selection} /></details>
      </section>}
      {!session?.selectedId && <p className="native-local-note">{draft.detached ? 'Detached local carrier review. The profile is retained; edits do not update a shipment.' : 'Independent carrier scenario review. Search, roster and customer-policy calculations work without a shared shipment.'}</p>}
      <p style={{ padding: '12px 20px' }}>Scenario carrier review: authority, insurance and risk fields below are seeded examples evaluated against customer policy. They are not live verification or independent fraud findings.</p>

      {/* Main Header */}
      <header className="safety-top-nav">
        <div className="nav-title-group">
          <span className="platform-tag">TRUCKING PLATFORM</span>
          <h1 className="brand-title">Product 08 — Carrier Trust & Anti-Fraud Shield</h1>
        </div>

        <nav aria-label="Platform Bridges" className="nav-bridges">
          <a href={session?.selectedId ? session.productUrl('command-center-portal') : 'http://localhost:5170'} className="nav-link" target="_blank" rel="noopener noreferrer">
            <span className="dot dot-portal" /> Command Center (5170)
          </a>
          <a href={session?.selectedId ? session.productUrl('product-02-freight-pricing') : 'http://localhost:5174'} className="nav-link" target="_blank" rel="noopener noreferrer">
            <span className="dot dot-p02" /> P02 Pricing (5174)
          </a>
          <a href={session?.selectedId ? session.productUrl('product-03-hos-planner') : 'http://localhost:5175'} className="nav-link" target="_blank" rel="noopener noreferrer">
            <span className="dot dot-p03" /> P03 HOS (5175)
          </a>
          <a href={session?.selectedId ? session.productUrl('product-08-carrier-trust') : 'http://localhost:5180'} className="nav-link active" target="_blank" rel="noopener noreferrer">
            <span className="dot dot-p06" /> P08 Carrier Trust (5180)
          </a>
        </nav>
      </header>

      {/* Content Wrap */}
      <main id="main-content" className="safety-content-wrap" tabIndex={-1}>
        {/* Carrier Search & Selector Bar */}
        <div className="carrier-selector-bar">
          <div className="selector-left">
            <span className="bar-label">CARRIER PROFILE:</span>
            <div className="carrier-pills">
              {filteredCarriers.map((c) => (
                <button
                  key={c.dotNumber}
                  className={`btn-carrier-pill ${c.dotNumber === selectedDot ? 'active' : ''}`}
                  onClick={() => setSelectedDot(c.dotNumber)}
                >
                  <span className="pill-name">{c.legalName}</span>
                  <span className="pill-dot">DOT #{c.dotNumber}</span>
                  <span className={`pill-status-dot ${c.dispatchEligibility}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="selector-right">
            <input
              type="text"
              aria-label="Search carrier by DOT, MC or name"
              placeholder="Search DOT #, MC #, or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="carrier-search-input"
            />
          </div>
        </div>

        {activeCarrier ? <>
        {/* Carrier Details & Identity Banner */}
        <div className="carrier-identity-banner">
          <div className="id-col main-info">
            <span className="col-label">LEGAL CARRIER ENTITY</span>
            <h2 className="entity-name">{activeCarrier.legalName}</h2>
            <div className="entity-ids">
              <span>USDOT: <strong>{activeCarrier.dotNumber}</strong></span>
              <span>MC / FF: <strong>{activeCarrier.mcNumber}</strong></span>
              <span>MCS-150: {activeCarrier.mcs150Date}</span>
            </div>
            <div className="entity-address">
              {activeCarrier.physicalAddress}, {activeCarrier.city}, {activeCarrier.state} {activeCarrier.zip}
            </div>
          </div>

          <div className="id-col fleet-info">
            <span className="col-label">EQUIPMENT & FLEET SIZE</span>
            <div className="fleet-stat-row">
              <div>Power Units: <strong>{activeCarrier.powerUnitCount}</strong></div>
              <div>CDL Drivers: <strong>{activeCarrier.driverCount}</strong></div>
            </div>
            <div style={{ marginTop: '8px' }}>
              Operating Authority: <strong style={{ color: activeCarrier.operatingAuthority === 'AUTHORIZED_FOR_HIRE' ? '#10b981' : '#ef4444' }}>{activeCarrier.operatingAuthority}</strong>
            </div>
          </div>

          <div className="id-col cross-bridges">
            <span className="col-label">DISPATCH GATES & CROSS BRIDGES</span>
            <div className="bridge-btn-group">
              <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="btn-cross portal">
                Orchestrate in Portal (5170) ↗
              </a>
              <a href={p02Url} target="_blank" rel="noopener noreferrer" className="btn-cross p02">
                Lock Rate in Pricing (5174) ↗
              </a>
              <a href={p03Url} target="_blank" rel="noopener noreferrer" className="btn-cross p03">
                Audit Driver HOS (5175) ↗
              </a>
              <button
                type="button"
                onClick={() => setIsDqfOpen(true)}
                className="btn-cross p03"
                style={{ cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(56, 189, 248, 0.4)', background: '#1e293b', color: '#38bdf8' }}
              >
                Driver DQF &amp; Clearinghouse
              </button>
              <button
                type="button"
                onClick={() => setIsFreightGuardOpen(true)}
                className="btn-cross p03"
                style={{ cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.4)', background: '#1e293b', color: '#fca5a5' }}
              >
                FreightGuard Incidents
              </button>
            </div>
          </div>
        </div>

        {/* Audit Blockers or Warnings Banner */}
        {activeCarrier.blockers.length > 0 && (
          <div className="audit-banner blockers">
            <strong> SCENARIO BLOCKERS:</strong>
            <ul>
              {activeCarrier.blockers.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        {activeCarrier.warnings.length > 0 && activeCarrier.blockers.length === 0 && (
          <div className="audit-banner warnings">
            <strong> SCENARIO REVIEW WARNINGS:</strong>
            <ul>
              {activeCarrier.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Primary Safety HUD Grid */}
        <div className="safety-grid">
          {/* Composite Safety Dial */}
          <CarrierScoreDial
            score={activeCarrier.compositeSafetyScore}
            eligibility={activeCarrier.dispatchEligibility}
            safetyRating={activeCarrier.safetyRating}
          />

          {/* Certificate of Insurance (COI) */}
          <CoiVerificationCard policies={activeCarrier.insurancePolicies} />

          {/* SMS BASIC Percentiles */}
          <BasicPercentilesGrid basics={activeCarrier.basics} />

          {/* Fraud & Double Brokering Radar */}
          <FraudRiskRadar
            fraud={activeCarrier.fraudIndicators}
            authority={activeCarrier.operatingAuthority}
            powerUnits={activeCarrier.powerUnitCount}
            drivers={activeCarrier.driverCount}
            contact={activeCarrier.fraudIndicators.contactSecurity}
            filings={activeCarrier.authorityFilings}
            onInitiateStepUp={() => setIsStepUpOpen(true)}
            stepUpVerified={Boolean(verifiedDots[activeCarrier.dotNumber])}
          />
        </div>

        {/* Chameleon Carrier Network Clusters & Cyber Fraud Nexus Radar Scope */}
        <ChameleonNetworkRadarCanvas carrier={activeCarrier} />

        {/* Tier-3 Step-Up Verification Modal */}
        {isStepUpOpen && <StepUpVerificationModal
          carrier={activeCarrier}
          isOpen={isStepUpOpen}
          onClose={() => setIsStepUpOpen(false)}
          onVerified={(receipt) => {
            setVerifiedDots((prev) => ({ ...prev, [receipt.dotNumber]: receipt }));
          }}
        />}

        {/* Driver qualification scenario */}
        {isDqfOpen && <DriverQualificationModal
          carrierDot={activeCarrier.dotNumber}
          carrierName={activeCarrier.legalName}
          isOpen={isDqfOpen}
          onClose={() => setIsDqfOpen(false)}
        />}

        {/* FreightGuard Incident Exchange */}
        {isFreightGuardOpen && <FreightGuardModal
          isOpen={isFreightGuardOpen}
          onClose={() => setIsFreightGuardOpen(false)}
          carrierDot={activeCarrier.dotNumber}
          carrierName={activeCarrier.legalName}
        />}
        </> : <section className="audit-banner blockers" role="status"><h2>Carrier identity unresolved</h2><p>DOT {selectedDot} is absent from the explicit scenario roster. No other carrier profile is substituted. Choose a listed profile to review its declared policy evidence.</p></section>}
      </main>
    </div>
  );
}
