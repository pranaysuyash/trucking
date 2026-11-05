import { spawn } from 'child_process';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const productsDir = join(process.cwd(), 'products');
const subproducts = readdirSync(productsDir)
  .filter((d) => existsSync(join(productsDir, d, 'package.json')))
  .sort();

console.log('================================================================');
console.log('🚛 TRUCKING MULTI-PRODUCT PLATFORM LAUNCHER');
console.log('================================================================');

const manifests = {};
for (const sp of subproducts) {
  const manifestPath = join(productsDir, sp, 'product.manifest.json');
  let port = 'Dynamic';
  let shortName = sp;
  let icon = '🚛';
  if (existsSync(manifestPath)) {
    try {
      const m = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      port = m.port || port;
      shortName = m.shortName || shortName;
      icon = m.icon || icon;
      manifests[sp] = m;
    } catch {}
  }
  console.log(` • ${icon} ${sp.padEnd(30)} [${shortName.padEnd(16)}] -> http://localhost:${port}/`);
}
console.log('================================================================\n');

const children = [];

for (const sp of subproducts) {
  const pPath = join(productsDir, sp);
  const child = spawn('./node_modules/.bin/vite', ['--host', '127.0.0.1', '--strictPort'], {
    cwd: pPath,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });

  const prefix = `[${sp.replace('product-', 'P')}]`;
  child.stdout.on('data', (d) => {
    process.stdout.write(`${prefix} ${d.toString()}`);
  });
  child.stderr.on('data', (d) => {
    process.stderr.write(`${prefix} ${d.toString()}`);
  });

  children.push(child);
}

process.on('SIGINT', () => {
  console.log('\nGracefully shutting down all subproduct dev servers...');
  for (const c of children) c.kill('SIGINT');
  process.exit(0);
});
