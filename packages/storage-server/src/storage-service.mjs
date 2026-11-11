import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

const ports = [5170, 5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180, 5181];
const allowedOrigins = new Set(ports.flatMap(port => [`http://127.0.0.1:${port}`, `http://localhost:${port}`]));
const keys = ['facility', 'tenants', 'leases', 'ledger', 'maintenance', 'meterReadings', 'receipts', 'events'];
const emptyStore = () => ({ schemaVersion: 1, facility: null, tenants: [], leases: [], ledger: [], maintenance: [], meterReadings: [], receipts: [], events: [] });

function normalizeState(input) {
  const next = emptyStore();
  if (!input || typeof input !== 'object') return next;
  for (const key of keys) if (input[key] !== undefined) next[key] = input[key];
  return next;
}
const legacyRevisionOf = state => `legacy-${createHash('sha256').update(JSON.stringify(state)).digest('hex')}`;
const tag = revision => `"${revision}"`;

/** File-backed loopback service. The caller selects the store path and owns listening. */
export async function createStorageService({ file }) {
  let store = emptyStore();
  let revision;
  let preservedFields = {};
  try {
    const raw = JSON.parse(await readFile(file, 'utf8'));
    if (raw.schemaVersion !== 1) throw new Error('Unsupported store schema.');
    preservedFields = Object.fromEntries(Object.entries(raw).filter(([key]) => key !== 'schemaVersion' && key !== 'storageRevision' && !keys.includes(key)));
    store = normalizeState(Array.isArray(raw.facilities) && raw.facility === undefined ? { ...raw, facility: raw.facilities[0] ?? null } : raw);
    if (raw.storageRevision !== undefined && (typeof raw.storageRevision !== 'string' || !/^rev-[0-9a-f-]{36}$/.test(raw.storageRevision))) throw new Error('Invalid storage revision.');
    revision = raw.storageRevision;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  revision ??= legacyRevisionOf(store);
  let mutationQueue = Promise.resolve();
  async function persist(next) {
    await mkdir(dirname(file), { recursive: true, mode: 0o700 });
    const temp = `${file}.next-${randomUUID()}`;
    const nextRevision = `rev-${randomUUID()}`;
    await writeFile(temp, JSON.stringify({ ...preservedFields, ...next, storageRevision: nextRevision }, null, 2), { mode: 0o600 });
    await rename(temp, file);
    store = next;
    revision = nextRevision;
  }
  function mutate(token, update) {
    const action = mutationQueue.then(async () => {
      if (!token) return { status: 428, body: { error: 'If-Match revision is required.' } };
      if (token !== tag(revision)) return { status: 412, body: { error: 'Storage changed; reload and review the conflict.' } };
      const next = update(store);
      await persist(next);
      return { status: 200, body: { ok: true }, revision: tag(revision) };
    });
    mutationQueue = action.then(() => undefined, () => undefined);
    return action;
  }
  return async (req, res) => {
    const origin = req.headers.origin;
    const reply = (status, body, revision) => {
      if (revision) res.setHeader('ETag', revision);
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(body));
    };
    try {
      if (!/^(localhost|127\.0\.0\.1):\d+$/.test(req.headers.host ?? '')) throw new Error('Loopback host required.');
      if (origin && !allowedOrigins.has(origin)) throw new Error('Origin not allowed.');
      if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Expose-Headers', 'ETag'); }
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, If-Match');
        return reply(204, null);
      }
      const path = new URL(req.url, 'http://127.0.0.1').pathname;
      if (req.method === 'GET' && path === '/health') return reply(200, { mode: 'local_persistent', schemaVersion: 1 });
      if (req.method === 'GET' && path === '/data') return reply(200, store, tag(revision));
      if (req.method === 'POST' && path === '/data') {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString());
        const result = await mutate(req.headers['if-match'], current => normalizeState({ ...current, ...body }));
        return reply(result.status, result.body, result.revision);
      }
      if (req.method === 'DELETE' && path === '/data') {
        if (Object.keys(preservedFields).length) return reply(409, { error: 'Unrecognized stored fields require review before reset; data was preserved.' });
        const result = await mutate(req.headers['if-match'], () => emptyStore());
        return reply(result.status, result.body, result.revision);
      }
      return reply(404, { error: 'Not found' });
    } catch (error) { return reply(500, { error: error.message }); }
  };
}
