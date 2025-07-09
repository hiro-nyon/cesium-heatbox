/**
 * CesiumJS Heatbox 基本例
 */

// 開発版のライブラリを使用（実際のプロジェクトでは build されたバージョンを使用）
import Heatbox, { generateTestEntities } from '../../src/index.js';

// アプリケーションの状態
let viewer;
let heatbox;
let testEntities = [];
let isVisible = true;

// UI要素
const elements = {
  generateBtn: document.getElementById('generateBtn'),
  createHeatmapBtn: document.getElementById('createHeatmapBtn'),
  clearBtn: document.getElementById('clearBtn'),
  toggleBtn: document.getElementById('toggleBtn'),
  entityCount: document.getElementById('entityCount'),
  voxelSize: document.getElementById('voxelSize'),
  opacity: document.getElementById('opacity'),
  opacityValue: document.getElementById('opacityValue'),
  showEmpty: document.getElementById('showEmpty'),
  statistics: document.getElementById('statistics'),
  statisticsContent: document.getElementById('statisticsContent')
};

/**
 * アプリケーションの初期化
 */
async function initializeApp() {
  try {
    // CesiumJS Viewerの初期化
    viewer = new Cesium.Viewer('cesiumContainer', {
      terrainProvider: Cesium.createWorldTerrain(),
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      selectionIndicator: false,
      navigationHelpButton: false,
      creditContainer: document.createElement('div') // クレジット非表示
    });
    
    // 東京駅周辺にカメラを移動
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(139.7660, 35.6805, 2000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0
      }
    });
    
    // Heatboxインスタンスの初期化
    heatbox = new Heatbox(viewer);
    
    // イベントリスナーの設定
    setupEventListeners();
    
    console.log('アプリケーションが初期化されました');
    
  } catch (error) {
    console.error('初期化エラー:', error);
    alert('アプリケーションの初期化に失敗しました: ' + error.message);
  }
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
  // テストエンティティ生成
  elements.generateBtn.addEventListener('click', generateTestEntities);
  
  // ヒートマップ作成
  elements.createHeatmapBtn.addEventListener('click', createHeatmap);
  
  // クリア
  elements.clearBtn.addEventListener('click', clearHeatmap);
  
  // 表示/非表示切り替え
  elements.toggleBtn.addEventListener('click', toggleVisibility);
  
  // 透明度変更
  elements.opacity.addEventListener('input', (e) => {
    elements.opacityValue.textContent = e.target.value;
    updateHeatmapOptions();
  });
  
  // その他のオプション変更
  elements.voxelSize.addEventListener('change', updateHeatmapOptions);
  elements.showEmpty.addEventListener('change', updateHeatmapOptions);
}

/**
 * テストエンティティの生成
 */
function generateTestEntities() {
  try {
    // 既存のエンティティをクリア
    viewer.entities.removeAll();
    
    // 東京駅周辺の境界を定義
    const bounds = {
      minLon: 139.7640,
      maxLon: 139.7680,
      minLat: 35.6790,
      maxLat: 35.6820,
      minAlt: 0,
      maxAlt: 100
    };
    
    const count = parseInt(elements.entityCount.value);
    
    // プログレス表示
    updateStatus(`${count}個のテストエンティティを生成中...`);
    
    // テストエンティティの生成
    testEntities = generateTestEntities(viewer, bounds, count);
    
    // UI状態の更新
    elements.generateBtn.disabled = false;
    elements.createHeatmapBtn.disabled = false;
    
    updateStatus(`${testEntities.length}個のテストエンティティを生成しました`);
    
  } catch (error) {
    console.error('テストエンティティ生成エラー:', error);
    alert('テストエンティティの生成に失敗しました: ' + error.message);
  }
}

/**
 * ヒートマップの作成
 */
async function createHeatmap() {
  try {
    if (testEntities.length === 0) {
      alert('テストエンティティを先に生成してください');
      return;
    }
    
    // UI状態の更新
    elements.createHeatmapBtn.disabled = true;
    updateStatus('ヒートマップを作成中...');
    
    // オプションの取得
    const options = {
      voxelSize: parseInt(elements.voxelSize.value),
      opacity: parseFloat(elements.opacity.value),
      showEmptyVoxels: elements.showEmpty.checked
    };
    
    // ヒートマップの作成
    heatbox.updateOptions(options);
    const statistics = await heatbox.createFromEntities(testEntities);
    
    // 統計情報の表示
    displayStatistics(statistics);
    
    // UI状態の更新
    elements.createHeatmapBtn.disabled = false;
    elements.clearBtn.disabled = false;
    elements.toggleBtn.disabled = false;
    
    updateStatus('ヒートマップを作成しました');
    
  } catch (error) {
    console.error('ヒートマップ作成エラー:', error);
    alert('ヒートマップの作成に失敗しました: ' + error.message);
    elements.createHeatmapBtn.disabled = false;
  }
}

/**
 * ヒートマップのクリア
 */
function clearHeatmap() {
  try {
    heatbox.clear();
    
    // UI状態の更新
    elements.clearBtn.disabled = true;
    elements.toggleBtn.disabled = true;
    elements.statistics.style.display = 'none';
    
    updateStatus('ヒートマップをクリアしました');
    
  } catch (error) {
    console.error('クリアエラー:', error);
    alert('クリアに失敗しました: ' + error.message);
  }
}

/**
 * 表示/非表示の切り替え
 */
function toggleVisibility() {
  try {
    isVisible = !isVisible;
    heatbox.setVisible(isVisible);
    
    elements.toggleBtn.textContent = isVisible ? '非表示' : '表示';
    updateStatus(isVisible ? 'ヒートマップを表示しました' : 'ヒートマップを非表示にしました');
    
  } catch (error) {
    console.error('表示切り替えエラー:', error);
    alert('表示切り替えに失敗しました: ' + error.message);
  }
}

/**
 * ヒートマップオプションの更新
 */
function updateHeatmapOptions() {
  try {
    if (!heatbox || !heatbox.getStatistics()) {
      return; // ヒートマップが作成されていない場合は何もしない
    }
    
    const options = {
      voxelSize: parseInt(elements.voxelSize.value),
      opacity: parseFloat(elements.opacity.value),
      showEmptyVoxels: elements.showEmpty.checked
    };
    
    heatbox.updateOptions(options);
    
  } catch (error) {
    console.error('オプション更新エラー:', error);
  }
}

/**
 * 統計情報の表示
 */
function displayStatistics(statistics) {
  const html = `
    <div class="stat-item">総ボクセル数: ${statistics.totalVoxels.toLocaleString()}</div>
    <div class="stat-item">表示ボクセル数: ${statistics.renderedVoxels.toLocaleString()}</div>
    <div class="stat-item">非空ボクセル数: ${statistics.nonEmptyVoxels.toLocaleString()}</div>
    <div class="stat-item">空ボクセル数: ${statistics.emptyVoxels.toLocaleString()}</div>
    <div class="stat-item">総エンティティ数: ${statistics.totalEntities.toLocaleString()}</div>
    <div class="stat-item">最小密度: ${statistics.minCount}</div>
    <div class="stat-item">最大密度: ${statistics.maxCount}</div>
    <div class="stat-item">平均密度: ${statistics.averageCount.toFixed(2)}</div>
  `;
  
  elements.statisticsContent.innerHTML = html;
  elements.statistics.style.display = 'block';
}

/**
 * ステータスメッセージの更新
 */
function updateStatus(message) {
  console.log('Status:', message);
  
  // 簡単なトースト通知（実装は簡略化）
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    z-index: 10000;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    document.body.removeChild(toast);
  }, 3000);
}

/**
 * エラーハンドリング
 */
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
  alert('予期しないエラーが発生しました: ' + event.error.message);
});

// アプリケーションの起動
document.addEventListener('DOMContentLoaded', initializeApp);
