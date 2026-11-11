import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const templates = ['types.ts', 'ShipmentWorkspace.tsx', 'shipment.css', 'useShipmentContext.ts', 'ShipmentSession.tsx', 'useShipmentDraft.ts', 'ShipmentInspector.tsx', 'inspector.css', 'ShipmentFinance.tsx', 'ShipmentCanvas.tsx', 'canvas.css', 'shipmentViewModel.ts', 'reviewedGeometry.mjs', 'reviewedGeometry.d.mts', 'carrierFreshness.mjs', 'carrierFreshness.d.mts'];

test('registry-only products do not receive an unusable shipment workspace', () => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'trucking-sync-'));
  try {
    for (const dir of ['scripts', 'packages/shipment-flow/src', 'products/integrated', 'products/storage']) mkdirSync(path.join(fixture, dir), { recursive: true });
    copyFileSync(path.join(root, 'scripts/sync-suite.mjs'), path.join(fixture, 'scripts/sync-suite.mjs'));
    for (const file of templates) writeFileSync(path.join(fixture, 'packages/shipment-flow/src', file), `fixture ${file}\n`);
    writeFileSync(path.join(fixture, 'products/integrated/product.manifest.json'), JSON.stringify({ id: 'integrated', code: 'I', port: 1 }));
    writeFileSync(path.join(fixture, 'products/storage/product.manifest.json'), JSON.stringify({ id: 'storage', code: 'S', port: 2, shipmentClient: false }));
    const run = (...args) => spawnSync(process.execPath, [path.join(fixture, 'scripts/sync-suite.mjs'), ...args], { encoding: 'utf8' });
    assert.equal(run().status, 0);
    assert.equal(existsSync(path.join(fixture, 'products/storage/src/suite/ShipmentWorkspace.tsx')), false);
    assert.equal(existsSync(path.join(fixture, 'products/integrated/src/suite/ShipmentWorkspace.tsx')), true);
    const registry = JSON.parse(readFileSync(path.join(fixture, 'products/storage/src/suite/productRegistry.json'), 'utf8'));
    assert.deepEqual(registry.map(item => item.id), ['integrated', 'storage']);
    assert.equal(run('--check').status, 0);
    writeFileSync(path.join(fixture, 'products/integrated/src/suite/types.ts'), 'stale');
    assert.equal(run('--check').status, 1);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
