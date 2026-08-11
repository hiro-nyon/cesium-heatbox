import { TimeSlicer } from './TimeSlicer.js';
import { Logger } from '../../utils/logger.js';

/**
 * Controller to synchronize Heatbox with Cesium Clock.
 * Cesium Clock と Heatbox を連携させるコントローラ。
 */
export class TimeController {
    /**
     * @param {Cesium.Viewer} viewer 
     * @param {Heatbox} heatbox 
     * @param {Object} options 
     */
    constructor(viewer, heatbox, options) {
        this._viewer = viewer;
        this._heatbox = heatbox;
        this._options = options;

        // Initialize TimeSlicer
        this._slicer = new TimeSlicer(options.data, options);

        this._lastUpdateTime = null;      // Last real time update (for throttling)
        this._lastEntry = null;           // Last data entry (for change detection)
        this._removeListener = null;      // Clock listener remover
        this._removeCameraListener = null;
        this._isActive = false;
        this._lastCameraRefreshTime = 0;
        this._asyncTickRequestId = 0;
        this._updateInFlight = null;
        this._queuedEntry = null;
        this._hasQueuedEntry = false;
    }

    /**
     * Activate the controller.
     * コントローラを有効化します。
     */
    activate() {
        if (this._isActive) return;
        this._isActive = true;

        // Global scope: calculate stats once
        if (this._options.classificationScope === 'global') {
            const heatboxOptions = this._heatbox.options || {};
            return this._activateWithAsyncStats(heatboxOptions.classification || null);
        }

        this._bindClockListener();
        this._bindCameraListener();

        // Initial update
        this._onTick(this._viewer.clock);
    }

    async _activateWithAsyncStats(classificationOptions) {
        let isCancelled = false;

        try {
            const heatboxOptions = this._heatbox.options || {};
            this._heatbox._globalStats = await this._slicer.calculateGlobalVoxelStats({
                ...heatboxOptions,
                classification: classificationOptions
            });
        } finally {
            isCancelled = !this._isActive;
        }

        if (isCancelled) {
            return;
        }

        this._bindClockListener();
        this._bindCameraListener();
        this._onTick(this._viewer.clock);
    }

    _bindClockListener() {
        if (this._removeListener) {
            return;
        }

        // Register clock listener
        this._removeListener = this._viewer.clock.onTick.addEventListener(
            this._onTick.bind(this)
        );
    }

    _bindCameraListener() {
        if (this._removeCameraListener || typeof this._viewer?.camera?.changed?.addEventListener !== 'function') {
            return;
        }

        this._removeCameraListener = this._viewer.camera.changed.addEventListener(
            this._onCameraChanged.bind(this)
        );
    }

    /**
     * Deactivate the controller.
     * コントローラを無効化します。
     */
    deactivate() {
        if (!this._isActive) return;
        this._isActive = false;
        this._asyncTickRequestId++;
        this._queuedEntry = null;
        this._hasQueuedEntry = false;

        if (this._removeListener) {
            this._removeListener();
            this._removeListener = null;
        }

        if (this._removeCameraListener) {
            this._removeCameraListener();
            this._removeCameraListener = null;
        }

        this._slicer.destroy();
    }

    /**
     * Handle clock tick.
     * Clock の更新を処理します。
     * @param {Cesium.Clock} clock 
     * @private
     */
    _onTick(clock) {
        if (this._options.dataSource || this._options.useWorker) {
            void this._handleAsyncTick(clock);
            return;
        }

        const now = clock.currentTime;

        // Throttling check
        if (!this._shouldUpdate(now)) return;

        // Get data for current time
        const entry = this._slicer.getEntry(now);

        // Change detection
        // Allow null entries to propagate so outOfRangeBehavior can run
        if (entry !== null && entry === this._lastEntry) {
            return;
        }

        this._lastEntry = entry;
        this._updateHeatbox(entry);
    }

    async _handleAsyncTick(clock) {
        const now = clock.currentTime;

        if (!this._shouldUpdate(now)) return;

        const requestId = ++this._asyncTickRequestId;
        const entry = await this._slicer.getEntryAsync(now);

        if (!this._isActive || requestId !== this._asyncTickRequestId) {
            return;
        }

        if (entry !== null && entry === this._lastEntry) {
            return;
        }

        this._lastEntry = entry;
        this._updateHeatbox(entry);
    }

    _onCameraChanged() {
        if (!this._isActive || !this._lastEntry) {
            return;
        }

        const now = Date.now();
        if (this._lastCameraRefreshTime && now - this._lastCameraRefreshTime < 50) {
            return;
        }

        this._lastCameraRefreshTime = now;
        this._updateHeatbox(this._lastEntry);
    }

    /**
     * Check if update should proceed (throttling).
     * 更新すべきか判定します（スロットリング）。
     * @param {Cesium.JulianDate} now 
     * @returns {boolean}
     * @private
     */
    _shouldUpdate(_now) {
        const interval = this._options.updateInterval;

        if (interval === 'frame' || !interval) {
            return true;  // Update every frame
        }

        // Check elapsed time since last update
        const currentRealTime = Date.now();
        if (
            this._lastUpdateTime === null ||
            currentRealTime - this._lastUpdateTime >= interval
        ) {
            this._lastUpdateTime = currentRealTime;
            return true;
        }

        return false;
    }

    /**
     * Update Heatbox with new data.
     * Heatbox を新しいデータで更新します。
     * @param {Object|null} entry 
     * @private
     */
    _updateHeatbox(entry) {
        if (this._updateInFlight) {
            this._queuedEntry = entry;
            this._hasQueuedEntry = true;
            return this._updateInFlight;
        }

        if (!entry) {
            // No data: check outOfRangeBehavior
            if (this._options.outOfRangeBehavior === 'clear') {
                this._heatbox.clear();
            }
            return;
        }

        // Update options
        const updateOptions = { _skipRebuild: false, _skipAutoView: true };

        // Global scope handling (Phase 3)
        if (this._options.classificationScope === 'global' && this._heatbox._globalStats) {
            updateOptions._externalStats = this._heatbox._globalStats;
        }

        const updateResult = typeof this._heatbox.updateValues === 'function'
            ? this._heatbox.updateValues(entry.data, updateOptions)
            : this._heatbox.setData(entry.data, updateOptions);

        if (!updateResult || typeof updateResult.then !== 'function') {
            return updateResult;
        }

        this._updateInFlight = Promise.resolve(updateResult)
            .catch((error) => {
                Logger.warn('Temporal Heatbox update failed:', error);
            })
            .finally(() => {
                this._updateInFlight = null;
                if (!this._isActive || !this._hasQueuedEntry) {
                    return;
                }

                const queuedEntry = this._queuedEntry;
                this._queuedEntry = null;
                this._hasQueuedEntry = false;
                this._updateHeatbox(queuedEntry);
            });

        return this._updateInFlight;
    }
}
