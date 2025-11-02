#!/usr/bin/env node

/**
 * Prepare the official ouranos-gex Spatial ID library.
 *
 * This script clones the upstream repository, builds the distribution bundle,
 * and copies the compiled artefacts into node_modules so Heatbox can load the
 * official implementation instead of the fallback converter.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const moduleDir = path.join(projectRoot, 'node_modules', 'ouranos-gex-lib-for-javascript');
const distEntry = path.join(moduleDir, 'dist', 'index.js');

function run(command, options = {}) {
  execSync(command, { stdio: 'inherit', ...options });
}

function ensureModuleInstalled() {
  if (!fs.existsSync(moduleDir)) {
    console.error('[ouranos] node_modules/ouranos-gex-lib-for-javascript not found.');
    console.error('[ouranos] Run `npm install ouranos-gex-lib-for-javascript@github:ouranos-gex/ouranos-gex-lib-for-JavaScript --no-save` first.');
    process.exit(1);
  }
}

function ensureVendorClone(cloneDir) {
  if (!fs.existsSync(cloneDir)) {
    fs.mkdirSync(path.dirname(cloneDir), { recursive: true });
    console.log('[ouranos] cloning upstream repository...');
    run(`git clone https://github.com/ouranos-gex/ouranos-gex-lib-for-JavaScript.git "${cloneDir}"`);
  } else {
    console.log('[ouranos] pulling latest changes...');
    run(`git -C "${cloneDir}" pull --ff-only`);
  }
}

function buildClone(cloneDir) {
  console.log('[ouranos] installing dependencies for upstream library...');
  run('npm install', { cwd: cloneDir });
  console.log('[ouranos] building upstream library...');
  run('npm run build', { cwd: cloneDir });
}

function copyDist(cloneDir) {
  const sourceDist = path.join(cloneDir, 'dist');
  if (!fs.existsSync(sourceDist)) {
    console.error('[ouranos] build completed but dist/ directory not found.');
    process.exit(1);
  }

  const targetDist = path.join(moduleDir, 'dist');
  fs.mkdirSync(targetDist, { recursive: true });

  console.log('[ouranos] copying compiled artefacts into node_modules...');
  fs.rmSync(targetDist, { recursive: true, force: true });
  fs.mkdirSync(targetDist, { recursive: true });
  fs.readdirSync(sourceDist).forEach((entry) => {
    fs.cpSync(path.join(sourceDist, entry), path.join(targetDist, entry), { recursive: true });
  });
}

function main() {
  ensureModuleInstalled();
  if (fs.existsSync(distEntry)) {
    console.log('[ouranos] dist/index.js already present. Nothing to do.');
    return;
  }

  const cloneDir = path.join(projectRoot, 'vendor', 'ouranos-gex-lib-for-JavaScript');
  ensureVendorClone(cloneDir);
  buildClone(cloneDir);
  copyDist(cloneDir);

  console.log('[ouranos] preparation complete. Official Spatial ID library is ready.');
}

main();
