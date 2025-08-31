/**
 * CesiumJS Heatbox v0.1.9 - Adaptive Rendering Demo
 * 
 * この例では、v0.1.9で追加された適応的レンダリング機能をデモンストレーションします：
 * - Adaptive Rendering Limits (density/coverage/hybrid strategies)
 * - Auto Render Budget (device tier detection)
 * - Enhanced auto voxel size with occupancy mode
 * - Smart fitView assistance
 */

import * as Cesium from 'cesium';
import { Heatbox } from '../../src/index.js';
import { generateSampleData } from '../../src/utils/sampleData.js';

// シーン設定
const viewer = new Cesium.Viewer('cesiumContainer', {
  shouldAnimate: false,
  homeButton: false,
  sceneModePicker: false,
  baseLayerPicker: false
});

// v0.1.9 新機能のデモンストレーション
async function demonstrateAdaptiveRendering() {
  console.log('🚀 v0.1.9 Adaptive Rendering Demo Starting...');

  // 大規模データセットを生成（適応的レンダリングのテスト用）
  const largeDataset = generateSampleData(20000, {
    // 密集したデータクラスター
    clusters: [
      { center: [139.7, 35.7, 50], radius: 0.02, density: 0.8, count: 8000 },
      { center: [139.72, 35.68, 100], radius: 0.015, density: 0.6, count: 6000 },
      { center: [139.75, 35.72, 75], radius: 0.01, density: 0.9, count: 4000 },
      // 疎なデータ領域
      { center: [139.8, 35.75, 30], radius: 0.05, density: 0.1, count: 2000 }
    ]
  });

  console.log(`📊 Generated dataset: ${largeDataset.length} entities`);

  // Strategy 1: Density-based selection (密度ベース選択)
  console.log('\n🎯 Strategy 1: Density-based Selection');
  await demonstrateStrategy('density', largeDataset);

  // Strategy 2: Coverage-based selection (カバレッジベース選択)
  console.log('\n🗺️ Strategy 2: Coverage-based Selection');
  await demonstrateStrategy('coverage', largeDataset);

  // Strategy 3: Hybrid selection (ハイブリッド選択)
  console.log('\n⚖️ Strategy 3: Hybrid Selection');
  await demonstrateStrategy('hybrid', largeDataset);

  // Auto Render Budget Demo
  console.log('\n💻 Auto Render Budget Demo');
  await demonstrateAutoRenderBudget(largeDataset);

  // Enhanced Auto Voxel Size Demo
  console.log('\n📏 Enhanced Auto Voxel Size (Occupancy Mode) Demo');
  await demonstrateEnhancedAutoVoxelSize(largeDataset);

  console.log('\n✅ Demo completed successfully!');
}

/**
 * 特定の戦略をデモンストレーション
 */
async function demonstrateStrategy(strategy, entities) {
  const startTime = performance.now();

  // Heatboxインスタンスを作成（戦略固定）
  const heatbox = new Heatbox(viewer, {
    voxelSize: 500, // 固定サイズでテスト
    renderLimitStrategy: strategy,
    maxRenderVoxels: 5000, // 制限を設けて戦略の効果を観察
    debug: true // デバッグ情報を有効化
  });

  try {
    // データ設定とレンダリング
    await heatbox.setData(entities);
    
    const loadTime = performance.now() - startTime;
    const stats = heatbox.getStatistics();
    
    console.log(`  ⏱️  Load time: ${loadTime.toFixed(1)}ms`);
    console.log(`  📈 Strategy: ${stats.selectionStrategy}`);
    console.log(`  🔢 Total voxels: ${stats.totalVoxels}`);
    console.log(`  🎨 Rendered voxels: ${stats.renderedVoxels}`);
    console.log(`  ✂️  Clipped (non-empty): ${stats.clippedNonEmpty || 0}`);
    console.log(`  📊 Coverage ratio: ${(stats.coverageRatio * 100).toFixed(1)}%`);

    // 2秒間表示してから次に進む
    await new Promise(resolve => setTimeout(resolve, 2000));

  } catch (error) {
    console.error(`❌ Error with strategy ${strategy}:`, error);
  } finally {
    heatbox.dispose();
  }
}

/**
 * Auto Render Budgetのデモンストレーション
 */
async function demonstrateAutoRenderBudget(entities) {
  const startTime = performance.now();

  // Auto Render Budgetを有効化
  const heatbox = new Heatbox(viewer, {
    voxelSize: 400,
    maxRenderVoxels: 'auto', // Auto Render Budget有効
    renderLimitStrategy: 'hybrid', // 最適な戦略を使用
    debug: true
  });

  try {
    await heatbox.setData(entities);
    
    const loadTime = performance.now() - startTime;
    const stats = heatbox.getStatistics();
    
    console.log(`  ⏱️  Load time: ${loadTime.toFixed(1)}ms`);
    console.log(`  💻 Device tier: ${stats.renderBudgetTier}`);
    console.log(`  🎛️  Auto max render voxels: ${stats.autoMaxRenderVoxels}`);
    console.log(`  🎨 Actually rendered: ${stats.renderedVoxels}`);
    console.log(`  📊 Strategy used: ${stats.selectionStrategy}`);

    // デバイス情報も表示
    const debugInfo = heatbox.getDebugInfo();
    if (debugInfo.autoRenderBudget) {
      console.log(`  🔍 Device memory: ${debugInfo.autoRenderBudget.deviceMemory || 'N/A'} GB`);
      console.log(`  ⚙️  Hardware cores: ${debugInfo.autoRenderBudget.hardwareConcurrency}`);
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('❌ Auto Render Budget demo error:', error);
  } finally {
    heatbox.dispose();
  }
}

/**
 * Enhanced Auto Voxel Size (Occupancy Mode) のデモンストレーション
 */
async function demonstrateEnhancedAutoVoxelSize(entities) {
  const startTime = performance.now();

  // Occupancy-based auto voxel sizing
  const heatbox = new Heatbox(viewer, {
    autoVoxelSize: true,
    autoVoxelSizeMode: 'occupancy', // v0.1.9の新機能
    maxRenderVoxels: 8000,
    renderLimitStrategy: 'hybrid',
    debug: true
  });

  try {
    await heatbox.setData(entities);
    
    const loadTime = performance.now() - startTime;
    const stats = heatbox.getStatistics();
    
    console.log(`  ⏱️  Load time: ${loadTime.toFixed(1)}ms`);
    console.log(`  📏 Original voxel size: ${stats.originalVoxelSize}m`);
    console.log(`  ✅ Final voxel size: ${stats.finalVoxelSize}m`);
    console.log(`  🔄 Auto adjusted: ${stats.autoAdjusted}`);
    console.log(`  📝 Adjustment reason: ${stats.adjustmentReason}`);
    console.log(`  🎨 Total voxels: ${stats.totalVoxels}`);
    console.log(`  📊 Occupancy ratio: ${(stats.occupancyRatio * 100).toFixed(1)}%`);

    // Smart fitView のデモンストレーション
    console.log('  🎯 Executing smart fitView...');
    await heatbox.fitView();
    
    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('❌ Enhanced Auto Voxel Size demo error:', error);
  } finally {
    heatbox.dispose();
  }
}

/**
 * ユーザーインタラクションの設定
 */
function setupUserControls() {
  // HTML controls for interactive testing
  const controlsHtml = `
    <div id="adaptiveControls" style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; font-family: Arial;">
      <h3>🚀 v0.1.9 Adaptive Rendering Controls</h3>
      
      <div style="margin: 10px 0;">
        <label>Render Strategy:</label>
        <select id="strategySelect">
          <option value="density">Density-based</option>
          <option value="coverage">Coverage-based</option>
          <option value="hybrid" selected>Hybrid</option>
        </select>
      </div>
      
      <div style="margin: 10px 0;">
        <label>Max Render Voxels:</label>
        <select id="budgetSelect">
          <option value="auto" selected>Auto Budget</option>
          <option value="3000">3,000 (Low)</option>
          <option value="8000">8,000 (Medium)</option>
          <option value="15000">15,000 (High)</option>
        </select>
      </div>
      
      <div style="margin: 10px 0;">
        <label>Auto Voxel Size Mode:</label>
        <select id="voxelModeSelect">
          <option value="basic">Basic (v0.1.8)</option>
          <option value="occupancy" selected>Occupancy (v0.1.9)</option>
        </select>
      </div>
      
      <button id="applySettings" style="margin: 5px; padding: 5px 10px;">Apply Settings</button>
      <button id="fitViewBtn" style="margin: 5px; padding: 5px 10px;">Fit View</button>
      <button id="showStats" style="margin: 5px; padding: 5px 10px;">Show Stats</button>
    </div>
  `;
  
  document.body.insertAdjacentHTML('afterbegin', controlsHtml);
  
  // 現在のheatboxインスタンス
  let currentHeatbox = null;
  let currentData = null;

  // Apply Settings ボタン
  document.getElementById('applySettings').addEventListener('click', async () => {
    const strategy = document.getElementById('strategySelect').value;
    const budget = document.getElementById('budgetSelect').value;
    const voxelMode = document.getElementById('voxelModeSelect').value;
    
    // 既存インスタンスを破棄
    if (currentHeatbox) {
      currentHeatbox.dispose();
    }
    
    // 新しい設定でインスタンスを作成
    currentHeatbox = new Heatbox(viewer, {
      autoVoxelSize: true,
      autoVoxelSizeMode: voxelMode,
      renderLimitStrategy: strategy,
      maxRenderVoxels: budget === 'auto' ? 'auto' : parseInt(budget),
      debug: true
    });
    
    // データがあれば再適用
    if (currentData) {
      try {
        await currentHeatbox.setData(currentData);
        console.log('✅ Settings applied successfully');
      } catch (error) {
        console.error('❌ Error applying settings:', error);
      }
    }
  });
  
  // Fit View ボタン
  document.getElementById('fitViewBtn').addEventListener('click', async () => {
    if (currentHeatbox) {
      try {
        await currentHeatbox.fitView();
        console.log('✅ Fit view completed');
      } catch (error) {
        console.error('❌ Fit view error:', error);
      }
    }
  });
  
  // Show Stats ボタン
  document.getElementById('showStats').addEventListener('click', () => {
    if (currentHeatbox) {
      const stats = currentHeatbox.getStatistics();
      console.log('📊 Current Statistics:', stats);
      
      // 統計情報をアラートで表示
      alert(`
📊 Heatbox Statistics (v0.1.9)

🎯 Strategy: ${stats.selectionStrategy}
💻 Device Tier: ${stats.renderBudgetTier || 'N/A'}
🎛️ Max Render Voxels: ${stats.autoMaxRenderVoxels || stats.maxRenderVoxels}
🎨 Rendered Voxels: ${stats.renderedVoxels}
📈 Total Voxels: ${stats.totalVoxels}
📊 Coverage Ratio: ${((stats.coverageRatio || 0) * 100).toFixed(1)}%
✂️ Clipped (Non-empty): ${stats.clippedNonEmpty || 0}

📏 Voxel Size: ${stats.finalVoxelSize || stats.voxelSize}m
🔄 Auto Adjusted: ${stats.autoAdjusted || false}
      `);
    }
  });
  
  // 初期データセットを保存
  currentData = generateSampleData(10000, {
    clusters: [
      { center: [139.7, 35.7, 50], radius: 0.02, density: 0.7, count: 5000 },
      { center: [139.75, 35.72, 100], radius: 0.015, density: 0.5, count: 3000 },
      { center: [139.8, 35.75, 30], radius: 0.03, density: 0.2, count: 2000 }
    ]
  });
}

// デモ実行
document.addEventListener('DOMContentLoaded', async () => {
  setupUserControls();
  await demonstrateAdaptiveRendering();
});

export { demonstrateAdaptiveRendering, setupUserControls };
