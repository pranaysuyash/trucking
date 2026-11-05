import http from 'node:http';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = resolve(__dirname, '../../.local/storage-server/store.json');
const ports = [5170, 5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180, 5181];
const allowedOrigins = new Set(ports.flatMap(port => [`http://127.0.0.1:${port}`, `http://localhost:${port}`]));

const emptyStore = () => ({
  schemaVersion: 1,
  facility: null,
  tenants: [],
  leases: [],
  ledger: [],
  maintenance: [],
  meterReadings: [],
  receipts: [],
});

// Keys the P09 client owns. Unknown keys are dropped so one product cannot
// silently accumulate dead fields in the shared store file.
const STATE_KEYS = ['facility', 'tenants', 'leases', 'ledger', 'maintenance', 'meterReadings', 'receipts'];

function normalizeState(input) {
  const next = emptyStore();
  if (!input || typeof input !== 'object') return next;
  for (const key of STATE_KEYS) {
    if (input[key] !== undefined) next[key] = input[key];
  }
  return next;
}

let store = emptyStore();
try {
  const raw = JSON.parse(await readFile(file, 'utf8'));
  if (raw.schemaVersion !== 1) throw new Error('Unsupported store schema.');
  // Migrate the pre-fix plural `facilities` array to the singular facility key.
  if (Array.isArray(raw.facilities) && raw.facility === undefined) {
    store = normalizeState({ ...raw, facility: raw.facilities[0] ?? null });
  } else {
    store = normalizeState(raw);
  }
} catch (error) { if (error.code !== 'ENOENT') throw error; }

async function persist(next) {
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.next-${randomUUID()}`;
  await writeFile(temp, JSON.stringify(next, null, 2), { mode: 0o600 });
  await rename(temp, file);
  store = next;
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  const reply = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(body));
  };
  try {
    const host = req.headers.host ?? '';
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host)) throw new Error('Loopback host required.');
    if (origin && !allowedOrigins.has(origin)) throw new Error('Origin not allowed.');
    if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return reply(204, null);
    }
    const url = new URL(req.url, 'http://127.0.0.1');
    const path = url.pathname;

    if (req.method === 'GET' && path === '/health') return reply(200, { mode: 'local_persistent', schemaVersion: 1 });

    // GET all data
    if (req.method === 'GET' && path === '/data') return reply(200, store);

    // POST (merge supplied keys into the canonical state)
    if (req.method === 'POST' && path === '/data') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const next = normalizeState({ ...store, ...body });
      await persist(next);
      return reply(200, { ok: true });
    }

    // DELETE (clear the store back to an empty canonical state)
    if (req.method === 'DELETE' && path === '/data') {
      await persist(emptyStore());
      return reply(200, { ok: true, cleared: true });
    }

    return reply(404, { error: 'Not found' });
  } catch (e) {
    return reply(500, { error: e.message });
  }
});

const port = 5182;
server.listen(port, '127.0.0.1', () => {
  console.log(`Storage server listening on http://127.0.0.1:${port}`);
});
