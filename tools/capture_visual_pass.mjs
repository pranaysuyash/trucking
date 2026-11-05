import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire('/Users/pranay/Projects/pdf_editor/node_modules/');
const { chromium } = require('playwright');

const OUTPUT_DIR = '/Users/pranay/Projects/trucking/docs/audits/visual-evidence/2026-10-24-post-remediation';
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const TARGETS = [
  {
    id: 'command-center-portal',
    name: 'Command Center Portal',
    url: 'http://127.0.0.1:5170/',
    wait: 2000,
  },
  {
    id: 'portal-platform-event-stream',
    name: 'Command Center Portal (Cross-Tab Platform Mesh Stream Modal)',
    url: 'http://127.0.0.1:5170/',
    wait: 2000,
    action: async (page) => {
      const btn = await page.$('button:has-text("Mesh Stream")');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(600);
      }
    },
  },
  {
    id: 'p01-cargo-fit',
    name: 'Product 01 Cargo Fit (Architectural Drafting & 3D Load Plan)',
    url: 'http://127.0.0.1:5173/#/app/plan',
    wait: 2500,
  },
  {
    id: 'p01-nmfc-classification',
    name: 'Product 01 Cargo Fit (NMFC Freight Density & LTL Class Advisor)',
    url: 'http://127.0.0.1:5173/#/app/plan',
    wait: 2500,
    action: async (page) => {
      const btn = await page.$('button:has-text("Class Advisor")');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(600);
      }
    },
  },
  {
    id: 'p01-cargo-fit-tandem',
    name: 'Product 01 Cargo Fit (Trailer Tandem Pin Slider Modal)',
    url: 'http://127.0.0.1:5173/#/app/plan',
    wait: 2500,
    action: async (page) => {
      const btn = await page.$('button:has-text("Adjust Pins")');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(600);
      }
    },
  },
  {
    id: 'p02-freight-pricing',
    name: 'Product 02 Freight Pricing HUD with Broker Margin Ledger',
    url: 'http://127.0.0.1:5174/',
    wait: 2000,
  },
  {
    id: 'p02-freight-pricing-accessorial',
    name: 'Product 02 Freight Pricing (Accessorial Schedule Modal)',
    url: 'http://127.0.0.1:5174/',
    wait: 2000,
    action: async (page) => {
      const btn = await page.$('button:has-text("Schedule")');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(600);
      }
    },
  },
  {
    id: 'p02-freight-pricing-weigh-stations',
    name: 'Product 02 Freight Pricing (Weigh Stations & Axle Fuel Burn Compliance)',
    url: 'http://127.0.0.1:5174/',
    wait: 2000,
    action: async (page) => {
      const btn = await page.$('button:has-text("Weigh Stations")');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(600);
      }
    },
  },
  {
    id: 'p02-factoring-quickpay',
    name: 'Product 02 Freight Pricing (QuickPay & Factoring Settlement Modal)',
    url: 'http://127.0.0.1:5174/',
    wait: 2000,
    action: async (page) => {
      const btn = await page.$('button:has-text("QuickPay")');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(600);
      }
    },
  },
  {
    id: 'p03-hos-planner',
    name: 'Product 03 HOS 24-hr ELD Logbook',
    url: 'http://127.0.0.1:5175/',
    wait: 2000,
  },
  {
    id: 'p03-split-sleeper',
    name: 'Product 03 HOS (Split Sleeper Berth & 8-Day Rolling Recap Modal)',
    url: 'http://127.0.0.1:5175/',
    wait: 2000,
    action: async (page) => {
      const btn = await page.$('button:has-text("Split Sleeper")');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(600);
      }
    },
  },
  {
    id: 'p01-dunnage-airbags',
    name: 'Product 01 Cargo Fit (49 CFR § 393.106 Dunnage Airbags Modal)',
    url: 'http://127.0.0.1:5173/#/app/plan',
    wait: 2500,
    action: async (page) => {
      const btn = await page.$('button:has-text("Dunnage")');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(600);
      }
    },
  },
  {
    id: 'p02-triangulation',
    name: 'Product 02 Freight Pricing (Backhaul Triangulation Analyzer)',
    url: 'http://127.0.0.1:5174/',
    wait: 2000,
    action: async (page) => {
      const btn = await page.$('button:has-text("Triangulation")');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(600);
      }
    },
  },
  {
    id: 'p03-hos-exemptions',
    name: 'Product 03 HOS (FMCSA Statutory Exemptions Modal)',
    url: 'http://127.0.0.1:5175/',
    wait: 2000,
    action: async (page) => {
      const btn = await page.$('button:has-text("Exemptions")');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(600);
      }
    },
  },
  {
    id: 'p04-asset-studio',
    name: 'Product 04 Asset Studio 3D Canvas',
    url: 'http://127.0.0.1:5176/',
    wait: 2500,
  },
  {
    id: 'p05-fleet-telematics',
    name: 'Product 05 Telematics HUD (Responsive Gauges & Remote Reefer IoT)',
    url: 'http://127.0.0.1:5177/',
    wait: 2000,
  },
  {
    id: 'p05-ifta-schedule',
    name: 'Product 05 Telematics (IFTA Quarterly Mileage Tax Schedule Modal)',
    url: 'http://127.0.0.1:5177/',
    wait: 2000,
    action: async (page) => {
      const btn = await page.$('button:has-text("IFTA")');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(600);
      }
    },
  },
  {
    id: 'p07-yard-dock',
    name: 'Product 07 Yard & Dock Management (2D Architectural SVG Blueprint)',
    url: 'http://127.0.0.1:5179/',
    wait: 2000,
  },
  {
    id: 'p08-carrier-trust',
    name: 'Product 08 Carrier Trust & Anti-Fraud Shield',
    url: 'http://127.0.0.1:5180/',
    wait: 2000,
  },
  {
    id: 'suite-dock-menu',
    name: 'SuiteDock Universal App Switcher (44px Targets)',
    url: 'http://127.0.0.1:5170/',
    action: async (page) => {
      // Click Apps button
      const btn = await page.$('button[aria-label*="Suite Switcher"], button:has-text("Apps")');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(600);
      }
    },
    wait: 1000,
  }
];

async function run() {
  console.log('📸 Launching Chromium for visual before/after pass...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const ARTIFACT_VISUALS_DIR = '/Users/pranay/.gemini/antigravity/brain/cd3c1b26-5602-45d3-a649-2939a3bf7f41/visuals';
  fs.mkdirSync(ARTIFACT_VISUALS_DIR, { recursive: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });

    for (const t of TARGETS) {
      const page = await context.newPage();
      try {
        console.log(`Capturing ${t.id} [${vp.name}]...`);
        await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        if (t.wait) await page.waitForTimeout(t.wait);
        if (t.action) await t.action(page);

        const outPath = path.join(OUTPUT_DIR, `${t.id}--${vp.name}.png`);
        await page.screenshot({ path: outPath, fullPage: false });
        console.log(`✓ Saved: ${outPath}`);

        // Also sync to brain visuals folder
        const brainOutPath = path.join(ARTIFACT_VISUALS_DIR, `${t.id}-${vp.name}.png`);
        fs.copyFileSync(outPath, brainOutPath);
      } catch (err) {
        console.error(`❌ Failed capturing ${t.id}:`, err.message);
      } finally {
        await page.close();
      }
    }
    await context.close();
  }

  await browser.close();
  console.log('\n✅ Visual pass capture complete! All images saved to:', OUTPUT_DIR);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
