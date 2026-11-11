import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { createStorageService } from '../src/storage-service.mjs';

test('conditional mutations serialize and preserve legacy store data', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'trucking-storage-cas-'));
  let server;
  try {
    const file = path.join(dir, 'store.json');
    await writeFile(file, JSON.stringify({ schemaVersion: 1, facility: null, tenants: [], leases: [], ledger: [], maintenance: [], meterReadings: [], receipts: ['legacy'], events: [] }));
    const service = await createStorageService({ file });
    server = createServer(service);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const get = await fetch(`${base}/data`);
    assert.deepEqual((await get.json()).receipts, ['legacy']);
    const revision = get.headers.get('etag');
    assert.ok(revision);
    const send = (receipts, token) => fetch(`${base}/data`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'If-Match': token } : {}) }, body: JSON.stringify({ receipts }) });
    assert.equal((await send(['unguarded'], null)).status, 428);
    const outcomes = await Promise.all([send(['first'], revision), send(['second'], revision)]);
    assert.deepEqual(outcomes.map(x => x.status).sort(), [200, 412]);
    const current = await fetch(`${base}/data`);
    const currentState = await current.json();
    assert.ok(currentState.receipts[0] === 'first' || currentState.receipts[0] === 'second');
    assert.notEqual(current.headers.get('etag'), revision);
    const intermediateRevision = current.headers.get('etag');
    const restored = await send(['legacy'], intermediateRevision);
    assert.equal(restored.status, 200);
    const restoredRevision = restored.headers.get('etag');
    assert.notEqual(restoredRevision, revision, 'a restored value is a new committed revision');
    assert.equal((await send(['stale-overwrite'], revision)).status, 412);
    const afterRestore = await fetch(`${base}/data`);
    assert.deepEqual((await afterRestore.json()).receipts, ['legacy']);
    assert.equal(afterRestore.headers.get('etag'), restoredRevision);
    assert.equal((await fetch(`${base}/data`, { method: 'DELETE', headers: { 'If-Match': revision } })).status, 412);
    assert.deepEqual((await (await fetch(`${base}/data`)).json()).receipts, ['legacy']);
    const latestRevision = restoredRevision;
    await new Promise(resolve => server.close(resolve));
    server = undefined;
    const restartedService = await createStorageService({ file });
    server = createServer(restartedService);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const restartedBase = `http://127.0.0.1:${server.address().port}`;
    const restarted = await fetch(`${restartedBase}/data`);
    assert.equal(restarted.headers.get('etag'), latestRevision);
    assert.deepEqual((await restarted.json()).receipts, ['legacy']);
    const cors = await fetch(`${restartedBase}/data`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:5181' } });
    assert.match(cors.headers.get('access-control-allow-headers'), /If-Match/i);
    assert.equal((await fetch(`${restartedBase}/data`, { method: 'DELETE', headers: { 'If-Match': latestRevision } })).status, 200);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('preserves unrecognized legacy fields on save and refuses a partial reset', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'trucking-storage-legacy-'));
  let server;
  try {
    const file = path.join(dir, 'store.json');
    await writeFile(file, JSON.stringify({ schemaVersion: 1, facility: null, receipts: [], interruptedWork: { retain: 'original' } }));
    server = createServer(await createStorageService({ file }));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const initial = await fetch(`${base}/data`);
    const update = await fetch(`${base}/data`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'If-Match': initial.headers.get('etag') }, body: JSON.stringify({ receipts: ['saved'] }) });
    assert.equal(update.status, 200);
    assert.deepEqual(JSON.parse(await readFile(file, 'utf8')).interruptedWork, { retain: 'original' });
    const reset = await fetch(`${base}/data`, { method: 'DELETE', headers: { 'If-Match': update.headers.get('etag') } });
    assert.equal(reset.status, 409);
    assert.deepEqual(JSON.parse(await readFile(file, 'utf8')).interruptedWork, { retain: 'original' });
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
