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

        // Overlap validation
        if (this._options.overlapResolution === 'skip') {
            this._validateNoOverlap(normalized);
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

        // Linear search (Phase 1 implementation)
        // Phase 2 will implement binary search and optimization
        for (let i = 0; i < this._entries.length; i++) {
            const entry = this._entries[i];
            if (this._isInRange(currentTime, entry)) {
                this._currentIndex = i;
                this._currentEntry = entry;
                return entry;
            }
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
