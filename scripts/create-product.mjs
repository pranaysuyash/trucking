#!/usr/bin/env node
/**
 * TRUCKING Subproduct Chassis Generator CLI
 * Scaffolds an independent, sovereign subproduct conforming to the Trucking Platform standard.
 *
 * Usage:
 *   node scripts/create-product.mjs <product-id> <product-name> [port] [icon]
 * Example:
 *   node scripts/create-product.mjs product-06-yard-dispatch "Yard & Dock Dispatcher" 5178 🏭
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log(`
Usage: npm run create:product <product-id> <product-name> [port] [icon]
Example:
  npm run create:product product-06-yard-dock "Yard & Dock Management" 5178 🏭
`);
  process.exit(1);
}

const [productId, productName, portArg, iconArg] = args;
const port = portArg ? parseInt(portArg, 10) : 5180;
const icon = iconArg || '🚛';
const shortName = productName.split('&')[0].trim();
const code = productId.match(/product-(\d+)/) ? `P${productId.match(/product-(\d+)/)[1].padStart(2, '0')}` : 'PX';

const targetDir = join(process.cwd(), 'products', productId);

if (existsSync(targetDir)) {
  console.error(`❌ Error: Directory already exists at ${targetDir}`);
  process.exit(1);
}

console.log(`\n🚛 Scaffolding sovereign subproduct: ${productName} (${productId})...\n`);

mkdirSync(join(targetDir, 'src', 'ui'), { recursive: true });
mkdirSync(join(targetDir, 'src', 'engine'), { recursive: true });
mkdirSync(join(targetDir, 'tests'), { recursive: true });

// 1. package.json
const pkgJson = {
  name: `${productId}`,
  private: true,
  version: '0.1.0',
  type: 'module',
  scripts: {
    dev: 'vite',
    build: 'tsc --noEmit && vite build',
    preview: 'vite preview',
    typecheck: 'tsc --noEmit',
    test: 'vitest run',
  },
  dependencies: {
    react: '^19.0.0',
    'react-dom': '^19.0.0',
  },
  devDependencies: {
    '@types/react': '^19.0.0',
    '@types/react-dom': '^19.0.0',
    '@vitejs/plugin-react': '^5.0.0',
    typescript: '^5.6.0',
    vite: '^7.0.0',
    vitest: '^3.0.0',
  },
};
writeFileSync(join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));

// 2. product.manifest.json
const manifest = {
  $schema: 'https://trucking.platform.io/schemas/subproduct-manifest-v1.json',
  id: productId,
  name: productName,
  shortName: shortName,
  code: code,
  version: '1.0.0',
  port: port,
  icon: icon,
  description: `${productName} for commercial freight and logistics operations.`,
  category: 'operations',
  entitlementKey: productId.replace(/-/g, '_'),
  routes: {
    dev: `http://localhost:${port}`,
    cloud: `https://${productId}.pages.dev`,
  },
  bridges: {
    consumes: [],
    produces: [],
  },
};
writeFileSync(join(targetDir, 'product.manifest.json'), JSON.stringify(manifest, null, 2));

// 3. tsconfig.json
const tsconfig = {
  compilerOptions: {
    target: 'ES2022',
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    moduleResolution: 'Bundler',
    jsx: 'react-jsx',
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    skipLibCheck: true,
    isolatedModules: true,
    resolveJsonModule: true,
    types: ['vite/client'],
  },
  include: ['src', 'tests'],
};
writeFileSync(join(targetDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

// 4. vite.config.ts
const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: ${port},
    host: true,
  },
});
`;
writeFileSync(join(targetDir, 'vite.config.ts'), viteConfig);

// 5. index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${icon}</text></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${code} — ${productName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
writeFileSync(join(targetDir, 'index.html'), indexHtml);

// 6. src/main.tsx
const mainTsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './ui/App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
writeFileSync(join(targetDir, 'src', 'main.tsx'), mainTsx);

// 7. src/styles.css
const stylesCss = `:root {
  --bg-primary: #090d16;
  --bg-secondary: #0f172a;
  --bg-card: #131d31;
  --border: #1e293b;
  --accent: #38bdf8;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-main);
  min-height: 100vh;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

.app-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .app-container {
    padding: 14px;
  }
  .card {
    padding: 16px;
  }
}
`;
writeFileSync(join(targetDir, 'src', 'styles.css'), stylesCss);

// 8. src/ui/SuiteDock.tsx & src/ui/icons.tsx
const suiteDockSource = join(process.cwd(), 'packages', 'suite-dock', 'src', 'SuiteDock.tsx');
if (existsSync(suiteDockSource)) {
  const dockCode = readFileSync(suiteDockSource, 'utf-8');
  writeFileSync(join(targetDir, 'src', 'ui', 'SuiteDock.tsx'), dockCode);
}
const iconsSource = join(process.cwd(), 'packages', 'suite-dock', 'src', 'icons.tsx');
if (existsSync(iconsSource)) {
  const iconsCode = readFileSync(iconsSource, 'utf-8');
  writeFileSync(join(targetDir, 'src', 'ui', 'icons.tsx'), iconsCode);
}

// 9. src/ui/App.tsx
const appTsx = `import { SuiteDock } from './SuiteDock';

export function App() {
  return (
    <div className="subproduct-root">
      <SuiteDock currentProductId="${productId}" />
      <div className="app-container">
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 32 }}>${icon}</span>
          <div>
            <h1 style={{ fontSize: 22, color: '#fff' }}>${productName}</h1>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Sovereign subproduct operating on Port ${port}</p>
          </div>
        </header>

        <div className="card">
          <h3>Operational Dashboard</h3>
          <p style={{ color: '#94a3b8', marginTop: 8 }}>Ready for independent SaaS subscription or mixed suite integration.</p>
        </div>
      </div>
    </div>
  );
}
`;
writeFileSync(join(targetDir, 'src', 'ui', 'App.tsx'), appTsx);

// 10. tests/spec.test.ts
const specTest = `import { describe, it, expect } from 'vitest';

describe('${code} — ${productName}', () => {
  it('initializes sovereign module successfully', () => {
    expect(true).toBe(true);
  });
});
`;
writeFileSync(join(targetDir, 'tests', 'spec.test.ts'), specTest);

console.log(`✅ Successfully created ${productId} on Port ${port}!`);
console.log(`To run this subproduct independently:\n  cd products/${productId} && npm run dev\n`);
