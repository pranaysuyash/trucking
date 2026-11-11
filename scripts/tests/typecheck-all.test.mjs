import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const runner = resolve('scripts/typecheck-all.mjs');

async function fixture() {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'trucking-typecheck-')));
  for (const dir of ['products/alpha', 'packages/shared', 'packages/no-typecheck', 'bin']) {
    await mkdir(join(root, dir), { recursive: true });
  }
  await writeFile(join(root, 'products/alpha/package.json'), JSON.stringify({ scripts: { typecheck: 'tsc --noEmit' } }));
  await writeFile(join(root, 'packages/shared/package.json'), JSON.stringify({ scripts: { typecheck: 'tsc --noEmit' } }));
  await writeFile(join(root, 'packages/no-typecheck/package.json'), '{}');
  await writeFile(join(root, 'bin/npm'), '#!/bin/sh\nprintf "%s:%s\\n" "$PWD" "$*" >> "$TRUCKING_CHECK_LOG"\ncase "$PWD" in *shared) test "${TRUCKING_FAIL_SHARED:-0}" != 1 ;; esac\n', { mode: 0o755 });
  return root;
}

test('runs declared workspace typecheck scripts without requiring package-local compiler binaries', async () => {
  const root = await fixture();
  try {
    const log = join(root, 'calls.log');
    const run = spawnSync(process.execPath, [runner], { cwd: root, encoding: 'utf8', env: { ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH}`, TRUCKING_CHECK_LOG: log } });
    assert.equal(run.status, 0, run.stderr);
    const calls = (await readFile(log, 'utf8')).trim().split('\n');
    assert.deepEqual(calls, [`${join(root, 'products/alpha')}:run typecheck`, `${join(root, 'packages/shared')}:run typecheck`]);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('returns failure when a workspace typecheck fails', async () => {
  const root = await fixture();
  try {
    const run = spawnSync(process.execPath, [runner], { cwd: root, encoding: 'utf8', env: { ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH}`, TRUCKING_CHECK_LOG: join(root, 'calls.log'), TRUCKING_FAIL_SHARED: '1' } });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Typecheck failure in @trucking\/shared/);
    assert.match(await readFile(join(root, 'calls.log'), 'utf8'), /packages\/shared:run typecheck/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
