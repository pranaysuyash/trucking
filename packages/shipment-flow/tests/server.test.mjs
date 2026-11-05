import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { createFlowServer } from '../server.mjs';
import { createShipment } from '../src/domain.mjs';

function createClient(server) {
  return function request(urlOrPath, { method = 'GET', headers = {}, body = null } = {}) {
    return new Promise((resolve) => {
      const url = new URL(urlOrPath, 'http://127.0.0.1:5171');
      const req = new PassThrough();
      req.method = method;
      req.url = url.pathname + url.search;
      const lowerHeaders = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
      req.headers = { host: '127.0.0.1:5171', ...lowerHeaders };

      const res = new PassThrough();
      let resHeaders = {};
      let statusCode = 200;
      res.writeHead = function(status, h) {
        statusCode = status;
        if (h) resHeaders = { ...resHeaders, ...h };
        return this;
      };
      res.setHeader = function(k, v) {
        resHeaders[k.toLowerCase()] = v;
      };
      res.getHeader = function(k) {
        return resHeaders[k.toLowerCase()];
      };

      let responseChunks = [];
      res.on('data', chunk => responseChunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(responseChunks).toString('utf8');
        resolve({
          status: statusCode,
          headers: resHeaders,
          text: async () => text,
          json: async () => (text ? JSON.parse(text) : null),
        });
      });

      server.emit('request', req, res);
      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  };
}

test('API persists across restart, rejects foreign origins and deduplicates creation', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'trucking-flow-api-')); const file = join(dir, 'store.json');
  let server = await createFlowServer({ file });
  let request = createClient(server);
  const post = (path, body, origin = 'http://127.0.0.1:5170') => request(path, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body });
  try {
    assert.equal((await post('/shipments', { reference: 'Origin attack', operationId: 'bad' }, 'https://foreign.example')).status, 403);
    const body = { reference: 'Persistent fixture', operationId: 'create-fixture-1' };
    const created = await (await post('/shipments', body)).json();
    const retry = await (await post('/shipments', body)).json();
    assert.equal(retry.id, created.id);
    assert.equal((await post('/shipments', { ...body, reference: 'Different content' })).status, 409);
    assert.equal((await request('/shipments').then(r => r.json())).length, 1);
    const amend = { type: 'amend', productId: 'command-center-portal', operationId: 'amend-fixture-1', expectedRevision: created.revision, payload: { input: { ...created.input, loadedMiles: 110 } } };
    const a = await (await post(`/shipments/${created.id}/commands`, amend)).json();
    const b = await (await post(`/shipments/${created.id}/commands`, amend)).json();
    assert.equal(a.revision, 2); assert.equal(b.revision, 2);
    assert.equal((await post(`/shipments/${created.id}/commands`, { ...amend, operationId: 'stale-writer' })).status, 409);
    server = await createFlowServer({ file });
    request = createClient(server);
    const restored = await request(`/shipments/${created.id}`).then(r => r.json());
    assert.equal(restored.input.loadedMiles, 110); assert.equal(restored.revision, 2);
    const writeA = { ...amend, operationId: 'concurrent-a', expectedRevision: 2, payload: { input: { ...restored.input, loadedMiles: 111 } } };
    const writeB = { ...amend, operationId: 'concurrent-b', expectedRevision: 2, payload: { input: { ...restored.input, loadedMiles: 112 } } };
    const concurrent = await Promise.all([post(`/shipments/${created.id}/commands`, writeA), post(`/shipments/${created.id}/commands`, writeB)]);
    assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 409]);
    assert.equal(JSON.parse(await readFile(file, 'utf8')).shipments.length, 1);
  } finally {}
});

test('delivered warehouse stock remains held while departed origin doors become available', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'trucking-flow-resources-')); const file = join(dir, 'store.json');
  const s = createShipment('Resource custody fixture'); s.status = 'delivered';
  s.results.warehouse = { ok: true, inputRevision: s.inputRevision, details: { assignments: [{ slotId: 'BIN-HELD' }] } };
  s.results.yard = { ok: true, inputRevision: s.inputRevision, details: { doorId: 'DOOR-RELEASED' } };
  await writeFile(file, JSON.stringify({ schemaVersion: 1, shipments: [s] }));
  const server = await createFlowServer({ file });
  const request = createClient(server);
  try {
    const usage = await request('/resources').then(r => r.json());
    assert.deepEqual(usage.warehouseSlotIds, ['BIN-HELD']); assert.deepEqual(usage.yardDoorIds, []);
  } finally {}
});

test('an unreadable or incompatible store is preserved instead of silently reset', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'trucking-flow-corrupt-')); const file = join(dir, 'store.json');
  await writeFile(file, '{corrupt-record');
  await assert.rejects(createFlowServer({ file }));
  assert.equal(await readFile(file, 'utf8'), '{corrupt-record');
});

test('a reviewed receiving plan rejects changed shared capacity even when its individual slots do not collide', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'trucking-flow-capacity-review-')); const file = join(dir, 'store.json');
  const shipments = [createShipment('Capacity reviewer A'), createShipment('Capacity reviewer B')];
  for (const shipment of shipments) shipment.results.fit = { ok: true, inputRevision: shipment.inputRevision, recordedAt: '2026-10-22T12:00:00.000Z' };
  await writeFile(file, JSON.stringify({ schemaVersion: 1, shipments }));
  const server = await createFlowServer({ file });
  const request = createClient(server);
  const reviewedPlan = (shipment, prefix, reserved = []) => ({
    type: 'evaluate', productId: 'product-06-warehouse-space-flow', operationId: `${prefix}-review-${reserved.length}`, expectedRevision: shipment.revision,
    payload: { stage: 'warehouse', result: { ok: true, summary: 'Reviewed shared bay capacity fixture', details: {
      nativeResult: { feasible: true }, reservationSnapshot: { warehouseSlotIds: reserved }, fitRecordedAt: shipment.results.fit.recordedAt,
      assignments: shipment.input.units.map((unit, index) => ({ unitId: unit.id, barcode: unit.barcode, slotId: `${prefix}-${index}`, slotCode: `${prefix}-${index}` })),
    } } },
  });
  const post = (shipment, body) => request(`/shipments/${shipment.id}/commands`, { method: 'POST', headers: { Origin: 'http://127.0.0.1:5178', 'Content-Type': 'application/json' }, body });
  try {
    const accepted = await post(shipments[0], reviewedPlan(shipments[0], 'BAY-A')); assert.equal(accepted.status, 200);
    const before = await readFile(file, 'utf8');
    const rejected = await post(shipments[1], reviewedPlan(shipments[1], 'BAY-B')); assert.equal(rejected.status, 409);
    assert.match((await rejected.json()).error, /reservations changed during review/);
    assert.equal(await readFile(file, 'utf8'), before, 'Rejected stale capacity must not write a result or event.');
    const reservations = await request(`/resources?exclude=${shipments[1].id}`).then(response => response.json());
    const rereviewed = await post(shipments[1], reviewedPlan(shipments[1], 'BAY-B', reservations.warehouseSlotIds));
    assert.equal(rereviewed.status, 200, 'A plan reviewed against the new shared snapshot may publish.');
    assert.equal((await rereviewed.json()).revision, 2);
  } finally {}
});

test('a saved receiving operation can be retried after upstream invalidation without replaying its reservation', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'trucking-flow-retry-')); const file = join(dir, 'store.json');
  const server = await createFlowServer({ file });
  const request = createClient(server);
  const post = (path, body) => request(path, { method: 'POST', headers: { Origin: 'http://127.0.0.1:5170', 'Content-Type': 'application/json' }, body });
  try {
    let s = await (await post('/shipments', { reference: 'Historical retry', operationId: 'retry-create' })).json();
    const send = async (stage, details) => {
      const productId = { asset: 'product-04-asset-studio', fit: 'product-01-cargo-fit', warehouse: 'product-06-warehouse-space-flow' }[stage];
      const command = { type: 'evaluate', productId, operationId: `retry-${stage}-${s.revision}`, expectedRevision: s.revision, payload: { stage, result: { ok: true, summary: 'API retry fixture', details } } };
      const response = await post(`/shipments/${s.id}/commands`, command); assert.equal(response.status, 200); s = await response.json(); return command;
    };
    const asset = { equipmentId: s.input.equipmentId, lengthIn: 630, widthIn: 100, heightIn: 100, doorWidthIn: 96, doorHeightIn: 98, payloadLbs: 45000 };
    await send('asset', asset);
    await send('fit', { geometryFeasible: true, violations: 0, unitIds: s.input.units.map(u => u.id), placements: s.input.units.map(u => ({ unitId: u.id })) });
    const receiving = await send('warehouse', { assignments: s.input.units.map((u, i) => ({ unitId: u.id, barcode: u.barcode, slotId: `S-${i}`, slotCode: `R-${i}` })) });
    await send('asset', asset); assert.equal(s.results.warehouse, undefined);
    const before = await readFile(file, 'utf8');
    const retry = await post(`/shipments/${s.id}/commands`, receiving); assert.equal(retry.status, 200);
    const retried = await retry.json(); assert.equal(retried.revision, s.revision); assert.equal(retried.results.warehouse, undefined);
    assert.equal(await readFile(file, 'utf8'), before);
  } finally {}
});
