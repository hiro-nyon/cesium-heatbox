#!/usr/bin/env node
/* eslint-disable no-console */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { execFileSync } = require('child_process');

async function main() {
  const packageRoot = path.join(__dirname, '..');
  const packageJson = require(path.join(packageRoot, 'package.json'));
  const noticesPath = path.join(packageRoot, 'THIRD_PARTY_NOTICES');
  const installerPath = path.join(packageRoot, packageJson.bin['cesium-heatbox-install-ouranos']);

  assert(packageJson.files.includes('THIRD_PARTY_NOTICES'), 'npm package must include third-party notices');
  assert(packageJson.files.includes('tools/install-ouranos.js'), 'npm package must include the declared installer bin');
  assert(!packageJson.files.includes('tools/'), 'npm package must not publish unrelated development tools');
  assert.match(
    packageJson.optionalDependencies['ouranos-gex-lib-for-javascript'],
    /#[0-9a-f]{40}$/,
    'GitHub optional dependency must be pinned to a full commit SHA'
  );
  assert(fs.existsSync(noticesPath), 'THIRD_PARTY_NOTICES must exist');
  assert(fs.existsSync(installerPath), 'declared installer bin must exist');
  fs.accessSync(installerPath, fs.constants.X_OK);

  const pinnedOuranosRevision = packageJson.optionalDependencies['ouranos-gex-lib-for-javascript'].split('#')[1];
  const installerSource = fs.readFileSync(installerPath, 'utf8');
  assert(
    installerSource.includes(pinnedOuranosRevision),
    'installer bin must build the same pinned Ouranos revision declared by the package'
  );

  const notices = fs.readFileSync(noticesPath, 'utf8');
  for (const bundledComponent of [
    'simple-statistics 7.8.8',
    'ouranos-gex-lib-for-javascript 0.0.0',
    'TurfJS 6.5.0 modules',
    'geojson-rbush 3.2.0',
    'rbush 3.0.1',
    'quickselect 2.0.0'
  ]) {
    assert(notices.includes(bundledComponent), `missing notice for ${bundledComponent}`);
  }

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
