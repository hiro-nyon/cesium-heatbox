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
});
