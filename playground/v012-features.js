/**
 * v0.1.12 新機能のためのJavaScript拡張
 * プレイグラウンドにv0.1.12の新機能を統合
 */

// プロファイル説明は i18n キーを使用（外部辞書に定義）
const PROFILE_DESC_KEYS = {
  '': 'profile_desc_custom',
  'mobile-fast': 'profile_desc_mobile',
  'desktop-balanced': 'profile_desc_desktop',
  'dense-data': 'profile_desc_dense',
  'sparse-data': 'profile_desc_sparse'
};

const PROFILE_CONFIGS = {
  'mobile-fast': {
    maxRenderVoxels: 5000,
    opacity: 0.7,
    outlineRenderMode: 'emulation-only',
    emulationScope: 'topn',
    outlineWidthPreset: 'thin',
    renderLimitStrategy: 'density'
  },
  'desktop-balanced': {
    maxRenderVoxels: 15000,
    opacity: 0.8,
    outlineRenderMode: 'standard',
    emulationScope: 'off',
    outlineWidthPreset: 'medium',
    renderLimitStrategy: 'hybrid'
  },
  'dense-data': {
    maxRenderVoxels: 25000,
    opacity: 0.9,
    outlineRenderMode: 'standard',
    emulationScope: 'off',
    outlineWidthPreset: 'thin',
    renderLimitStrategy: 'density'
  },
  'sparse-data': {
    maxRenderVoxels: 8000,
    opacity: 0.8,
    outlineRenderMode: 'inset',
    emulationScope: 'all',
    outlineWidthPreset: 'thick',
    renderLimitStrategy: 'coverage'
  }
};

// プロファイル変更ハンドラ
HeatboxPlayground.prototype.handleProfileChange = function() {
  const profileSelect = document.getElementById('configProfile');
  const profileDescElement = document.querySelector('#profileDescription span');
  
  if (!profileSelect || !profileDescElement) return;
  
  const selectedProfile = profileSelect.value;
  
  // 説明文更新（i18n）
  const key = PROFILE_DESC_KEYS[selectedProfile] || PROFILE_DESC_KEYS[''];
  if (profileDescElement) {
    profileDescElement.setAttribute('data-i18n', key);
  }
  try { this._applyTranslations(); } catch (_) {}
  
  // プロファイル設定をUIに反映
  if (selectedProfile && PROFILE_CONFIGS[selectedProfile]) {
    this.applyProfileToUI(PROFILE_CONFIGS[selectedProfile]);
    console.log(`Applied profile: ${selectedProfile}`, PROFILE_CONFIGS[selectedProfile]);
  }
  
  // ヒートマップを更新
  this.updateHeatmapOptions();
};

// UIにプロファイル設定を適用
HeatboxPlayground.prototype.applyProfileToUI = function(profileConfig) {
  Object.entries(profileConfig).forEach(([key, value]) => {
    const element = document.getElementById(key);
    if (element) {
      if (element.type === 'checkbox') {
        element.checked = value;
      } else if (element.type === 'range') {
        element.value = value;
        // 値表示も更新
        const valueDisplay = document.getElementById(key + 'Value');
        if (valueDisplay) valueDisplay.textContent = value;
      } else {
        element.value = value;
      }
    }
  });
};

// パフォーマンスオーバーレイの切り替え
HeatboxPlayground.prototype.handlePerformanceOverlayToggle = function() {
  const enabled = document.getElementById('performanceOverlay')?.checked;
  const positionGroup = document.getElementById('overlayPositionGroup');
  const updateGroup = document.getElementById('overlayUpdateGroup');
  
  // UI状態更新
  [positionGroup, updateGroup].forEach(group => {
    if (group) {
      group.style.opacity = enabled ? '1' : '0.5';
      group.style.pointerEvents = enabled ? 'auto' : 'none';
      const select = group.querySelector('select');
      const input = group.querySelector('input');
      if (select) select.disabled = !enabled;
      if (input) input.disabled = !enabled;
    }
  });
  
  // パフォーマンスオーバーレイの有効化/無効化
  if (this.heatbox) {
    try {
      if (enabled) {
        const position = document.getElementById('overlayPosition')?.value || 'top-right';
        const updateInterval = parseInt(document.getElementById('overlayUpdateInterval')?.value) || 500;
        
        this.heatbox.setPerformanceOverlayEnabled(true, {
          position: position,
          updateIntervalMs: updateInterval,
          autoShow: true
        });
        console.log('Performance overlay enabled:', { position, updateInterval });
      } else {
        this.heatbox.setPerformanceOverlayEnabled(false);
        console.log('Performance overlay disabled');
      }
    } catch (error) {
      console.error('Error toggling performance overlay:', error);
    }
  }
};

// オーバーレイ更新間隔の変更
HeatboxPlayground.prototype.handleOverlayIntervalChange = function() {
  const intervalInput = document.getElementById('overlayUpdateInterval');
  const valueDisplay = document.getElementById('overlayUpdateValue');
  
  if (intervalInput && valueDisplay) {
    valueDisplay.textContent = intervalInput.value;
  }
  
  // 既にオーバーレイが有効な場合は再設定
  const enabled = document.getElementById('performanceOverlay')?.checked;
  if (enabled) {
    this.handlePerformanceOverlayToggle();
  }
};

// プリセット変更の処理（廃止予定警告付き）
HeatboxPlayground.prototype.handlePresetChange = function() {
  const presetSelect = document.getElementById('outlineWidthPreset');
  if (!presetSelect) return;
  
  const selectedPreset = presetSelect.value;
  const legacyPresets = {
    'uniform': 'medium',
    'adaptive-density': 'adaptive', 
    'topn-focus': 'thick'
  };
  
  if (legacyPresets[selectedPreset]) {
    console.warn(`[Heatbox Playground] Preset "${selectedPreset}" is deprecated. Consider using "${legacyPresets[selectedPreset]}" instead.`);
  }
  
  this.updateHeatmapOptions();
};

// getEffectiveOptions()の結果表示
HeatboxPlayground.prototype.showEffectiveOptions = function() {
  if (!this.heatbox) {
    alert('ヒートマップを作成してからお試しください。');
    return;
  }
  
  try {
    const effectiveOptions = this.heatbox.getEffectiveOptions();
    console.log('Effective Options:', effectiveOptions);
    
    // 整理された表示用JSON
    const displayOptions = JSON.stringify(effectiveOptions, null, 2);
    
    // モーダルまたはコンソール表示
    if (confirm('Effective Options をコンソールに出力しました。詳細をアラートで表示しますか？')) {
      alert(`Current Effective Options:\n\n${displayOptions.substring(0, 1000)}${displayOptions.length > 1000 ? '...\n\n[Full output in console]' : ''}`);
    }
    
    // ナビゲーション統計の更新
    this.updateNavigationStats();
    
  } catch (error) {
    console.error('Error getting effective options:', error);
    alert('getEffectiveOptions() でエラーが発生しました。コンソールをご確認ください。');
  }
};

// パフォーマンスオーバーレイの更新
HeatboxPlayground.prototype.updatePerformanceOverlay = function() {
  // v0.1.12のパフォーマンスオーバーレイ機能は自動で更新されるため、
  // 特別な処理は不要ですが、必要に応じて手動更新も可能
  if (this.heatbox && document.getElementById('performanceOverlay')?.checked) {
    try {
      // オーバーレイが表示されている場合の追加処理
      console.log('Performance overlay is active');
    } catch (error) {
      console.error('Error updating performance overlay:', error);
    }
  }
};

// ナビゲーション統計の更新（v0.1.12対応）
HeatboxPlayground.prototype.updateNavigationStats = function() {
  if (!this.heatbox) return;
  
  try {
    const stats = this.heatbox.getStatistics();
    const effectiveOptions = this.heatbox.getEffectiveOptions();
    
    // プロファイル情報の表示
    const currentProfile = document.getElementById('configProfile')?.value || 'custom';
    console.log('Current profile:', currentProfile);
    console.log('Profile applied options:', effectiveOptions);
    
    // v0.1.12の新しい統計情報があれば表示
    if (stats.renderTimeMs !== undefined) {
      console.log('Render time:', stats.renderTimeMs, 'ms');
    }
    
  } catch (error) {
    console.error('Error updating navigation stats:', error);
  }
};

console.log('v0.1.12 features loaded successfully');
