#!/usr/bin/env node
/* eslint-disable no-console */
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
const { execFileSync } = require('child_process');

async function main() {
  const packageRoot = path.join(__dirname, '..');
  const commonJsExport = require(packageRoot);
  assert.strictEqual(typeof commonJsExport, 'function', 'CommonJS export must be the Heatbox constructor');
  assert.strictEqual(commonJsExport.Heatbox, undefined, 'CommonJS must not advertise unavailable named exports');

  const esmPath = path.join(packageRoot, 'dist', 'cesium-heatbox.min.mjs');
  const esmExport = await import(pathToFileURL(esmPath).href);
  assert.strictEqual(typeof esmExport.default, 'function', 'ESM default export must be the Heatbox constructor');
  assert.strictEqual(typeof esmExport.Heatbox, 'function', 'ESM named Heatbox export must exist');
  assert.strictEqual(typeof esmExport.getEnvironmentInfo, 'function', 'ESM named helpers must exist');

  execFileSync(process.execPath, [
    require.resolve('typescript/bin/tsc'),
    '--project',
    path.join(packageRoot, 'test', 'package', 'tsconfig.json')
  ], { cwd: packageRoot, stdio: 'pipe' });

  console.log('Package exports and conditional types OK (CommonJS + ESM)');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
