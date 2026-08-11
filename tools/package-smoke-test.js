#!/usr/bin/env node
/* eslint-disable no-console */
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

async function main() {
  const packageRoot = path.join(__dirname, '..');
  const commonJsExport = require(packageRoot);
  assert.strictEqual(typeof commonJsExport, 'function', 'CommonJS export must be the Heatbox constructor');

  const esmPath = path.join(packageRoot, 'dist', 'cesium-heatbox.min.mjs');
  const esmExport = await import(pathToFileURL(esmPath).href);
  assert.strictEqual(typeof esmExport.default, 'function', 'ESM default export must be the Heatbox constructor');
  assert.strictEqual(typeof esmExport.Heatbox, 'function', 'ESM named Heatbox export must exist');

  console.log('Package exports OK (CommonJS + ESM)');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
