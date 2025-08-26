/**
 * CesiumJS Heatbox 基本例
 * UMDビルドを使用してブラウザ互換性を向上
 */

// UMDビルドからCesiumHeatboxを取得
const Heatbox = window.CesiumHeatbox || window.Heatbox;

// アプリケーションの状態
let viewer;
let heatbox;
let testEntities = [];
let isVisible = true;

// UI要素のキャッシュ
const elements = {};

/**
 * テスト用エンティティを生成する関数
 */
function generateLocalTestEntities(viewer, bounds, count) {
  const entities = [];
  for (let i = 0; i < count; i++) {
    const lon = bounds.minLon + Math.random() * (bounds.maxLon - bounds.minLon);
    const lat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
    const alt = bounds.minAlt + Math.random() * (bounds.maxAlt - bounds.minAlt);
    
    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
      point: {
        pixelSize: 5,
        color: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1
      }
    });
    entities.push(entity);
  }
  return entities;
}

/**
 * アプリケーションの初期化
 */
async function initializeApp() {
  try {
    // CesiumJS Viewerの初期化
    viewer = new Cesium.Viewer('cesiumContainer', {
      // プロトタイプの設定を参考
      homeButton: false,
      sceneModePicker: false,
      baseLayerPicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      geocoder: false,
      infoBox: true, // InfoBoxはクリックイベントで使うのでtrue
      selectionIndicator: true,
      creditContainer: document.createElement('div')
    });
    
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(139.7665, 35.6807, 800),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-30),
        roll: 0
      }
    });
    
    // UI要素を取得
    const uiElementIds = [
      'generateBtn', 'createHeatmapBtn', 'clearBtn', 'toggleBtn',
      'entityCount', 'voxelSize', 'opacity', 'opacityValue', 'showEmpty', 'showOutline',
      'wireframeOnly', 'heightBased', 'debugLogs', // v0.1.2 新機能 + debug制御
      'autoVoxelSize', 'manualVoxelSizeGroup', // v0.1.4 新機能
      'showBounds', 'colorMap', 'diverging', 'highlightTopN', // v0.1.5 新機能
      'voxelGap', 'voxelGapValue', 'outlineOpacity', 'outlineOpacityValue', 'adaptiveOutline', // v0.1.6 新機能
      'outlineInset', 'outlineInsetValue', 'outlineInsetMode', // v0.1.6.1 新機能
      'outlineRenderMode', 'adaptiveOutlines', 'outlineWidthPreset', 'useOpacityResolvers', 'adaptiveSettings', 'resolverDemo', // v0.1.7 新機能
      'statistics', 'statisticsContent', 'status'
    ];
    uiElementIds.forEach(id => {
      elements[id] = document.getElementById(id);
    });

    // Heatboxインスタンスの初期化
    heatbox = new Heatbox(viewer);
    
    setupEventListeners();
    updateStatus('アプリケーションが初期化されました');
    
  } catch (error) {
    console.error('初期化エラー:', error);
    updateStatus('初期化エラー: ' + error.message, true);
  }
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
  elements.generateBtn.addEventListener('click', () => {
    clearEntities();
    const count = parseInt(elements.entityCount.value, 10);
    updateStatus(`${count}個のテストエンティティを生成中...`);
    
    // 東京駅周辺の境界を定義
    const bounds = {
      minLon: 139.7640, maxLon: 139.7690,
      minLat: 35.6790, maxLat: 35.6830,
      minAlt: 0, maxAlt: 150
    };
    
    // 非同期でエンティティを生成
    setTimeout(() => {
      testEntities = generateLocalTestEntities(viewer, bounds, count);
      updateStatus(`${testEntities.length}個のエンティティを生成しました`);
      elements.createHeatmapBtn.disabled = false;
    }, 10);
  });
  
  elements.createHeatmapBtn.addEventListener('click', async () => {
    if (testEntities.length === 0) {
      updateStatus('エンティティを先に生成してください', true);
      return;
    }
    updateStatus('ヒートマップを作成中...');
    
    try {
      const options = getOptionsFromUI();
      // v0.1.2: 新しいヒートボックスインスタンスを作成
      heatbox = new Heatbox(viewer, options);
      
      // v0.1.2: createFromEntitiesを使用（非同期）
      const stats = await heatbox.createFromEntities(testEntities);
      
      if (stats) {
        displayStatistics(stats);
        updateStatus('ヒートマップを作成しました');
        elements.clearBtn.disabled = false;
        elements.toggleBtn.disabled = false;
      }
    } catch (error) {
      console.error('ヒートマップ作成エラー:', error);
      updateStatus('ヒートマップ作成に失敗しました', true);
    }
  });
  
  elements.clearBtn.addEventListener('click', () => {
    heatbox.clear();
    clearEntities();
    elements.statistics.style.display = 'none';
    elements.clearBtn.disabled = true;
    elements.toggleBtn.disabled = true;
    updateStatus('クリアしました');
  });
  
  elements.toggleBtn.addEventListener('click', () => {
    isVisible = !isVisible;
    heatbox.setVisible(isVisible);
    elements.toggleBtn.textContent = isVisible ? '非表示' : '表示';
    updateStatus(isVisible ? 'ヒートマップを表示' : 'ヒートマップを非表示');
  });

  // オプション変更時にヒートマップを再生成
  const optionInputs = ['voxelSize', 'opacity', 'showEmpty', 'showOutline'];
  optionInputs.forEach(id => {
    if (elements[id]) {
      elements[id].addEventListener('change', () => {
        if (heatbox && heatbox.getStatistics()) {
           elements.createHeatmapBtn.click();
        }
      });
    }
  });

  elements.opacity.addEventListener('input', e => {
    elements.opacityValue.textContent = e.target.value;
  });

  // v0.1.4: autoVoxelSizeチェックボックスの処理
  elements.autoVoxelSize.addEventListener('change', () => {
    const isAutoMode = elements.autoVoxelSize.checked;
    elements.manualVoxelSizeGroup.style.display = isAutoMode ? 'none' : 'block';
    
    if (heatbox && heatbox.getStatistics()) {
      elements.createHeatmapBtn.click(); // 再生成
    }
  });

  // v0.1.6: 新機能のリアルタイム値表示
  if (elements.voxelGap && elements.voxelGapValue) {
    elements.voxelGap.addEventListener('input', () => {
      elements.voxelGapValue.textContent = parseFloat(elements.voxelGap.value).toFixed(1);
    });
  }
  
  if (elements.outlineOpacity && elements.outlineOpacityValue) {
    elements.outlineOpacity.addEventListener('input', () => {
      elements.outlineOpacityValue.textContent = parseFloat(elements.outlineOpacity.value).toFixed(1);
    });
  }

  // v0.1.6.1: インセット枠線の制御
  if (elements.outlineInset) {
    elements.outlineInset.addEventListener('input', () => {
      const value = parseFloat(elements.outlineInset.value);
      elements.outlineInsetValue.textContent = value.toFixed(1);
      
      // OFF モードでない場合のみスライダー値を有効にする
      if (elements.outlineInsetMode.value !== 'off') {
        // リアルタイム更新は負荷が高いので、ここでは値の表示のみ
        console.log(`Inset distance: ${value}m (mode: ${elements.outlineInsetMode.value})`);
      }
    });
    
    elements.outlineInsetMode.addEventListener('change', () => {
      const mode = elements.outlineInsetMode.value;
      console.log(`Inset mode changed to: ${mode}`);
      
      // OFF モードの場合はスライダーを無効化
      elements.outlineInset.disabled = (mode === 'off');
      
      if (mode === 'off') {
        elements.outlineInsetValue.textContent = '0';
      } else {
        elements.outlineInsetValue.textContent = parseFloat(elements.outlineInset.value).toFixed(1);
      }
    });
    
    // 初期状態の設定
    elements.outlineInset.disabled = (elements.outlineInsetMode.value === 'off');
  }

  // v0.1.7: 適応的枠線制御の制御
  if (elements.adaptiveOutlines) {
    elements.adaptiveOutlines.addEventListener('change', () => {
      const isEnabled = elements.adaptiveOutlines.checked;
      elements.adaptiveSettings.style.display = isEnabled ? 'block' : 'none';
      elements.resolverDemo.style.display = isEnabled ? 'block' : 'none';
      console.log(`Adaptive outlines: ${isEnabled}`);
    });
  }

  if (elements.outlineRenderMode) {
    elements.outlineRenderMode.addEventListener('change', () => {
      const mode = elements.outlineRenderMode.value;
      console.log(`Render mode changed to: ${mode}`);
      
      // emulation-onlyモードでは適応的制御を推奨
      if (mode === 'emulation-only' && !elements.adaptiveOutlines.checked) {
        console.info('emulation-onlyモードでは適応的制御の使用を推奨します');
      }
    });
  }

  if (elements.outlineWidthPreset) {
    elements.outlineWidthPreset.addEventListener('change', () => {
      const preset = elements.outlineWidthPreset.value;
      console.log(`Width preset changed to: ${preset}`);
    });
  }

  if (elements.useOpacityResolvers) {
    elements.useOpacityResolvers.addEventListener('change', () => {
      const useResolvers = elements.useOpacityResolvers.checked;
      console.log(`Use opacity resolvers: ${useResolvers}`);
    });
  }

}

function getOptionsFromUI() {
  // v0.1.5: debugオプションの拡張対応
  let debugOption;
  if (elements.debugLogs?.checked && elements.showBounds?.checked) {
    debugOption = { showBounds: true };
  } else if (elements.debugLogs?.checked) {
    debugOption = true; // 従来の動作
  } else if (elements.showBounds?.checked) {
    debugOption = { showBounds: true };
  } else {
    debugOption = false;
  }
  
  // v0.1.6: 適応的枠線制御の実装（旧版との互換性維持）
  let outlineWidthResolver = null;
  if (elements.adaptiveOutline?.checked) {
    outlineWidthResolver = ({ voxel, isTopN, normalizedDensity }) => {
      // 密度に応じた適応的制御（デモ用）
      if (isTopN) return 6; // TopN は常に太く
      if (normalizedDensity > 0.7) return 1; // 高密度は細く
      if (normalizedDensity > 0.3) return 2; // 中密度は標準
      return 3; // 低密度は太く
    };
  }

  // v0.1.7: 透明度resolverのデモ実装
  let boxOpacityResolver = null;
  let outlineOpacityResolver = null;
  if (elements.useOpacityResolvers?.checked) {
    // 順相関（密度が高いほど不透明、低いほど薄い）
    boxOpacityResolver = ({ isTopN, normalizedDensity }) => {
      if (isTopN) return 1.0; // TopNは最も不透明に
      const v = 0.3 + 0.7 * (normalizedDensity || 0);
      return Math.max(0, Math.min(1, v));
    };

    outlineOpacityResolver = ({ isTopN, normalizedDensity }) => {
      if (isTopN) return 1.0; // TopNは最も不透明に
      const v = 0.3 + 0.7 * (normalizedDensity || 0);
      return Math.max(0, Math.min(1, v));
    };
  }

  const options = {
    opacity: parseFloat(elements.opacity.value),
    showEmptyVoxels: elements.showEmpty.checked,
    showOutline: elements.showOutline.checked,
    // v0.1.2 新機能
    wireframeOnly: elements.wireframeOnly?.checked || false,
    heightBased: elements.heightBased?.checked || false,
    outlineWidth: 2,
    // v0.1.4 新機能
    autoVoxelSize: elements.autoVoxelSize?.checked || false,
    // v0.1.5 新機能
    debug: debugOption,
    colorMap: elements.colorMap?.value || 'custom',
    diverging: elements.diverging?.checked || false,
    highlightTopN: elements.highlightTopN?.value ? parseInt(elements.highlightTopN.value) : null,
    // v0.1.6 新機能
    voxelGap: parseFloat(elements.voxelGap?.value) || 0,
    outlineOpacity: parseFloat(elements.outlineOpacity?.value) || 1.0,
    // v0.1.6.1 新機能: インセット枠線
    outlineInset: elements.outlineInsetMode?.value === 'off' ? 0 : (parseFloat(elements.outlineInset?.value) || 0),
    outlineInsetMode: elements.outlineInsetMode?.value === 'off' ? 'all' : (elements.outlineInsetMode?.value || 'all'),
    outlineWidthResolver: outlineWidthResolver,
    // v0.1.7 新機能: 適応的枠線制御とエミュレーション専用表示モード
    outlineRenderMode: elements.outlineRenderMode?.value || 'standard',
    adaptiveOutlines: elements.adaptiveOutlines?.checked || false,
    outlineWidthPreset: elements.outlineWidthPreset?.value || 'uniform',
    boxOpacityResolver: boxOpacityResolver,
    outlineOpacityResolver: outlineOpacityResolver
  };
  
  // autoVoxelSizeがtrueでない場合のみvoxelSizeを設定
  if (!options.autoVoxelSize) {
    options.voxelSize = parseInt(elements.voxelSize.value, 10);
  }
  
  return options;
}

function clearEntities() {
  viewer.entities.removeAll();
  testEntities = [];
}

function displayStatistics(stats) {
  const trimmedCount = stats.nonEmptyVoxels - stats.renderedVoxels;
  const trimmedNote = trimmedCount > 0 ? 
    `<small style="color: #ccc;">(注: ${trimmedCount.toLocaleString()}個の非空ボクセルが描画制限で非表示)</small>` : '';
  
  // v0.1.4: 自動調整情報の表示
  let autoAdjustInfo = '';
  if (stats.autoAdjusted !== undefined) {
    if (stats.autoAdjusted) {
      autoAdjustInfo = `
        <div style="color: #4CAF50;">🔧 自動調整: ${stats.originalVoxelSize}m → ${stats.finalVoxelSize}m</div>
        <div style="color: #ccc; font-size: 12px;">理由: ${stats.adjustmentReason}</div>
      `;
    } else if (stats.finalVoxelSize) {
      autoAdjustInfo = `<div style="color: #2196F3;">⚙️ 自動決定サイズ: ${stats.finalVoxelSize}m</div>`;
    }
  }
  
  elements.statisticsContent.innerHTML = `
    <div>総ボクセル数: ${stats.totalVoxels.toLocaleString()}</div>
    <div>表示ボクセル数: ${stats.renderedVoxels.toLocaleString()} ${trimmedNote}</div>
    <div>非空ボクセル数: ${stats.nonEmptyVoxels.toLocaleString()}</div>
    <div>総エンティティ数: ${stats.totalEntities.toLocaleString()}</div>
    <div>最大密度: ${stats.maxCount}</div>
    <div>平均密度: ${stats.averageCount.toFixed(2)}</div>
    ${autoAdjustInfo}
  `;
  elements.statistics.style.display = 'block';
}

function updateStatus(message, isError = false) {
  console.log(message);
  elements.status.textContent = message;
  elements.status.style.color = isError ? 'red' : 'white';
}

document.addEventListener('DOMContentLoaded', initializeApp);
