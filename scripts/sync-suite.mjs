import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const products = fs.readdirSync(path.join(root, 'products')).filter(p => fs.existsSync(path.join(root, 'products', p, 'product.manifest.json')));
const manifests = products.map(p => JSON.parse(fs.readFileSync(path.join(root, 'products', p, 'product.manifest.json'), 'utf8'))).sort((a, b) => a.port - b.port);
if (new Set(manifests.map(m => m.id)).size !== manifests.length || new Set(manifests.map(m => m.port)).size !== manifests.length) throw new Error('Product identity and ports must be unique.');
const registry = JSON.stringify(manifests.map(m => ({ ...m, icon: m.code })), null, 2) + '\n';
let stale = false;
function write(relative, content) {
  const file = path.join(root, relative);
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return;
  if (check) { console.error('Generated suite file needs refresh:', relative); stale = true; return; }
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content);
}
write('packages/suite-dock/src/productRegistry.json', registry);
for (const product of products) {
  write(`products/${product}/src/suite/productRegistry.json`, registry);
  for (const name of ['types.ts', 'ShipmentWorkspace.tsx', 'shipment.css', 'useShipmentContext.ts', 'ShipmentSession.tsx', 'useShipmentDraft.ts', 'ShipmentInspector.tsx', 'inspector.css', 'ShipmentFinance.tsx', 'ShipmentCanvas.tsx', 'canvas.css', 'shipmentViewModel.ts', 'reviewedGeometry.mjs', 'reviewedGeometry.d.mts']) {
    const source = fs.readFileSync(path.join(root, 'packages/shipment-flow/src', name), 'utf8');
    write(`products/${product}/src/suite/${name}`, source);
  }
}
if (stale) process.exitCode = 1;
else console.log(`Suite registry and optional shipment clients ${check ? 'verified' : 'synchronized'} for ${products.length} independently buildable products.`);
