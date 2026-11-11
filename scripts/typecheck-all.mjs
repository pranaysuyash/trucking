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
        if (pkg.scripts && pkg.scripts.typecheck) {
          targets.push({ name: `@trucking/${d}`, cwd: join(packagesDir, d) });
        }
      } catch {}
    }
  }
}

console.log(`\n🚛 Running TypeScript typecheck across ${targets.length} sovereign workspaces...\n`);

let failed = false;
for (const target of targets) {
  console.log(`\n▶ Typechecking ${target.name}...`);
  // Each workspace owns its compiler command. npm resolves both local and
  // workspace-hoisted binaries without assuming a package-local node_modules.
  const res = spawnSync('npm', ['run', 'typecheck'], {
    cwd: target.cwd,
    stdio: 'inherit',
    shell: false,
  });
  if (res.status !== 0) {
    if (res.error) console.error(`Unable to launch typecheck in ${target.name}: ${res.error.message}`);
    console.error(`❌ Typecheck failure in ${target.name}`);
    failed = true;
  } else {
    console.log(`✓ Zero TypeScript errors in ${target.name}`);
  }
}

if (failed) {
  console.error('\n❌ One or more workspace typechecks failed.');
  process.exit(1);
} else {
  console.log('\n✅ All sovereign workspace typechecks passed with 0 errors!\n');
}
