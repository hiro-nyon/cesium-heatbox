# Source: core/temporal/TimeSlicer.js

**日本語** | [English](#english)

## English

See also: [Class: TimeSlicer](TimeSlicer)

```javascript
import * as Cesium from 'cesium';
import { DataProcessor } from '../DataProcessor.js';
import { Logger } from '../../utils/logger.js';
import { TemporalWorkerBridge } from './TemporalWorkerBridge.js';
import { calculateTemporalStats, interpolateTemporalData } from './temporalWorkerTasks.js';

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
        this._dataSource = typeof options.dataSource === 'function' ? options.dataSource : null;
        this._entries = this._normalizeAndSort(rawData);
        this._currentIndex = 0;
        this._currentEntry = null;
        this._globalStatsCache = {};
        this._pendingLoad = null;
        this._workerBridge = new TemporalWorkerBridge(options);

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
        if ((!Array.isArray(rawData) || rawData.length === 0) && !this._dataSource) {
            throw new Error('Temporal data must be a non-empty array');
        }

        if (!Array.isArray(rawData) || rawData.length === 0) {
            return [];
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

        const entry = this._getDirectEntry(currentTime);
        if (entry) {
            return entry;
        }

        // Not found
        this._currentEntry = null;
        if (this._options.interpolate) {
            const interpolated = this._interpolateBetweenEntries(currentTime);
            this._currentEntry = interpolated;
            return interpolated;
        }
        return null;
    }

    async getEntryAsync(currentTime) {
        this._searchCount++;

        const existing = this._getDirectEntry(currentTime);
        if (existing) {
            return existing;
        }

        if (this._dataSource && !this._pendingLoad) {
            this._pendingLoad = Promise.resolve(
                this._dataSource(currentTime, {
                    loadedEntries: this._entries.length,
                    timeRange: this.getTimeRange()
                })
            )
                .then(result => {
                    this._pendingLoad = null;
                    this._mergeLoadedEntries(result);
                })
                .catch(error => {
                    this._pendingLoad = null;
                    Logger.warn('Temporal dataSource failed to provide data:', error);
                });
        }

        if (this._pendingLoad) {
            await this._pendingLoad;
            const loaded = this._getDirectEntry(currentTime);
            if (loaded) {
                return loaded;
            }
        }

        if (this._options.interpolate) {
            const interpolated = await this._interpolateBetweenEntriesAsync(currentTime);
            this._currentEntry = interpolated;
            return interpolated;
        }

        this._currentEntry = null;
        return null;
    }

    _getDirectEntry(currentTime) {
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

    _interpolateBetweenEntries(currentTime) {
        if (this._entries.length < 2) {
            return null;
        }

        for (let index = 0; index < this._entries.length - 1; index++) {
            const previous = this._entries[index];
            const next = this._entries[index + 1];
            const secondsFromPreviousStop = this._getSecondsDifference(currentTime, previous.stop);
            const secondsToNextStart = this._getSecondsDifference(next.start, currentTime);

            if (!Number.isFinite(secondsFromPreviousStop) || !Number.isFinite(secondsToNextStart)) {
                continue;
            }

            if (secondsFromPreviousStop < 0 || secondsToNextStart < 0) {
                continue;
            }

            const gapSeconds = this._getSecondsDifference(next.start, previous.stop);
            if (!Number.isFinite(gapSeconds) || gapSeconds <= 0) {
                continue;
            }

            const ratio = Math.max(0, Math.min(1, secondsFromPreviousStop / gapSeconds));
            const interpolatedData = interpolateTemporalData(previous.data, next.data, ratio);
            const stop = Cesium.JulianDate.addSeconds(currentTime, 1, new Cesium.JulianDate());

            return {
                start: currentTime,
                stop,
                data: interpolatedData,
                interpolated: true
            };
        }

        return null;
    }

    async _interpolateBetweenEntriesAsync(currentTime) {
        if (!this._workerBridge.isEnabled()) {
            return this._interpolateBetweenEntries(currentTime);
        }

        if (this._entries.length < 2) {
            return null;
        }

        for (let index = 0; index < this._entries.length - 1; index++) {
            const previous = this._entries[index];
            const next = this._entries[index + 1];
            const secondsFromPreviousStop = this._getSecondsDifference(currentTime, previous.stop);
            const secondsToNextStart = this._getSecondsDifference(next.start, currentTime);

            if (!Number.isFinite(secondsFromPreviousStop) || !Number.isFinite(secondsToNextStart)) {
                continue;
            }

            if (secondsFromPreviousStop < 0 || secondsToNextStart < 0) {
                continue;
            }

            const gapSeconds = this._getSecondsDifference(next.start, previous.stop);
            if (!Number.isFinite(gapSeconds) || gapSeconds <= 0) {
                continue;
            }

            const ratio = Math.max(0, Math.min(1, secondsFromPreviousStop / gapSeconds));
            let interpolatedData = null;

            try {
                interpolatedData = await this._workerBridge.run('interpolate', {
                    previousData: previous.data,
                    nextData: next.data,
                    ratio
                });
            } catch (error) {
                Logger.warn('Temporal interpolation worker failed, falling back to main thread:', error);
            }

            if (!Array.isArray(interpolatedData)) {
                interpolatedData = interpolateTemporalData(previous.data, next.data, ratio);
            }

            const stop = Cesium.JulianDate.addSeconds(currentTime, 1, new Cesium.JulianDate());
            return {
                start: currentTime,
                stop,
                data: interpolatedData,
                interpolated: true
            };
        }

        return null;
    }

    _mergeLoadedEntries(loadedEntries) {
        if (!loadedEntries) {
            return;
        }

        const normalized = Array.isArray(loadedEntries) ? loadedEntries : [loadedEntries];
        if (normalized.length === 0) {
            return;
        }

        const merged = [...this._entries, ...normalized];
        this._entries = this._normalizeAndSort(merged);
        this._invalidateGlobalStatsCache();
    }

    _invalidateGlobalStatsCache() {
        this._globalStatsCache = {};
    }

    _getSecondsDifference(left, right) {
        if (typeof Cesium.JulianDate.secondsDifference === 'function') {
            return Cesium.JulianDate.secondsDifference(left, right);
        }

        if (typeof Cesium.JulianDate.toDate === 'function') {
            return (Cesium.JulianDate.toDate(left).getTime() - Cesium.JulianDate.toDate(right).getTime()) / 1000;
        }

        if (left?._value instanceof Date && right?._value instanceof Date) {
            return (left._value.getTime() - right._value.getTime()) / 1000;
        }

        if (Number.isFinite(left?.dayNumber) && Number.isFinite(right?.dayNumber) &&
            Number.isFinite(left?.secondsOfDay) && Number.isFinite(right?.secondsOfDay)) {
            return ((left.dayNumber - right.dayNumber) * 86400) + (left.secondsOfDay - right.secondsOfDay);
        }

        return NaN;
    }

    /**
   * Calculate global statistics across all time entries.
   * 全時間のエントリーにまたがる統計量を計算します。
   * @param {string} valueProperty - Property name to use for value (default: 'weight')
   * @returns {Object} Global statistics
   */
    calculateGlobalStats(valueProperty = 'weight', classificationOptions = null) {
        const cacheKey = JSON.stringify({
            valueProperty,
            classification: classificationOptions || null
        });

        if (this._globalStatsCache[cacheKey]) {
            return this._globalStatsCache[cacheKey];
        }

        const stats = calculateTemporalStats(this._entries, valueProperty);
        if (!stats) {
            return null;
        }

        if (classificationOptions && classificationOptions.enabled) {
            const allValues = [];
            for (const entry of this._entries) {
                if (!Array.isArray(entry.data)) continue;
                for (const point of entry.data) {
                    const value = point[valueProperty] ?? 1;
                    if (typeof value === 'number') {
                        allValues.push(value);
                    }
                }
            }

            stats.classification = DataProcessor._buildClassificationStats(
                allValues,
                classificationOptions,
                stats.min,
                stats.max
            );
        }

        this._globalStatsCache[cacheKey] = stats;
        return stats;
    }

    async calculateGlobalStatsAsync(valueProperty = 'weight', classificationOptions = null) {
        const cacheKey = JSON.stringify({
            valueProperty,
            classification: classificationOptions || null
        });

        if (this._globalStatsCache[cacheKey]) {
            return this._globalStatsCache[cacheKey];
        }

        if (!this._workerBridge.isEnabled() || (classificationOptions && classificationOptions.enabled)) {
            return this.calculateGlobalStats(valueProperty, classificationOptions);
        }

        try {
            const stats = await this._workerBridge.run('stats', {
                entries: this._entries.map(entry => ({ data: entry.data })),
                valueProperty
            });

            if (stats) {
                this._globalStatsCache[cacheKey] = stats;
                return stats;
            }
        } catch (error) {
            Logger.warn('Temporal stats worker failed, falling back to main thread:', error);
        }

        return this.calculateGlobalStats(valueProperty, classificationOptions);
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

    destroy() {
        this._workerBridge.destroy();
    }
}

```

## 日本語

関連: [TimeSlicerクラス](TimeSlicer)

```javascript
import * as Cesium from 'cesium';
import { DataProcessor } from '../DataProcessor.js';
import { Logger } from '../../utils/logger.js';
import { TemporalWorkerBridge } from './TemporalWorkerBridge.js';
import { calculateTemporalStats, interpolateTemporalData } from './temporalWorkerTasks.js';

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
        this._dataSource = typeof options.dataSource === 'function' ? options.dataSource : null;
        this._entries = this._normalizeAndSort(rawData);
        this._currentIndex = 0;
        this._currentEntry = null;
        this._globalStatsCache = {};
        this._pendingLoad = null;
        this._workerBridge = new TemporalWorkerBridge(options);

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
        if ((!Array.isArray(rawData) || rawData.length === 0) && !this._dataSource) {
            throw new Error('Temporal data must be a non-empty array');
        }

        if (!Array.isArray(rawData) || rawData.length === 0) {
            return [];
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

        const entry = this._getDirectEntry(currentTime);
        if (entry) {
            return entry;
        }

        // Not found
        this._currentEntry = null;
        if (this._options.interpolate) {
            const interpolated = this._interpolateBetweenEntries(currentTime);
            this._currentEntry = interpolated;
            return interpolated;
        }
        return null;
    }

    async getEntryAsync(currentTime) {
        this._searchCount++;

        const existing = this._getDirectEntry(currentTime);
        if (existing) {
            return existing;
        }

        if (this._dataSource && !this._pendingLoad) {
            this._pendingLoad = Promise.resolve(
                this._dataSource(currentTime, {
                    loadedEntries: this._entries.length,
                    timeRange: this.getTimeRange()
                })
            )
                .then(result => {
                    this._pendingLoad = null;
                    this._mergeLoadedEntries(result);
                })
                .catch(error => {
                    this._pendingLoad = null;
                    Logger.warn('Temporal dataSource failed to provide data:', error);
                });
        }

        if (this._pendingLoad) {
            await this._pendingLoad;
            const loaded = this._getDirectEntry(currentTime);
            if (loaded) {
                return loaded;
            }
        }

        if (this._options.interpolate) {
            const interpolated = await this._interpolateBetweenEntriesAsync(currentTime);
            this._currentEntry = interpolated;
            return interpolated;
        }

        this._currentEntry = null;
        return null;
    }

    _getDirectEntry(currentTime) {
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

    _interpolateBetweenEntries(currentTime) {
        if (this._entries.length < 2) {
            return null;
        }

        for (let index = 0; index < this._entries.length - 1; index++) {
            const previous = this._entries[index];
            const next = this._entries[index + 1];
            const secondsFromPreviousStop = this._getSecondsDifference(currentTime, previous.stop);
            const secondsToNextStart = this._getSecondsDifference(next.start, currentTime);

            if (!Number.isFinite(secondsFromPreviousStop) || !Number.isFinite(secondsToNextStart)) {
                continue;
            }

            if (secondsFromPreviousStop < 0 || secondsToNextStart < 0) {
                continue;
            }

            const gapSeconds = this._getSecondsDifference(next.start, previous.stop);
            if (!Number.isFinite(gapSeconds) || gapSeconds <= 0) {
                continue;
            }

            const ratio = Math.max(0, Math.min(1, secondsFromPreviousStop / gapSeconds));
            const interpolatedData = interpolateTemporalData(previous.data, next.data, ratio);
            const stop = Cesium.JulianDate.addSeconds(currentTime, 1, new Cesium.JulianDate());

            return {
                start: currentTime,
                stop,
                data: interpolatedData,
                interpolated: true
            };
        }

        return null;
    }

    async _interpolateBetweenEntriesAsync(currentTime) {
        if (!this._workerBridge.isEnabled()) {
            return this._interpolateBetweenEntries(currentTime);
        }

        if (this._entries.length < 2) {
            return null;
        }

        for (let index = 0; index < this._entries.length - 1; index++) {
            const previous = this._entries[index];
            const next = this._entries[index + 1];
            const secondsFromPreviousStop = this._getSecondsDifference(currentTime, previous.stop);
            const secondsToNextStart = this._getSecondsDifference(next.start, currentTime);

            if (!Number.isFinite(secondsFromPreviousStop) || !Number.isFinite(secondsToNextStart)) {
                continue;
            }

            if (secondsFromPreviousStop < 0 || secondsToNextStart < 0) {
                continue;
            }

            const gapSeconds = this._getSecondsDifference(next.start, previous.stop);
            if (!Number.isFinite(gapSeconds) || gapSeconds <= 0) {
                continue;
            }

            const ratio = Math.max(0, Math.min(1, secondsFromPreviousStop / gapSeconds));
            let interpolatedData = null;

            try {
                interpolatedData = await this._workerBridge.run('interpolate', {
                    previousData: previous.data,
                    nextData: next.data,
                    ratio
                });
            } catch (error) {
                Logger.warn('Temporal interpolation worker failed, falling back to main thread:', error);
            }

            if (!Array.isArray(interpolatedData)) {
                interpolatedData = interpolateTemporalData(previous.data, next.data, ratio);
            }

            const stop = Cesium.JulianDate.addSeconds(currentTime, 1, new Cesium.JulianDate());
            return {
                start: currentTime,
                stop,
                data: interpolatedData,
                interpolated: true
            };
        }

        return null;
    }

    _mergeLoadedEntries(loadedEntries) {
        if (!loadedEntries) {
            return;
        }

        const normalized = Array.isArray(loadedEntries) ? loadedEntries : [loadedEntries];
        if (normalized.length === 0) {
            return;
        }

        const merged = [...this._entries, ...normalized];
        this._entries = this._normalizeAndSort(merged);
        this._invalidateGlobalStatsCache();
    }

    _invalidateGlobalStatsCache() {
        this._globalStatsCache = {};
    }

    _getSecondsDifference(left, right) {
        if (typeof Cesium.JulianDate.secondsDifference === 'function') {
            return Cesium.JulianDate.secondsDifference(left, right);
        }

        if (typeof Cesium.JulianDate.toDate === 'function') {
            return (Cesium.JulianDate.toDate(left).getTime() - Cesium.JulianDate.toDate(right).getTime()) / 1000;
        }

        if (left?._value instanceof Date && right?._value instanceof Date) {
            return (left._value.getTime() - right._value.getTime()) / 1000;
        }

        if (Number.isFinite(left?.dayNumber) && Number.isFinite(right?.dayNumber) &&
            Number.isFinite(left?.secondsOfDay) && Number.isFinite(right?.secondsOfDay)) {
            return ((left.dayNumber - right.dayNumber) * 86400) + (left.secondsOfDay - right.secondsOfDay);
        }

        return NaN;
    }

    /**
   * Calculate global statistics across all time entries.
   * 全時間のエントリーにまたがる統計量を計算します。
   * @param {string} valueProperty - Property name to use for value (default: 'weight')
   * @returns {Object} Global statistics
   */
    calculateGlobalStats(valueProperty = 'weight', classificationOptions = null) {
        const cacheKey = JSON.stringify({
            valueProperty,
            classification: classificationOptions || null
        });

        if (this._globalStatsCache[cacheKey]) {
            return this._globalStatsCache[cacheKey];
        }

        const stats = calculateTemporalStats(this._entries, valueProperty);
        if (!stats) {
            return null;
        }

        if (classificationOptions && classificationOptions.enabled) {
            const allValues = [];
            for (const entry of this._entries) {
                if (!Array.isArray(entry.data)) continue;
                for (const point of entry.data) {
                    const value = point[valueProperty] ?? 1;
                    if (typeof value === 'number') {
                        allValues.push(value);
                    }
                }
            }

            stats.classification = DataProcessor._buildClassificationStats(
                allValues,
                classificationOptions,
                stats.min,
                stats.max
            );
        }

        this._globalStatsCache[cacheKey] = stats;
        return stats;
    }

    async calculateGlobalStatsAsync(valueProperty = 'weight', classificationOptions = null) {
        const cacheKey = JSON.stringify({
            valueProperty,
            classification: classificationOptions || null
        });

        if (this._globalStatsCache[cacheKey]) {
            return this._globalStatsCache[cacheKey];
        }

        if (!this._workerBridge.isEnabled() || (classificationOptions && classificationOptions.enabled)) {
            return this.calculateGlobalStats(valueProperty, classificationOptions);
        }

        try {
            const stats = await this._workerBridge.run('stats', {
                entries: this._entries.map(entry => ({ data: entry.data })),
                valueProperty
            });

            if (stats) {
                this._globalStatsCache[cacheKey] = stats;
                return stats;
            }
        } catch (error) {
            Logger.warn('Temporal stats worker failed, falling back to main thread:', error);
        }

        return this.calculateGlobalStats(valueProperty, classificationOptions);
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

    destroy() {
        this._workerBridge.destroy();
    }
}

```
