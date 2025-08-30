# Legend Implementation Guide (凡例実装ガイド) (v0.1.6)

[English](#english) | [日本語](#日本語)

## English

Cesium-Heatbox does not include legend functionality in the main library but provides sample code that users can easily implement. This allows flexible adaptation to application-specific design and layout requirements.

### Basic Legend Implementation

#### 1. HTML Structure

```html
<div id="heatmap-legend" class="legend-container">
  <div class="legend-title">Data Density</div>
  <div class="legend-scale">
    <div class="legend-labels">
      <span class="legend-min">0</span>
      <span class="legend-max">100</span>
    </div>
    <div class="legend-gradient" id="legend-gradient"></div>
  </div>
</div>
```

#### 2. CSS Styles

```css
.legend-container {
  position: absolute;
  bottom: 30px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  font-family: Arial, sans-serif;
  min-width: 200px;
  z-index: 1000;
}

.legend-title {
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}

.legend-gradient {
  height: 20px;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 12px;
}
```

#### 3. JavaScript Implementation

```javascript
class HeatmapLegend {
  constructor(containerId = 'heatmap-legend') {
    this.container = document.getElementById(containerId);
    this.gradient = this.container.querySelector('#legend-gradient');
    this.minLabel = this.container.querySelector('.legend-min');
    this.maxLabel = this.container.querySelector('.legend-max');
  }

  /**
   * Update legend
   * @param {Object} options - Heatbox options
   * @param {Object} statistics - Data statistics
   */
  update(options, statistics) {
    // 1. Generate gradient based on color map
    const gradient = this.generateGradientCSS(options);
    this.gradient.style.background = gradient;

    // 2. Update labels
    this.updateLabels(statistics);

    // 3. Show/hide
    this.container.style.display = options.showLegend !== false ? 'block' : 'none';
  }

  /**
   * Generate CSS gradient from color map
   * @param {Object} options - Heatbox options
   * @returns {string} CSS gradient string
   */
  generateGradientCSS(options) {
    switch (options.colorMap) {
      case 'viridis':
        return 'linear-gradient(to right, #440154, #31688e, #35b779, #fde725)';
      
      case 'inferno':
        return 'linear-gradient(to right, #000004, #781c6d, #ed6925, #fcffa4)';
      
      case 'diverging':
        return 'linear-gradient(to right, #2166ac, #f7f7f7, #b2182b)';
      
      default: // custom
        const [minR, minG, minB] = options.minColor || [0, 32, 255];
        const [maxR, maxG, maxB] = options.maxColor || [255, 64, 0];
        return `linear-gradient(to right, rgb(${minR},${minG},${minB}), rgb(${maxR},${maxG},${maxB}))`;
    }
  }

  /**
   * Update numeric labels
   * @param {Object} statistics - Data statistics
   */
  updateLabels(statistics) {
    if (statistics) {
      this.minLabel.textContent = statistics.minCount || 0;
      this.maxLabel.textContent = statistics.maxCount || 0;
    }
  }

  /**
   * Add TopN highlight information
   * @param {number} topN - Highlight count
   */
  addTopNIndicator(topN) {
    if (topN && topN > 0) {
      // Remove existing TopN display
      const existing = this.container.querySelector('.legend-topn');
      if (existing) existing.remove();

      // Add TopN display
      const topnDiv = document.createElement('div');
      topnDiv.className = 'legend-topn';
      topnDiv.innerHTML = `
        <div style="margin-top: 10px; font-size: 11px; color: #666;">
          <strong>Top ${topN}</strong> highlighted with thick outline
        </div>
      `;
      this.container.appendChild(topnDiv);
    }
  }
}

// Usage example
const legend = new HeatmapLegend();

// Update legend after Heatbox generation
heatbox.addEventListener('heatmapGenerated', (event) => {
  const { options, statistics } = event.detail;
  legend.update(options, statistics);
  
  if (options.highlightTopN) {
    legend.addTopNIndicator(options.highlightTopN);
  }
});
```

### Advanced Legend Implementation

#### Discrete Value Display

```javascript
class DiscreteLegend extends HeatmapLegend {
  /**
   * Generate discrete value legend
   * @param {Array} thresholds - Threshold array
   * @param {Array} colors - Color array
   */
  generateDiscreteLegend(thresholds, colors) {
    const discreteContainer = document.createElement('div');
    discreteContainer.className = 'legend-discrete';
    
    thresholds.forEach((threshold, index) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `
        <div class="legend-color-box" style="background-color: ${colors[index]}"></div>
        <span class="legend-threshold">${threshold}+</span>
      `;
      discreteContainer.appendChild(item);
    });

    this.container.appendChild(discreteContainer);
  }
}
```

#### Responsive Design

```css
@media (max-width: 768px) {
  .legend-container {
    bottom: 10px;
    left: 10px;
    right: 10px;
    min-width: unset;
  }
  
  .legend-gradient {
    height: 15px;
  }
  
  .legend-labels {
    font-size: 10px;
  }
}
```

#### Dark Theme Support

```css
.legend-container.dark-theme {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: 1px solid #444;
}

.legend-container.dark-theme .legend-gradient {
  border-color: #666;
}
```

### Integration Example

```javascript
// Application initialization
const viewer = new Cesium.Viewer('cesiumContainer');
const heatbox = new Heatbox(viewer);
const legend = new HeatmapLegend();

// Generate heatmap with legend
async function generateHeatmapWithLegend() {
  // 1. Add data
  heatbox.addEntityDataArray(sampleData);
  
  // 2. Generate heatmap
  const options = {
    colorMap: 'viridis',
    highlightTopN: 5,
    voxelGap: 1.0,           // v0.1.6
    outlineOpacity: 0.8      // v0.1.6
  };
  
  await heatbox.generateHeatmap(options);
  
  // 3. Update legend
  const statistics = heatbox.getStatistics();
  legend.update(options, statistics);
  legend.addTopNIndicator(options.highlightTopN);
}

// UI control integration
document.getElementById('colorMapSelect').addEventListener('change', (e) => {
  const newOptions = { colorMap: e.target.value };
  heatbox.updateVisualization(newOptions);
  legend.update(newOptions, heatbox.getStatistics());
});
```

### Notes and Best Practices

#### Performance
- Avoid frequent legend updates with large datasets
- Use caching for gradient generation

#### Accessibility
- Use `aria-label` for screen reader support
- Consider high contrast display

#### Compatibility
- Tested with CesiumJS 1.120.0+
- Requires modern browsers (ES6 support)

### v0.2.0 Planned Extensions

- Support for discrete classification (quantize, jenks, etc.)
- Interactive legend (click for filtering)
- Custom color map editor integration

This implementation guide enables creation of flexible legends adapted to application requirements. Questions and improvement suggestions are welcome at [GitHub Issues](https://github.com/hiro-nyon/cesium-heatbox/issues).

## 日本語

Cesium-Heatboxでは凡例機能をライブラリ本体に含めず、ユーザーが実装しやすいサンプルコードを提供します。これにより、アプリケーション固有のデザインやレイアウト要件に柔軟に対応できます。

## 基本的な凡例の実装

### 1. HTML構造

```html
<div id="heatmap-legend" class="legend-container">
  <div class="legend-title">データ密度</div>
  <div class="legend-scale">
    <div class="legend-labels">
      <span class="legend-min">0</span>
      <span class="legend-max">100</span>
    </div>
    <div class="legend-gradient" id="legend-gradient"></div>
  </div>
</div>
```

### 2. CSS スタイル

```css
.legend-container {
  position: absolute;
  bottom: 30px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  font-family: Arial, sans-serif;
  min-width: 200px;
  z-index: 1000;
}

.legend-title {
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}

.legend-scale {
  position: relative;
}

.legend-gradient {
  height: 20px;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 12px;
}
```

### 3. JavaScript実装

```javascript
class HeatmapLegend {
  constructor(containerId = 'heatmap-legend') {
    this.container = document.getElementById(containerId);
    this.gradient = this.container.querySelector('#legend-gradient');
    this.minLabel = this.container.querySelector('.legend-min');
    this.maxLabel = this.container.querySelector('.legend-max');
  }

  /**
   * 凡例を更新
   * @param {Object} options - Heatboxのオプション
   * @param {Object} statistics - データ統計情報
   */
  update(options, statistics) {
    // 1. カラーマップに応じたグラデーション生成
    const gradient = this.generateGradientCSS(options);
    this.gradient.style.background = gradient;

    // 2. ラベル更新
    this.updateLabels(statistics);

    // 3. 表示/非表示
    this.container.style.display = options.showLegend !== false ? 'block' : 'none';
  }

  /**
   * カラーマップからCSSグラデーションを生成
   * @param {Object} options - Heatboxオプション
   * @returns {string} CSS gradient string
   */
  generateGradientCSS(options) {
    switch (options.colorMap) {
      case 'viridis':
        return 'linear-gradient(to right, #440154, #31688e, #35b779, #fde725)';
      
      case 'inferno':
        return 'linear-gradient(to right, #000004, #781c6d, #ed6925, #fcffa4)';
      
      case 'diverging':
        return 'linear-gradient(to right, #2166ac, #f7f7f7, #b2182b)';
      
      default: // custom
        const [minR, minG, minB] = options.minColor || [0, 32, 255];
        const [maxR, maxG, maxB] = options.maxColor || [255, 64, 0];
        return `linear-gradient(to right, rgb(${minR},${minG},${minB}), rgb(${maxR},${maxG},${maxB}))`;
    }
  }

  /**
   * 数値ラベルを更新
   * @param {Object} statistics - データ統計
   */
  updateLabels(statistics) {
    if (statistics) {
      this.minLabel.textContent = statistics.minCount || 0;
      this.maxLabel.textContent = statistics.maxCount || 0;
    }
  }

  /**
   * TopNハイライト情報を追加
   * @param {number} topN - ハイライト数
   */
  addTopNIndicator(topN) {
    if (topN && topN > 0) {
      // 既存のTopN表示を削除
      const existing = this.container.querySelector('.legend-topn');
      if (existing) existing.remove();

      // TopN表示を追加
      const topnDiv = document.createElement('div');
      topnDiv.className = 'legend-topn';
      topnDiv.innerHTML = `
        <div style="margin-top: 10px; font-size: 11px; color: #666;">
          <strong>Top ${topN}</strong> highlighted with thick outline
        </div>
      `;
      this.container.appendChild(topnDiv);
    }
  }

  /**
   * 分割数表示（将来の離散化カラーマップ用）
   * @param {number} classes - 分割数
   */
  showClassification(classes) {
    // v0.2.0 で実装予定の機能のプレースホルダー
    console.log(`Classification with ${classes} classes (planned for v0.2.0)`);
  }
}

// 使用例
const legend = new HeatmapLegend();

// Heatbox生成後に凡例を更新
heatbox.addEventListener('heatmapGenerated', (event) => {
  const { options, statistics } = event.detail;
  legend.update(options, statistics);
  
  if (options.highlightTopN) {
    legend.addTopNIndicator(options.highlightTopN);
  }
});
```

## 高度な凡例の実装

### 離散値表示

```javascript
class DiscreteLegend extends HeatmapLegend {
  /**
   * 離散値凡例を生成
   * @param {Array} thresholds - しきい値配列
   * @param {Array} colors - 色配列
   */
  generateDiscreteLegend(thresholds, colors) {
    const discreteContainer = document.createElement('div');
    discreteContainer.className = 'legend-discrete';
    
    thresholds.forEach((threshold, index) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `
        <div class="legend-color-box" style="background-color: ${colors[index]}"></div>
        <span class="legend-threshold">${threshold}+</span>
      `;
      discreteContainer.appendChild(item);
    });

    this.container.appendChild(discreteContainer);
  }
}
```

### レスポンシブ対応

```css
@media (max-width: 768px) {
  .legend-container {
    bottom: 10px;
    left: 10px;
    right: 10px;
    min-width: unset;
  }
  
  .legend-gradient {
    height: 15px;
  }
  
  .legend-labels {
    font-size: 10px;
  }
}
```

### ダークテーマ対応

```css
.legend-container.dark-theme {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: 1px solid #444;
}

.legend-container.dark-theme .legend-gradient {
  border-color: #666;
}
```

## 統合例

```javascript
// アプリケーション初期化時
const viewer = new Cesium.Viewer('cesiumContainer');
const heatbox = new Heatbox(viewer);
const legend = new HeatmapLegend();

// データ生成とヒートマップ作成
async function generateHeatmapWithLegend() {
  // 1. データ追加
  heatbox.addEntityDataArray(sampleData);
  
  // 2. ヒートマップ生成
  const options = {
    colorMap: 'viridis',
    highlightTopN: 5,
    voxelGap: 1.0,           // v0.1.6
    outlineOpacity: 0.8      // v0.1.6
  };
  
  await heatbox.generateHeatmap(options);
  
  // 3. 凡例更新
  const statistics = heatbox.getStatistics();
  legend.update(options, statistics);
  legend.addTopNIndicator(options.highlightTopN);
}

// UI制御との連携
document.getElementById('colorMapSelect').addEventListener('change', (e) => {
  const newOptions = { colorMap: e.target.value };
  heatbox.updateVisualization(newOptions);
  legend.update(newOptions, heatbox.getStatistics());
});
```

## 注意事項とベストプラクティス

### パフォーマンス
- 大量データでの頻繁な凡例更新は避ける
- グラデーション生成はキャッシュを活用

### アクセシビリティ
- `aria-label` でスクリーンリーダー対応
- 高コントラスト表示への配慮

### 互換性
- CesiumJS 1.120.0+ で動作確認済み
- モダンブラウザ（ES6対応）が必要

## v0.2.0での拡張予定

- 離散化分類（quantize, jenks等）への対応
- インタラクティブな凡例（クリックでフィルタリング）
- カスタムカラーマップエディタ連携

---

この実装ガイドにより、アプリケーション要件に合わせた柔軟な凡例を作成できます。質問や改善提案は [GitHub Issues](https://github.com/hiro-nyon/cesium-heatbox/issues) でお聞かせください。
