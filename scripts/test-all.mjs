import { spawnSync } from 'child_process';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const productsDir = join(process.cwd(), 'products');
const packagesDir = join(process.cwd(), 'packages');

const targets = [];
if (existsSync(productsDir)) {
  for (const d of readdirSync(productsDir)) {
    if (existsSync(join(productsDir, d, 'package.json'))) {
      targets.push({ name: d, cwd: join(productsDir, d) });
    }
  }
}
if (existsSync(packagesDir)) {
  for (const d of readdirSync(packagesDir)) {
    const pkgPath = join(packagesDir, d, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        if (pkg.scripts && pkg.scripts.test) {
          targets.push({ name: `@trucking/${d}`, cwd: join(packagesDir, d) });
        }
      } catch {}
    }
  }
}

console.log(`\n🚛 Running test suites across ${targets.length} sovereign workspaces...\n`);

let failed = false;
for (const target of targets) {
  console.log(`\n▶ Testing ${target.name}...`);
  const res = spawnSync('npm', ['test'], {
    cwd: target.cwd,
    stdio: 'inherit',
    shell: false,
  });
  if (res.status !== 0) {
    console.error(`❌ Test failure in ${target.name}`);
    failed = true;
  } else {
    console.log(`✓ Tests passed in ${target.name}`);
  }
}

if (failed) {
  console.error('\n❌ One or more workspace test suites failed.');
  process.exit(1);
} else {
  console.log('\n✅ All sovereign workspace test suites passed successfully!\n');
}
