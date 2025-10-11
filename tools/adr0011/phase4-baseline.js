#!/usr/bin/env node
/**
 * ADR-0011 Phase 4 Baseline Metrics
 * Phase 4完了時点の適応制御メトリクスを測定し、ベースラインとして記録
 * Phase 1 との比較も実施（性能劣化チェック）
 * 
 * 使用方法:
 *   node tools/adr0011/phase4-baseline.js
 * 
 * @version 0.1.15
 */

const Module = require('module');
const fs = require('fs');
const { transformSync } = require('@babel/core');

// Babel loader for ES modules
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

// 3つのデータパターン（Phase 1 と同じ）
const PATTERNS = [
  { key: 'clustered', label: 'dense-data' },
  { key: 'scattered', label: 'sparse-data' },
  { key: 'mixed', label: 'mixed-data' }
];

const BASE_GRID_DIMENSIONS = { x: 18, y: 18, z: 4 };
const CELL_SIZE_METERS = { x: 20, y: 20, z: 5 };

// Phase 4 完了時点の設定（Phase 1 の phase1-defaults から継承）
const PHASE4_CONFIG = {
  label: 'phase4-complete',
  adaptiveParams: {
    ...DEFAULT_OPTIONS.adaptiveParams,
    // Phase 4 で追加・調整された設定があればここに記載
    // 現時点では Phase 1 のデフォルト値を継承
  }
};

// Phase 1 baseline for comparison
const PHASE1_BASELINE = {
  label: 'phase1-defaults',
  adaptiveParams: {
    neighborhoodRadius: 30,
    densityThreshold: 3,
    cameraDistanceFactor: 0.8,
    overlapRiskFactor: 0.4,
    minOutlineWidth: 1.0,
    maxOutlineWidth: 5.0,
    outlineWidthRange: null,
    boxOpacityRange: null,
    outlineOpacityRange: null,
    adaptiveOpacityEnabled: false,
    zScaleCompensation: true,
    overlapDetection: false
  }
};

/**
 * 擬似乱数生成（Phase 1 と同じアルゴリズム）
 */
function pseudoRandom(x, y, z) {
  const seed = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791);
  return ((seed % 1000) / 1000);
}

/**
 * ボクセルデータセットを生成（Phase 1 と同じ）
 */
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

/**
 * 統計情報を構築
 */
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

/**
 * シナリオを評価
 */
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
    zScaleAdjustments: 0,
    overlapDetections: 0,
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

    if (Math.abs(zScaleFactor - 1.0) > 1e-6) {
      metrics.zScaleAdjustments += 1;
    }

    if (result.shouldUseEmulation) {
      metrics.emulationCount += 1;
    }

    // Phase 4: overlapDetection チェック
    const overlapRec = result?._debug?.overlapRecommendation;
    if (overlapRec && overlapRec.recommendedMode === 'inset' && overlapRec.reason) {
      metrics.overlapDetections += 1;
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

/**
 * メトリクスをサマライズ
 */
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
      zScaleAdjustments: 0,
      overlapDetections: 0,
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
    zScaleAdjustments: metrics.zScaleAdjustments,
    overlapDetections: metrics.overlapDetections,
    clampRatio: metrics.clampHits / metrics.total
  };
}

/**
 * 結果を表示
 */
function printResults(byPattern) {
  console.log('\n='.repeat(80));
  console.log('ADR-0011 Phase 4 Baseline Metrics');
  console.log('='.repeat(80));
  
  for (const [patternLabel, evaluations] of byPattern.entries()) {
    console.log(`\nPattern: ${patternLabel}`);
    console.log('-'.repeat(80));
    
    evaluations.forEach((entry) => {
      const formatted = simplifyForDisplay(entry);
      console.log(
        `  ${formatted.scenario.padEnd(20)} | ` +
        `dense=${formatted.denseAreaRatio.toFixed(3)} | ` +
        `width=${formatted.avgOutlineWidth.toFixed(3)} (σ=${formatted.outlineWidthStdDev.toFixed(3)}) | ` +
        `boxOp=${formatted.avgBoxOpacity.toFixed(3)} | ` +
        `outOp=${formatted.avgOutlineOpacity.toFixed(3)} | ` +
        `emu=${formatted.emulationUsage.toFixed(3)} | ` +
        `zAdj=${formatted.zScaleAdjustments} | ` +
        `overlap=${formatted.overlapDetections}`
      );
    });

    // Phase 1 vs Phase 4 comparison
    const phase1 = evaluations.find((entry) => entry.scenario === 'phase1-defaults');
    const phase4 = evaluations.find((entry) => entry.scenario === 'phase4-complete');
    if (phase1 && phase4) {
      const delta = computeDelta(phase1, phase4);
      const formattedDelta = simplifyForDisplay(delta);
      console.log(
        `  ${'delta (phase4-phase1)'.padEnd(20)} | ` +
        `dense=${formattedDelta.denseAreaRatio >= 0 ? '+' : ''}${formattedDelta.denseAreaRatio.toFixed(3)} | ` +
        `width=${formattedDelta.avgOutlineWidth >= 0 ? '+' : ''}${formattedDelta.avgOutlineWidth.toFixed(3)} (σ=${formattedDelta.outlineWidthStdDev >= 0 ? '+' : ''}${formattedDelta.outlineWidthStdDev.toFixed(3)}) | ` +
        `boxOp=${formattedDelta.avgBoxOpacity >= 0 ? '+' : ''}${formattedDelta.avgBoxOpacity.toFixed(3)} | ` +
        `outOp=${formattedDelta.avgOutlineOpacity >= 0 ? '+' : ''}${formattedDelta.avgOutlineOpacity.toFixed(3)} | ` +
        `emu=${formattedDelta.emulationUsage >= 0 ? '+' : ''}${formattedDelta.emulationUsage.toFixed(3)} | ` +
        `zAdj=${formattedDelta.zScaleAdjustments >= 0 ? '+' : ''}${formattedDelta.zScaleAdjustments} | ` +
        `overlap=${formattedDelta.overlapDetections >= 0 ? '+' : ''}${formattedDelta.overlapDetections}`
      );
    }
  }

  // Generate ADR table
  console.log('\n' + '='.repeat(80));
  console.log('ADR-0011 Markdown Table (for insertion into ADR):');
  console.log('='.repeat(80));
  printMarkdownTable(byPattern);
}

/**
 * Markdown テーブルを出力
 */
function printMarkdownTable(byPattern) {
  console.log('\n| Pattern      | Scenario           | Dense Area Ratio | Avg Outline Width (σ) | Avg Box Opacity | Avg Outline Opacity | Emulation Usage | Z-Scale Adj | Overlaps |');
  console.log('| ------------ | ------------------ | ---------------- | --------------------- | --------------- | ------------------- | --------------- | ----------- | -------- |');
  
  for (const [patternLabel, evaluations] of byPattern.entries()) {
    for (const entry of evaluations) {
      console.log(
        `| ${entry.pattern.padEnd(12)} | ` +
        `${entry.scenario.padEnd(18)} | ` +
        `${entry.denseAreaRatio.toFixed(3).padEnd(16)} | ` +
        `${entry.avgOutlineWidth.toFixed(3)} (${entry.outlineWidthStdDev.toFixed(3)})`.padEnd(21) + ' | ' +
        `${entry.avgBoxOpacity.toFixed(3).padEnd(15)} | ` +
        `${entry.avgOutlineOpacity.toFixed(3).padEnd(19)} | ` +
        `${entry.emulationUsage.toFixed(3).padEnd(15)} | ` +
        `${String(entry.zScaleAdjustments).padEnd(11)} | ` +
        `${String(entry.overlapDetections).padEnd(8)} |`
      );
    }

    // Delta row
    const phase1 = evaluations.find((entry) => entry.scenario === 'phase1-defaults');
    const phase4 = evaluations.find((entry) => entry.scenario === 'phase4-complete');
    if (phase1 && phase4) {
      const delta = computeDelta(phase1, phase4);
      console.log(
        `| ${patternLabel.padEnd(12)} | ` +
        `${'delta (p4-p1)'.padEnd(18)} | ` +
        `${(delta.denseAreaRatio >= 0 ? '+' : '') + delta.denseAreaRatio.toFixed(3)}`.padEnd(16) + ' | ' +
        `${(delta.avgOutlineWidth >= 0 ? '+' : '') + delta.avgOutlineWidth.toFixed(3)} (${(delta.outlineWidthStdDev >= 0 ? '+' : '') + delta.outlineWidthStdDev.toFixed(3)})`.padEnd(21) + ' | ' +
        `${(delta.avgBoxOpacity >= 0 ? '+' : '') + delta.avgBoxOpacity.toFixed(3)}`.padEnd(15) + ' | ' +
        `${(delta.avgOutlineOpacity >= 0 ? '+' : '') + delta.avgOutlineOpacity.toFixed(3)}`.padEnd(19) + ' | ' +
        `${(delta.emulationUsage >= 0 ? '+' : '') + delta.emulationUsage.toFixed(3)}`.padEnd(15) + ' | ' +
        `${(delta.zScaleAdjustments >= 0 ? '+' : '') + String(delta.zScaleAdjustments)}`.padEnd(11) + ' | ' +
        `${(delta.overlapDetections >= 0 ? '+' : '') + String(delta.overlapDetections)}`.padEnd(8) + ' |'
      );
    }
  }
}

/**
 * 表示用に簡略化
 */
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
    zScaleAdjustments: result.zScaleAdjustments,
    overlapDetections: result.overlapDetections,
    clampRatio: formatter(result.clampRatio)
  };
}

/**
 * デルタを計算
 */
function computeDelta(baseline, current) {
  const delta = { pattern: baseline.pattern, scenario: 'delta' };
  for (const key of Object.keys(baseline)) {
    if (typeof baseline[key] === 'number' && typeof current[key] === 'number') {
      delta[key] = current[key] - baseline[key];
    }
  }
  return delta;
}

/**
 * メイン実行
 */
function main() {
  console.log('\n🚀 Starting ADR-0011 Phase 4 Baseline Metrics Evaluation...\n');
  
  const resultsByPattern = new Map();
  const scenarios = [PHASE1_BASELINE, PHASE4_CONFIG];

  for (const pattern of PATTERNS) {
    const dataset = generateVoxelDataset(pattern.key);
    const evaluations = scenarios.map((scenario) => evaluateScenario(pattern, dataset, scenario));
    resultsByPattern.set(pattern.label, evaluations);
  }

  printResults(resultsByPattern);
  
  console.log('\n✅ Phase 4 Baseline Metrics Evaluation Complete!');
  console.log('📊 Copy the Markdown table above into docs/adr/ADR-0011-v0.1.15-adaptive-visualization-finalization.md\n');
}

main();

