<!-- Generated from docs/api/utils_performanceOverlay.js.html by npm run wiki:sync. Edit JSDoc in src/, not this page. -->

# Source: utils/performanceOverlay.js

**日本語** | [English](#english)

## English

See also: [Class: performanceOverlay](performanceOverlay)

```javascript
/**
 * Performance overlay for real-time statistics display
 * リアルタイム統計表示用パフォーマンスオーバーレイ
 *
 * @version 0.1.12
 */

/**
 * Performance Overlay UI component
 * パフォーマンスオーバーレイUIコンポーネント
 */
export class PerformanceOverlay {
  /**
   * Constructor
   * @param {Object} options - Overlay options / オーバーレイオプション
   * @param {string} [options.position='top-right'] - Position on screen / 画面上の位置
   * @param {number} [options.fpsAveragingWindowMs=1000] - FPS averaging window / FPS平均化ウィンドウ
   * @param {boolean} [options.autoUpdate=true] - Auto update enabled / 自動更新有効
   */
  constructor(options = {}) {
    this.options = {
      position: 'top-right',
      fpsAveragingWindowMs: 1000,
      autoUpdate: true,
      ...options
    };

    this.element = null;
    this.isVisible = false;
    this.updateInterval = null;
    this.frameTimeHistory = [];
    this.lastUpdateTime = Date.now();

    this._createOverlay();
  }

  /**
   * Create overlay DOM element
   * オーバーレイDOM要素を作成
   * @private
   */
  _createOverlay() {
    this.element = document.createElement('div');
    this.element.id = 'cesium-heatbox-perf-overlay';
    this.element.style.cssText = `
      position: absolute;
      ${this._getPositionStyles()}
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 10px;
      border-radius: 5px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      z-index: 1000;
      min-width: 200px;
      user-select: none;
      pointer-events: auto;
      display: none;
    `;

    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 2px;
      right: 5px;
      background: none;
      border: none;
      color: #fff;
      font-size: 16px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
    `;
    closeButton.onclick = () => this.hide();
    this.element.appendChild(closeButton);

    // Content container
    this.contentElement = document.createElement('div');
    this.contentElement.style.marginTop = '15px';
    this.element.appendChild(this.contentElement);

    // Add to document
    document.body.appendChild(this.element);
  }

  /**
   * Get position styles based on options
   * オプションに基づく位置スタイルを取得
   * @private
   */
  _getPositionStyles() {
    const positions = {
      'top-left': 'top: 10px; left: 10px;',
      'top-right': 'top: 10px; right: 10px;',
      'bottom-left': 'bottom: 10px; left: 10px;',
      'bottom-right': 'bottom: 10px; right: 10px;'
    };
    return positions[this.options.position] || positions['top-right'];
  }

  /**
   * Show overlay
   * オーバーレイを表示
   */
  show() {
    if (this.element) {
      this.element.style.display = 'block';
      this.isVisible = true;

      if (this.options.autoUpdate) {
        this.startAutoUpdate();
      }
    }
  }

  /**
   * Hide overlay
   * オーバーレイを非表示
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
      this.isVisible = false;
      this.stopAutoUpdate();
    }
  }

  /**
   * Toggle visibility
   * 表示/非表示を切り替え
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Update overlay content with statistics
   * 統計情報でオーバーレイ内容を更新
   *
   * @param {Object} stats - Performance statistics / パフォーマンス統計
   * @param {number} [frameTime] - Frame time in ms / フレーム時間（ミリ秒）
   */
  update(stats, frameTime) {
    if (!this.contentElement || !this.isVisible) return;

    // Track frame time for FPS calculation
    if (frameTime !== undefined) {
      this._trackFrameTime(frameTime);
    }

    const fps = this._calculateFPS();
    const content = this._formatStats(stats, fps, frameTime);
    this.contentElement.innerHTML = content;
  }

  /**
   * Track frame time for FPS calculation
   * FPS計算用のフレーム時間を追跡
   * @private
   */
  _trackFrameTime(frameTime) {
    const now = Date.now();
    this.frameTimeHistory.push({ time: now, frameTime });

    // Remove old entries
    const cutoff = now - this.options.fpsAveragingWindowMs;
    this.frameTimeHistory = this.frameTimeHistory.filter(entry => entry.time > cutoff);
  }

  /**
   * Calculate FPS from frame time history
   * フレーム時間履歴からFPSを計算
   * @private
   */
  _calculateFPS() {
    if (this.frameTimeHistory.length < 2) return 0;

    const avgFrameTime = this.frameTimeHistory.reduce((sum, entry) => sum + entry.frameTime, 0)
                        / this.frameTimeHistory.length;
    return avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 0;
  }

  /**
   * Format statistics for display
   * 表示用の統計フォーマット
   * @private
   */
  _formatStats(stats, fps, frameTime) {
    const lines = [];

    // Header
    lines.push('<div style="font-weight: bold; color: #4CAF50;">🚀 Performance Stats</div>');
    lines.push('');

    // FPS and Frame Time
    if (fps > 0) {
      const fpsColor = fps >= 30 ? '#4CAF50' : fps >= 15 ? '#FF9800' : '#F44336';
      lines.push(`<div style="color: ${fpsColor};">FPS: ${fps}</div>`);
    }
    if (frameTime !== undefined) {
      const frameColor = frameTime <= 33 ? '#4CAF50' : frameTime <= 66 ? '#FF9800' : '#F44336';
      lines.push(`<div style="color: ${frameColor};">Frame: ${frameTime.toFixed(1)}ms</div>`);
    }
    lines.push('');

    // Voxel Statistics
    if (stats) {
      lines.push('<div style="font-weight: bold;">Voxels:</div>');
      lines.push(`  Total: ${stats.totalVoxels || 0}`);
      lines.push(`  Rendered: ${stats.renderedVoxels || 0}`);

      if (stats.totalVoxels > 0) {
        const renderRatio = ((stats.renderedVoxels || 0) / stats.totalVoxels * 100).toFixed(1);
        lines.push(`  Ratio: ${renderRatio}%`);
      }

      if (stats.topNCount) {
        lines.push(`  TopN: ${stats.topNCount}`);
      }
      lines.push('');

      // Strategy Information
      if (stats.selectionStrategy) {
        lines.push('<div style="font-weight: bold;">Strategy:</div>');
        lines.push(`  Selection: ${stats.selectionStrategy}`);

        if (stats.coverageRatio !== undefined) {
          lines.push(`  Coverage: ${(stats.coverageRatio * 100).toFixed(1)}%`);
        }

        if (stats.renderBudgetTier) {
          lines.push(`  Budget Tier: ${stats.renderBudgetTier}`);
        }
        lines.push('');
      }

      // v0.1.15 Phase 3: Adaptive Control Metrics (ADR-0011)
      if (stats.adaptive) {
        lines.push('<div style="font-weight: bold; color: #2196F3;">📊 Adaptive Control:</div>');

        if (stats.adaptive.denseModeCount !== undefined) {
          const densePct = stats.renderedVoxels > 0
            ? ((stats.adaptive.denseModeCount / stats.renderedVoxels) * 100).toFixed(1)
            : '0.0';
          lines.push(`  Dense Areas: ${stats.adaptive.denseModeCount} (${densePct}%)`);
        }

        if (stats.adaptive.emulationModeCount !== undefined) {
          const emuPct = stats.renderedVoxels > 0
            ? ((stats.adaptive.emulationModeCount / stats.renderedVoxels) * 100).toFixed(1)
            : '0.0';
          lines.push(`  Emulation: ${stats.adaptive.emulationModeCount} (${emuPct}%)`);
        }

        if (stats.adaptive.avgOutlineWidth !== undefined) {
          const widthColor = stats.adaptive.avgOutlineWidth >= 1.0 && stats.adaptive.avgOutlineWidth <= 3.0
            ? '#4CAF50' : '#FF9800';
          lines.push(`  <span style="color: ${widthColor};">Avg Width: ${stats.adaptive.avgOutlineWidth.toFixed(2)}px</span>`);
        }

        if (stats.adaptive.overlapDetections !== undefined) {
          const overlapPct = stats.renderedVoxels > 0
            ? ((stats.adaptive.overlapDetections / stats.renderedVoxels) * 100).toFixed(1)
            : '0.0';
          const overlapColor = stats.adaptive.overlapDetections > 0 ? '#FF9800' : '#4CAF50';
          lines.push(`  <span style="color: ${overlapColor};">Overlaps: ${stats.adaptive.overlapDetections} (${overlapPct}%)</span>`);
        }

        if (stats.adaptive.zScaleAdjustments !== undefined && stats.adaptive.zScaleAdjustments > 0) {
          lines.push(`  Z-Scale Adj: ${stats.adaptive.zScaleAdjustments}`);
        }

        lines.push('');
      }

      // Performance Metrics
      if (stats.renderTimeMs !== undefined) {
        const renderColor = stats.renderTimeMs <= 50 ? '#4CAF50' : stats.renderTimeMs <= 100 ? '#FF9800' : '#F44336';
        lines.push(`<div style="color: ${renderColor};">Render Time: ${stats.renderTimeMs.toFixed(1)}ms</div>`);
      }

      if (stats.memoryUsageMB !== undefined) {
        const memColor = stats.memoryUsageMB <= 50 ? '#4CAF50' : stats.memoryUsageMB <= 100 ? '#FF9800' : '#F44336';
        lines.push(`<div style="color: ${memColor};">Memory: ${stats.memoryUsageMB.toFixed(1)}MB</div>`);
      }
    }

    return lines.join('<br>');
  }

  /**
   * Start automatic updates
   * 自動更新を開始
   */
  startAutoUpdate() {
    this.stopAutoUpdate();
    this.updateInterval = setInterval(() => {
      // Auto update is handled externally by providing stats
      // This just ensures the overlay stays responsive
    }, 100);
  }

  /**
   * Stop automatic updates
   * 自動更新を停止
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Destroy overlay
   * オーバーレイを破棄
   */
  destroy() {
    this.stopAutoUpdate();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.contentElement = null;
  }
}

```

## 日本語

関連: [performanceOverlayクラス](performanceOverlay)

```javascript
/**
 * Performance overlay for real-time statistics display
 * リアルタイム統計表示用パフォーマンスオーバーレイ
 *
 * @version 0.1.12
 */

/**
 * Performance Overlay UI component
 * パフォーマンスオーバーレイUIコンポーネント
 */
export class PerformanceOverlay {
  /**
   * Constructor
   * @param {Object} options - Overlay options / オーバーレイオプション
   * @param {string} [options.position='top-right'] - Position on screen / 画面上の位置
   * @param {number} [options.fpsAveragingWindowMs=1000] - FPS averaging window / FPS平均化ウィンドウ
   * @param {boolean} [options.autoUpdate=true] - Auto update enabled / 自動更新有効
   */
  constructor(options = {}) {
    this.options = {
      position: 'top-right',
      fpsAveragingWindowMs: 1000,
      autoUpdate: true,
      ...options
    };

    this.element = null;
    this.isVisible = false;
    this.updateInterval = null;
    this.frameTimeHistory = [];
    this.lastUpdateTime = Date.now();

    this._createOverlay();
  }

  /**
   * Create overlay DOM element
   * オーバーレイDOM要素を作成
   * @private
   */
  _createOverlay() {
    this.element = document.createElement('div');
    this.element.id = 'cesium-heatbox-perf-overlay';
    this.element.style.cssText = `
      position: absolute;
      ${this._getPositionStyles()}
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 10px;
      border-radius: 5px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      z-index: 1000;
      min-width: 200px;
      user-select: none;
      pointer-events: auto;
      display: none;
    `;

    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 2px;
      right: 5px;
      background: none;
      border: none;
      color: #fff;
      font-size: 16px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
    `;
    closeButton.onclick = () => this.hide();
    this.element.appendChild(closeButton);

    // Content container
    this.contentElement = document.createElement('div');
    this.contentElement.style.marginTop = '15px';
    this.element.appendChild(this.contentElement);

    // Add to document
    document.body.appendChild(this.element);
  }

  /**
   * Get position styles based on options
   * オプションに基づく位置スタイルを取得
   * @private
   */
  _getPositionStyles() {
    const positions = {
      'top-left': 'top: 10px; left: 10px;',
      'top-right': 'top: 10px; right: 10px;',
      'bottom-left': 'bottom: 10px; left: 10px;',
      'bottom-right': 'bottom: 10px; right: 10px;'
    };
    return positions[this.options.position] || positions['top-right'];
  }

  /**
   * Show overlay
   * オーバーレイを表示
   */
  show() {
    if (this.element) {
      this.element.style.display = 'block';
      this.isVisible = true;

      if (this.options.autoUpdate) {
        this.startAutoUpdate();
      }
    }
  }

  /**
   * Hide overlay
   * オーバーレイを非表示
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
      this.isVisible = false;
      this.stopAutoUpdate();
    }
  }

  /**
   * Toggle visibility
   * 表示/非表示を切り替え
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Update overlay content with statistics
   * 統計情報でオーバーレイ内容を更新
   *
   * @param {Object} stats - Performance statistics / パフォーマンス統計
   * @param {number} [frameTime] - Frame time in ms / フレーム時間（ミリ秒）
   */
  update(stats, frameTime) {
    if (!this.contentElement || !this.isVisible) return;

    // Track frame time for FPS calculation
    if (frameTime !== undefined) {
      this._trackFrameTime(frameTime);
    }

    const fps = this._calculateFPS();
    const content = this._formatStats(stats, fps, frameTime);
    this.contentElement.innerHTML = content;
  }

  /**
   * Track frame time for FPS calculation
   * FPS計算用のフレーム時間を追跡
   * @private
   */
  _trackFrameTime(frameTime) {
    const now = Date.now();
    this.frameTimeHistory.push({ time: now, frameTime });

    // Remove old entries
    const cutoff = now - this.options.fpsAveragingWindowMs;
    this.frameTimeHistory = this.frameTimeHistory.filter(entry => entry.time > cutoff);
  }

  /**
   * Calculate FPS from frame time history
   * フレーム時間履歴からFPSを計算
   * @private
   */
  _calculateFPS() {
    if (this.frameTimeHistory.length < 2) return 0;

    const avgFrameTime = this.frameTimeHistory.reduce((sum, entry) => sum + entry.frameTime, 0)
                        / this.frameTimeHistory.length;
    return avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 0;
  }

  /**
   * Format statistics for display
   * 表示用の統計フォーマット
   * @private
   */
  _formatStats(stats, fps, frameTime) {
    const lines = [];

    // Header
    lines.push('<div style="font-weight: bold; color: #4CAF50;">🚀 Performance Stats</div>');
    lines.push('');

    // FPS and Frame Time
    if (fps > 0) {
      const fpsColor = fps >= 30 ? '#4CAF50' : fps >= 15 ? '#FF9800' : '#F44336';
      lines.push(`<div style="color: ${fpsColor};">FPS: ${fps}</div>`);
    }
    if (frameTime !== undefined) {
      const frameColor = frameTime <= 33 ? '#4CAF50' : frameTime <= 66 ? '#FF9800' : '#F44336';
      lines.push(`<div style="color: ${frameColor};">Frame: ${frameTime.toFixed(1)}ms</div>`);
    }
    lines.push('');

    // Voxel Statistics
    if (stats) {
      lines.push('<div style="font-weight: bold;">Voxels:</div>');
      lines.push(`  Total: ${stats.totalVoxels || 0}`);
      lines.push(`  Rendered: ${stats.renderedVoxels || 0}`);

      if (stats.totalVoxels > 0) {
        const renderRatio = ((stats.renderedVoxels || 0) / stats.totalVoxels * 100).toFixed(1);
        lines.push(`  Ratio: ${renderRatio}%`);
      }

      if (stats.topNCount) {
        lines.push(`  TopN: ${stats.topNCount}`);
      }
      lines.push('');

      // Strategy Information
      if (stats.selectionStrategy) {
        lines.push('<div style="font-weight: bold;">Strategy:</div>');
        lines.push(`  Selection: ${stats.selectionStrategy}`);

        if (stats.coverageRatio !== undefined) {
          lines.push(`  Coverage: ${(stats.coverageRatio * 100).toFixed(1)}%`);
        }

        if (stats.renderBudgetTier) {
          lines.push(`  Budget Tier: ${stats.renderBudgetTier}`);
        }
        lines.push('');
      }

      // v0.1.15 Phase 3: Adaptive Control Metrics (ADR-0011)
      if (stats.adaptive) {
        lines.push('<div style="font-weight: bold; color: #2196F3;">📊 Adaptive Control:</div>');

        if (stats.adaptive.denseModeCount !== undefined) {
          const densePct = stats.renderedVoxels > 0
            ? ((stats.adaptive.denseModeCount / stats.renderedVoxels) * 100).toFixed(1)
            : '0.0';
          lines.push(`  Dense Areas: ${stats.adaptive.denseModeCount} (${densePct}%)`);
        }

        if (stats.adaptive.emulationModeCount !== undefined) {
          const emuPct = stats.renderedVoxels > 0
            ? ((stats.adaptive.emulationModeCount / stats.renderedVoxels) * 100).toFixed(1)
            : '0.0';
          lines.push(`  Emulation: ${stats.adaptive.emulationModeCount} (${emuPct}%)`);
        }

        if (stats.adaptive.avgOutlineWidth !== undefined) {
          const widthColor = stats.adaptive.avgOutlineWidth >= 1.0 && stats.adaptive.avgOutlineWidth <= 3.0
            ? '#4CAF50' : '#FF9800';
          lines.push(`  <span style="color: ${widthColor};">Avg Width: ${stats.adaptive.avgOutlineWidth.toFixed(2)}px</span>`);
        }

        if (stats.adaptive.overlapDetections !== undefined) {
          const overlapPct = stats.renderedVoxels > 0
            ? ((stats.adaptive.overlapDetections / stats.renderedVoxels) * 100).toFixed(1)
            : '0.0';
          const overlapColor = stats.adaptive.overlapDetections > 0 ? '#FF9800' : '#4CAF50';
          lines.push(`  <span style="color: ${overlapColor};">Overlaps: ${stats.adaptive.overlapDetections} (${overlapPct}%)</span>`);
        }

        if (stats.adaptive.zScaleAdjustments !== undefined && stats.adaptive.zScaleAdjustments > 0) {
          lines.push(`  Z-Scale Adj: ${stats.adaptive.zScaleAdjustments}`);
        }

        lines.push('');
      }

      // Performance Metrics
      if (stats.renderTimeMs !== undefined) {
        const renderColor = stats.renderTimeMs <= 50 ? '#4CAF50' : stats.renderTimeMs <= 100 ? '#FF9800' : '#F44336';
        lines.push(`<div style="color: ${renderColor};">Render Time: ${stats.renderTimeMs.toFixed(1)}ms</div>`);
      }

      if (stats.memoryUsageMB !== undefined) {
        const memColor = stats.memoryUsageMB <= 50 ? '#4CAF50' : stats.memoryUsageMB <= 100 ? '#FF9800' : '#F44336';
        lines.push(`<div style="color: ${memColor};">Memory: ${stats.memoryUsageMB.toFixed(1)}MB</div>`);
      }
    }

    return lines.join('<br>');
  }

  /**
   * Start automatic updates
   * 自動更新を開始
   */
  startAutoUpdate() {
    this.stopAutoUpdate();
    this.updateInterval = setInterval(() => {
      // Auto update is handled externally by providing stats
      // This just ensures the overlay stays responsive
    }, 100);
  }

  /**
   * Stop automatic updates
   * 自動更新を停止
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Destroy overlay
   * オーバーレイを破棄
   */
  destroy() {
    this.stopAutoUpdate();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.contentElement = null;
  }
}

```
