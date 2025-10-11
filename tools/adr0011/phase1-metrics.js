#!/usr/bin/env node

const Module = require('module');
const fs = require('fs');
const { transformSync } = require('@babel/core');

const originalLoader = Module._extensions['.js'];
Module._extensions['.js'] = function babelRegister(module, filename) {
  if (filename.includes('node_modules')) {
    return originalLoader(module, filename);
  }

  const source = fs.readFileSync(filename, 'utf8');
  const { code } = transformSync(source, {
    filename,
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      '@babel/preset-typescript'
    ],
    babelrc: false,
    configFile: false,
    sourceMaps: 'inline'
  });

  return module._compile(code, filename);
};

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

const { AdaptiveController } = require('../../src/core/adaptive/AdaptiveController.js');
const { DEFAULT_OPTIONS } = require('../../src/utils/constants.js');

const PATTERNS = [
  { key: 'clustered', label: 'dense-data' },
  { key: 'scattered', label: 'sparse-data' },
  { key: 'mixed', label: 'mixed-data' }
];

const BASE_GRID_DIMENSIONS = { x: 18, y: 18, z: 4 };
const CELL_SIZE_METERS = { x: 20, y: 20, z: 5 };

const SCENARIOS = [
  {
    label: 'baseline-v0.1.14',
    adaptiveParams: {
      neighborhoodRadius: 50,
      densityThreshold: 5,
      cameraDistanceFactor: 1.0,
      overlapRiskFactor: 0.3,
      minOutlineWidth: 1.0,
      maxOutlineWidth: 5.0,
      outlineWidthRange: null,
      boxOpacityRange: null,
      outlineOpacityRange: null,
      adaptiveOpacityEnabled: false,
      zScaleCompensation: false,
      overlapDetection: false
    }
  },
  {
    label: 'phase1-defaults',
    adaptiveParams: {
      ...DEFAULT_OPTIONS.adaptiveParams
    }
  }
];

function pseudoRandom(x, y, z) {
  const seed = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791);
  return ((seed % 1000) / 1000);
}

function generateVoxelDataset(patternKey) {
  const map = new Map();
  const dims = BASE_GRID_DIMENSIONS;
  const centerX = (dims.x - 1) / 2;
  const centerY = (dims.y - 1) / 2;
  const centerZ = (dims.z - 1) / 2;

  for (let x = 0; x < dims.x; x++) {
    for (let y = 0; y < dims.y; y++) {
      for (let z = 0; z < dims.z; z++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dz = z - centerZ;
        const planarDist = Math.sqrt(dx * dx + dy * dy);

        let baseCount;
        switch (patternKey) {
          case 'clustered':
            baseCount = Math.max(0, 55 - planarDist * 9 + (centerZ - Math.abs(dz)) * 6);
            break;
          case 'scattered':
            baseCount = 4 + (Math.cos((x + y) / 3) + Math.sin((y - z) / 2));
            baseCount = Math.max(0, baseCount * 1.5);
            break;
          case 'mixed':
          default: {
            const ridge = Math.max(0, 35 - Math.abs(dx) * 6 - Math.abs(dy) * 4);
            const background = 6 + (Math.sin((x * y) / 20) + Math.cos((y + z) / 4)) * 2;
            baseCount = ridge + background;
            break;
          }
        }

        if (baseCount <= 0.5) {
          continue;
        }

        const variability = 1 + 0.2 * (pseudoRandom(x, y, z) - 0.5);
        const count = Math.max(1, Math.round(baseCount * variability));
        const key = `${x},${y},${z}`;
        map.set(key, { x, y, z, count });
      }
    }
  }

  const grid = {
    numVoxelsX: dims.x,
    numVoxelsY: dims.y,
    numVoxelsZ: dims.z,
    totalVoxels: dims.x * dims.y * dims.z,
    cellSizeX: CELL_SIZE_METERS.x,
    cellSizeY: CELL_SIZE_METERS.y,
    cellSizeZ: CELL_SIZE_METERS.z,
    voxelSizeMeters: CELL_SIZE_METERS.x
  };

  const statistics = buildStatistics(map, grid);
  return { voxelData: map, grid, statistics };
}

function buildStatistics(voxelData, grid) {
  if (voxelData.size === 0) {
    return {
      totalVoxels: grid.totalVoxels,
      renderedVoxels: 0,
      nonEmptyVoxels: 0,
      emptyVoxels: grid.totalVoxels,
      totalEntities: 0,
      minCount: 0,
      maxCount: 0,
      averageCount: 0
    };
  }

  let minCount = Infinity;
  let maxCount = -Infinity;
  let totalEntities = 0;

  for (const { count } of voxelData.values()) {
    minCount = Math.min(minCount, count);
    maxCount = Math.max(maxCount, count);
    totalEntities += count;
  }

  return {
    totalVoxels: grid.totalVoxels,
    renderedVoxels: voxelData.size,
    nonEmptyVoxels: voxelData.size,
    emptyVoxels: grid.totalVoxels - voxelData.size,
    totalEntities,
    minCount,
    maxCount,
    averageCount: totalEntities / voxelData.size
  };
}

function evaluateScenario(pattern, dataset, scenario) {
  const controller = new AdaptiveController({
    adaptiveParams: { ...scenario.adaptiveParams }
  });

  const renderOptions = {
    adaptiveOutlines: true,
    outlineWidthPreset: 'adaptive-density',
    outlineWidth: 2,
    opacity: DEFAULT_OPTIONS.opacity,
    outlineOpacity: DEFAULT_OPTIONS.outlineOpacity ?? 1.0,
    outlineRenderMode: 'standard',
    highlightTopN: null,
    adaptiveParams: { ...scenario.adaptiveParams }
  };

  const metrics = {
    total: 0,
    denseAreaCount: 0,
    outlineWidthSum: 0,
    outlineWidthSqSum: 0,
    boxOpacitySum: 0,
    outlineOpacitySum: 0,
    emulationCount: 0,
    zScaleFactorSum: 0,
    clampHits: 0
  };

  const { voxelData, statistics, grid } = dataset;

  for (const info of voxelData.values()) {
    const result = controller.calculateAdaptiveParams(
      info,
      false,
      voxelData,
      statistics,
      renderOptions,
      grid
    );

    metrics.total += 1;

    const dense = result?._debug?.neighborhoodResult?.isDenseArea;
    if (dense) {
      metrics.denseAreaCount += 1;
    }

    const outlineWidth = result.outlineWidth ?? renderOptions.outlineWidth;
    const boxOpacity = result.boxOpacity ?? renderOptions.opacity;
    const outlineOpacity = result.outlineOpacity ?? renderOptions.outlineOpacity;
    const zScaleFactor = result?._debug?.zScaleFactor ?? 1.0;

    metrics.outlineWidthSum += outlineWidth;
    metrics.outlineWidthSqSum += outlineWidth * outlineWidth;
    metrics.boxOpacitySum += boxOpacity;
    metrics.outlineOpacitySum += outlineOpacity;
    metrics.zScaleFactorSum += zScaleFactor;

    if (result.shouldUseEmulation) {
      metrics.emulationCount += 1;
    }

    const { adaptiveParams } = renderOptions;
    if (adaptiveParams) {
      const { outlineWidthRange, minOutlineWidth, maxOutlineWidth } = adaptiveParams;
      const minW = Array.isArray(outlineWidthRange) ? outlineWidthRange[0] : minOutlineWidth;
      const maxW = Array.isArray(outlineWidthRange) ? outlineWidthRange[1] : maxOutlineWidth;
      if ((minW !== undefined && Math.abs(outlineWidth - minW) < 1e-6) ||
          (maxW !== undefined && Math.abs(outlineWidth - maxW) < 1e-6)) {
        metrics.clampHits += 1;
      }
    }
  }

  return summarizeMetrics(pattern.label, scenario.label, metrics);
}

function summarizeMetrics(patternLabel, scenarioLabel, metrics) {
  if (metrics.total === 0) {
    return {
      pattern: patternLabel,
      scenario: scenarioLabel,
      denseAreaRatio: 0,
      avgOutlineWidth: 0,
      outlineWidthStdDev: 0,
      avgBoxOpacity: 0,
      avgOutlineOpacity: 0,
      emulationUsage: 0,
      avgZScaleFactor: 0,
      clampRatio: 0
    };
  }

  const avgOutlineWidth = metrics.outlineWidthSum / metrics.total;
  const variance = (metrics.outlineWidthSqSum / metrics.total) - (avgOutlineWidth * avgOutlineWidth);
  const stdDev = Math.sqrt(Math.max(variance, 0));

  return {
    pattern: patternLabel,
    scenario: scenarioLabel,
    denseAreaRatio: metrics.denseAreaCount / metrics.total,
    avgOutlineWidth,
    outlineWidthStdDev: stdDev,
    avgBoxOpacity: metrics.boxOpacitySum / metrics.total,
    avgOutlineOpacity: metrics.outlineOpacitySum / metrics.total,
    emulationUsage: metrics.emulationCount / metrics.total,
    avgZScaleFactor: metrics.zScaleFactorSum / metrics.total,
    clampRatio: metrics.clampHits / metrics.total
  };
}

function printResults(byPattern) {
  for (const [patternLabel, evaluations] of byPattern.entries()) {
    console.log(`\nPattern: ${patternLabel}`);
    evaluations.forEach((entry) => {
      const formatted = simplifyForDisplay(entry);
      console.log(
        `  ${formatted.scenario.padEnd(16)} | dense=${formatted.denseAreaRatio.toFixed(3)} | ` +
        `width=${formatted.avgOutlineWidth.toFixed(3)} (σ=${formatted.outlineWidthStdDev.toFixed(3)}) | ` +
        `boxOpacity=${formatted.avgBoxOpacity.toFixed(3)} | outlineOpacity=${formatted.avgOutlineOpacity.toFixed(3)} | ` +
        `emulation=${formatted.emulationUsage.toFixed(3)} | zScale=${formatted.avgZScaleFactor.toFixed(3)}`
      );
    });
    const baseline = evaluations.find((entry) => entry.scenario === 'baseline-v0.1.14');
    const phase1 = evaluations.find((entry) => entry.scenario === 'phase1-defaults');
    if (baseline && phase1) {
      const delta = computeDelta(baseline, phase1);
      const formattedDelta = simplifyForDisplay(delta);
      console.log(
        `  delta              | dense=${formattedDelta.denseAreaRatio.toFixed(3)} | ` +
        `width=${formattedDelta.avgOutlineWidth.toFixed(3)} (σ=${formattedDelta.outlineWidthStdDev.toFixed(3)}) | ` +
        `boxOpacity=${formattedDelta.avgBoxOpacity.toFixed(3)} | outlineOpacity=${formattedDelta.avgOutlineOpacity.toFixed(3)} | ` +
        `emulation=${formattedDelta.emulationUsage.toFixed(3)} | zScale=${formattedDelta.avgZScaleFactor.toFixed(3)}`
      );
    }
  }
}

function simplifyForDisplay(result) {
  const formatter = (value) => (typeof value === 'number' ? Number(value.toFixed(3)) : value);
  return {
    pattern: result.pattern,
    scenario: result.scenario,
    denseAreaRatio: formatter(result.denseAreaRatio),
    avgOutlineWidth: formatter(result.avgOutlineWidth),
    outlineWidthStdDev: formatter(result.outlineWidthStdDev),
    avgBoxOpacity: formatter(result.avgBoxOpacity),
    avgOutlineOpacity: formatter(result.avgOutlineOpacity),
    emulationUsage: formatter(result.emulationUsage),
    avgZScaleFactor: formatter(result.avgZScaleFactor),
    clampRatio: formatter(result.clampRatio)
  };
}

function computeDelta(baseline, phase1) {
  const delta = { pattern: baseline.pattern, scenario: 'delta' };
  for (const key of Object.keys(baseline)) {
    if (typeof baseline[key] === 'number' && typeof phase1[key] === 'number') {
      delta[key] = phase1[key] - baseline[key];
    }
  }
  return delta;
}

function main() {
  const resultsByPattern = new Map();

  for (const pattern of PATTERNS) {
    const dataset = generateVoxelDataset(pattern.key);
    const evaluations = SCENARIOS.map((scenario) => evaluateScenario(pattern, dataset, scenario));
    resultsByPattern.set(pattern.label, evaluations);
  }

  printResults(resultsByPattern);
}

main();
