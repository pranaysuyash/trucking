#!/usr/bin/env node
/**
 * Rendered-evidence capture for Product 09 (Operating Doctrine §3: a
 * user-visible change needs a real BEFORE/AFTER rendered pair).
 *
 * Drives headless Chrome over the DevTools Protocol using Node's built-in
 * global WebSocket, so it adds no dependency to the workspace.
 *
 * Usage:
 *   node scripts/capture-evidence.mjs --out docs/evidence/before --label before
 *   node scripts/capture-evidence.mjs --out docs/evidence/after  --label after
 *
 * Options:
 *   --url       base URL (default http://localhost:5181/)
 *   --out       output directory (required)
 *   --width     viewport width (default 1440)
 *   --height    viewport height (default 1000)
 *   --dpr       device scale factor (default 1)
 *   --tabs      comma-separated tab labels to click (default: all known tabs)
 *   --full      capture full-page height instead of viewport only
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];

const DEFAULT_TABS = [
  'overview',
  'spaces',
  'leases',
  'ledger',
  'maintenance',
  'meters',
];

function parseArgs(argv) {
  const args = { url: 'http://localhost:5181/', width: 1440, height: 1000, dpr: 1, full: false };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    if (key === '--full') { args.full = true; continue; }
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    if (next === undefined || next.startsWith('--')) continue;
    args[name] = name === 'width' || name === 'height' || name === 'dpr' ? Number(next) : next;
    i += 1;
  }
  if (args.tabs) args.tabs = String(args.tabs).split(',').map((t) => t.trim()).filter(Boolean);
  return args;
}

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) if (existsSync(candidate)) return candidate;
  throw new Error('No Chrome/Chromium binary found. Install Google Chrome to capture evidence.');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForEndpoint(port, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return await res.json();
    } catch {
      /* not up yet */
    }
    await sleep(150);
  }
  throw new Error(`Chrome DevTools endpoint on :${port} did not become ready`);
}

/** Minimal CDP client over the browser-level WebSocket. */
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`));
        else resolve(msg.result);
      }
    });
  }

  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', () => reject(new Error('CDP websocket failed')), { once: true });
    });
    return new Cdp(ws);
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId;
    this.nextId += 1;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 30000);
    });
  }

  close() {
    try { this.ws.close(); } catch { /* already closed */ }
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.out) throw new Error('--out <directory> is required');

  const outDir = path.resolve(process.cwd(), args.out);
  await mkdir(outDir, { recursive: true });

  const port = 9333 + Math.floor(Math.random() * 200);
  const userDataDir = path.join(outDir, '.chrome-profile');
  const chrome = spawn(
    findChrome(),
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--force-color-profile=srgb',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  let cdp;
  const written = [];
  try {
    const version = await waitForEndpoint(port);
    cdp = await Cdp.connect(version.webSocketDebuggerUrl);

    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: args.width,
      height: args.height,
      deviceScaleFactor: args.dpr,
      mobile: false,
    }, sessionId);

    await cdp.send('Page.navigate', { url: args.url }, sessionId);
    // Wait for the app shell to paint (React mount + font settle).
    await sleep(2500);

    const evaluate = async (expression) => {
      const result = await cdp.send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      }, sessionId);
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.exception?.description || 'evaluate failed');
      }
      return result.result.value;
    };

    const readFullHeight = () => evaluate(
      'Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)',
    );

    const shoot = async (name) => {
      const height = args.full ? await readFullHeight() : args.height;
      if (args.full) {
        await cdp.send('Emulation.setDeviceMetricsOverride', {
          width: args.width, height, deviceScaleFactor: args.dpr, mobile: false,
        }, sessionId);
        await sleep(350);
      }
      const { data } = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: args.full,
      }, sessionId);
      const file = path.join(outDir, `${name}.png`);
      await writeFile(file, Buffer.from(data, 'base64'));
      written.push(file);
      if (args.full) {
        await cdp.send('Emulation.setDeviceMetricsOverride', {
          width: args.width, height: args.height, deviceScaleFactor: args.dpr, mobile: false,
        }, sessionId);
      }
    };

    const tabs = args.tabs || DEFAULT_TABS;
    const suffix = args.width < 700 ? `-${args.width}` : '';
    
    for (const tab of tabs) {
      const clicked = await evaluate(`(() => {
        const wanted = ${JSON.stringify(tab)}.toLowerCase();
        const buttons = Array.from(document.querySelectorAll('button, [role="tab"], a'));
        const match = buttons.find((el) => {
          const label = (el.getAttribute('aria-label') || el.textContent || '').trim().toLowerCase();
          return label === wanted || label.startsWith(wanted);
        });
        if (!match) return false;
        match.click();
        return true;
      })()`);
      if (!clicked) {
        process.stdout.write(`  skip ${tab} (no control found)\n`);
        continue;
      }
      await sleep(600);
      await shoot(`${tab}${suffix}`);
      process.stdout.write(`  captured ${tab}${suffix}\n`);
    }

    // Return to the first tab so the last frame is the landing surface.
    await evaluate(`(() => {
      const first = Array.from(document.querySelectorAll('button')).find(
        (el) => (el.textContent || '').trim().toLowerCase() === ${JSON.stringify(tabs[0])});
      if (first) first.click();
    })()`);

    const meta = await evaluate(`(() => ({
      url: location.href,
      title: document.title,
      viewport: { w: innerWidth, h: innerHeight },
      scrollHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
    }))()`);
    await writeFile(
      path.join(outDir, 'meta.json'),
      `${JSON.stringify({ capturedAt: new Date().toISOString(), args, page: meta, files: written }, null, 2)}\n`,
    );
    process.stdout.write(`\n${written.length} image(s) → ${outDir}\n`);
  } finally {
    cdp?.close();
    chrome.kill('SIGTERM');
  }
}

main().catch((error) => {
  process.stderr.write(`capture-evidence failed: ${error.message}\n`);
  process.exitCode = 1;
});
