import { spawnSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

const productsDir = join(process.cwd(), 'products');
const subproducts = readdirSync(productsDir).filter((d) =>
  existsSync(join(productsDir, d, 'package.json'))
);

console.log(`\n🚛 Building production bundles across ${subproducts.length} sovereign subproducts...\n`);

let failed = false;
for (const sp of subproducts) {
  const pPath = join(productsDir, sp);
  console.log(`\n▶ Building ${sp}...`);
  const res = spawnSync('npm', ['run', 'build'], {
    cwd: pPath,
    stdio: 'inherit',
    shell: false,
  });
  if (res.status !== 0) {
    console.error(`❌ Build failure in ${sp}`);
    failed = true;
  } else {
    console.log(`✓ Built ${sp}`);
  }
}

if (failed) {
  console.error('\n❌ One or more subproduct builds failed.');
  process.exit(1);
} else {
  console.log('\n✅ All sovereign subproduct production builds succeeded!\n');
}
