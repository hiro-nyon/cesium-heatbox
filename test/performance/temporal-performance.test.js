import { TimeSlicer } from '../../src/core/temporal/TimeSlicer.js';
import * as Cesium from 'cesium';

describe('TimeSlicer Performance', () => {
    const baseTime = Cesium.JulianDate.fromIso8601('2025-01-01T00:00:00Z');
    let largeData = [];
    const DATA_SIZE = 10000;

    beforeAll(() => {
        // Generate large dataset
        for (let i = 0; i < DATA_SIZE; i++) {
            largeData.push({
                start: Cesium.JulianDate.addSeconds(baseTime, i * 3600, new Cesium.JulianDate()),
                stop: Cesium.JulianDate.addSeconds(baseTime, (i + 1) * 3600, new Cesium.JulianDate()),
                data: [{ id: i }]
            });
        }
    });

    test('Binary search performance (random access)', () => {
        const slicer = new TimeSlicer(largeData);
        const randomIndices = Array.from({ length: 1000 }, () => Math.floor(Math.random() * DATA_SIZE));

        const start = performance.now();
        for (const idx of randomIndices) {
            const time = Cesium.JulianDate.addSeconds(baseTime, idx * 3600 + 10, new Cesium.JulianDate());
            slicer.getEntry(time);
        }
        const end = performance.now();
        const duration = end - start;

        console.log(`Random access (1000 queries): ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(50); // Should be very fast
    });

    test('Sequential access performance (caching)', () => {
        const slicer = new TimeSlicer(largeData);

        const start = performance.now();
        // Simulate sequential playback
        for (let i = 0; i < 1000; i++) {
            const time = Cesium.JulianDate.addSeconds(baseTime, i * 3600 + 10, new Cesium.JulianDate());
            slicer.getEntry(time);
        }
        const end = performance.now();
        const duration = end - start;

        console.log(`Sequential access (1000 queries): ${duration.toFixed(2)}ms`);
        console.log(`Cache hit rate: ${slicer.getCacheHitRate()}`);

        expect(duration).toBeLessThan(20); // Should be extremely fast due to nearby search
        // Cache hit rate might be low if we always move to next entry, but nearby search makes it fast.
        // To verify cache hits, we need multiple queries within same entry.
    });

    test('Cache hit verification', () => {
        const slicer = new TimeSlicer(largeData);

        // Query same entry multiple times
        const time1 = Cesium.JulianDate.addSeconds(baseTime, 10, new Cesium.JulianDate());
        const time2 = Cesium.JulianDate.addSeconds(baseTime, 20, new Cesium.JulianDate());

        slicer.getEntry(time1); // Miss (search)
        slicer.getEntry(time2); // Hit (cache)
        slicer.getEntry(time1); // Hit (cache)

        expect(slicer.getCacheHitRate()).toBeGreaterThan(0.5);
    });
});
