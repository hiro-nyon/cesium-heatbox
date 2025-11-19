import { TimeSlicer } from '../../../src/core/temporal/TimeSlicer.js';
import * as Cesium from 'cesium';

describe('TimeSlicer', () => {
    const baseTime = Cesium.JulianDate.fromIso8601('2025-01-01T00:00:00Z');

    const createTime = (offsetSeconds) => {
        return Cesium.JulianDate.addSeconds(baseTime, offsetSeconds, new Cesium.JulianDate());
    };

    const mockData = [
        {
            start: '2025-01-01T00:00:00Z',
            stop: '2025-01-01T01:00:00Z',
            data: [{ id: 1 }]
        },
        {
            start: '2025-01-01T01:00:00Z',
            stop: '2025-01-01T02:00:00Z',
            data: [{ id: 2 }]
        },
        {
            start: '2025-01-01T02:00:00Z',
            stop: '2025-01-01T03:00:00Z',
            data: [{ id: 3 }]
        }
    ];

    describe('constructor', () => {
        test('should normalize and sort data', () => {
            const unsorted = [mockData[1], mockData[0], mockData[2]];
            const slicer = new TimeSlicer(unsorted);

            const range = slicer.getTimeRange();
            expect(range.start).toBeDefined();
            expect(range.stop).toBeDefined();

            // Check if sorted
            const entry0 = slicer.getEntry(createTime(10)); // 00:00:10
            expect(entry0.data[0].id).toBe(1);
        });

        test('should throw error for empty data', () => {
            expect(() => new TimeSlicer([])).toThrow();
            expect(() => new TimeSlicer(null)).toThrow();
        });

        test('should detect overlaps when overlapResolution is skip', () => {
            const overlapping = [
                {
                    start: '2025-01-01T00:00:00Z',
                    stop: '2025-01-01T01:00:00Z',
                    data: []
                },
                {
                    start: '2025-01-01T00:30:00Z', // Overlaps
                    stop: '2025-01-01T01:30:00Z',
                    data: []
                }
            ];

            expect(() => new TimeSlicer(overlapping, { overlapResolution: 'skip' }))
                .toThrow(/overlap/);
        });

        test('should extend zero-length slices by one second', () => {
            const zeroLength = [
                { start: '2025-01-01T00:00:00Z', stop: '2025-01-01T00:00:00Z', data: [] }
            ];

            const slicer = new TimeSlicer(zeroLength);
            const range = slicer.getTimeRange();
            expect(Cesium.JulianDate.lessThan(range.start, range.stop)).toBe(true);
        });
    });

    describe('getEntry', () => {
        let slicer;

        beforeEach(() => {
            slicer = new TimeSlicer(mockData);
        });

        test('should return correct entry for time', () => {
            const time = createTime(3600 + 10); // 01:00:10
            const entry = slicer.getEntry(time);
            expect(entry).not.toBeNull();
            expect(entry.data[0].id).toBe(2);
        });

        test('should return null for out of range time', () => {
            const time = createTime(-10); // Before start
            expect(slicer.getEntry(time)).toBeNull();
        });

        test('should handle boundary conditions (start inclusive)', () => {
            const time = createTime(3600); // 01:00:00 (Start of 2nd entry)
            const entry = slicer.getEntry(time);
            expect(entry.data[0].id).toBe(2);
        });

        test('should handle boundary conditions (stop exclusive)', () => {
            const time = createTime(3600 - 0.001); // Just before 01:00:00
            const entry = slicer.getEntry(time);
            expect(entry.data[0].id).toBe(1);
        });

        test('should recover when time moves backwards (reverse playback)', () => {
            const slicer = new TimeSlicer(mockData);

            const forwardTime = createTime(2 * 3600 + 10);
            const forwardEntry = slicer.getEntry(forwardTime);
            expect(forwardEntry.data[0].id).toBe(3);

            const backwardTime = createTime(10);
            const backwardEntry = slicer.getEntry(backwardTime);
            expect(backwardEntry.data[0].id).toBe(1);
        });

        test('should report cache hit rate when repeatedly sampling same entry', () => {
            const slicer = new TimeSlicer(mockData);
            const time = createTime(120); // Inside first entry

            slicer.getEntry(time); // warm up, cache miss
            slicer.getEntry(time); // cache hit
            slicer.getEntry(time); // cache hit

            expect(slicer.getCacheHitRate()).toBeGreaterThan(0);
            expect(slicer.getCacheHitRate()).toBeLessThanOrEqual(1);
        });
    });

    describe('overlapResolution handling', () => {
        const overlappingData = [
            {
                start: '2025-01-01T00:00:00Z',
                stop: '2025-01-01T01:00:00Z',
                data: [{ id: 'early' }]
            },
            {
                start: '2025-01-01T00:30:00Z',
                stop: '2025-01-01T01:30:00Z',
                data: [{ id: 'late' }]
            }
        ];

        test('prefer-earlier (default) keeps first entry until it ends', () => {
            const slicer = new TimeSlicer(overlappingData);
            const withinFirst = slicer.getEntry(createTime(15 * 60)); // 00:15
            expect(withinFirst.data[0].id).toBe('early');

            const afterOverlap = slicer.getEntry(createTime(75 * 60)); // 01:15
            expect(afterOverlap.data[0].id).toBe('late');
        });

        test('prefer-later prioritizes later entry inside overlap', () => {
            const slicer = new TimeSlicer(overlappingData, { overlapResolution: 'prefer-later' });

            const beforeOverlap = slicer.getEntry(createTime(10 * 60));
            expect(beforeOverlap.data[0].id).toBe('early');

            const insideOverlap = slicer.getEntry(createTime(45 * 60));
            expect(insideOverlap.data[0].id).toBe('late');
        });

        test('skip mode throws on overlapping data', () => {
            expect(() => new TimeSlicer(overlappingData, { overlapResolution: 'skip' }))
                .toThrow(/overlap/);
        });
    });

    describe('calculateGlobalStats', () => {
        test('uses provided valueProperty and caches results', () => {
            const data = [
                {
                    start: '2025-01-01T00:00:00Z',
                    stop: '2025-01-01T01:00:00Z',
                    data: [{ weight: 5, intensity: 100 }]
                },
                {
                    start: '2025-01-01T01:00:00Z',
                    stop: '2025-01-01T02:00:00Z',
                    data: [{ weight: 1, intensity: 50 }]
                }
            ];

            const slicer = new TimeSlicer(data);
            const stats = slicer.calculateGlobalStats('intensity');
            expect(stats).not.toBeNull();
            expect(stats.min).toBe(50);
            expect(stats.max).toBe(100);
            expect(stats.domain).toEqual([50, 100]);

            const cached = slicer.calculateGlobalStats('intensity');
            expect(cached).toBe(stats);
        });

        test('defaults to 1 when value property is missing', () => {
            const data = [
                {
                    start: '2025-01-01T00:00:00Z',
                    stop: '2025-01-01T01:00:00Z',
                    data: [{ id: 'a' }, { id: 'b' }]
                }
            ];

            const slicer = new TimeSlicer(data);
            const stats = slicer.calculateGlobalStats();
            expect(stats).not.toBeNull();
            expect(stats.min).toBe(1);
            expect(stats.max).toBe(1);
            expect(stats.count).toBe(2);
        });

        test('returns null when entries have no numeric values', () => {
            const data = [
                {
                    start: '2025-01-01T00:00:00Z',
                    stop: '2025-01-01T01:00:00Z',
                    data: [{ id: 'x', weight: 'invalid' }]
                }
            ];

            const slicer = new TimeSlicer(data);
            const stats = slicer.calculateGlobalStats('weight');
            expect(stats).toBeNull();
        });
    });
});
