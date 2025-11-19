import * as Cesium from 'cesium';
import { TimeSlicer } from './TimeSlicer.js';

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
        this._isActive = false;
    }

    /**
     * Activate the controller.
     * コントローラを有効化します。
     */
    activate() {
        if (this._isActive) return;
        this._isActive = true;

        // Register clock listener
        this._removeListener = this._viewer.clock.onTick.addEventListener(
            this._onTick.bind(this)
        );

        // Initial update
        this._onTick(this._viewer.clock);
    }

    /**
     * Deactivate the controller.
     * コントローラを無効化します。
     */
    deactivate() {
        if (!this._isActive) return;
        this._isActive = false;

        if (this._removeListener) {
            this._removeListener();
            this._removeListener = null;
        }
    }

    /**
     * Handle clock tick.
     * Clock の更新を処理します。
     * @param {Cesium.Clock} clock 
     * @private
     */
    _onTick(clock) {
        const now = clock.currentTime;

        // Throttling check
        if (!this._shouldUpdate(now)) return;

        // Get data for current time
        const entry = this._slicer.getEntry(now);

        // Change detection
        if (entry === this._lastEntry) return;

        this._lastEntry = entry;
        this._updateHeatbox(entry);
    }

    /**
     * Check if update should proceed (throttling).
     * 更新すべきか判定します（スロットリング）。
     * @param {Cesium.JulianDate} now 
     * @returns {boolean}
     * @private
     */
    _shouldUpdate(now) {
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
        if (!entry) {
            // No data: check outOfRangeBehavior
            if (this._options.outOfRangeBehavior === 'clear') {
                this._heatbox.clear();
            }
            return;
        }

        // Update options
        const updateOptions = { _skipRebuild: false };

        // Global scope handling (Phase 3)
        // if (this._options.classificationScope === 'global') {
        //   updateOptions._externalStats = this._heatbox._globalStats;
        // }

        this._heatbox.setData(entry.data, updateOptions);
    }
}
