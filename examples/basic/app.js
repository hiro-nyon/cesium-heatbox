/**
 * CesiumJS Heatbox 基本例
 */
import Heatbox from '../../src/index.js';

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
      'wireframeOnly', 'heightBased', // v0.1.2 新機能
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
}

function getOptionsFromUI() {
  return {
    voxelSize: parseInt(elements.voxelSize.value, 10),
    opacity: parseFloat(elements.opacity.value),
    showEmptyVoxels: elements.showEmpty.checked,
    showOutline: elements.showOutline.checked,
    // v0.1.2 新機能
    wireframeOnly: elements.wireframeOnly?.checked || false,
    heightBased: elements.heightBased?.checked || false,
    outlineWidth: 2
  };
}

function clearEntities() {
  viewer.entities.removeAll();
  testEntities = [];
}

function displayStatistics(stats) {
  elements.statisticsContent.innerHTML = `
    <div>総ボクセル数: ${stats.totalVoxels.toLocaleString()}</div>
    <div>非空ボクセル数: ${stats.nonEmptyVoxels.toLocaleString()}</div>
    <div>総エンティティ数: ${stats.totalEntities.toLocaleString()}</div>
    <div>最大密度: ${stats.maxCount}</div>
    <div>平均密度: ${stats.averageCount.toFixed(2)}</div>
  `;
  elements.statistics.style.display = 'block';
}

function updateStatus(message, isError = false) {
  console.log(message);
  elements.status.textContent = message;
  elements.status.style.color = isError ? 'red' : 'white';
}

document.addEventListener('DOMContentLoaded', initializeApp);