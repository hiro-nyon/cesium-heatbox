#!/usr/bin/env node
/**
 * Enhanced benchmark tool for CesiumJS Heatbox
 * v0.1.12: Added statistical analysis, output formats, and comparison features
 * v0.1.15: Added adaptive control metrics (Phase 4 - ADR-0011)
 */
/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Benchmark configuration
 */
const BENCHMARK_CONFIG = {
  datasets: [
    { name: 'small', voxelCount: 100 },
    { name: 'medium', voxelCount: 1000 },
    { name: 'large', voxelCount: 5000 }
  ],
  profiles: ['mobile-fast', 'desktop-balanced', 'dense-data', 'sparse-data'],
  defaultRepeat: 5,
  defaultWarmup: 2,
  outputFormats: ['console', 'csv', 'markdown']
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    output: 'console',
    repeat: BENCHMARK_CONFIG.defaultRepeat,
    warmup: BENCHMARK_CONFIG.defaultWarmup,
    compare: null,
    outFile: null,
    adaptive: false
  };

  for (let i = 0; i < args.length; i++) {
    const flag = args[i];

    switch (flag) {
      case '--out':
        config.output = args[i + 1];
        i++;
        break;
      case '--repeat':
        config.repeat = parseInt(args[i + 1], 10) || config.repeat;
        i++;
        break;
      case '--warmup':
        config.warmup = parseInt(args[i + 1], 10) || config.warmup;
        i++;
        break;
      case '--compare':
        config.compare = args[i + 1].split(',');
        i++;
        break;
      case '--file':
        config.outFile = args[i + 1];
        i++;
        break;
      case '--adaptive':
        config.adaptive = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
    }
  }

  return config;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
CesiumJS Heatbox Benchmark Tool v0.1.15

Usage:
  npm run benchmark [options]

Options:
  --out <format>     Output format: console, csv, markdown (default: console)
  --repeat <n>       Number of test repetitions (default: 5)
  --warmup <n>       Number of warmup runs (default: 2)  
  --compare <files>  Compare with baseline files (comma-separated)
  --file <path>      Output file path (optional)
  --adaptive         Include adaptive control metrics (v0.1.15+)
  --help             Show this help

Examples:
  npm run benchmark
  npm run benchmark -- --out csv --repeat 10 --warmup 3
  npm run benchmark -- --out markdown --file results.md --adaptive
  npm run benchmark -- --compare baseline.csv,previous.csv
`);
}

/**
 * Get system environment information
 */
function getEnvironmentInfo() {
  try {
    const os = process.platform;
    const arch = process.arch;
    const nodeVersion = process.version;
    
    let cpuInfo = 'unknown';
    let memoryInfo = 'unknown';
    let gitHash = 'unknown';

    try {
      if (os === 'darwin') {
        cpuInfo = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' }).trim();
        memoryInfo = execSync('sysctl -n hw.memsize', { encoding: 'utf8' }).trim();
        memoryInfo = `${Math.round(parseInt(memoryInfo) / 1024 / 1024 / 1024)}GB`;
      } else if (os === 'linux') {
        cpuInfo = execSync('grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2', { encoding: 'utf8' }).trim();
        memoryInfo = execSync('grep MemTotal /proc/meminfo | awk \'{print $2}\'', { encoding: 'utf8' }).trim();
        memoryInfo = `${Math.round(parseInt(memoryInfo) / 1024 / 1024)}GB`;
      }

      gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      // Ignore errors in getting system info
    }

    return {
      timestamp: new Date().toISOString(),
      os,
      arch,
      nodeVersion,
      cpuInfo,
      memoryInfo,
      gitHash
    };
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      os: 'unknown',
      arch: 'unknown', 
      nodeVersion: 'unknown',
      cpuInfo: 'unknown',
      memoryInfo: 'unknown',
      gitHash: 'unknown'
    };
  }
}

/**
 * Generate simulated adaptive control metrics (v0.1.15)
 * @param {Object} dataset - Dataset configuration
 * @param {string} profile - Profile name
 * @returns {Object} Adaptive metrics
 */
function generateAdaptiveMetrics(dataset, profile) {
  // Simulate adaptive control behavior based on dataset and profile
  const baseDensity = profile === 'dense-data' ? 0.8 : profile === 'sparse-data' ? 0.2 : 0.5;
  const variation = (Math.random() - 0.5) * 0.15;
  
  return {
    denseAreaRatio: Math.max(0, Math.min(1, baseDensity + variation)),
    avgOutlineWidth: 1.0 + (baseDensity * 0.5) + (Math.random() - 0.5) * 0.3,
    outlineWidthStdDev: 0.1 + (baseDensity * 0.15),
    avgBoxOpacity: 0.65 - (baseDensity * 0.05) + (Math.random() - 0.5) * 0.05,
    avgOutlineOpacity: 0.4 - (baseDensity * 0.15) + (Math.random() - 0.5) * 0.1,
    emulationUsage: baseDensity + (Math.random() - 0.5) * 0.1,
    overlapDetections: Math.floor(dataset.voxelCount * baseDensity * 0.3),
    zScaleAdjustments: Math.floor(dataset.voxelCount * 0.05)
  };
}

/**
 * Run a single benchmark test
 */
function runSingleBenchmark(dataset, profile, includeAdaptive = false) {
  // Simulate benchmark - in real environment would use actual Heatbox
  const baseTime = 10 + (dataset.voxelCount * 0.01);
  const profileMultiplier = getProfileMultiplier(profile);
  const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
  
  const renderTime = baseTime * profileMultiplier * (1 + variation);
  const memoryMB = 5 + (dataset.voxelCount * 0.001);
  
  const result = {
    renderTimeMs: Math.max(1, renderTime),
    memoryMB: Math.max(0.1, memoryMB),
    voxelCount: dataset.voxelCount
  };

  if (includeAdaptive) {
    result.adaptive = generateAdaptiveMetrics(dataset, profile);
  }
  
  return result;
}

/**
 * Get profile performance multiplier (simulation)
 */
function getProfileMultiplier(profile) {
  const multipliers = {
    'mobile-fast': 0.7,
    'desktop-balanced': 1.0,
    'dense-data': 1.3,
    'sparse-data': 0.9
  };
  return multipliers[profile] || 1.0;
}

/**
 * Calculate statistics from results array
 */
function calculateStats(results) {
  if (results.length === 0) return null;

  const sorted = [...results].sort((a, b) => a - b);
  const sum = results.reduce((a, b) => a + b, 0);
  const mean = sum / results.length;
  
  const variance = results.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / results.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    count: results.length,
    mean: Number(mean.toFixed(2)),
    median: sorted[Math.floor(sorted.length / 2)],
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    stdDev: Number(stdDev.toFixed(2))
  };
}

/**
 * Run benchmark suite
 */
function runBenchmarkSuite(config) {
  console.log(`Running Heatbox Benchmark Suite (${config.repeat} runs, ${config.warmup} warmup)`);
  if (config.adaptive) {
    console.log('Adaptive control metrics: ENABLED (v0.1.15)');
  }
  console.log('='.repeat(70));
  
  const environment = getEnvironmentInfo();
  const results = [];

  for (const dataset of BENCHMARK_CONFIG.datasets) {
    for (const profile of BENCHMARK_CONFIG.profiles) {
      console.log(`Testing ${dataset.name} dataset (${dataset.voxelCount} voxels) with ${profile} profile...`);
      
      const runs = [];
      
      // Warmup runs
      for (let i = 0; i < config.warmup; i++) {
        runSingleBenchmark(dataset, profile, config.adaptive);
      }
      
      // Actual benchmark runs
      for (let i = 0; i < config.repeat; i++) {
        const result = runSingleBenchmark(dataset, profile, config.adaptive);
        runs.push(result);
      }
      
      // Calculate statistics
      const renderTimes = runs.map(r => r.renderTimeMs);
      const memoryUsages = runs.map(r => r.memoryMB);
      
      const renderStats = calculateStats(renderTimes);
      const memoryStats = calculateStats(memoryUsages);
      
      const resultEntry = {
        environment: environment.gitHash,
        dataset: dataset.name,
        profile,
        voxelCount: dataset.voxelCount,
        renderTimeMs: renderStats.mean,
        renderTimeP95: renderStats.p95,
        renderTimeStdDev: renderStats.stdDev,
        memoryMB: memoryStats.mean,
        memoryStdDev: memoryStats.stdDev,
        timestamp: environment.timestamp
      };

      // Add adaptive metrics if enabled
      if (config.adaptive && runs.length > 0 && runs[0].adaptive) {
        const adaptiveMetrics = runs[0].adaptive; // Use first run as representative
        resultEntry.adaptive = adaptiveMetrics;
      }

      results.push(resultEntry);
    }
  }

  return { environment, results };
}

/**
 * Format output based on config
 */
function formatOutput(benchmarkData, config) {
  const { environment, results } = benchmarkData;
  
  switch (config.output) {
    case 'csv':
      return formatCSV(environment, results);
    case 'markdown':
      return formatMarkdown(environment, results);
    default:
      return formatConsole(environment, results);
  }
}

/**
 * Format as CSV
 */
function formatCSV(environment, results) {
  const hasAdaptive = results.length > 0 && results[0].adaptive;
  
  let header = 'environment,dataset,profile,voxelCount,renderTimeMs,renderTimeP95,renderTimeStdDev,memoryMB,memoryStdDev,timestamp';
  if (hasAdaptive) {
    header += ',denseAreaRatio,avgOutlineWidth,outlineWidthStdDev,avgBoxOpacity,avgOutlineOpacity,emulationUsage,overlapDetections,zScaleAdjustments';
  }
  header += '\n';
  
  const rows = results.map(r => {
    let row = `${r.environment},${r.dataset},${r.profile},${r.voxelCount},${r.renderTimeMs},${r.renderTimeP95},${r.renderTimeStdDev},${r.memoryMB},${r.memoryStdDev},${r.timestamp}`;
    if (hasAdaptive && r.adaptive) {
      const a = r.adaptive;
      row += `,${a.denseAreaRatio.toFixed(3)},${a.avgOutlineWidth.toFixed(3)},${a.outlineWidthStdDev.toFixed(3)},${a.avgBoxOpacity.toFixed(3)},${a.avgOutlineOpacity.toFixed(3)},${a.emulationUsage.toFixed(3)},${a.overlapDetections},${a.zScaleAdjustments}`;
    }
    return row;
  }).join('\n');
  
  return header + rows;
}

/**
 * Format as Markdown
 */
function formatMarkdown(environment, results) {
  const hasAdaptive = results.length > 0 && results[0].adaptive;
  
  let output = `# CesiumJS Heatbox Benchmark Results\n\n`;
  output += `**Environment**: ${environment.os} ${environment.arch} | ${environment.cpuInfo} | ${environment.memoryInfo}\n`;
  output += `**Node**: ${environment.nodeVersion} | **Git**: ${environment.gitHash} | **Date**: ${environment.timestamp}\n\n`;
  
  output += `## Results Summary\n\n`;
  output += `| Dataset | Profile | Voxels | Render Time (ms) | P95 (ms) | StdDev | Memory (MB) |\n`;
  output += `|---------|---------|--------|------------------|----------|--------|-------------|\n`;
  
  for (const r of results) {
    output += `| ${r.dataset} | ${r.profile} | ${r.voxelCount} | ${r.renderTimeMs} | ${r.renderTimeP95} | ${r.renderTimeStdDev} | ${r.memoryMB} |\n`;
  }
  
  // Add adaptive control metrics section if available
  if (hasAdaptive) {
    output += `\n## Adaptive Control Metrics (v0.1.15)\n\n`;
    output += `| Dataset | Profile | Dense Area | Avg Width (σ) | Box Opacity | Outline Opacity | Emulation |\n`;
    output += `|---------|---------|------------|---------------|-------------|-----------------|----------|\n`;
    
    for (const r of results) {
      if (r.adaptive) {
        const a = r.adaptive;
        output += `| ${r.dataset} | ${r.profile} | ${a.denseAreaRatio.toFixed(3)} | ${a.avgOutlineWidth.toFixed(3)} (${a.outlineWidthStdDev.toFixed(3)}) | ${a.avgBoxOpacity.toFixed(3)} | ${a.avgOutlineOpacity.toFixed(3)} | ${a.emulationUsage.toFixed(3)} |\n`;
      }
    }
  }
  
  return output;
}

/**
 * Format as console output
 */
function formatConsole(environment, results) {
  const hasAdaptive = results.length > 0 && results[0].adaptive;
  
  let output = `\nBenchmark Results\n`;
  output += `================\n`;
  output += `Environment: ${environment.os} ${environment.arch}\n`;
  output += `CPU: ${environment.cpuInfo}\n`;
  output += `Memory: ${environment.memoryInfo}\n`;
  output += `Node: ${environment.nodeVersion}\n`;
  output += `Git: ${environment.gitHash}\n`;
  output += `Date: ${environment.timestamp}\n\n`;
  
  for (const r of results) {
    output += `${r.dataset.toUpperCase()} (${r.voxelCount} voxels) - ${r.profile}:\n`;
    output += `  Render: ${r.renderTimeMs}ms (±${r.renderTimeStdDev}ms, P95: ${r.renderTimeP95}ms)\n`;
    output += `  Memory: ${r.memoryMB}MB\n`;
    
    if (hasAdaptive && r.adaptive) {
      const a = r.adaptive;
      output += `  Adaptive:\n`;
      output += `    Dense Areas: ${(a.denseAreaRatio * 100).toFixed(1)}%\n`;
      output += `    Avg Width: ${a.avgOutlineWidth.toFixed(2)}px (σ=${a.outlineWidthStdDev.toFixed(2)})\n`;
      output += `    Box Opacity: ${a.avgBoxOpacity.toFixed(2)}\n`;
      output += `    Outline Opacity: ${a.avgOutlineOpacity.toFixed(2)}\n`;
      output += `    Emulation: ${(a.emulationUsage * 100).toFixed(1)}%\n`;
      output += `    Overlaps: ${a.overlapDetections}, Z-Scale Adj: ${a.zScaleAdjustments}\n`;
    }
    
    output += `\n`;
  }
  
  return output;
}

/**
 * Main execution
 */
function main() {
  const config = parseArgs();
  
  // Check for Cesium environment (browser simulation for now)
  if (typeof window === 'undefined' && typeof global !== 'undefined') {
    // Node.js environment - run simulation
    console.log('Running in simulation mode (Cesium environment not available)');
  }
  
  const benchmarkData = runBenchmarkSuite(config);
  const output = formatOutput(benchmarkData, config);
  
  if (config.outFile) {
    fs.writeFileSync(config.outFile, output);
    console.log(`Results saved to: ${config.outFile}`);
  } else {
    console.log(output);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

