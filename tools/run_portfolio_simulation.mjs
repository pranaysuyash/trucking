import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire('/Users/pranay/Projects/pdf_editor/node_modules/');
const { chromium } = require('playwright');

const AXE_PATH = '/opt/homebrew/lib/node_modules/lighthouse/node_modules/axe-core/axe.min.js';
const axeSource = fs.existsSync(AXE_PATH) ? fs.readFileSync(AXE_PATH, 'utf8') : null;

const OUTPUT_DIR = '/Users/pranay/Projects/trucking/docs/audits/visual-evidence/2026-10-21-persona-simulation';
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const PRODUCTS_MAP = {
  'command-center-portal': {
    name: 'Unified Freight Command Center Portal',
    port: 5170,
    url: 'http://localhost:5170',
  },
  'p01-cargo-fit': {
    name: 'Product 01: Cargo Fit & 3D Load Optimization',
    port: 5173,
    url: 'http://localhost:5173',
  },
  'p02-freight-pricing': {
    name: 'Product 02: Freight Pricing & Tactical Dispatch HUD',
    port: 5174,
    url: 'http://localhost:5174',
  },
  'p03-hos-planner': {
    name: 'Product 03: HOS Compliance & Corridor Legality Planner',
    port: 5175,
    url: 'http://localhost:5175',
  },
  'p04-asset-studio': {
    name: 'Product 04: Fleet & Cargo Asset Studio',
    port: 5176,
    url: 'http://localhost:5176',
  },
  'p05-fleet-telematics': {
    name: 'Product 05: Fleet Telematics & Real-Time Tracking HUD',
    port: 5177,
    url: 'http://localhost:5177',
  },
};

const PERSONA_MISSIONS = [
  {
    id: 'PER-950374',
    title: 'Fleet Operations Manager',
    source: 'desktop_canonical',
    mandate: 'Real-world commercial fleet efficiency, turnaround time, driver satisfaction, equipment utilization across all 6 products.',
    simulationMission: 'Audit cross-portfolio end-to-end operational viability, check Fit-to-Quote bridge, telematics stream, and cross-system export continuity.',
    surfaces: [
      { productKey: 'command-center-portal', step: 'portal-overview', hash: '', wait: 1200 },
      { productKey: 'command-center-portal', step: 'edi-hub-x12', hash: '', actions: ['click-edi-hub'], wait: 1000 },
      { productKey: 'p01-cargo-fit', step: 'cargo-manifest', hash: '#/app/cargo', wait: 1000 },
      { productKey: 'p01-cargo-fit', step: 'plan-3d-dock', hash: '#/app/plan', wait: 1500 },
      { productKey: 'p01-cargo-fit', step: 'decision-bridge', hash: '#/app/decision', wait: 1200 },
      { productKey: 'p02-freight-pricing', step: 'hud-overview', hash: '', wait: 1500 },
      { productKey: 'p02-freight-pricing', step: 'rate-confirmation', hash: '', wait: 1000 },
      { productKey: 'p03-hos-planner', step: 'corridor-chicago-dallas', hash: '', wait: 1500 },
      { productKey: 'p04-asset-studio', step: 'catalog-3d-cutaway', hash: '', wait: 1500 },
      { productKey: 'p05-fleet-telematics', step: 'j1939-gauges-live', hash: '', wait: 1500 },
      { productKey: 'p05-fleet-telematics', step: 'dtc-diagnostics', hash: '', wait: 1000 },
    ]
  },
  {
    id: 'PER-0395',
    title: 'Logistics & Supply Chain Systems Architect',
    source: 'desktop_canonical',
    mandate: 'End-to-end data pipelines, equipment spec integrity, Bridge Law axle rules, tare weights, fuel burn physics, Open Logistics Asset Schema.',
    simulationMission: 'Inspect Product 01 3D packing validator & tie-downs; Product 04 digital twin 3D/2.5D/CAD projections, Product 05 telematics bus, and Portal EDI Hub.',
    surfaces: [
      { productKey: 'command-center-portal', step: 'portal-overview', hash: '', wait: 1200 },
      { productKey: 'command-center-portal', step: 'edi-hub-x12', hash: '', actions: ['click-edi-hub'], wait: 1000 },
      { productKey: 'p01-cargo-fit', step: 'equipment-select', hash: '#/app/equipment', wait: 1000 },
      { productKey: 'p01-cargo-fit', step: 'plan-3d-dock', hash: '#/app/plan', wait: 1500 },
      { productKey: 'p01-cargo-fit', step: 'decision-bridge', hash: '#/app/decision', wait: 1200 },
      { productKey: 'p04-asset-studio', step: 'catalog-3d-cutaway', hash: '', wait: 1500 },
      { productKey: 'p04-asset-studio', step: 'blueprint-2d-cad', hash: '', actions: ['view-blueprint'], wait: 1200 },
      { productKey: 'p05-fleet-telematics', step: 'j1939-gauges-live', hash: '', wait: 1500 },
    ]
  },
  {
    id: 'PER-0995',
    title: 'Transport Planner',
    source: 'desktop_canonical',
    mandate: 'Interstate lane routing, multi-stop drop sequencing, dispatch rates, spot market margin calculations, solo vs team hours of service schedules.',
    simulationMission: 'Stress-test Product 02 Tactical Dispatch HUD, Product 03 HOS Planner, and Product 05 Corridor GPS tracking.',
    surfaces: [
      { productKey: 'command-center-portal', step: 'portal-overview', hash: '', wait: 1200 },
      { productKey: 'p02-freight-pricing', step: 'hud-overview', hash: '', wait: 1500 },
      { productKey: 'p02-freight-pricing', step: 'reefer-temp-control', hash: '', actions: ['click-reefer'], wait: 1200 },
      { productKey: 'p02-freight-pricing', step: 'rate-confirmation', hash: '', wait: 1000 },
      { productKey: 'p03-hos-planner', step: 'corridor-chicago-dallas', hash: '', wait: 1500 },
      { productKey: 'p03-hos-planner', step: 'team-driving-mode', hash: '', actions: ['toggle-team'], wait: 1200 },
      { productKey: 'p05-fleet-telematics', step: 'corridor-geofencing', hash: '', wait: 1500 },
    ]
  },
  {
    id: 'PER-0384',
    title: 'Legal & Compliance Workflow Architect',
    source: 'desktop_canonical',
    mandate: 'FMCSA Part 395 regulatory compliance, Federal Bridge Formula B axle weight limits, 49 CFR § 393.102 cargo securement, audit logs.',
    simulationMission: 'Scrutinize HOS compliance engine, Roadside DOT inspection print sheet, ELD 24-hr record of duty status visualization, and FSMA cold-chain excursion logger.',
    surfaces: [
      { productKey: 'command-center-portal', step: 'dispatch-manifest-packet', hash: '', actions: ['click-manifest'], wait: 1000 },
      { productKey: 'p01-cargo-fit', step: 'decision-bridge', hash: '#/app/decision', wait: 1200 },
      { productKey: 'p03-hos-planner', step: 'corridor-chicago-dallas', hash: '', wait: 1500 },
      { productKey: 'p03-hos-planner', step: 'team-driving-mode', hash: '', actions: ['toggle-team'], wait: 1200 },
      { productKey: 'p05-fleet-telematics', step: 'cold-chain-fsma-excursions', hash: '', wait: 1500 },
    ]
  },
  {
    id: 'PER-0080',
    title: 'Accessibility for Spatial & Scientific Interfaces Specialist',
    source: 'desktop_canonical',
    mandate: 'Web accessibility (WCAG 2.1 AA/AAA), keyboard accessibility of complex 3D canvases, color contrast of status badges, screen-reader text alternatives.',
    simulationMission: 'Run full WCAG 2.1 accessibility scans across all 6 services; audit focus indicators, ARIA landmarks, color contrast, and keyboard operability.',
    surfaces: [
      { productKey: 'command-center-portal', step: 'portal-overview', hash: '', wait: 1200 },
      { productKey: 'p01-cargo-fit', step: 'plan-3d-dock', hash: '#/app/plan', wait: 1500 },
      { productKey: 'p02-freight-pricing', step: 'hud-overview', hash: '', wait: 1500 },
      { productKey: 'p03-hos-planner', step: 'corridor-chicago-dallas', hash: '', wait: 1500 },
      { productKey: 'p04-asset-studio', step: 'isometric-projection', hash: '', actions: ['view-isometric'], wait: 1200 },
      { productKey: 'p05-fleet-telematics', step: 'j1939-gauges-live', hash: '', wait: 1500 },
    ]
  },
  {
    id: 'PER-RT-0101',
    title: 'Independent Owner-Operator & Freight Buyer',
    source: 'runtime_saved',
    mandate: 'Evaluate first-impression clarity, zero-onboarding cognitive overhead, quick rate confirmations, mobile readability from a truck cab, and commercial WTP.',
    simulationMission: 'Arrive cold at landing screens, test intuitive discoverability of barcode scanning, rate generation, and truck twin customization without prior training.',
    surfaces: [
      { productKey: 'command-center-portal', step: 'portal-overview', hash: '', wait: 1200 },
      { productKey: 'p01-cargo-fit', step: 'landing', hash: '#/', wait: 1000 },
      { productKey: 'p01-cargo-fit', step: 'cargo-manifest', hash: '#/app/cargo', wait: 1000 },
      { productKey: 'p02-freight-pricing', step: 'hud-overview', hash: '', wait: 1500 },
      { productKey: 'p02-freight-pricing', step: 'rate-confirmation', hash: '', wait: 1000 },
      { productKey: 'p03-hos-planner', step: 'corridor-chicago-dallas', hash: '', wait: 1500 },
      { productKey: 'p04-asset-studio', step: 'catalog-3d-cutaway', hash: '', wait: 1500 },
      { productKey: 'p05-fleet-telematics', step: 'j1939-gauges-live', hash: '', wait: 1500 },
    ]
  },
  {
    id: 'PER-RT-0102',
    title: 'Logistics Adversarial & Boundary Stress Tester',
    source: 'runtime_saved',
    mandate: 'Test extreme inputs, edge cases, zero-division, oversized cargo exceedances, impossible routes, rapid viewport resize, and UI crash resilience.',
    simulationMission: 'Examine all subproducts under stress: extreme cargo rotations, rapid viewport switching, reefer temperature accessorials, team duty switches, CAD viewport collapses.',
    surfaces: [
      { productKey: 'command-center-portal', step: 'portal-overview', hash: '', wait: 1200 },
      { productKey: 'p01-cargo-fit', step: 'plan-3d-dock', hash: '#/app/plan', wait: 1500 },
      { productKey: 'p01-cargo-fit', step: 'decision-bridge', hash: '#/app/decision', wait: 1200 },
      { productKey: 'p02-freight-pricing', step: 'reefer-temp-control', hash: '', actions: ['click-reefer'], wait: 1200 },
      { productKey: 'p03-hos-planner', step: 'team-driving-mode', hash: '', actions: ['toggle-team'], wait: 1200 },
      { productKey: 'p04-asset-studio', step: 'blueprint-2d-cad', hash: '', actions: ['view-blueprint'], wait: 1200 },
      { productKey: 'p05-fleet-telematics', step: 'cold-chain-fsma-excursions', hash: '', wait: 1500 },
    ]
  }
];

async function runAudit() {
  console.log('🚀 Starting Targeted Portfolio Simulation across all 4 products...');
  console.log(`Outputs will be saved to: ${OUTPUT_DIR}`);

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const sessionResults = {
    startedAt: new Date().toISOString(),
    completedAt: null,
    totalPersonas: PERSONA_MISSIONS.length,
    personas: PERSONA_MISSIONS.map(p => ({
      id: p.id,
      title: p.title,
      source: p.source,
      mandate: p.mandate,
      simulationMission: p.simulationMission,
      surfacesCount: p.surfaces.length,
    })),
    surfaces: [],
    axeSummary: {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      totalViolations: 0,
      violationsByProduct: {},
    },
    consoleErrors: [],
  };

  try {
    for (const persona of PERSONA_MISSIONS) {
      console.log(`\n=============================================================`);
      console.log(`👤 Simulating Persona: ${persona.title} (${persona.id})`);
      console.log(`   Mission: ${persona.simulationMission}`);

      for (const surface of persona.surfaces) {
        const prod = PRODUCTS_MAP[surface.productKey];

        for (const vp of VIEWPORTS) {
          const context = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
            userAgent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) PersonaSim/${persona.id}`,
          });

          const page = await context.newPage();
          const pageLogs = [];

          page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
              pageLogs.push({ type: msg.type(), text: msg.text() });
            }
          });
          page.on('pageerror', err => {
            pageLogs.push({ type: 'pageerror', text: err.message });
            sessionResults.consoleErrors.push({
              persona: persona.id,
              product: surface.productKey,
              viewport: vp.name,
              error: err.message,
            });
          });

          const targetUrl = surface.hash ? `${prod.url}/${surface.hash}` : prod.url;
          try {
            await page.goto(targetUrl, { waitUntil: 'load', timeout: 15000 });
            if (surface.wait) await page.waitForTimeout(surface.wait);

            // Execute defined actions
            if (surface.actions) {
              for (const act of surface.actions) {
                if (act === 'click-reefer') {
                  const btn = page.locator('button:has-text("Reefer"), button:has-text("reefer")').first();
                  if (await btn.count() > 0) await btn.click().catch(() => {});
                } else if (act === 'toggle-team') {
                  const btn = page.locator('button:has-text("Team"), button:has-text("Team Driver")').first();
                  if (await btn.count() > 0) await btn.click().catch(() => {});
                } else if (act === 'view-isometric') {
                  const btn = page.locator('button:has-text("Isometric"), button:has-text("2.5D")').first();
                  if (await btn.count() > 0) await btn.click().catch(() => {});
                } else if (act === 'view-blueprint') {
                  const btn = page.locator('button:has-text("Blueprint"), button:has-text("CAD"), button:has-text("2D")').first();
                  if (await btn.count() > 0) await btn.click().catch(() => {});
                } else if (act === 'click-edi-hub') {
                  const btn = page.locator('button:has-text("EDI Transaction Hub")').first();
                  if (await btn.count() > 0) await btn.click().catch(() => {});
                } else if (act === 'click-manifest') {
                  const btn = page.locator('button:has-text("Master VICS BOL"), button:has-text("Print Dispatch Manifest")').first();
                  if (await btn.count() > 0) await btn.click().catch(() => {});
                }
                await page.waitForTimeout(400);
              }
            }

            // Screenshot filename
            const screenshotFilename = `${persona.id}--${surface.productKey}--${surface.step}--${vp.name}.png`;
            const screenshotPath = path.join(OUTPUT_DIR, screenshotFilename);
            await page.screenshot({ path: screenshotPath, fullPage: false });

            // Collect DOM Metrics
            const domMetrics = await page.evaluate(() => {
              return {
                title: document.title,
                headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()).filter(Boolean).slice(0, 5),
                buttonsCount: document.querySelectorAll('button').length,
                inputsCount: document.querySelectorAll('input, select, textarea').length,
                canvasesCount: document.querySelectorAll('canvas').length,
                svgCount: document.querySelectorAll('svg').length,
                hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
              };
            });

            // Run Axe accessibility scan
            let axeResults = { violations: [] };
            if (axeSource) {
              try {
                await page.evaluate(axeSource);
                axeResults = await page.evaluate(async () => {
                  // @ts-ignore
                  return await axe.run(document, {
                    runOnly: {
                      type: 'tag',
                      values: ['wcag2a', 'wcag2aa', 'best-practice']
                    }
                  });
                });
              } catch (axeErr) {
                console.warn(`    ⚠️ Axe scan error on ${surface.step}: ${axeErr.message}`);
              }
            }

            // Tally axe violations
            const violationsList = (axeResults.violations || []).map(v => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              help: v.help,
              helpUrl: v.helpUrl,
              nodesCount: v.nodes.length,
              targetSample: v.nodes[0]?.target?.join(' ') || '',
            }));

            for (const v of violationsList) {
              if (v.impact === 'critical') sessionResults.axeSummary.critical++;
              else if (v.impact === 'serious') sessionResults.axeSummary.serious++;
              else if (v.impact === 'moderate') sessionResults.axeSummary.moderate++;
              else if (v.impact === 'minor') sessionResults.axeSummary.minor++;
              sessionResults.axeSummary.totalViolations++;

              sessionResults.axeSummary.violationsByProduct[surface.productKey] =
                (sessionResults.axeSummary.violationsByProduct[surface.productKey] || 0) + 1;
            }

            sessionResults.surfaces.push({
              personaId: persona.id,
              personaTitle: persona.title,
              productKey: surface.productKey,
              productName: prod.name,
              step: surface.step,
              viewport: vp.name,
              screenshot: screenshotFilename,
              title: domMetrics.title,
              domMetrics,
              logs: pageLogs,
              axeViolations: violationsList,
            });

            console.log(`    📸 Captured ${surface.productKey} [${surface.step} | ${vp.name}] -> ${screenshotFilename} (Axe: ${violationsList.length})`);
          } catch (err) {
            console.error(`    ❌ Error capturing ${surface.productKey} [${surface.step} | ${vp.name}]:`, err.message);
          } finally {
            await context.close();
          }
        }
      }
    }
  } finally {
    await browser.close();
  }

  sessionResults.completedAt = new Date().toISOString();
  const summaryPath = path.join(OUTPUT_DIR, 'simulation-results.json');
  fs.writeFileSync(summaryPath, JSON.stringify(sessionResults, null, 2));
  console.log(`\n🎉 Full Portfolio Simulation Complete! Captured ${sessionResults.surfaces.length} surfaces. Results written to: ${summaryPath}`);
}

runAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
