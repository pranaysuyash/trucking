import http from 'node:http';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createShipment, applyCommand, FlowError, validateInput } from './src/domain.mjs';

const ports = [5170, 5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180];
const allowedOrigins = new Set(ports.flatMap(port => [`http://127.0.0.1:${port}`, `http://localhost:${port}`]));

export async function createFlowServer({ file = resolve(fileURLToPath(new URL('../../', import.meta.url)), '.local/shipment-flow/store.json') } = {}) {
  let store = { schemaVersion: 1, shipments: [] };
  try {
    store = JSON.parse(await readFile(file, 'utf8'));
    if (store.schemaVersion !== 1 || !Array.isArray(store.shipments)) throw new Error('Unsupported shipment store. Preserve the file and migrate it explicitly.');
    for (const shipment of store.shipments) validateInput(shipment.input);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  let queue = Promise.resolve();
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
      if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host)) throw new FlowError('Loopback host required.', 403);
      if (origin && !allowedOrigins.has(origin)) throw new FlowError('Origin is not a local trucking preview.', 403);
      if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return reply(204, null);
      }
      const url = new URL(req.url, 'http://127.0.0.1');
      if (req.method === 'GET' && url.pathname === '/health') return reply(200, { mode: 'local_scenario', persistent: true, schemaVersion: 1 });
      if (req.method === 'GET' && url.pathname === '/shipments') return reply(200, store.shipments.map(({ id, reference, status }) => ({ id, reference, status })));
      if (req.method === 'GET' && url.pathname === '/resources') {
        const warehouseSlotIds = new Set(); const yardDoorIds = new Set();
        for (const s of store.shipments.filter(s => s.id !== url.searchParams.get('exclude'))) {
          const w = s.results.warehouse; const y = s.results.yard;
          if (w?.ok && w.inputRevision === s.inputRevision) for (const a of w.details.assignments) warehouseSlotIds.add(a.slotId);
          if (y?.ok && y.inputRevision === s.inputRevision && ['draft', 'dispatched'].includes(s.status)) yardDoorIds.add(y.details.doorId);
        }
        return reply(200, { warehouseSlotIds: [...warehouseSlotIds], yardDoorIds: [...yardDoorIds] });
      }
      const match = /^\/shipments\/([a-f0-9-]{36})(\/commands)?$/.exec(url.pathname);
      if (req.method === 'GET' && match && !match[2]) {
        const shipment = store.shipments.find(s => s.id === match[1]);
        if (!shipment) throw new FlowError('Shipment was not found. Standalone tools remain available.', 404);
        return reply(200, shipment);
      }
      if (req.method !== 'POST' || !(url.pathname === '/shipments' || match?.[2])) throw new FlowError('Route not found.', 404);
      if (!origin || !allowedOrigins.has(origin)) throw new FlowError('A trusted local product origin is required for writes.', 403);
      if (!req.headers['content-type']?.startsWith('application/json')) throw new FlowError('JSON content type required.', 415);
      let body = '';
      for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 65536) throw new FlowError('Request exceeds 64 KiB.', 413); }
      let data;
      try { data = JSON.parse(body); } catch { throw new FlowError('Invalid JSON.'); }
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new FlowError('A JSON object is required.');
      const work = queue.then(async () => {
        const next = structuredClone(store);
        let shipment;
        if (url.pathname === '/shipments') {
          if (typeof data.operationId !== 'string' || data.operationId.length < 1 || data.operationId.length > 100) throw new FlowError('A creation operation ID is required.');
          const existing = next.shipments.find(s => s.creationOperationId === data.operationId);
          if (existing) {
            if (existing.reference !== data.reference) throw new FlowError('Creation operation ID was reused with different content.', 409);
            return existing;
          }
          if (next.shipments.length >= 100) throw new FlowError('Local scenario store reached its 100-record limit. Preserve/export records before a separate storage decision.');
          shipment = createShipment(data.reference); shipment.creationOperationId = data.operationId; next.shipments.push(shipment);
        } else {
          const index = next.shipments.findIndex(s => s.id === match[1]);
          if (index < 0) throw new FlowError('Shipment not found.', 404);
          shipment = applyCommand(next.shipments[index], data);
          // A confirmed retry must not replay reservations or write history again.
          if (shipment === next.shipments[index]) return shipment;
          // Location reservations from different local shipments cannot silently collide.
          if (data.type === 'evaluate' && data.payload?.result?.ok && ['warehouse', 'yard'].includes(data.payload.stage)) {
            const stage = data.payload.stage;
            const d = shipment.results[stage].details;
            // Reviewed native plans bind the shared capacity snapshot as well as
            // this shipment's revision. Another shipment may reserve different
            // positions in the same bay while this operator is reviewing.
            const reservationKey = stage === 'warehouse' ? 'warehouseSlotIds' : 'yardDoorIds';
            const reviewed = d.reservationSnapshot?.[reservationKey];
            if (d.nativeResult || d.doorSnapshot || reviewed !== undefined) {
              if (!Array.isArray(reviewed) || !reviewed.every(id => typeof id === 'string')) throw new FlowError('Reviewed reservation evidence is missing. Refresh and replan.', 409);
              const held = new Set();
              for (const other of next.shipments.filter(s => s.id !== shipment.id && (stage === 'warehouse' || ['draft', 'dispatched'].includes(s.status)))) {
                const r = other.results[stage];
                if (r?.ok && r.inputRevision === other.inputRevision) {
                  if (stage === 'warehouse') for (const a of r.details.assignments) held.add(a.slotId);
                  else held.add(r.details.doorId);
                }
              }
              if (JSON.stringify([...new Set(reviewed)].sort()) !== JSON.stringify([...held].sort())) throw new FlowError('Shared facility reservations changed during review. Refresh and replan before publishing.', 409);
            }
            for (const other of next.shipments.filter(s => s.id !== shipment.id && (stage === 'warehouse' || ['draft', 'dispatched'].includes(s.status)))) {
              const r = other.results[stage];
              if (!r?.ok || r.inputRevision !== other.inputRevision) continue;
              const collision = stage === 'yard' ? r.details.doorId === d.doorId : d.assignments.some(a => r.details.assignments.some(b => a.slotId === b.slotId));
              if (collision) throw new FlowError('Facility reservation is already held by another shipment. Replan or release through an explicit workflow.', 409);
            }
          }
          next.shipments[index] = shipment;
        }
        await persist(next);
        return shipment;
      });
      queue = work.catch(() => {});
      return reply(200, await work);
    } catch (error) { reply(error instanceof FlowError ? error.status : 500, { error: error instanceof FlowError ? error.message : 'Shipment service could not complete the operation. Stored history was preserved.' }); }
  });
  server.requestTimeout = 10000;
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await createFlowServer();
  server.listen(5171, '127.0.0.1', () => console.log('Local scenario shipment service: http://127.0.0.1:5171 (loopback only; not production authentication)'));
}
