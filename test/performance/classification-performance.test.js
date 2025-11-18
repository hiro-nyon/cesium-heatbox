/**
 * @jest-environment jsdom
 */

import { Heatbox } from '../../src/Heatbox.js';
import { createMockViewer } from '../helpers/testHelpers.js';

describe('Classification Performance & Memory (ADR-0016 Phase 6)', () => {
  let viewer;

  beforeEach(() => {
    viewer = createMockViewer();
  });

  const baseOptions = {
    voxelSize: 30,
    showOutline: true,
    outlineRenderMode: 'standard',
    emulationScope: 'off'
  };

  const classificationPreset = {
    enabled: true,
    scheme: 'equal-interval',
    classes: 6,
    colorMap: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725']
  };

  async function measureMedianProcessingTime(entities, options, iterations = 3) {
    const durations = [];

    for (let i = 0; i < iterations; i++) {
      const heatbox = new Heatbox(viewer, options);
      const start = performance.now();
      await heatbox.createFromEntities(entities);
      durations.push(performance.now() - start);
      heatbox.clear();
    }

    durations.sort((a, b) => a - b);
    const median = durations[Math.floor(durations.length / 2)];
    const average = durations.reduce((sum, value) => sum + value, 0) / durations.length;
    return {
      median,
      average,
      min: durations[0],
      max: durations[durations.length - 1]
    };
  }

  function generateLatLonEntities(count) {
    const entities = [];
    for (let i = 0; i < count; i++) {
      entities.push({
        id: `entity-${i}`,
        position: {
          x: 139.68 + Math.random() * 0.04, // lon
          y: 35.68 + Math.random() * 0.03,  // lat
          z: Math.random() * 200
        },
        properties: {
          value: Math.random() * 100
        }
      });
    }
    return entities;
  }

  it('adds ≤15% median overhead compared to baseline', async () => {
    const entities = generateLatLonEntities(1500);

    const baseline = await measureMedianProcessingTime(entities, {
      ...baseOptions,
      classification: { enabled: false }
    }, 3);

    const classified = await measureMedianProcessingTime(entities, {
      ...baseOptions,
      classification: classificationPreset
    }, 3);

    const delta = Math.max(0, classified.median - baseline.median);
    const reference = Math.max(baseline.median, 1);
    const overheadPct = (delta / reference) * 100;
    const allowedDelta = Math.max(reference * 0.15, 15); // allow absolute jitter for CI

    console.log(`[classification-perf] baseline=${baseline.median.toFixed(2)}ms classified=${classified.median.toFixed(2)}ms Δ=${delta.toFixed(2)}ms (${overheadPct.toFixed(2)}%)`);
    expect(delta).toBeLessThanOrEqual(allowedDelta);
  }, 20000);

  it('quantile + multi-target stays within 3x of color-only quantile median', async () => {
    const entities = generateLatLonEntities(2000);

    const baseline = await measureMedianProcessingTime(entities, {
      ...baseOptions,
      classification: {
        enabled: true,
        scheme: 'quantile',
        classes: 5,
        colorMap: classificationPreset.colorMap,
        classificationTargets: { color: true }
      }
    }, 2);

    const multiTarget = await measureMedianProcessingTime(entities, {
      ...baseOptions,
      classification: {
        enabled: true,
        scheme: 'quantile',
        classes: 5,
        classificationTargets: { color: true, opacity: true, width: true },
        colorMap: classificationPreset.colorMap
      },
      adaptiveParams: {
        boxOpacityRange: [0.35, 0.95],
        outlineOpacityRange: [0.4, 1.0],
        outlineWidthRange: [1, 5]
      }
    }, 2);

    const ratio = multiTarget.median / Math.max(1, baseline.median);

    console.log(`[classification-quantile-multi] color=${baseline.median.toFixed(2)}ms multi=${multiTarget.median.toFixed(2)}ms ratio=${ratio.toFixed(2)}x`);
    expect(ratio).toBeLessThanOrEqual(3);
  }, 20000);

  it('classification stays under 80ms up to 2k entities', async () => {
    const counts = [500, 1000, 2000];

    for (const count of counts) {
      const entities = generateLatLonEntities(count);
      const result = await measureMedianProcessingTime(entities, {
        ...baseOptions,
        classification: classificationPreset
      }, 3);
      console.log(`[classification-scale] count=${count} median=${result.median.toFixed(2)}ms`);
      expect(result.median).toBeLessThan(80);
    }
  }, 30000);

  it('jenks stays within 3x of quantile median at 2k entities', async () => {
    const entities = generateLatLonEntities(2000);

    const quantile = await measureMedianProcessingTime(entities, {
      ...baseOptions,
      classification: {
        ...classificationPreset,
        scheme: 'quantile',
        classes: 5
      }
    }, 2);

    const jenks = await measureMedianProcessingTime(entities, {
      ...baseOptions,
      classification: {
        ...classificationPreset,
        scheme: 'jenks',
        classes: 5
      }
    }, 2);

    const ratio = jenks.median / Math.max(1, quantile.median);
    console.log(`[classification-jenks] quantile=${quantile.median.toFixed(2)}ms jenks=${jenks.median.toFixed(2)}ms ratio=${ratio.toFixed(2)}x`);
    expect(ratio).toBeLessThanOrEqual(3);
  }, 25000);

  it('incurs ≤20% memory overhead with classification enabled', async () => {
    if (typeof global.gc !== 'function') {
      console.warn('[classification-memory] Skipping memory test: run with --expose-gc to enable');
      return;
    }

    const entities = generateLatLonEntities(2000);

    global.gc();
    const memBeforeBaseline = process.memoryUsage().heapUsed;
    const baselineHeatbox = new Heatbox(viewer, {
      ...baseOptions,
      classification: { enabled: false }
    });
    await baselineHeatbox.createFromEntities(entities);
    const memAfterBaseline = process.memoryUsage().heapUsed;
    baselineHeatbox.clear();

    global.gc();
    const memBeforeClassified = process.memoryUsage().heapUsed;
    const classifiedHeatbox = new Heatbox(viewer, {
      ...baseOptions,
      classification: classificationPreset
    });
    await classifiedHeatbox.createFromEntities(entities);
    const memAfterClassified = process.memoryUsage().heapUsed;
    classifiedHeatbox.clear();

    const baselineMem = Math.max(memAfterBaseline - memBeforeBaseline, 1);
    const classifiedMem = Math.max(memAfterClassified - memBeforeClassified, 1);
    const overhead = (classifiedMem - baselineMem) / baselineMem;

    console.log(`[classification-memory] baseline=${(baselineMem / 1024 / 1024).toFixed(2)}MB classified=${(classifiedMem / 1024 / 1024).toFixed(2)}MB overhead=${(overhead * 100).toFixed(2)}%`);
    expect(overhead).toBeLessThan(0.2);
  }, 30000);

  it('multi-target classification keeps memory overhead within 15%', async () => {
    if (typeof global.gc !== 'function') {
      console.warn('[classification-memory-multitarget] Skipping memory test: run with --expose-gc to enable');
      return;
    }

    const entities = generateLatLonEntities(1800);

    global.gc();
    const memBeforeBaseline = process.memoryUsage().heapUsed;
    const baselineHeatbox = new Heatbox(viewer, {
      ...baseOptions,
      classification: { enabled: false }
    });
    await baselineHeatbox.createFromEntities(entities);
    const memAfterBaseline = process.memoryUsage().heapUsed;
    baselineHeatbox.clear();

    global.gc();
    const memBeforeMulti = process.memoryUsage().heapUsed;
    const multiHeatbox = new Heatbox(viewer, {
      ...baseOptions,
      classification: {
        enabled: true,
        scheme: 'quantile',
        classes: 5,
        classificationTargets: { color: true, opacity: true, width: true },
        colorMap: classificationPreset.colorMap
      },
      adaptiveParams: {
        boxOpacityRange: [0.35, 0.95],
        outlineOpacityRange: [0.4, 1.0],
        outlineWidthRange: [1, 5]
      }
    });
    await multiHeatbox.createFromEntities(entities);
    const memAfterMulti = process.memoryUsage().heapUsed;
    multiHeatbox.clear();

    const baselineMem = Math.max(memAfterBaseline - memBeforeBaseline, 1);
    const multiMem = Math.max(memAfterMulti - memBeforeMulti, 1);
    const overhead = (multiMem - baselineMem) / baselineMem;

    console.log(`[classification-memory-multi] baseline=${(baselineMem / 1024 / 1024).toFixed(2)}MB multi=${(multiMem / 1024 / 1024).toFixed(2)}MB overhead=${(overhead * 100).toFixed(2)}%`);
    expect(overhead).toBeLessThan(0.15);
  }, 30000);
});
