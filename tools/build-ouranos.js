#!/usr/bin/env node

/**
 * Build the official ouranos-gex Spatial ID library for bundling.
 *
 * The pinned GitHub source tarball is installed as a development dependency.
 * This script builds that source in place so webpack can bundle the official
 * implementation instead of silently producing a fallback-only package.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const YARN_VERSION = '1.22.22';
let moduleDir = null;
let distEntry = null;

function run(command, options = {}) {
  execSync(command, { stdio: 'inherit', ...options });
}

function ensureModuleInstalled() {
  try {
    const packageJsonPath = require.resolve('ouranos-gex-lib-for-javascript/package.json', {
      paths: [projectRoot]
    });
    moduleDir = path.dirname(packageJsonPath);
    distEntry = path.join(moduleDir, 'dist', 'index.js');
  } catch (_error) {
    console.error('[ouranos] node_modules/ouranos-gex-lib-for-javascript not found.');
    console.error('[ouranos] Reinstall cesium-heatbox so its pinned optional dependency is available.');
    process.exit(1);
  }
}

function buildModule() {
  console.log('[ouranos] installing dependencies from the upstream frozen lockfile...');
  run(`npx --yes yarn@${YARN_VERSION} install --frozen-lockfile --ignore-scripts --non-interactive`, { cwd: moduleDir });
  console.log('[ouranos] building upstream library...');
  run('npm run build', { cwd: moduleDir });
}

function main() {
  ensureModuleInstalled();
  if (fs.existsSync(distEntry)) {
    console.log('[ouranos] dist/index.js already present. Nothing to do.');
    return;
  }

  buildModule();

  if (!fs.existsSync(distEntry)) {
    console.error('[ouranos] build completed but dist/index.js was not produced.');
    process.exit(1);
  }

  console.log('[ouranos] preparation complete. Official Spatial ID library is ready.');
}

main();
