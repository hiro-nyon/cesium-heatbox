/**
 * @jest-environment node
 */

import { TimeSlicer } from '../../src/core/temporal/TimeSlicer.js';
import * as Cesium from 'cesium';

function padHour(hour) {
  return String(hour).padStart(2, '0');
}

function generateTemporalEntries(hours, pointsPerHour, valueKey = 'weight') {
  const entries = [];

  for (let i = 0; i < hours; i++) {
    const startIso = `2025-01-01T${padHour(i)}:00:00Z`;
    const stopIso = `2025-01-01T${padHour(i + 1)}:00:00Z`;

    const data = [];
    for (let j = 0; j < pointsPerHour; j++) {
      const value = i * pointsPerHour + j;
      data.push({
        weight: value,
        [valueKey]: value
      });
    }

    entries.push({ start: startIso, stop: stopIso, data });
  }

  return entries;
}

describe('Temporal deterministic performance guards', () => {
  test('sequential playback keeps cache hit rate ≥0.99', () => {
    const hours = 24;
    const entries = generateTemporalEntries(hours, 10);
    const slicer = new TimeSlicer(entries);
    const baseTime = Cesium.JulianDate.fromIso8601('2025-01-01T00:00:00Z');
    const iterationsPerHour = 200;

    for (let hour = 0; hour < hours; hour++) {
      const hourStart = Cesium.JulianDate.addSeconds(baseTime, hour * 3600, new Cesium.JulianDate());
      const sampleTime = Cesium.JulianDate.addSeconds(hourStart, 1800, new Cesium.JulianDate());

      for (let i = 0; i < iterationsPerHour; i++) {
        slicer.getEntry(sampleTime);
      }
    }

    expect(slicer.getCacheHitRate()).toBeGreaterThanOrEqual(0.99);
  });

  test('global stats handle 240k points and cache the result', () => {
    const hours = 24;
    const pointsPerHour = 10000;
    const entries = generateTemporalEntries(hours, pointsPerHour, 'intensity');
    const slicer = new TimeSlicer(entries);

    const stats = slicer.calculateGlobalStats('intensity');

    expect(stats).not.toBeNull();
    expect(stats.count).toBe(hours * pointsPerHour);
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(hours * pointsPerHour - 1);
    expect(stats.median).toBe((stats.count - 1) / 2);
    expect(stats.domain).toEqual([stats.min, stats.max]);
    expect(Array.isArray(stats.quantiles)).toBe(true);
    expect(stats.quantiles.length).toBe(3);

    const cached = slicer.calculateGlobalStats('intensity');
    expect(cached).toBe(stats);
  }, 20000);
});
