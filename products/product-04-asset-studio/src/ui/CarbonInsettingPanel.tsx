import { useState, useMemo } from 'react';
import {
  calculateCarbonFootprint,
  GLEC_EMISSION_FACTORS,
  type FuelEnergyType,
} from '../engine/glec';

interface CarbonInsettingProps {
  defaultMiles?: number;
  vehicleName?: string;
}

export function CarbonInsettingPanel({
  defaultMiles = 750,
  vehicleName = 'Class 8 Sleeper + 53ft Dry Van',
}: CarbonInsettingProps) {
  const [loadedMiles, setLoadedMiles] = useState<number>(defaultMiles);
  const [deadheadMiles, setDeadheadMiles] = useState<number>(85);
  const [payloadTons, setPayloadTons] = useState<number>(22.5); // ~45,000 lbs
  const [mpg, setMpg] = useState<number>(6.5);
  const [selectedFuel, setSelectedFuel] = useState<FuelEnergyType>('hvo100');
  const [isReefer, setIsReefer] = useState<boolean>(false);
  const [reeferHours, setReeferHours] = useState<number>(14);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);

  const footprint = useMemo(() => {
    return calculateCarbonFootprint({
      loadedMiles,
      emptyDeadheadMiles: deadheadMiles,
      cargoPayloadTons: payloadTons,
      fuelEconomyMpg: selectedFuel === 'battery_electric' ? 2.1 : mpg,
      selectedFuel,
      isReeferActive: isReefer,
      reeferHours: isReefer ? reeferHours : 0,
    });
  }, [loadedMiles, deadheadMiles, payloadTons, mpg, selectedFuel, isReefer, reeferHours]);

  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <div className="panel-h" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <b>GLEC Framework v3.0 Carbon Insetting Scenario Estimator</b>
          <span style={{ marginLeft: 10, fontSize: 12, color: '#94a3b8' }}>
            Indicative Scope 1 &amp; Scope 3 Decarbonization Modeling
          </span>
        </div>
        <button
          onClick={() => setShowCertificate(true)}
          style={{
            background: 'linear-gradient(135deg, #059669, #10b981)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Generate Scenario Summary
        </button>
      </div>

      {/* Input Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, padding: '14px 0', borderBottom: '1px solid #1e293b' }}>
        <label className="field">
          Loaded Miles
          <input
            type="number"
            min={1}
            value={loadedMiles}
            onChange={(e) => setLoadedMiles(Math.max(1, Number(e.target.value)))}
          />
        </label>
        <label className="field">
          Empty Deadhead Miles
          <input
            type="number"
            min={0}
            value={deadheadMiles}
            onChange={(e) => setDeadheadMiles(Math.max(0, Number(e.target.value)))}
          />
        </label>
        <label className="field">
          Cargo Payload (Short Tons)
          <input
            type="number"
            step="0.5"
            min={0.1}
            value={payloadTons}
            onChange={(e) => setPayloadTons(Math.max(0.1, Number(e.target.value)))}
          />
        </label>
        <label className="field">
          Fuel / Energy Vector
          <select
            value={selectedFuel}
            onChange={(e) => setSelectedFuel(e.target.value as FuelEnergyType)}
          >
            {Object.entries(GLEC_EMISSION_FACTORS).map(([key, f]) => (
              <option key={key} value={key}>
                {f.name} {f.co2ReductionVsDieselPct > 0 ? `(-${f.co2ReductionVsDieselPct}%)` : ''}
              </option>
            ))}
          </select>
        </label>
        {selectedFuel !== 'battery_electric' && (
          <label className="field">
            Fuel Economy (MPG)
            <input
              type="number"
              step="0.1"
              min={1}
              value={mpg}
              onChange={(e) => setMpg(Math.max(1, Number(e.target.value)))}
            />
          </label>
        )}
      </div>

      {/* Auxiliary Reefer Controls */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#cbd5e1' }}>
          <input
            type="checkbox"
            checked={isReefer}
            onChange={(e) => setIsReefer(e.target.checked)}
          />
          <span>Include Auxiliary Reefer Unit Fuel (0.6 gal/hr)</span>
        </label>
        {isReefer && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
            Operating Hours:
            <input
              type="number"
              min={1}
              value={reeferHours}
              onChange={(e) => setReeferHours(Math.max(1, Number(e.target.value)))}
              style={{ width: 60, padding: '2px 6px', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#fff' }}
            />
          </label>
        )}
      </div>

      {/* Results Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, margin: '16px 0' }}>
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Scope 3 Avoided CO₂e</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
            -{footprint.avoidedScope3KgCO2e.toLocaleString()} kg
          </div>
          <div style={{ fontSize: 12, color: '#34d399', marginTop: 2 }}>
            {footprint.insettingReductionPct}% Insetting Savings
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Well-to-Wheel (WTW)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
            {footprint.wtwKgCO2e.toLocaleString()} kg
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            Tailpipe (TTW): {footprint.ttwKgCO2e} kg · Upstream (WTT): {footprint.wttKgCO2e} kg
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Carbon Intensity</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#38bdf8', marginTop: 4 }}>
            {footprint.gramsCO2ePerTonMile}
            <span style={{ fontSize: 13, fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>g/ton-mile</span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            {footprint.gramsCO2ePerTonneKm} gCO₂e / tonne-km
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Emissions Scenario Tier</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: footprint.insettingReductionPct >= 50 ? '#10b981' : '#f59e0b', marginTop: 8 }}>
            {footprint.indicativeScenarioCategory}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
            Standard: {footprint.verificationStandard}
          </div>
        </div>
      </div>

      {/* Comparison Progress Bar */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
          <span>Emissions vs Fossil Diesel Baseline ({footprint.baselineDieselWtwKgCO2e.toLocaleString()} kg CO₂e)</span>
          <span style={{ color: '#10b981', fontWeight: 600 }}>{footprint.insettingReductionPct}% Cleaner</span>
        </div>
        <div style={{ height: 12, background: '#334155', borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
          <div
            style={{
              width: `${Math.max(2, 100 - footprint.insettingReductionPct)}%`,
              background: footprint.insettingReductionPct > 50 ? '#10b981' : '#38bdf8',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Printable Insetting Certificate Modal */}
      {showCertificate && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#090d16',
              border: '2px solid #059669',
              borderRadius: 12,
              padding: 28,
              maxWidth: 620,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #1e293b', paddingBottom: 14 }}>
              <div>
                <div style={{ color: '#10b981', fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>INDICATIVE ESG SCENARIO ESTIMATE</div>
                <h3 style={{ margin: '4px 0', fontSize: 18, color: '#f8fafc' }}>Carbon Insetting Scenario Summary</h3>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Aligned with GLEC Framework v3.0 Methodology</div>
              </div>
              <button
                onClick={() => setShowCertificate(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}
              >Close</button>
            </div>

            <div style={{ padding: '16px 0', fontSize: 13, lineHeight: 1.6, color: '#cbd5e1' }}>
              <p>
                This certifies that the freight movement with equipment <b>{vehicleName}</b> over a total distance of <b>{footprint.totalMiles} miles</b> ({loadedMiles} loaded + {deadheadMiles} empty) carrying <b>{payloadTons} short tons</b> ({footprint.totalPayloadTonMiles.toLocaleString()} ton-miles) utilized <b>{footprint.fuelName}</b>.
              </p>
              
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 12, margin: '14px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Baseline Fossil Diesel WTW:</span>
                  <b>{footprint.baselineDieselWtwKgCO2e.toLocaleString()} kg CO₂e</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Actual Route Footprint WTW:</span>
                  <b style={{ color: '#10b981' }}>{footprint.wtwKgCO2e.toLocaleString()} kg CO₂e</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: 6, marginTop: 6 }}>
                  <span>Net Estimated Avoided Emissions:</span>
                  <b style={{ color: '#34d399', fontSize: 15 }}>-{footprint.avoidedScope3KgCO2e.toLocaleString()} kg CO₂e ({footprint.insettingReductionPct}%)</b>
                </div>
              </div>

              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
                Batch Tracking ID: <code>GLEC-SCENARIO-{Math.abs(footprint.totalPayloadTonMiles)}-{Date.now().toString(36).toUpperCase()}</code><br />
                Scenario Classification: <b>{footprint.indicativeScenarioCategory}</b><br />
                <span style={{ fontSize: 10, color: '#94a3b8' }}>
                  * Indicative calculation based on GLEC v3.0 default factors. Does not constitute third-party ISO 14083 certification or official EPA SmartWay recognition.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <button
                onClick={() => window.print()}
                style={{
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid #475569',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Print Certificate
              </button>
              <button
                onClick={() => setShowCertificate(false)}
                style={{
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
