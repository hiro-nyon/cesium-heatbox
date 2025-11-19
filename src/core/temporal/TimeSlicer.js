import * as Cesium from 'cesium';

/**
 * TimeSlicer class for managing and retrieving time-series data.
 * 時系列データの管理と高速検索を担当するクラス。
 */
export class TimeSlicer {
    /**
     * @param {Array} rawData - Array of temporal data entries
     * @param {Object} options - Options
     */
    constructor(rawData, options = {}) {
        this._options = options;
        this._entries = this._normalizeAndSort(rawData);
        this._currentIndex = 0;
        this._currentEntry = null;
        this._globalStatsCache = {};

        // Performance metrics
        this._searchCount = 0;
        this._cacheHits = 0;
    }

    /**
     * Normalize and sort raw data.
     * データの正規化とソートを行います。
     * @param {Array} rawData 
     * @returns {Array} Normalized entries
     * @private
     */
    _normalizeAndSort(rawData) {
        if (!Array.isArray(rawData) || rawData.length === 0) {
            throw new Error('Temporal data must be a non-empty array');
        }

        // Normalize
        const normalized = rawData.map((entry, index) => {
            if (!entry.start || !entry.stop || !entry.data) {
                throw new Error(
                    `Invalid entry at index ${index}: missing start, stop, or data`
                );
            }

            const start = this._toJulianDate(entry.start);
            const stop = this._toJulianDate(entry.stop);

            // Time validation
            if (Cesium.JulianDate.greaterThan(start, stop)) {
                throw new Error(
                    `Invalid time range at index ${index}: start > stop`
                );
            }

            // Handle single point in time
            if (Cesium.JulianDate.equals(start, stop)) {
                Cesium.JulianDate.addSeconds(start, 1, stop);
            }

            return { start, stop, data: entry.data };
        });

        // Sort
        normalized.sort((a, b) => Cesium.JulianDate.compare(a.start, b.start));

        // Overlap handling
        const resolution = this._options.overlapResolution || 'prefer-earlier';
        if (resolution === 'skip') {
            this._validateNoOverlap(normalized);
            return normalized;
        }
        if (resolution === 'prefer-earlier') {
            return this._resolvePreferEarlier(normalized);
        }
        if (resolution === 'prefer-later') {
            return this._resolvePreferLater(normalized);
        }

        return normalized;
    }

    /**
     * Convert various time formats to JulianDate.
     * 様々な時刻形式を JulianDate に変換します。
     * @param {Cesium.JulianDate|string|Date|number} value 
     * @returns {Cesium.JulianDate}
     * @private
     */
    _toJulianDate(value) {
        if (value instanceof Cesium.JulianDate) return value;
        if (typeof value === 'string') {
            return Cesium.JulianDate.fromIso8601(value);
        }
        if (value instanceof Date) {
            return Cesium.JulianDate.fromDate(value);
        }
        if (typeof value === 'number') {
            return Cesium.JulianDate.fromDate(new Date(value * 1000));
        }
        throw new Error(`Unsupported time format: ${typeof value}`);
    }

    /**
     * Validate that there are no overlaps between entries.
     * エントリー間に重複がないことを検証します。
     * @param {Array} entries 
     * @private
     */
    _validateNoOverlap(entries) {
        for (let i = 0; i < entries.length - 1; i++) {
            const current = entries[i];
            const next = entries[i + 1];

            if (Cesium.JulianDate.greaterThan(current.stop, next.start)) {
                throw new Error(
                    `Data overlap detected: entry ${i} stops at ${current.stop}, ` +
                    `but entry ${i + 1} starts at ${next.start}`
                );
            }
        }
    }

    /**
     * Resolve overlaps by keeping the earlier entry and trimming later entries.
     * 早いエントリーを優先し、後続エントリーをトリミングまたは破棄します。
     * @param {Array} entries 
     * @returns {Array}
     * @private
     */
    _resolvePreferEarlier(entries) {
        const resolved = [];

        for (const entry of entries) {
            const previous = resolved[resolved.length - 1];
            if (!previous) {
                resolved.push(entry);
                continue;
            }

            if (Cesium.JulianDate.greaterThan(previous.stop, entry.start)) {
                if (Cesium.JulianDate.greaterThanOrEquals(previous.stop, entry.stop)) {
                    // Entry is fully overlapped by previous, drop it
                    continue;
                }
                // Trim start to previous stop
                entry.start = Cesium.JulianDate.clone(previous.stop);
                if (!Cesium.JulianDate.lessThan(entry.start, entry.stop)) {
                    continue;
                }
            }

            resolved.push(entry);
        }

        return resolved;
    }

    /**
     * Resolve overlaps by prioritizing later entries.
     * 遅いエントリーを優先し、手前のエントリー終端を調整します。
     * @param {Array} entries 
     * @returns {Array}
     * @private
     */
    _resolvePreferLater(entries) {
        const resolved = [];

        for (const entry of entries) {
            while (resolved.length > 0) {
                const previous = resolved[resolved.length - 1];
                if (!Cesium.JulianDate.greaterThan(previous.stop, entry.start)) {
                    break;
                }

                if (
                    Cesium.JulianDate.lessThan(entry.start, previous.start) ||
                    Cesium.JulianDate.equals(entry.start, previous.start)
                ) {
                    // Later entry fully replaces previous
                    resolved.pop();
                    continue;
                }

                previous.stop = Cesium.JulianDate.clone(entry.start);
                if (!Cesium.JulianDate.lessThan(previous.start, previous.stop)) {
                    resolved.pop();
                    continue;
                }

                break;
            }

            resolved.push(entry);
        }

        return resolved;
    }

    /**
   * Get entry for the current time.
   * 現在時刻に対応するエントリーを取得します。
   * @param {Cesium.JulianDate} currentTime 
   * @returns {Object|null} Entry or null if not found
   */
    getEntry(currentTime) {
        this._searchCount++;

        // Cache check
        if (this._currentEntry) {
            if (
                Cesium.JulianDate.greaterThanOrEquals(currentTime, this._currentEntry.start) &&
                Cesium.JulianDate.lessThan(currentTime, this._currentEntry.stop)
            ) {
                this._cacheHits++;
                return this._currentEntry;
            }
        }

        // Nearby search (Phase 2)
        const nearbyIndices = [
            this._currentIndex,
            this._currentIndex + 1,
            this._currentIndex - 1
        ];

        for (const idx of nearbyIndices) {
            if (idx >= 0 && idx < this._entries.length) {
                const entry = this._entries[idx];
                if (this._isInRange(currentTime, entry)) {
                    this._currentIndex = idx;
                    this._currentEntry = entry;
                    return entry;
                }
            }
        }

        // Binary search (Phase 2)
        const index = this._binarySearch(currentTime);
        if (index >= 0) {
            this._currentIndex = index;
            this._currentEntry = this._entries[index];
            return this._currentEntry;
        }

        // Not found
        this._currentEntry = null;
        return null;
    }

    /**
     * Check if time is within entry range.
     * 時刻がエントリーの範囲内かチェックします。
     * @param {Cesium.JulianDate} time 
     * @param {Object} entry 
     * @returns {boolean}
     * @private
     */
    _isInRange(time, entry) {
        return (
            Cesium.JulianDate.greaterThanOrEquals(time, entry.start) &&
            Cesium.JulianDate.lessThan(time, entry.stop)
        );
    }

    /**
     * Binary search for the entry containing the time.
     * 二分探索で時刻を含むエントリーを探します。
     * @param {Cesium.JulianDate} time 
     * @returns {number} Index or -1 if not found
     * @private
     */
    _binarySearch(time) {
        let left = 0;
        let right = this._entries.length - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const entry = this._entries[mid];

            if (this._isInRange(time, entry)) {
                return mid;
            }

            if (Cesium.JulianDate.lessThan(time, entry.start)) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        return -1;
    }

    /**
   * Calculate global statistics across all time entries.
   * 全時間のエントリーにまたがる統計量を計算します。
   * @param {string} valueProperty - Property name to use for value (default: 'weight')
   * @returns {Object} Global statistics
   */
    calculateGlobalStats(valueProperty = 'weight') {
        const cacheKey = valueProperty;

        if (this._globalStatsCache[cacheKey]) {
            return this._globalStatsCache[cacheKey];
        }

        let min = Infinity;
        let max = -Infinity;
        let sum = 0;
        let count = 0;
        const allValues = [];

        for (const entry of this._entries) {
            if (!Array.isArray(entry.data)) continue;

            for (const point of entry.data) {
                const value = point[valueProperty] ?? 1; // Default to 1 if property missing
                if (typeof value !== 'number') continue;

                min = Math.min(min, value);
                max = Math.max(max, value);
                sum += value;
                count++;
                allValues.push(value);
            }
        }

        if (count === 0) {
            return null;
        }

        // Mean & Median
        const mean = sum / count;
        allValues.sort((a, b) => a - b);
        const median = this._calculateMedian(allValues);

        // Quantiles
        const quantiles = this._calculateQuantiles(allValues, [0.25, 0.5, 0.75]);

        this._globalStatsCache[cacheKey] = {
            min,
            max,
            mean,
            median,
            quantiles,
            domain: [min, max],
            count
        };

        return this._globalStatsCache[cacheKey];
    }

    _calculateMedian(sortedValues) {
        if (sortedValues.length === 0) return 0;
        const mid = Math.floor(sortedValues.length / 2);
        if (sortedValues.length % 2 === 0) {
            return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
        }
        return sortedValues[mid];
    }

    _calculateQuantiles(sortedValues, quantiles) {
        return quantiles.map(q => {
            const index = Math.floor(sortedValues.length * q);
            return sortedValues[Math.min(index, sortedValues.length - 1)];
        });
    }

    /**
     * Get cache hit rate.
     * キャッシュヒット率を取得します。
     * @returns {number}
     */
    getCacheHitRate() {
        return this._searchCount > 0
            ? this._cacheHits / this._searchCount
            : 0;
    }

    /**
     * Get time range of all data.
     * 全データの時間範囲を取得します。
     * @returns {Object|null} {start, stop}
     */
    getTimeRange() {
        if (this._entries.length === 0) {
            return null;
        }
        return {
            start: this._entries[0].start,
            stop: this._entries[this._entries.length - 1].stop
        };
    }
}
