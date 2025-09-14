/* eslint-env browser */
/* global Cesium, CesiumHeatbox */
/**
 * Cesium Heatbox Playground - メインアプリケーション
 */

// UMDバージョンを使用するため、グローバルのHeatboxを使用
// import { Heatbox, createHeatbox, getEnvironmentInfo } from '../cesium-heatbox/src/index.js';

class HeatboxPlayground {
  constructor() {
    console.log('=== HeatboxPlayground 初期化開始 ===');
    
    this.viewer = null;
    this.heatbox = null;
    this.currentData = null;
    this.isVisible = true;
    // v0.1.6: outlineWidthResolver の統計
    this._outlineStats = null;
    // i18n 状態
    this._lang = (typeof localStorage !== 'undefined' && localStorage.getItem('hb_lang')) || 'en';
    
    console.log('Cesium available:', typeof Cesium !== 'undefined');
    console.log('CesiumHeatbox available:', typeof CesiumHeatbox !== 'undefined');
    
    if (typeof Cesium !== 'undefined') {
      console.log('Cesium VERSION:', Cesium.VERSION);
      console.log('Cesium.createWorldTerrain available:', typeof Cesium.createWorldTerrain === 'function');
      console.log('Cesium.CesiumTerrainProvider available:', typeof Cesium.CesiumTerrainProvider === 'function');
      console.log('Cesium.EllipsoidTerrainProvider available:', typeof Cesium.EllipsoidTerrainProvider === 'function');
      console.log('Cesium.IonImageryProvider available:', typeof Cesium.IonImageryProvider === 'function');
    }
    
    if (typeof CesiumHeatbox !== 'undefined') {
      console.log('CesiumHeatbox type:', typeof CesiumHeatbox);
      console.log('CesiumHeatbox keys:', Object.keys(CesiumHeatbox));
      console.log('CesiumHeatbox.default:', CesiumHeatbox.default);
      console.log('CesiumHeatbox.Heatbox:', CesiumHeatbox.Heatbox);
    }
    
    console.log('DOM ready:', document.readyState);
    console.log('Container element:', document.getElementById('cesiumContainer'));
    
    this.initializeCesium();
    this.setupEventListeners();
    this.initializeControlStates();
    this.updateEnvironmentInfo();
    this._resetOutlineStats();
    // Camera/fitView coordination flags
    this._autoViewRequest = false;
    this._fitViewOptions = null;
    this._fitOnceHandler = null;
    this._inCameraMove = false;
    // Debug: capture render errors quickly
    try {
      this.viewer?.scene?.renderError?.addEventListener((e) => {
        console.warn('[PG][renderError]', e && e.message ? e.message : e);
      });
      this.viewer?.camera?.moveStart?.addEventListener?.(() => { this._inCameraMove = true; });
      this.viewer?.camera?.moveEnd?.addEventListener?.(() => { this._inCameraMove = false; });
    } catch (_) {}
    this._setupLanguageControls();
    this._applyTranslations();
    this._setupMobileUI();
    this._setupDesktopCollapseUI();
    // View Mode state store (per-mode parameter persistence)
    this._viewModeStates = {
      'boxes': {},
      'outline-only': {},
      'outline-inset': { outlineInset: 2.0, outlineInsetMode: 'all' },
      'emulation-only': {}
    };
    this._currentViewMode = (document.getElementById('viewModePreset')?.value) || 'boxes';
    this._setupViewModeControls();
    
    console.log('=== HeatboxPlayground 初期化完了 ===');
  }

  /**
   * View Mode controls wiring
   * - Save/restore per-mode state
   * - Enforce semantic overrides for each mode
   */
  _setupViewModeControls() {
    const sel = document.getElementById('viewModePreset');
    if (!sel) return;
    sel.addEventListener('change', () => {
      const prev = this._currentViewMode;
      const next = sel.value || 'boxes';
      // Save current UI parameters into prev mode
      this._saveViewModeState(prev);
      // Apply next mode state (or defaults)
      this._applyViewModeState(next);
      this._currentViewMode = next;
      // Refresh heatmap if exists
      try { this.updateHeatmapOptions && this.updateHeatmapOptions(); } catch (_) {}
    });
  }

  _saveViewModeState(mode) {
    const getVal = (id, def=null) => {
      const el = document.getElementById(id);
      if (!el) return def;
      if (el.type === 'checkbox') return !!el.checked;
      return el.value ?? def;
    };
    this._viewModeStates[mode] = {
      outlineRenderMode: getVal('outlineRenderMode', 'standard'),
      emulationScope: getVal('emulationScope', 'off'),
      outlineInset: parseFloat(getVal('outlineInset', '0')) || 0,
      outlineInsetMode: getVal('outlineInsetMode', 'all'),
      enableThickFrames: !!(document.getElementById('enableThickFrames')?.checked),
      adaptiveOutlines: !!(document.getElementById('adaptiveOutlines')?.checked),
      outlineWidthPreset: getVal('outlineWidthPreset', 'medium')
    };
  }

  _applyViewModeState(mode) {
    const st = this._viewModeStates[mode] || {};
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (!el || val === undefined || val === null) return;
      if (el.type === 'checkbox') el.checked = !!val; else el.value = val;
      // immediate UI reflectors
      if (id === 'outlineInset') {
        const dv = document.getElementById('outlineInsetValue');
        if (dv) dv.textContent = String(val);
      }
    };
    // Defaults per mode
    if (!st.outlineRenderMode) {
      st.outlineRenderMode = (mode === 'outline-inset') ? 'inset' : (mode === 'emulation-only' ? 'emulation-only' : 'standard');
    }
    if (!st.emulationScope) st.emulationScope = (mode === 'emulation-only') ? 'all' : 'off';
    if (st.outlineInset === undefined) st.outlineInset = (mode === 'outline-inset') ? 2.0 : 0.0;
    if (!st.outlineInsetMode) st.outlineInsetMode = (mode === 'outline-inset') ? 'all' : 'all';
    if (st.enableThickFrames === undefined) st.enableThickFrames = (mode === 'emulation-only');
    if (st.adaptiveOutlines === undefined) st.adaptiveOutlines = true;
    if (!st.outlineWidthPreset) st.outlineWidthPreset = 'adaptive';

    // Apply to UI
    setVal('outlineRenderMode', st.outlineRenderMode);
    setVal('emulationScope', st.emulationScope);
    setVal('outlineInset', st.outlineInset);
    setVal('outlineInsetMode', st.outlineInsetMode);
    setVal('enableThickFrames', st.enableThickFrames);
    setVal('adaptiveOutlines', st.adaptiveOutlines);
    setVal('outlineWidthPreset', st.outlineWidthPreset);
  }

  /**
   * Heatboxコンストラクタを堅牢に取得（UMD形状差に対応）
   */
  _getHeatboxCtor() {
    try {
      const g = typeof window !== 'undefined' ? window : globalThis;
      if (!g) return null;
      if (typeof g.CesiumHeatbox === 'function') return g.CesiumHeatbox;
      if (g.CesiumHeatbox && typeof g.CesiumHeatbox.default === 'function') return g.CesiumHeatbox.default;
      if (g.CesiumHeatbox && typeof g.CesiumHeatbox.Heatbox === 'function') return g.CesiumHeatbox.Heatbox;
      if (typeof g.Heatbox === 'function') return g.Heatbox;
    } catch (_) {}
    return null;
  }

  /**
   * モバイルUI機能の初期化
   */
  _setupMobileUI() {
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const toolbar = document.getElementById('toolbar');
    const cesiumContainer = document.getElementById('cesiumContainer');
    
    if (!mobileToggle || !toolbar) {
      console.log('Mobile UI elements not found, skipping mobile setup');
      return;
    }

    // ハンバーガーメニューの開閉制御
    let isMenuOpen = false;
    
    const toggleMenu = () => {
      const L = this._getTranslations()[this._lang] || this._getTranslations().ja;
      isMenuOpen = !isMenuOpen;
      
      if (isMenuOpen) {
        toolbar.classList.add('open');
        mobileToggle.innerHTML = '✕';
        mobileToggle.setAttribute('aria-label', L.aria_nav_close || 'Close navigation');
        mobileToggle.setAttribute('aria-expanded', 'true');
        mobileToggle.setAttribute('aria-controls', 'toolbar');
        // スクロールを一時的に無効化（背景スクロール防止）
        document.body.style.overflow = 'hidden';
      } else {
        toolbar.classList.remove('open');
        mobileToggle.innerHTML = '☰';
        mobileToggle.setAttribute('aria-label', L.aria_nav_open || 'Open navigation');
        mobileToggle.setAttribute('aria-expanded', 'false');
        // スクロールを復元
        document.body.style.overflow = '';
      }
    };

    // ハンバーガーメニューボタンクリック
    mobileToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    // Cesium地図エリアクリックでメニューを閉じる
    if (cesiumContainer) {
      cesiumContainer.addEventListener('click', () => {
        if (isMenuOpen) {
          toggleMenu();
        }
      });
    }

    // ESCキーでメニューを閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        toggleMenu();
      }
    });

    // 画面サイズ変更時の処理
    const handleResize = () => {
      // デスクトップサイズになったらメニューを閉じる
      if (window.innerWidth > 768 && isMenuOpen) {
        isMenuOpen = false;
        toolbar.classList.remove('open');
        mobileToggle.innerHTML = '☰';
        document.body.style.overflow = '';
      }
      // 情報パネルの位置を再計算
      this._adjustUIPanelPositions();
    };

    window.addEventListener('resize', handleResize);
    
    // タッチデバイス検出と追加制御
    this._setupTouchOptimizations();
    
    // 情報パネルのモバイル制御
    this._setupMobileInfoPanel();
    
    console.log('Mobile UI setup completed');
  }

  /**
   * デスクトップ向け：左右パネルの折りたたみUI
   */
  _setupDesktopCollapseUI() {
    const makeBtn = (id, ariaKey) => {
      const L = this._getTranslations()[this._lang] || this._getTranslations().ja;
      let btn = document.getElementById(id);
      if (!btn) {
        btn = document.createElement('button');
        btn.id = id;
        btn.className = 'collapse-toggle';
        btn.type = 'button';
        const aria = L[ariaKey] || ariaKey;
        btn.setAttribute('aria-label', aria);
        btn.setAttribute('data-i18n-aria-label', ariaKey);
        document.body.appendChild(btn);
      }
      return btn;
    };

    const leftBtn = makeBtn('collapseLeft', 'aria_collapse_left');
    const rightBtn = makeBtn('collapseRight', 'aria_collapse_right');

    const applyState = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        document.body.classList.remove('left-collapsed', 'right-collapsed');
        leftBtn.style.display = 'none';
        rightBtn.style.display = 'none';
        return;
      }
      leftBtn.style.display = '';
      rightBtn.style.display = '';

      const lc = (typeof localStorage !== 'undefined' && localStorage.getItem('hb_left_collapsed')) === '1';
      // Always show right panel by default on desktop (ignore stored state)
      const rc = false;
      document.body.classList.toggle('left-collapsed', !!lc);
      document.body.classList.toggle('right-collapsed', !!rc);
    };

    const toggleLeft = () => {
      const next = !document.body.classList.contains('left-collapsed');
      document.body.classList.toggle('left-collapsed', next);
      try { localStorage.setItem('hb_left_collapsed', next ? '1' : '0'); } catch (_) {}
    };

    const toggleRight = () => {
      const next = !document.body.classList.contains('right-collapsed');
      document.body.classList.toggle('right-collapsed', next);
      try { localStorage.setItem('hb_right_collapsed', next ? '1' : '0'); } catch (_) {}
      // 右の折りたたみ状態が変わったら位置再計算
      try { this._adjustUIPanelPositions(); } catch (_) {}
    };

    leftBtn.addEventListener('click', toggleLeft);
    rightBtn.addEventListener('click', toggleRight);

    // 初期適用とリサイズ対応
    applyState();
    window.addEventListener('resize', applyState);
  }

  /**
   * CesiumのUI（右上ツールバー・タイムライン）と重ならないように
   * 情報パネル(#info)の位置と高さを動的に調整
   */
  _adjustUIPanelPositions() {
    const info = document.getElementById('info');
    if (!info) return;

    // 右パネルが折りたたまれている場合は何もしない
    if (document.body.classList.contains('right-collapsed')) {
      info.style.top = '';
      info.style.right = '';
      info.style.left = '';
      info.style.bottom = '';
      info.style.maxHeight = '';
      return;
    }

    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // モバイルはCSSで中央上固定にしているため、明示指定を解除
      info.style.top = '';
      info.style.right = '';
      info.style.left = '';
      info.style.bottom = '';
      info.style.maxHeight = '';
      return;
    }

    // デスクトップ: 右上のCesiumツールバーを避ける
    const toolbarEl = document.querySelector('.cesium-viewer-toolbar');
    const timelineEl = document.querySelector('.cesium-timeline-main');

    let top = 10;
    if (toolbarEl) {
      const r = toolbarEl.getBoundingClientRect();
      // ツールバー下端 + 10px までは下げる
      if (r.bottom) top = Math.max(top, Math.round(r.bottom) + 10);
    }

    info.style.top = `${top}px`;
    info.style.right = '10px';
    info.style.left = 'auto';

    // タイムラインと重ならないように高さ制限
    let maxH = window.innerHeight - top - 20; // 下マージン20
    if (timelineEl) {
      const tr = timelineEl.getBoundingClientRect();
      const timelineHeight = tr.height || (window.innerHeight - tr.top) || 0;
      maxH = Math.max(80, window.innerHeight - top - timelineHeight - 20);
    }
    info.style.maxHeight = `${Math.floor(maxH)}px`;
  }

  /**
   * タッチデバイス向け最適化
   */
  _setupTouchOptimizations() {
    // タッチデバイス検出
    const isTouchDevice = ('ontouchstart' in window) || 
                         (navigator.maxTouchPoints > 0) || 
                         (navigator.msMaxTouchPoints > 0);

    if (!isTouchDevice) return;

    console.log('Touch device detected, applying optimizations');

    // ダブルタップでのズーム防止（メニューボタン等）
    const preventDoubleZoom = (element) => {
      let lastTouchEnd = 0;
      element.addEventListener('touchend', (e) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }, false);
    };

    // 主要なUI要素にダブルタップズーム防止を適用（ハンバーガーは除外しクリックの確実性を優先）
    const uiElements = document.querySelectorAll('#toolbar button, select, input[type="range"]');
    uiElements.forEach(preventDoubleZoom);

    // スライダーのタッチ操作改善
    const sliders = document.querySelectorAll('#toolbar input[type="range"]');
    sliders.forEach(slider => {
      slider.style.touchAction = 'pan-x'; // 水平スクロールのみ許可
      
      // タッチ開始時のフィードバック
      slider.addEventListener('touchstart', () => {
        slider.style.outline = '2px solid #4CAF50';
      });
      
      slider.addEventListener('touchend', () => {
        slider.style.outline = '';
      });
    });

    // ツールバー内のスクロール改善
    const toolbar = document.getElementById('toolbar');
    if (toolbar) {
      toolbar.style.webkitOverflowScrolling = 'touch';
      toolbar.style.overscrollBehavior = 'contain';
    }
  }

  /**
   * モバイル向け情報パネル制御
   */
  _setupMobileInfoPanel() {
    const infoPanel = document.getElementById('info');
    if (!infoPanel) return;

    // 小画面での情報パネル初期状態（最小化）
    const checkMobileLayout = () => {
      const isMobile = window.innerWidth <= 768;
      
      if (isMobile) {
        // モバイルでは詳細セクションをデフォルトで折りたたむ
        const detailsSections = infoPanel.querySelectorAll('details.section');
        detailsSections.forEach(details => {
          details.removeAttribute('open');
        });
        
        // 情報パネルをコンパクトモードに
        infoPanel.classList.add('mobile-compact');
        
        // タップで展開可能なヘッダーを追加
        if (!infoPanel.querySelector('.mobile-info-toggle')) {
          const toggleButton = document.createElement('div');
          toggleButton.className = 'mobile-info-toggle';
          toggleButton.innerHTML = '<span>ℹ️ 統計情報 ▼</span>';
          toggleButton.style.cssText = `
            background: rgba(0,0,0,0.8);
            padding: 8px 12px;
            border-radius: 4px 4px 0 0;
            cursor: pointer;
            font-size: 12px;
            border-bottom: 1px solid #333;
          `;
          
          infoPanel.insertBefore(toggleButton, infoPanel.firstChild);
          
          let isExpanded = false;
          toggleButton.addEventListener('click', () => {
            isExpanded = !isExpanded;
            const sections = infoPanel.querySelectorAll('.section');
            
            if (isExpanded) {
              sections.forEach(section => section.style.display = 'block');
              toggleButton.innerHTML = '<span>ℹ️ 統計情報 ▲</span>';
              infoPanel.style.maxHeight = '70vh';
            } else {
              sections.forEach(section => section.style.display = 'none');
              toggleButton.innerHTML = '<span>ℹ️ 統計情報 ▼</span>';
              infoPanel.style.maxHeight = '40px';
            }
          });
          
          // 初期状態は折りたたみ
          const sections = infoPanel.querySelectorAll('.section');
          sections.forEach(section => section.style.display = 'none');
          infoPanel.style.maxHeight = '40px';
        }
      } else {
        // デスクトップでは通常表示
        infoPanel.classList.remove('mobile-compact');
        const toggle = infoPanel.querySelector('.mobile-info-toggle');
        if (toggle) {
          toggle.remove();
        }
        
        const sections = infoPanel.querySelectorAll('.section');
        sections.forEach(section => {
          section.style.display = 'block';
        });
        infoPanel.style.maxHeight = '';
      }
    };

    // 初期チェックと画面サイズ変更時の対応
    checkMobileLayout();
    window.addEventListener('resize', checkMobileLayout);
  }
  
  /**
   * 言語コントロールの初期化
   */
  _setupLanguageControls() {
    try {
      const sel = document.getElementById('langSelect');
      if (!sel) return;
      // 初期値を反映
      sel.value = this._lang;
      sel.addEventListener('change', () => {
        const val = sel.value;
        this.setLanguage(val);
      });
    } catch (_) {}
  }

  /**
   * 言語を設定
   */
  setLanguage(lang) {
    this._lang = lang || 'ja';
    try { if (typeof localStorage !== 'undefined') localStorage.setItem('hb_lang', this._lang); } catch (_) {}
    this._applyTranslations();
  }

  /**
   * 翻訳適用（主要テキストのみ）
   */
  _applyTranslations() {
    const t = this._getTranslations();
    const L = t[this._lang] || t.ja;
    const map = {
      'i18n-title': 'title_main',
      'i18n-subtitle': 'subtitle',
      'i18n-sum-data': 'sum_data',
      'i18n-sum-display': 'sum_display',
      'i18n-sum-basemap': 'sum_basemap',
      'i18n-sum-voxel': 'sum_voxel',
      'i18n-sum-color': 'sum_color',
      'i18n-sum-outline': 'sum_outline',
      'i18n-sum-adaptive': 'sum_adaptive',
      'i18n-sum-view': 'sum_view',
      'i18n-sum-legacy-adaptive': 'sum_legacy_adaptive',
      'i18n-sum-highlight': 'sum_highlight',
      'i18n-sum-advanced': 'sum_advanced',
      'i18n-ops-title': 'ops_title',
      'i18n-stats-title': 'stats_title',
      // Navigation dropdown stats
      'navStatsTitle': 'nav_stats_title',
      'navLabelDataCount': 'nav_label_dataCount',
      'navLabelVoxelCount': 'nav_label_voxelCount',
      'navLabelMaxValue': 'nav_label_maxValue',
      'navLabelMinValue': 'nav_label_minValue',
      // Sidebar stats
      'i18n-label-dataCount': 'label_dataCount',
      'i18n-label-voxelCount': 'label_voxelCount',
      'i18n-label-emptyVoxel': 'label_emptyVoxel',
      'i18n-label-max': 'label_max',
      'i18n-label-min': 'label_min',
      'i18n-label-avg': 'label_avg',
      'i18n-autosize-adjusted': 'autosize_adjusted',
      'i18n-autosize-size': 'autosize_size',
      'i18n-env-title': 'env_title',
      'i18n-label-cesium': 'label_cesium',
      'i18n-label-heatbox': 'label_heatbox',
      'i18n-label-webgl': 'label_webgl',
      'i18n-or-title': 'or_title',
      'i18n-label-or-calls': 'or_calls',
      'i18n-label-or-avg': 'or_avg',
      'i18n-label-or-minmax': 'or_minmax',
      'i18n-label-or-dminmax': 'or_dminmax',
      'i18n-label-or-topn': 'or_topn',
      'i18n-lang-label': 'lang_label'
    };
    Object.entries(map).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el && L[key]) el.textContent = L[key];
    });
    // data-i18n 汎用適用（ラベル・オプションなど）
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && L[key]) el.textContent = L[key];
    });
    // プレースホルダー
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key && L[key]) el.setAttribute('placeholder', L[key]);
    });
    // ARIAラベル
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria-label');
      if (key && L[key]) el.setAttribute('aria-label', L[key]);
    });
    // ローディング
    const loadingP = document.querySelector('#loading [data-i18n="loading"]');
    if (loadingP && L.loading) loadingP.textContent = L.loading;
  }

  /**
   * 翻訳辞書
   */
  _getTranslations() {
    // Externalized dictionaries take precedence (see playground/i18n/*.js)
    try {
      if (typeof window !== 'undefined' && window.HEATBOX_I18N) {
        return window.HEATBOX_I18N;
      }
    } catch (_) {}
    return {
      ja: {
        // Section summaries
        sum_rendering: '描画制御',
        sum_actions: '操作・実行',
        // Language selector
        label_language: '言語',
        lang_ja: '日本語',
        lang_en: 'English',
        // Navigation
        nav_home: 'ホーム',
        nav_quick: 'クイックスタート',
        nav_playground: 'プレイグラウンド',
        nav_docs: 'ドキュメント',
        nav_github: 'GitHub',
        nav_menu: 'メニュー',
        aria_nav_open: 'ナビゲーションを開く',
        aria_nav_close: 'ナビゲーションを閉じる',
        aria_menu_toggle: 'メニューを開く',
        aria_collapse_left: '左パネルの表示/非表示',
        aria_collapse_right: '右パネルの表示/非表示',
        title_main: 'Cesium Heatbox Playground',
        subtitle: '高度なコントロール',
        sum_data: 'データ読み込み',
        sum_display: '表示設定',
        sum_basemap: '背景地図',
        sum_voxel: 'ボクセルと描画',
        sum_color: '色設定',
        sum_outline: '枠線・見た目',
        sum_adaptive: '適応表示',
        sum_view: 'ビュー',
        sum_legacy_adaptive: '適応表示（レガシー）',
        sum_highlight: '強調表示',
        sum_advanced: '詳細設定',
        ops_title: '操作',
        btn_create: 'ヒートマップ作成',
        btn_clear: 'クリア',
        btn_toggle: '表示/非表示',
        btn_export: 'データ出力',
        stats_title: '統計情報',
        // Navigation dropdown stats
        nav_stats_title: '統計情報',
        nav_label_dataCount: 'データ点数:',
        nav_label_voxelCount: 'ボクセル数:',
        nav_label_maxValue: '最大値:',
        nav_label_minValue: '最小値:',
        nav_strategy: '戦略:',
        nav_rendered: 'レンダリング:',
        nav_tier: 'ティア:',
        nav_coverage: 'カバレッジ:',
        detail_title: '詳細統計',
        autosize_title: '自動サイズ調整',
        render_title: 'レンダリング情報',
        // Sidebar stats
        label_dataCount: 'データ点数:',
        label_voxelCount: 'ボクセル数:',
        label_emptyVoxel: '空ボクセル:',
        label_max: '最大値:',
        label_min: '最小値:',
        label_avg: '平均値:',
        autosize_adjusted: '自動調整:',
        autosize_size: 'サイズ:',
        env_title: '環境情報',
        label_cesium: 'Cesium:',
        label_heatbox: 'Heatbox:',
        label_webgl: 'WebGL:',
        or_title: 'Outline Resolver 統計',
        or_calls: '呼び出し:',
        or_avg: '平均太さ:',
        or_minmax: '太さ範囲:',
        or_dminmax: '密度範囲:',
        or_topn: 'TopN対象:',
        lang_label: '言語',
        // Adaptive (v0.1.9)
        label_maxRenderVoxels: '最大レンダーボクセル数:',
        opt_budget_auto: 'Auto（自動）',
        opt_budget_3k: '3,000（軽量）',
        opt_budget_8k: '8,000（標準）',
        opt_budget_15k: '15,000（高性能）',
        opt_budget_50k: '50,000（最大）',
        label_renderStrategy: 'レンダリング戦略:',
        opt_strategy_density: 'Density（密度重視）',
        opt_strategy_coverage: 'Coverage（範囲重視）',
        opt_strategy_hybrid: 'Hybrid（バランス）',
        chk_autoView: '自動カメラ位置調整',
        label_fitViewHeading: 'カメラ方向（度）:',
        label_fitViewPitch: 'カメラ角度（度）:',
        btn_fitView: '手動カメラフィット',
        // Data section
        btn_load_sample: 'サンプルデータを読み込み',
        btn_generate_test: 'テストデータを生成',
        // Display section
        label_baseMap: '背景地図:',
        chk_autoVoxel: '自動サイズ決定（v0.1.4新機能）',
        label_gridSize: 'グリッドサイズ（手動）:',
        chk_heightBased: '高さベース表現',
        chk_showEmpty: '空のボクセルを表示',
        label_emptyOpacity: '空ボクセル透明度:',
        chk_wireframeOnly: '枠線のみ表示',
        // Color section
        label_colorMap: 'カラーマップ:',
        opt_color_custom: 'カスタム（従来）',
        opt_color_viridis: 'Viridis（科学的）',
        opt_color_inferno: 'Inferno（科学的）',
        label_customColor: 'カスタム色:',
        opt_theme_heat: 'ヒート（青→赤）',
        opt_theme_cool: 'クール（青→マゼンタ）',
        opt_theme_rainbow: 'レインボー',
        chk_diverging: '二極性データ（blue-white-red）',
        label_divergingPivot: '二極性中心値:',
        // Outline section
        label_outlineRenderMode: '描画モード:',
        opt_render_standard: '標準',
        opt_render_inset: 'インセット主体',
        opt_render_emulation: 'エミュレーションのみ',
        label_outlineInset: 'インセット枠線 (m):',
        label_outlineInsetMode: 'インセット適用範囲:',
        opt_inset_off: 'OFF（無効）',
        opt_inset_topn: 'TopN のみ',
        opt_inset_all: '全体',
        chk_thickFrames: '厚い枠線表示（フレーム埋め込み）',
        label_voxelGap: 'ボクセル間ギャップ (m):',
        label_outlineOpacity: '枠線透明度:',
        label_outlineMode: '枠線太さモード:',
        opt_outline_adaptive: '自動（密度に応じて調整）',
        opt_outline_manual: '手動（固定太さ）',
        label_outlineWidth: '枠線太さ (px):',
        label_outlineEmulation: '太線エミュレーション:',
        opt_emul_off: '無効',
        opt_emul_topn: 'TopNのみ',
        opt_emul_non_topn: 'TopN以外のみ',
        opt_emul_all: 'すべて太線（自動インセット適用）',
        // Adaptive
        chk_adaptiveOutlines: '適応的枠線制御を有効化',
        label_outlinePreset: '枠線プリセット:',
        opt_preset_uniform: '均一',
        opt_preset_density: '密度適応',
        opt_preset_topn: 'TopN重視',
        label_boxOpacityMode: 'ボックス透明度:',
        label_outlineOpacityMode: '枠線透明度:',
        opt_opacity_off: '固定（従来）',
        opt_opacity_density: '密度ベース',
        opt_opacity_topn: 'TopNベース',
        // Highlight
        label_highlightTopN: 'TopN強調表示:',
        ph_highlightTopN: '0=無効',
        label_highlightOpacity: '非TopNの減衰量:',
        // Advanced
        chk_debugMode: 'デバッグモード（ログ出力）',
        chk_showBounds: '境界ボックス表示',
        btn_testHeatbox: 'Heatboxテスト',
        // Buttons
        btn_create: 'ヒートマップ作成',
        btn_clear: 'クリア',
        btn_toggle: '表示/非表示',
        btn_export: 'データ出力',
        // Loading
        loading: '処理中...'
      },
      en: {
        // Section summaries
        sum_rendering: 'Rendering Control',
        sum_actions: 'Actions',
        // Language selector
        label_language: 'Language',
        lang_ja: 'Japanese',
        lang_en: 'English',
        // Navigation
        nav_home: 'Home',
        nav_quick: 'Quick Start',
        nav_playground: 'Playground',
        nav_docs: 'Docs',
        nav_github: 'GitHub',
        nav_menu: 'Menu',
        aria_nav_open: 'Open navigation',
        aria_nav_close: 'Close navigation',
        aria_menu_toggle: 'Open menu',
        aria_collapse_left: 'Toggle left panel',
        aria_collapse_right: 'Toggle right panel',
        title_main: 'Cesium Heatbox Playground',
        subtitle: 'Advanced controls',
        sum_data: 'Data',
        sum_display: 'Display',
        sum_basemap: 'Base Map',
        sum_voxel: 'Voxel Sizing & Rendering',
        sum_color: 'Colors',
        sum_outline: 'Outlines & Look',
        sum_adaptive: 'Adaptive',
        sum_view: 'View',
        sum_legacy_adaptive: 'Adaptive (Legacy)',
        sum_highlight: 'Highlight',
        sum_advanced: 'Advanced',
        ops_title: 'Actions',
        btn_create: 'Create Heatmap',
        btn_clear: 'Clear',
        btn_toggle: 'Show/Hide',
        btn_export: 'Export Data',
        stats_title: 'Statistics',
        // Navigation dropdown stats
        nav_stats_title: 'Statistics',
        nav_label_dataCount: 'Points:',
        nav_label_voxelCount: 'Voxels:',
        nav_label_maxValue: 'Max:',
        nav_label_minValue: 'Min:',
        nav_strategy: 'Strategy:',
        nav_rendered: 'Rendered:',
        nav_tier: 'Tier:',
        nav_coverage: 'Coverage:',
        detail_title: 'Details',
        autosize_title: 'Auto Sizing',
        render_title: 'Rendering Info',
        // Sidebar stats
        label_dataCount: 'Points:',
        label_voxelCount: 'Voxels:',
        label_emptyVoxel: 'Empty voxels:',
        label_max: 'Max:',
        label_min: 'Min:',
        label_avg: 'Avg:',
        autosize_adjusted: 'Auto-adjust:',
        autosize_size: 'Size:',
        env_title: 'Environment',
        label_cesium: 'Cesium:',
        label_heatbox: 'Heatbox:',
        label_webgl: 'WebGL:',
        or_title: 'Outline Resolver Stats',
        or_calls: 'Calls:',
        or_avg: 'Avg Width:',
        or_minmax: 'Width Range:',
        or_dminmax: 'Density Range:',
        or_topn: 'TopN Count:',
        lang_label: 'Language',
        // Adaptive (v0.1.9)
        label_maxRenderVoxels: 'Max render voxels:',
        opt_budget_auto: 'Auto',
        opt_budget_3k: '3,000 (light)',
        opt_budget_8k: '8,000 (standard)',
        opt_budget_15k: '15,000 (high)',
        opt_budget_50k: '50,000 (max)',
        label_renderStrategy: 'Render strategy:',
        opt_strategy_density: 'Density-focused',
        opt_strategy_coverage: 'Coverage-focused',
        opt_strategy_hybrid: 'Hybrid (balanced)',
        chk_autoView: 'Auto camera fit',
        label_fitViewHeading: 'Camera heading (deg):',
        label_fitViewPitch: 'Camera pitch (deg):',
        btn_fitView: 'Fit view',
        // Data
        btn_load_sample: 'Load sample data',
        btn_generate_test: 'Generate test data',
        // Display
        label_baseMap: 'Base map:',
        chk_autoVoxel: 'Auto voxel size (v0.1.4)',
        label_gridSize: 'Grid size (manual):',
        chk_heightBased: 'Height-based boxes',
        chk_showEmpty: 'Show empty voxels',
        label_emptyOpacity: 'Empty voxel opacity:',
        chk_wireframeOnly: 'Wireframe only',
        // Color
        label_colorMap: 'Color map:',
        opt_color_custom: 'Custom (classic)',
        opt_color_viridis: 'Viridis (scientific)',
        opt_color_inferno: 'Inferno (scientific)',
        label_customColor: 'Custom colors:',
        opt_theme_heat: 'Heat (blue→red)',
        opt_theme_cool: 'Cool (blue→magenta)',
        opt_theme_rainbow: 'Rainbow',
        chk_diverging: 'Diverging data (blue-white-red)',
        label_divergingPivot: 'Diverging pivot:',
        // Outline
        label_outlineRenderMode: 'Render mode:',
        opt_render_standard: 'Standard',
        opt_render_inset: 'Inset first',
        opt_render_emulation: 'Emulation only',
        label_outlineInset: 'Outline inset (m):',
        label_outlineInsetMode: 'Inset scope:',
        opt_inset_off: 'OFF (disabled)',
        opt_inset_topn: 'TopN only',
        opt_inset_all: 'All',
        chk_thickFrames: 'Thick outline (framed)',
        label_voxelGap: 'Voxel gap (m):',
        label_outlineOpacity: 'Outline opacity:',
        label_outlineMode: 'Outline width mode:',
        opt_outline_adaptive: 'Adaptive (by density)',
        opt_outline_manual: 'Manual (fixed width)',
        label_outlineWidth: 'Outline width (px):',
        label_outlineEmulation: 'Outline emulation:',
        opt_emul_off: 'Off',
        opt_emul_topn: 'TopN only',
        opt_emul_non_topn: 'Non-TopN only',
        opt_emul_all: 'All (auto inset)',
        // Adaptive
        chk_adaptiveOutlines: 'Enable adaptive outlines',
        label_outlinePreset: 'Outline preset:',
        opt_preset_uniform: 'Uniform',
        opt_preset_density: 'Adaptive by density',
        opt_preset_topn: 'TopN focused',
        label_boxOpacityMode: 'Box opacity:',
        label_outlineOpacityMode: 'Outline opacity:',
        opt_opacity_off: 'Fixed (classic)',
        opt_opacity_density: 'By density',
        opt_opacity_topn: 'By TopN',
        // Highlight
        label_highlightTopN: 'Highlight TopN:',
        ph_highlightTopN: '0 = off',
        label_highlightOpacity: 'Non-TopN attenuation:',
        // Advanced
        chk_debugMode: 'Debug mode (log output)',
        chk_showBounds: 'Show bounds box',
        btn_testHeatbox: 'Test Heatbox',
        // Buttons
        btn_create: 'Create Heatmap',
        btn_clear: 'Clear',
        btn_toggle: 'Show/Hide',
        btn_export: 'Export Data',
        // Loading
        loading: 'Processing...'
      }
    };
  }
  
  /**
   * 選択IDに応じたImageryProviderを生成
   */
  _createImageryProvider(id) {
    const make = (url, opts = {}) => new Cesium.UrlTemplateImageryProvider({ url, ...opts });
    switch (id) {
      case 'carto-light':
        return make('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
          subdomains: 'abcd', maximumLevel: 19, credit: '© OpenStreetMap contributors © CARTO'
        });
      case 'carto-dark':
        return make('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png', {
          subdomains: 'abcd', maximumLevel: 19, credit: '© OpenStreetMap contributors © CARTO'
        });
      case 'osm-humanitarian':
        return make('https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
          subdomains: 'abc', maximumLevel: 19, credit: '© OpenStreetMap contributors, Humanitarian style'
        });
      case 'osm-standard':
      default:
        return make('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          subdomains: 'abc', maximumLevel: 19, credit: '© OpenStreetMap contributors'
        });
    }
  }

  /**
   * ベースマップを切り替え
   */
  setBaseMap(id) {
    if (!this.viewer) return;
    const provider = this._createImageryProvider(id);
    const layers = this.viewer.imageryLayers;
    try {
      while (layers.length > 0) {
        layers.remove(layers.get(0), true);
      }
    } catch (_) {}
    layers.addImageryProvider(provider);
    console.log('Base map switched to:', id, 'Layers:', layers.length);
  }
  
  /**
   * Cesium Viewerを初期化
   */
  initializeCesium() {
    console.log('=== Cesium Viewer 初期化開始 ===');
    
    try {
      // コンテナ要素の確認
      const container = document.getElementById('cesiumContainer');
      if (!container) {
        throw new Error('cesiumContainer element not found');
      }
      console.log('Container element found:', container);
      
      console.log('Creating Cesium Viewer...');
      
      // 初期ベースマップをUIの選択から決定
      const baseMapSelect = document.getElementById('baseMap');
      const initialBaseMap = baseMapSelect?.value || 'carto-light';

      // Viewer設定
      const viewerOptions = {
        // ベースレイヤーは選択に応じて設定（Ion不要）
        imageryProvider: this._createImageryProvider(initialBaseMap),
        // UIコントロールの設定
        baseLayerPicker: false, // Ion依存のレイヤーを避けるため無効化
        homeButton: true,
        sceneModePicker: true,
        navigationHelpButton: false,
        animation: false,
        timeline: true,
        fullscreenButton: false,
        vrButton: false,
        geocoder: false,
        infoBox: false,
        selectionIndicator: false,
        shadows: false,
        shouldAnimate: false
      };
      
      // 地形プロバイダーの設定（明示的に設定）
      try {
        viewerOptions.terrainProvider = new Cesium.EllipsoidTerrainProvider();
        console.log('EllipsoidTerrainProvider set as fallback');
      } catch (e) {
        console.warn('Failed to set terrain provider:', e);
      }
      
      this.viewer = new Cesium.Viewer('cesiumContainer', viewerOptions);
      
      console.log('Cesium Viewer created successfully');
      
      // まれに初期レイヤーが0になる環境があるため冗長に適用
      try {
        const layers = this.viewer.imageryLayers;
        if (!layers || layers.length === 0 || !layers.get(0)) {
          console.warn('No imagery layer detected at init. Forcing base map add.');
          this.setBaseMap(initialBaseMap);
        }
      } catch (e) {
        console.warn('Failed to ensure base map at init:', e);
      }
      
      // ベースマップ選択変更への追従
      if (baseMapSelect) {
        baseMapSelect.addEventListener('change', () => {
          try {
            this.setBaseMap(baseMapSelect.value);
          } catch (e) {
            console.warn('Failed to switch base map:', e);
          }
        });
      }
      
      // 地球の表示を確実にする
      this.viewer.scene.globe.show = true;
      this.viewer.scene.globe.depthTestAgainstTerrain = false;
      this.viewer.scene.skyBox.show = true;
      this.viewer.scene.sun.show = true;
      this.viewer.scene.moon.show = true;
      if (this.viewer.scene.skyAtmosphere) {
        this.viewer.scene.skyAtmosphere.show = true;
      }
      
      // 背景色を設定（真っ黒を避ける）
      this.viewer.scene.backgroundColor = Cesium.Color.DARKSLATEGRAY;
      
      // 大気効果を有効にする（互換性のある範囲で）
      this.viewer.scene.globe.enableLighting = true;
      
      // フォグ（霧）効果を無効にする（地球が見えなくなる可能性を避ける）
      this.viewer.scene.fog.enabled = false;
      // トランスルーセント描画の互換性（バージョンにより読み取り専用のため安全に設定）
      try {
        const oit = this.viewer.scene.orderIndependentTranslucency;
        if (oit && typeof oit === 'object' && 'enabled' in oit) {
          oit.enabled = true;
        }
      } catch (_) {
        // ignore
      }
      
      console.log('Globe and sky settings applied');
      console.log('Globe visible:', this.viewer.scene.globe.show);
      console.log('Background color:', this.viewer.scene.backgroundColor);
      console.log('Imagery layers count:', this.viewer.imageryLayers.length);
      
      // デフォルトの位置を東京に設定
      this.viewer.scene.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(139.6917, 35.6895, 15000),
        orientation: {
          heading: 0,
          pitch: -Cesium.Math.PI_OVER_FOUR,
          roll: 0
        }
      });
      
      console.log('Camera position set to Tokyo');
      
      console.log('Cesium Viewer initialized successfully');
      console.log('Scene ready:', this.viewer.scene.isDestroyed() === false);
      console.log('Globe show:', this.viewer.scene.globe.show);
      console.log('Imagery layers:', this.viewer.imageryLayers.length);
      console.log('First imagery layer:', this.viewer.imageryLayers.get(0));
      console.log('Terrain provider type:', this.viewer.terrainProvider.constructor.name);
      console.log('Camera position:', this.viewer.scene.camera.position);
      console.log('Canvas size:', this.viewer.scene.canvas.clientWidth, 'x', this.viewer.scene.canvas.clientHeight);
      console.log('WebGL context:', this.viewer.scene.context._gl ? 'Available' : 'Not available');
      
      // イベントリスナーを追加してレンダリング状況を監視
      this.viewer.scene.postRender.addEventListener(() => {
        // 初回レンダリング時のみログ出力
        if (!this.viewer.scene._firstRenderLogged) {
          console.log('First render completed');
          console.log('Globe ellipsoid:', this.viewer.scene.globe.ellipsoid);
          this.viewer.scene._firstRenderLogged = true;
          // 初回レンダリング後にUI位置を調整
          try { this._adjustUIPanelPositions(); } catch (_) {}
        }
      });
      
      console.log('=== Cesium Viewer 初期化完了 ===');
      // Viewer初期化直後にも位置調整を試みる
      try { this._adjustUIPanelPositions(); } catch (_) {}

    } catch (error) {
      console.error('=== Cesium Viewer 初期化エラー ===');
      console.error('Error details:', error);
      console.error('Error stack:', error.stack);
      console.error('Cesium available:', typeof Cesium !== 'undefined');
      console.error('Container element:', document.getElementById('cesiumContainer'));
      throw new Error('Cesium Viewerの初期化に失敗しました: ' + error.message);
    }
  }
  
  /**
   * v0.1.5: コントロールの初期状態を設定
   */
  initializeControlStates() {
    // カスタムカラーコントロールを初期状態で非表示
    this.toggleCustomColorControls(false);
    
    // 二極性コントロールを初期状態で無効
    this.toggleDivergingControls(false);
    
    // TopN強調スタイルコントロールを初期状態で無効
    this.toggleHighlightStyleControls(false);
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // ファイル入力
    document.getElementById('fileInput').addEventListener('change', (e) => {
      this.handleFileInput(e);
    });
    
    // ボタン
    document.getElementById('loadSampleData').addEventListener('click', () => {
      this.loadSampleData();
    });
    
    document.getElementById('generateTestData').addEventListener('click', () => {
      this.generateTestData();
    });
    
    document.getElementById('createHeatmap').addEventListener('click', () => {
      this.createHeatmap();
    });
    
    document.getElementById('clearHeatmap').addEventListener('click', () => {
      this.clearHeatmap();
    });
    
    document.getElementById('toggleVisibility').addEventListener('click', () => {
      this.toggleVisibility();
    });
    
    document.getElementById('exportData').addEventListener('click', () => {
      this.exportData();
    });
    
    // Heatboxテストボタン
    document.getElementById('testHeatbox').addEventListener('click', () => {
      this.testHeatboxBasic();
    });
    
    // スライダー
    document.getElementById('gridSize').addEventListener('input', (e) => {
      document.getElementById('gridSizeValue').textContent = e.target.value;
    });
    
    // 高度オフセット・スケールはUI整理で削除
    
    // v0.1.4: 自動ボクセルサイズチェックボックス
    document.getElementById('autoVoxelSize').addEventListener('change', (e) => {
      this.toggleManualSizeControls(!e.target.checked);
      this.toggleAutoVoxelModeControls(e.target.checked);
    });
    
    // v0.1.9: 自動ボクセルサイズモード選択
    document.getElementById('autoVoxelSizeMode').addEventListener('change', (e) => {
      console.log('Auto voxel size mode changed:', e.target.value);
    });
    
    // v0.1.9: Auto View チェックボックス
    document.getElementById('autoView').addEventListener('change', (e) => {
      this.toggleFitViewControls(e.target.checked);
    });
    
    // v0.1.9: FitView設定スライダー
    document.getElementById('fitViewHeading').addEventListener('input', (e) => {
      document.getElementById('fitViewHeadingValue').textContent = e.target.value;
    });
    
    document.getElementById('fitViewPitch').addEventListener('input', (e) => {
      document.getElementById('fitViewPitchValue').textContent = e.target.value;
    });
    
    // v0.1.9: 手動fitViewボタン
    document.getElementById('manualFitView').addEventListener('click', () => {
      this.executeFitView();
    });

    // v0.1.12: Profiles & Performance Overlay controls
    const profileSel = document.getElementById('configProfile');
    if (profileSel && typeof this.handleProfileChange === 'function') {
      profileSel.addEventListener('change', this.handleProfileChange.bind(this));
    }
    const overlayChk = document.getElementById('performanceOverlay');
    if (overlayChk && typeof this.handlePerformanceOverlayToggle === 'function') {
      overlayChk.addEventListener('change', this.handlePerformanceOverlayToggle.bind(this));
    }
    const overlayPos = document.getElementById('overlayPosition');
    if (overlayPos && typeof this.handlePerformanceOverlayToggle === 'function') {
      overlayPos.addEventListener('change', this.handlePerformanceOverlayToggle.bind(this));
    }
    const overlayInt = document.getElementById('overlayUpdateInterval');
    if (overlayInt && typeof this.handleOverlayIntervalChange === 'function') {
      overlayInt.addEventListener('input', this.handleOverlayIntervalChange.bind(this));
    }
    const presetSel = document.getElementById('outlineWidthPreset');
    if (presetSel && typeof this.handlePresetChange === 'function') {
      presetSel.addEventListener('change', this.handlePresetChange.bind(this));
    }
    const effBtn = document.getElementById('getEffectiveOptions');
    if (effBtn && typeof this.showEffectiveOptions === 'function') {
      effBtn.addEventListener('click', this.showEffectiveOptions.bind(this));
    }
    
    // 空ボクセル表示チェックボックス
    document.getElementById('showEmptyVoxels').addEventListener('change', (e) => {
      this.toggleEmptyOpacityControls(e.target.checked);
    });
    
    // 空ボクセル透明度スライダー
    document.getElementById('emptyOpacity').addEventListener('input', (e) => {
      document.getElementById('emptyOpacityValue').textContent = e.target.value;
    });
    
    // v0.1.5: カラーマップ選択
    document.getElementById('colorMap').addEventListener('change', (e) => {
      this.toggleCustomColorControls(e.target.value === 'custom');
    });
    
    // v0.1.5: 二極性データチェックボックス
    document.getElementById('diverging').addEventListener('change', (e) => {
      this.toggleDivergingControls(e.target.checked);
    });
    
    // v0.1.5: TopN強調表示入力
    document.getElementById('highlightTopN').addEventListener('input', (e) => {
      this.toggleHighlightStyleControls(parseInt(e.target.value) > 0);
    });
    
    // v0.1.5: 強調不透明度スライダー
    document.getElementById('highlightOpacity').addEventListener('input', (e) => {
      document.getElementById('highlightOpacityValue').textContent = e.target.value;
    });

    // v0.1.6: voxelGap / outlineOpacity 値プレビュー
    const voxelGapEl = document.getElementById('voxelGap');
    const voxelGapValueEl = document.getElementById('voxelGapValue');
    if (voxelGapEl && voxelGapValueEl) {
      voxelGapEl.addEventListener('input', () => {
        voxelGapValueEl.textContent = parseFloat(voxelGapEl.value).toFixed(1);
      });
      voxelGapValueEl.textContent = parseFloat(voxelGapEl.value).toFixed(1);
    }

    const outlineOpacityEl = document.getElementById('outlineOpacity');
    const outlineOpacityValueEl = document.getElementById('outlineOpacityValue');
    if (outlineOpacityEl && outlineOpacityValueEl) {
      outlineOpacityEl.addEventListener('input', () => {
        outlineOpacityValueEl.textContent = parseFloat(outlineOpacityEl.value).toFixed(1);
      });
      outlineOpacityValueEl.textContent = parseFloat(outlineOpacityEl.value).toFixed(1);
    }

    // v0.1.6: 枠線太さモード切替と手動太さのリアルタイム表示
    const outlineModeEl = document.getElementById('outlineMode');
    const outlineWidthEl = document.getElementById('outlineWidth');
    const outlineWidthValueEl = document.getElementById('outlineWidthValue');
    if (outlineModeEl) {
      outlineModeEl.addEventListener('change', () => {
        this.toggleManualOutlineWidthControls(outlineModeEl.value === 'manual');
      });
      // 初期状態: adaptive → 手動コントロール無効
      this.toggleManualOutlineWidthControls(outlineModeEl.value === 'manual');
    }
    if (outlineWidthEl && outlineWidthValueEl) {
      outlineWidthEl.addEventListener('input', () => {
        outlineWidthValueEl.textContent = parseInt(outlineWidthEl.value, 10);
      });
      outlineWidthValueEl.textContent = parseInt(outlineWidthEl.value, 10);
    }

    // v0.1.6.1: outlineInset 値プレビュー
    const outlineInsetEl = document.getElementById('outlineInset');
    const outlineInsetValueEl = document.getElementById('outlineInsetValue');
    const outlineInsetModeEl = document.getElementById('outlineInsetMode');
    if (outlineInsetEl && outlineInsetValueEl) {
      outlineInsetEl.addEventListener('input', () => {
        outlineInsetValueEl.textContent = parseFloat(outlineInsetEl.value).toFixed(1);
      });
      outlineInsetValueEl.textContent = parseFloat(outlineInsetEl.value).toFixed(1);
    }
    if (outlineInsetModeEl && outlineInsetEl && outlineInsetValueEl) {
      outlineInsetModeEl.addEventListener('change', () => {
        const mode = outlineInsetModeEl.value;
        const isOff = mode === 'off';
        outlineInsetEl.disabled = isOff;
        outlineInsetEl.style.opacity = isOff ? '0.5' : '1';
        outlineInsetValueEl.textContent = isOff ? '0.0' : parseFloat(outlineInsetEl.value).toFixed(1);
      });
      // 初期状態反映
      const initOff = outlineInsetModeEl.value === 'off';
      outlineInsetEl.disabled = initOff;
      outlineInsetEl.style.opacity = initOff ? '0.5' : '1';
      outlineInsetValueEl.textContent = initOff ? '0.0' : parseFloat(outlineInsetEl.value).toFixed(1);
    }
    // v0.1.7: 適応表示UI（特別な初期化は不要）
    void document.getElementById('adaptiveOutlines');
    void document.getElementById('outlineWidthPreset');
    void document.getElementById('outlineRenderMode');
    void document.getElementById('boxOpacityMode');
    void document.getElementById('outlineOpacityMode');
  }
  
  /**
   * ファイル入力を処理
   */
  async handleFileInput(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    this.showLoading(true);
    
    try {
      const text = await file.text();
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      // 既存のエンティティをクリア
      this.viewer.entities.removeAll();
      
      console.log('ファイル読み込み開始:', file.name, 'タイプ:', fileExtension);
      
      if (fileExtension === 'czml') {
        // CZMLファイルの処理 - Cesiumネイティブフォーマット
        await this.processCZMLFile(text);
        // CZMLの場合、dataSourcesに追加されているので、currentDataを設定
        this.currentData = [];
        
        if (this.viewer && this.viewer.dataSources) {
          for (let i = 0; i < this.viewer.dataSources.length; i++) {
            const dataSource = this.viewer.dataSources.get(i);
            if (dataSource && dataSource.entities) {
              const entities = dataSource.entities.values;
              this.currentData = this.currentData.concat(entities);
            }
          }
          console.log('CZML データソースから', this.currentData.length, '個のエンティティを取得');
        } else {
          console.error('viewer.dataSourcesが利用できません');
          this.currentData = [];
        }
      } else {
        // JSON/GeoJSONファイルの処理
        const data = JSON.parse(text);
        
        // GeoJSONの場合は特別な処理
        if (data.type === 'FeatureCollection' || data.type === 'Feature') {
          this.convertGeoJSONToEntities(data);
        } else {
          // 通常のJSONデータをCesium Entityに変換
          this.convertDataToEntities(data);
        }
        
        // JSON/GeoJSONの場合のみ、viewer.entitiesからcurrentDataを取得
        this.currentData = this.viewer.entities.values;
      }
      
      this.updateStatistics();
      console.log('ファイル読み込み完了:', this.currentData?.length || 0, '個のデータポイント');
      
      // CZMLの場合は特別なメッセージ
      if (fileExtension === 'czml') {
        console.log('CZML表示完了 - Cesiumでネイティブ表示されています');
      }
      
    } catch (error) {
      console.error('ファイル読み込みエラー:', error);
      alert('ファイルの読み込みに失敗しました: ' + error.message);
    } finally {
      this.showLoading(false);
    }
  }
  
  /**
   * CZMLファイルを処理
   */
  async processCZMLFile(czmlText) {
    try {
      const czmlData = JSON.parse(czmlText);
      console.log('CZML データ読み込み:', czmlData.length, '個のCZMLオブジェクト');
      
      // 既存のデータソースをクリア
      this.viewer.dataSources.removeAll();
      
      // CesiumのCZMLデータソースを使用してCZMLを直接読み込み
      const dataSource = await Cesium.CzmlDataSource.load(czmlData);
      await this.viewer.dataSources.add(dataSource);
      
      console.log('CZML読み込み完了:', dataSource.entities.values.length, '個のエンティティ');
      console.log('データソース追加完了、総データソース数:', this.viewer.dataSources.length);
      
      // ビューアの時計をCZMLに合わせる（動的CZML対応）
      if (dataSource.clock) {
        try {
          this.viewer.clock.startTime = dataSource.clock.startTime.clone();
          this.viewer.clock.stopTime = dataSource.clock.stopTime.clone();
          this.viewer.clock.currentTime = dataSource.clock.currentTime.clone();
          this.viewer.clock.multiplier = dataSource.clock.multiplier;
          this.viewer.clock.clockRange = Cesium.ClockRange.CLAMPED;
          console.log('Viewer clock synchronized to CZML clock');
        } catch (e) {
          console.warn('Failed to sync viewer clock to CZML clock:', e);
        }
      }

      // CZMLデータに応じてカメラを移動
      if (dataSource.entities.values.length > 0) {
        await this.viewer.zoomTo(dataSource);
      }
      
      // ヒートマップ用に、現在時刻の固定Cartesian3に変換した簡易データを作成
      const currentTime = this.viewer.clock.currentTime || Cesium.JulianDate.now();
      const plainData = [];
      for (const entity of dataSource.entities.values) {
        try {
          if (!entity.position) continue;
          const cart = entity.position.getValue(currentTime);
          if (!cart) continue;
          let weight = 1;
          if (entity.properties) {
            if (typeof entity.properties.getValue === 'function') {
              const props = entity.properties.getValue(currentTime) || {};
              weight = props.weight || props.intensity || props.value || 1;
            } else {
              weight = entity.properties.weight || entity.properties.intensity || entity.properties.value || 1;
            }
          }
          plainData.push({ id: entity.id, position: cart, properties: { weight } });
        } catch (e) {
          // ignore invalid entity
        }
      }
      this.currentData = plainData;
      console.log('CZML converted to plain data count:', this.currentData.length);
      this.updateStatistics();
      console.log('CZMLデータが正常に表示されました（ヒートボックス用データも準備済み）');
      
    } catch (error) {
      console.error('CZML処理エラー:', error);
      throw new Error('CZMLファイルの処理に失敗しました: ' + error.message);
    }
  }
  
  /**
   * CZMLエンティティからヒートマップ用データを抽出
   */
  extractDataFromCZML(dataSource) {
    const entities = dataSource.entities.values;
    let extractedData = [];
    
    entities.forEach((entity, index) => {
      if (entity.position) {
        const cartographic = Cesium.Cartographic.fromCartesian(
          entity.position.getValue(Cesium.JulianDate.now())
        );
        
        const lon = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        const height = cartographic.height;
        
        // 重みを取得（プロパティから、またはデフォルト値）
        const weight = entity.properties?.weight?.getValue() || 
                      entity.properties?.intensity?.getValue() || 
                      entity.properties?.value?.getValue() || 1;
        
        extractedData.push({
          id: entity.id || `czml_${index}`,
          name: entity.name || `CZML Point ${index}`,
          position: {
            longitude: lon,
            latitude: lat,
            height: height || 0
          },
          weight: weight,
          point: {
            color: entity.point?.color?.getValue() || Cesium.Color.YELLOW,
            pixelSize: entity.point?.pixelSize?.getValue() || 10
          }
        });
      }
    });
    
    console.log('CZMLから抽出されたデータポイント:', extractedData.length);
    this.currentData = extractedData;
  }
  
  /**
   * GeoJSONをCesium Entityに変換して追加
   */
  convertGeoJSONToEntities(geojson) {
    const processFeature = (feature, index) => {
      if (feature.geometry && feature.geometry.type === 'Point') {
        const coords = feature.geometry.coordinates;
        const weight = feature.properties?.weight || 
                      feature.properties?.value || 
                      feature.properties?.intensity || 
                      feature.properties?.density || 1;
        
        this.viewer.entities.add({
          id: `geojson-${index}`,
          position: Cesium.Cartesian3.fromDegrees(coords[0], coords[1], coords[2] || 0),
          point: {
            pixelSize: 4,
            color: Cesium.Color.CYAN,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 1
          },
          properties: {
            weight: weight,
            ...feature.properties
          }
        });
      }
    };
    
    if (geojson.type === 'FeatureCollection') {
      geojson.features.forEach(processFeature);
    } else if (geojson.type === 'Feature') {
      processFeature(geojson, 0);
    }
  }
  
  /**
   * 通常のデータをCesium Entityに変換して追加
   */
  convertDataToEntities(data) {
    if (!Array.isArray(data)) {
      console.warn('データが配列ではありません');
      return;
    }
    
    data.forEach((item, index) => {
      if (item.position || (item.longitude && item.latitude)) {
        let position;
        if (item.position && item.position.x && item.position.y && item.position.z) {
          position = new Cesium.Cartesian3(item.position.x, item.position.y, item.position.z);
        } else if (item.longitude && item.latitude) {
          position = Cesium.Cartesian3.fromDegrees(item.longitude, item.latitude, item.altitude || 0);
        } else {
          return; // 位置情報が不正な場合はスキップ
        }
        
        this.viewer.entities.add({
          id: `data-${index}`,
          position: position,
          point: {
            pixelSize: 4,
            color: Cesium.Color.MAGENTA,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 1
          },
          properties: {
            weight: item.weight || 1,
            ...item.properties
          }
        });
      }
    });
  }
  
  /**
   * サンプルデータを読み込み
   */
  loadSampleData() {
    this.showLoading(true);
    try {
      // 東京周辺のサンプルデータをCesium Entityとして生成
      this.viewer.entities.removeAll(); // 既存のエンティティをクリア
      
      const centerLon = 139.6917;
      const centerLat = 35.6895;
      const radius = 0.02; // 約2km（密度を上げる）
      
      for (let i = 0; i < 800; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        const lon = centerLon + Math.cos(angle) * distance;
        const lat = centerLat + Math.sin(angle) * distance;
        const height = Math.random() * 200;
        
        // Cesium Entityとして追加
        this.viewer.entities.add({
          id: `sample-${i}`,
          position: Cesium.Cartesian3.fromDegrees(lon, lat, height),
          point: {
            pixelSize: 5,
            color: Cesium.Color.fromCssColorString('#1976D2').withAlpha(0.85),
            outlineWidth: 0
          },
          properties: {
            weight: Math.random() * 100,
            type: 'sample',
            value: Math.random() * 100
          }
        });
      }
      
      // 統計更新（Cesium Entitiesを使用）
      this.currentData = this.viewer.entities.values;
      this.updateStatistics();
      
      // すべてが確実に収まるようにBoundingSphereベースで移動
      this.fitCameraToEntities(this.currentData, {
        pitch: -Cesium.Math.toRadians(35),
        duration: 2.0,
        margin: 0.25,
        complete: () => console.log('Sample data camera positioning completed')
      });
      
      console.log('サンプルデータ読み込み完了:', this.currentData.length, '個のエンティティ');
    } catch (e) {
      console.warn('サンプルデータ読み込みエラー:', e);
    } finally {
      this.showLoading(false);
    }
  }
  
  /**
   * テストデータを生成
   */
  generateTestData() {
    this.showLoading(true);
    
    try {
      // 既存のエンティティをクリア
      this.viewer.entities.removeAll();
      
      // 東京周辺の境界を定義
      const bounds = {
        minLon: 139.68,
        maxLon: 139.70,
        minLat: 35.685,
        maxLat: 35.695,
        minAlt: 0,
        maxAlt: 200
      };
      
      // Cesium Entityとしてテストデータを生成
      const count = 300;
      
      for (let i = 0; i < count; i++) {
        const lon = bounds.minLon + (bounds.maxLon - bounds.minLon) * Math.random();
        const lat = bounds.minLat + (bounds.maxLat - bounds.minLat) * Math.random();
        const alt = bounds.minAlt + (bounds.maxAlt - bounds.minAlt) * Math.random();
        const category = ['residential', 'commercial', 'industrial', 'park'][Math.floor(Math.random() * 4)];
        
        this.viewer.entities.add({
          id: `test-${i}`,
          position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
          point: {
            pixelSize: 5,
            color: Cesium.Color.fromCssColorString('#1976D2').withAlpha(0.85),
            outlineWidth: 0
          },
          properties: {
            weight: Math.random() * 100,
            type: 'test',
            category: category,
            value: Math.random() * 100
          }
        });
      }
      
      this.currentData = this.viewer.entities.values;
      this.updateStatistics();
      
      // すべてが確実に収まるようにBoundingSphereベースで移動
      const flyToPromise = this.fitCameraToEntities(this.currentData, {
        pitch: -Cesium.Math.toRadians(35),
        duration: 2.0,
        margin: 0.25,
        complete: () => console.log('Test data camera positioning completed')
      });
      
      console.log('テストデータ生成完了:', this.currentData.length, '個のエンティティ');
    } catch (error) {
      console.error('テストデータ生成エラー:', error);
      alert('テストデータの生成に失敗しました: ' + error.message);
    } finally {
      this.showLoading(false);
    }
  }
  
  /**
   * ヒートマップを作成
   */
  async createHeatmap() {
    if (!this.currentData || this.currentData.length === 0) {
      alert('データを読み込んでください（サンプルデータまたはテストデータを生成してください）');
      return;
    }
    
    this.showLoading(true);
    
    try {
      console.log('=== ヒートマップ作成開始 ===');
      console.log('データ数:', this.currentData.length);
      console.log('最初の3つのデータ:', this.currentData.slice(0, 3));
      
      // CesiumHeatbox ライブラリの利用可能性をチェック
      if (typeof CesiumHeatbox === 'undefined') {
        throw new Error('CesiumHeatboxライブラリが読み込まれていません');
      }
      
      console.log('CesiumHeatbox type:', typeof CesiumHeatbox);
      console.log('CesiumHeatbox constructor:', CesiumHeatbox);
      console.log('CesiumHeatbox properties:', Object.getOwnPropertyNames(CesiumHeatbox));
      
      // UMDバンドルのdefaultエクスポートを確認
      if (CesiumHeatbox && typeof CesiumHeatbox === 'object' && CesiumHeatbox.default) {
        console.log('UMD default export found:', CesiumHeatbox.default);
        console.log('Default export constructor:', typeof CesiumHeatbox.default);
      }
      
      // 既存のヒートマップをクリア
      this.clearHeatmap();
      
      // 設定を取得
      const options = this.getHeatmapOptions();
      // 統計リセット（adaptiveモード時にカウントを見やすく）
      try {
        if (document.getElementById('outlineMode')?.value === 'adaptive') {
          this._resetOutlineStats();
        }
      } catch (_) {}
      console.log('設定:', options);
      
      // CesiumHeatboxの使用 - UMDバンドルでは直接コンストラクタとして利用可能
      console.log('CesiumHeatboxの型:', typeof CesiumHeatbox);
      
      // インスタンス作成 - CesiumHeatboxを直接コンストラクタとして使用
      console.log('Heatboxインスタンス作成中...');
      const HB = this._getHeatboxCtor();
      if (!HB) {
        throw new Error('Heatboxコンストラクタを解決できません（UMD読み込みを確認）');
      }
      this.heatbox = new HB(this.viewer, options);
      console.log('Heatboxインスタンス作成完了:', this.heatbox);
      console.log('Heatboxインスタンスのメソッド:', Object.getOwnPropertyNames(this.heatbox));
      // NOTE: main系の正規化でboxOpacityResolverは削除されるため、生成後に再設定して密度→不透明度を適用
      try {
        const wireframeOnly = document.getElementById('wireframeOnly')?.checked || false;
        this.heatbox.options.boxOpacityResolver = wireframeOnly ? (() => 0) : ((ctx) => {
          const d = Math.max(0, Math.min(1, Number(ctx?.normalizedDensity) || 0));
          // Range: 0.2 → 0.9 (linear)
          return Math.max(0.2, Math.min(0.9, 0.2 + d * 0.7));
        });
      } catch (_) {}
      
      // ヒートマップを生成 - createFromEntitiesメソッドを使用
      console.log('ヒートマップ生成開始...');
      console.log('currentDataの型:', Array.isArray(this.currentData), this.currentData.constructor.name);
      
      try {
        // エンティティ配列を確認
        if (!Array.isArray(this.currentData)) {
          console.warn('currentDataは配列ではありません。Cesium Entitiesの配列が必要です。');
          return;
        }

        console.log('エンティティデータの確認:', this.currentData.length, '個のエンティティ');
        
        // エンティティ処理のラップ - エラー対応
        const validEntities = this.currentData.filter(entity => {
          return entity && (entity.position || (entity.properties && entity.id));
        });
        console.log('有効なエンティティ数:', validEntities.length);
        
        // Heatbox APIの互換呼び出し
        if (typeof this.heatbox.createFromEntities === 'function') {
          console.log('createFromEntitiesメソッドを使用');
          await this.heatbox.createFromEntities(validEntities);
          console.log('createFromEntities完了');
        } else if (typeof this.heatbox.setData === 'function') {
          console.log('setDataメソッドを使用');
          this.heatbox.setData(validEntities);
          if (typeof this.heatbox.update === 'function') {
            this.heatbox.update();
          }
          console.log('setData完了');
        } else {
          throw new Error('Heatboxのデータ設定メソッドが見つかりません');
        }
        
        // 統計情報の取得
        const stats = this.heatbox.getStatistics();
        console.log('ヒートマップ統計情報:', stats);
        
        // デバッグ情報の出力
        if (typeof this.heatbox.getDebugInfo === 'function') {
          const dbg = this.heatbox.getDebugInfo();
          console.log('ヒートマップデバッグ情報:', dbg);
        }
        
        // 統計情報を更新
        this.updateStatisticsFromHeatmap(stats);

        // 自動カメラ位置調整（postRenderで一回だけ実行して競合を回避）
        try {
          if (this._autoViewRequest && this.viewer && this.viewer.scene && !this._fitOnceHandler) {
            const opts = this._fitViewOptions || { headingDegrees: 0, pitchDegrees: -45, paddingPercent: 0.1 };
            let fired = false;
            this._fitOnceHandler = async () => {
              if (fired) return;
              fired = true;
              try {
                // ライブラリfitViewではなく、Playground側の安定化ルートでズーム
                this._zoomToHeatboxBounds();
              } catch (e) {
                console.warn('auto-fitView failed:', e);
              } finally {
                try { this.viewer.scene.postRender.removeEventListener(this._fitOnceHandler); } catch (_) {}
                this._fitOnceHandler = null;
                this._autoViewRequest = false;
              }
            };
            this.viewer.scene.postRender.addEventListener(this._fitOnceHandler);
          }
        } catch (_) {}
      } catch (error) {
        console.error('ヒートマップデータ処理エラー:', error);
        alert('データの処理中にエラーが発生しました: ' + error.message);
      }
      
      console.log('=== ヒートマップ作成成功 ===');
      
    } catch (error) {
      console.error('=== ヒートマップ作成エラー ===');
      console.error('エラー詳細:', error);
      console.error('スタックトレース:', error.stack);
      alert('ヒートマップの作成に失敗しました: ' + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * ヒートマップ領域へカメラを移動
   */
  _zoomToHeatboxBounds() {
    try {
      // まず現在のデータから範囲を計算（優先）
      if (this.currentData && this.currentData.length > 0) {
        const flyToPromise = this.fitCameraToEntities(this.currentData, {
          pitch: -Cesium.Math.toRadians(45),
          duration: 1.5,
          margin: 0.25,
          complete: () => console.log('Heatmap camera positioning completed (data-based)')
        });
        void flyToPromise;
        console.log('Camera zoomed to calculated data bounds (via BoundingSphere)');
        return;
      }

      // フォールバック: Heatboxの境界情報を使用
      if (!this.heatbox || typeof this.heatbox.getBounds !== 'function') return;
      const bounds = this.heatbox.getBounds();
      if (!bounds) return;
      
      const centerLon = bounds.centerLon ?? (bounds.minLon + bounds.maxLon) / 2;
      const centerLat = bounds.centerLat ?? (bounds.minLat + bounds.maxLat) / 2;
      
      // 矩形サイズから最適高度を推定
      const DEG2M = 111000;
      const lonMeters = Math.abs(bounds.maxLon - bounds.minLon) * DEG2M * Math.cos((centerLat * Math.PI) / 180);
      const latMeters = Math.abs(bounds.maxLat - bounds.minLat) * DEG2M;
      const span = Math.max(lonMeters, latMeters);
      const altitude = Math.min(Math.max(span * 1.2, 800), 8000); // 1.2xスパン、高度800〜8000mに収める
      
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, altitude),
        orientation: {
          heading: 0,
          pitch: -Cesium.Math.PI_OVER_THREE, // 約 -60度
          roll: 0
        },
        duration: 1.0
      });
      
      console.log('Camera zoomed to heatbox bounds (fallback):', bounds);
      console.log('Scene primitives count:', this.viewer.scene.primitives.length);
    } catch (e) {
      console.warn('カメラ移動に失敗:', e);
    }
  }

  /**
   * デバッグ用: 中心に目印のボックスを1つ描画（Entityベース）
   */
  _drawDebugBox() {
    try {
      const info = typeof this.heatbox?.getDebugInfo === 'function' ? this.heatbox.getDebugInfo() : null;
      const b = info?.bounds;
      if (!b) return;
      const center = Cesium.Cartesian3.fromDegrees(b.centerLon, b.centerLat, (b.centerAlt || 0) + 50);
      const box = this.viewer.entities.add({
        id: `debug-box-${Date.now()}`,
        position: center,
        box: {
          dimensions: new Cesium.Cartesian3(200, 200, 200),
          material: Cesium.Color.LIME.withAlpha(0.6),
          outline: true,
          outlineColor: Cesium.Color.BLACK
        }
      });
      console.log('Debug box entity added:', box.id);
      // 自動で消す
      setTimeout(() => this.viewer.entities.remove(box), 3000);
    } catch (e) {
      console.warn('デバッグボックス描画に失敗:', e);
    }
  }

  /**
   * エンティティベースのボクセル描画（代替表示方法）
   * ライブラリのPrimitiveベース描画が失敗した場合のバックアップ
   */
  _drawEntityBasedVoxels(heatbox, entities) {
    if (!heatbox || !entities || entities.length === 0) return;
    
    const debug = heatbox.getDebugInfo?.() || {};
    const bounds = debug.bounds || null;
    const grid = debug.grid || null;
    const voxelSize = debug.options?.voxelSize || 20;
    
    if (!bounds || !grid) {
      console.warn('Bounds or grid info not available for entity-based voxels');
      return;
    }
    
    console.log('Drawing entity-based voxels with grid:', grid);
    
    // 簡易版のボクセルグリッド作成
    const voxelMap = new Map();
    
    // エンティティをボクセルに分類
    entities.forEach(entity => {
      try {
        const position = entity.position.getValue(Cesium.JulianDate.now());
        if (!position) return;
        
        const cartographic = Cesium.Cartographic.fromCartesian(position);
        const lon = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        const alt = cartographic.height;
        
        // ボクセルインデックスを計算
        const xIndex = Math.floor((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon) * grid.numVoxelsX);
        const yIndex = Math.floor((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat) * grid.numVoxelsY);
        const zIndex = Math.floor((alt - bounds.minAlt) / (bounds.maxAlt - bounds.minAlt) * grid.numVoxelsZ);
        
        if (xIndex < 0 || xIndex >= grid.numVoxelsX || 
            yIndex < 0 || yIndex >= grid.numVoxelsY || 
            zIndex < 0 || zIndex >= grid.numVoxelsZ) {
          return;
        }
        
        const key = `${xIndex},${yIndex},${zIndex}`;
        if (!voxelMap.has(key)) {
          voxelMap.set(key, {
            count: 0,
            x: xIndex,
            y: yIndex,
            z: zIndex,
          });
        }
        
        voxelMap.get(key).count++;
      } catch (e) {
        // エンティティ処理エラーはスキップ
      }
    });
    
    console.log('Entity-based voxels created:', voxelMap.size);
    
    // 最大5個のボクセルだけEntityとして描画
    const topVoxels = Array.from(voxelMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    topVoxels.forEach(voxel => {
      // ボクセル中心の座標を計算
      const lonFraction = (voxel.x + 0.5) / grid.numVoxelsX;
      const latFraction = (voxel.y + 0.5) / grid.numVoxelsY;
      const altFraction = (voxel.z + 0.5) / grid.numVoxelsZ;
      
      const lon = bounds.minLon + lonFraction * (bounds.maxLon - bounds.minLon);
      const lat = bounds.minLat + latFraction * (bounds.maxLat - bounds.minLat);
      const alt = bounds.minAlt + altFraction * (bounds.maxAlt - bounds.minAlt);
      
      // EntityBoxとして描画
      this.viewer.entities.add({
        id: `entity-voxel-${voxel.x}-${voxel.y}-${voxel.z}`,
        position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
        box: {
          dimensions: new Cesium.Cartesian3(
            grid.voxelSizeMeters || voxelSize, 
            grid.voxelSizeMeters || voxelSize, 
            grid.voxelSizeMeters || voxelSize
          ),
          material: Cesium.Color.RED.withAlpha(0.7),
          outline: true,
          outlineColor: Cesium.Color.WHITE,
        },
        label: {
          text: `Count: ${voxel.count}`,
          font: '12px sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, -30)
        }
      });
    });
    
    console.log('Top voxels rendered as entities:', topVoxels.length);
  }

  /**
   * デバッグ用: 上位密度のボクセル位置に大きなEntity Boxを描画
   * Heatbox内部のbounds/gridを使い、currentDataから擬似的にボクセル集計します
   */
  _drawTopVoxelsAsEntities() {
    try {
      const dbg = typeof this.heatbox?.getDebugInfo === 'function' ? this.heatbox.getDebugInfo() : null;
      if (!dbg || !dbg.bounds || !dbg.grid || !Array.isArray(this.currentData)) return;
      const bounds = dbg.bounds;
      const grid = dbg.grid;

      // 集計マップ key: "x,y,z" -> count
      const counts = new Map();
      const now = Cesium.JulianDate.now();

      const toLonLatAlt = (item) => {
        if (item.position && typeof item.position.getValue === 'function') {
          const p = item.position.getValue(now);
          if (!p) return null;
          const c = Cesium.Cartographic.fromCartesian(p);
          return {
            lon: Cesium.Math.toDegrees(c.longitude),
            lat: Cesium.Math.toDegrees(c.latitude),
            alt: c.height
          };
        } else if (item.position && item.position.x !== undefined) {
          const c = Cesium.Cartographic.fromCartesian(item.position);
          return {
            lon: Cesium.Math.toDegrees(c.longitude),
            lat: Cesium.Math.toDegrees(c.latitude),
            alt: c.height
          };
        } else if (item.longitude !== undefined && item.latitude !== undefined) {
          return { lon: item.longitude, lat: item.latitude, alt: item.altitude || 0 };
        }
        return null;
      };

      const coordToIndex = (lon, lat, alt) => {
        const lonDen = (bounds.maxLon - bounds.minLon);
        const latDen = (bounds.maxLat - bounds.minLat);
        const altDen = (bounds.maxAlt - bounds.minAlt);
        const nLon = lonDen === 0 ? 0 : (lon - bounds.minLon) / lonDen;
        const nLat = latDen === 0 ? 0 : (lat - bounds.minLat) / latDen;
        const nAlt = altDen === 0 ? 0 : (alt - bounds.minAlt) / altDen;
        const vx = Math.max(0, Math.min(grid.numVoxelsX - 1, Math.floor(nLon * grid.numVoxelsX)));
        const vy = Math.max(0, Math.min(grid.numVoxelsY - 1, Math.floor(nLat * grid.numVoxelsY)));
        const vz = Math.max(0, Math.min(grid.numVoxelsZ - 1, Math.floor(nAlt * grid.numVoxelsZ)));
        return { x: vx, y: vy, z: vz, key: `${vx},${vy},${vz}` };
      };

      const indexToCenterCoord = (x, y, z) => {
        const lon = bounds.minLon + (x + 0.5) / grid.numVoxelsX * (bounds.maxLon - bounds.minLon);
        const lat = bounds.minLat + (y + 0.5) / grid.numVoxelsY * (bounds.maxLat - bounds.minLat);
        const alt = bounds.minAlt + (z + 0.5) / grid.numVoxelsZ * (bounds.maxAlt - bounds.minAlt);
        return { lon, lat, alt };
      };

      for (const item of this.currentData) {
        const c = toLonLatAlt(item);
        if (!c) continue;
        const idx = coordToIndex(c.lon, c.lat, c.alt);
        counts.set(idx.key, (counts.get(idx.key) || 0) + 1);
      }

      const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
      for (const [key, count] of sorted) {
        const [x, y, z] = key.split(',').map(Number);
        const center = indexToCenterCoord(x, y, z);
        const pos = Cesium.Cartesian3.fromDegrees(center.lon, center.lat, center.alt);
        const ent = this.viewer.entities.add({
          id: `debug-top-voxel-${key}-${Date.now()}`,
          position: pos,
          box: {
            dimensions: new Cesium.Cartesian3(grid.voxelSizeMeters * 3, grid.voxelSizeMeters * 3, grid.voxelSizeMeters * 3),
            material: Cesium.Color.ORANGE.withAlpha(0.7),
            outline: true,
            outlineColor: Cesium.Color.BLACK
          },
          description: `Top Voxel ${key}<br/>Count: ${count}`
        });
        // 5秒で自動削除
        setTimeout(() => this.viewer.entities.remove(ent), 5000);
      }
      console.log('Debug top voxels drawn (entities):', sorted.length);
    } catch (e) {
      console.warn('デバッグ上位ボクセル描画に失敗:', e);
    }
  }
  
  /**
   * すべてのエンティティが確実に収まるように、BoundingSphereに基づいてカメラを移動
   * - flyToBoundingSphere + HeadingPitchRange を利用し、ピッチ/余白/時間を指定
   * - FOVとアスペクト比から必要距離を安全側で算出
   */
  async fitCameraToEntities(entities, opts = {}) {
    try {
      if (!this.viewer || !entities || entities.length === 0) return;

      // 位置配列を作成
      const now = Cesium.JulianDate.now();
      const points = [];
      for (const e of entities) {
        try {
          let p = null;
          if (e.position && typeof e.position.getValue === 'function') {
            p = e.position.getValue(now);
          } else if (e.position && e.position.x !== undefined) {
            p = e.position;
          }
          if (p) points.push(p);
        } catch (_) {}
      }

      if (points.length === 0) return;

      const sphere = Cesium.BoundingSphere.fromPoints(points);
      if (!sphere || !isFinite(sphere.radius) || sphere.radius <= 0) {
        // 半径0に近いケースは固定高度にフォールバック
        const c = Cesium.Cartographic.fromCartesian(points[0]);
        const lon = Cesium.Math.toDegrees(c.longitude);
        const lat = Cesium.Math.toDegrees(c.latitude);
        return this.viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lon, lat, 1200),
          orientation: {
            heading: 0,
            pitch: -Cesium.Math.PI_OVER_THREE,
            roll: 0
          },
          duration: opts.duration ?? 1.2
        });
      }

      // FOV/アスペクトから必要距離を計算（安全余白付き）
      const camera = this.viewer.camera;
      const canvas = this.viewer.scene.canvas;
      const aspect = Math.max(0.0001, canvas.clientWidth / Math.max(1, canvas.clientHeight));
      const frustum = camera.frustum;
      const verticalFov = typeof frustum.fov === 'number' ? frustum.fov : Cesium.Math.toRadians(60);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
      const limitingFov = Math.min(verticalFov, horizontalFov);
      const margin = Math.max(0.0, Math.min(0.8, opts.margin ?? 0.25));
      const baseRange = sphere.radius / Math.sin(Math.max(0.1, limitingFov / 2));
      const range = baseRange * (1 + margin);

      const heading = isFinite(opts.heading) ? opts.heading : 0.0;
      const pitch = isFinite(opts.pitch) ? opts.pitch : -Cesium.Math.toRadians(35);
      const duration = isFinite(opts.duration) ? opts.duration : 2.0;

      return this.viewer.camera.flyToBoundingSphere(sphere, {
        duration,
        offset: new Cesium.HeadingPitchRange(heading, pitch, range),
        complete: opts.complete,
        cancel: opts.cancel
      });
    } catch (e) {
      console.warn('fitCameraToEntities failed, fallback:', e);
      // フォールバック: 現行の簡易手法
      const b = this.calculateDataBounds(entities);
      return this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(b.centerLon, b.centerLat, b.optimalHeight),
        orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_THREE, roll: 0 },
        duration: 1.5
      });
    }
  }

  /**
   * データの範囲を計算してカメラの最適位置を決定（幾何ベース計算）
   */
  calculateDataBounds(entities) {
    if (!entities || entities.length === 0) {
      // フォールバック時も南側に配置  
      const fallbackOffsetLat = 0.005; // 約500m南側
      return {
        centerLon: 139.69,
        centerLat: 35.69 - fallbackOffsetLat,
        optimalHeight: 2000,
        dataCenterLon: 139.69,
        dataCenterLat: 35.69,
        minLon: 139.69,
        maxLon: 139.69,
        minLat: 35.69,
        maxLat: 35.69
      };
    }

    let minLon = Infinity, maxLon = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;
    let minAlt = Infinity, maxAlt = -Infinity;
    let sumLon = 0, sumLat = 0, sumAlt = 0;
    let validCount = 0;

    const now = Cesium.JulianDate.now();
    const positions = [];

    entities.forEach(entity => {
      try {
        let position = null;
        
        if (entity.position && typeof entity.position.getValue === 'function') {
          position = entity.position.getValue(now);
        } else if (entity.position && entity.position.x !== undefined) {
          position = entity.position;
        }

        if (position) {
          const cartographic = Cesium.Cartographic.fromCartesian(position);
          const lon = Cesium.Math.toDegrees(cartographic.longitude);
          const lat = Cesium.Math.toDegrees(cartographic.latitude);
          const alt = cartographic.height;

          // 境界計算
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minAlt = Math.min(minAlt, alt);
          maxAlt = Math.max(maxAlt, alt);
          
          // 重心計算用
          sumLon += lon;
          sumLat += lat;
          sumAlt += alt;
          positions.push({ lon, lat, alt });
          validCount++;
        }
      } catch (e) {
        // エンティティ処理エラーはスキップ
      }
    });

    if (validCount === 0) {
      // フォールバック時も南側に配置
      const fallbackOffsetLat = 0.005; // 約500m南側
      return {
        centerLon: 139.69,
        centerLat: 35.69 - fallbackOffsetLat,
        optimalHeight: 2000,
        dataCenterLon: 139.69,
        dataCenterLat: 35.69,
        minLon: 139.69,
        maxLon: 139.69,
        minLat: 35.69,
        maxLat: 35.69
      };
    }

    // 重心計算（単純平均）
    const centroidLon = sumLon / validCount;
    const centroidLat = sumLat / validCount;
    const centroidAlt = sumAlt / validCount;

    // データの幾何学的中心（境界の中点）
    const geometricCenterLon = (minLon + maxLon) / 2;
    const geometricCenterLat = (minLat + maxLat) / 2;
    
    // 重心と幾何学的中心の重み付け平均（重心を重視）
    const finalCenterLon = centroidLon * 0.7 + geometricCenterLon * 0.3;
    const finalCenterLat = centroidLat * 0.7 + geometricCenterLat * 0.3;

    // データ範囲の計算（地球上の距離）
    const DEG_TO_METERS = 111000; // 約111km per degree
    const lonSpanMeters = Math.abs(maxLon - minLon) * DEG_TO_METERS * Math.cos(finalCenterLat * Math.PI / 180);
    const latSpanMeters = Math.abs(maxLat - minLat) * DEG_TO_METERS;
    const altSpanMeters = Math.abs(maxAlt - minAlt);
    
    // 最大スパンを取得
    const maxHorizontalSpan = Math.max(lonSpanMeters, latSpanMeters);
    
    // Cesiumの視野角（60度）と見下ろし角度（45度）を考慮した最適高度計算
    const viewingAngle = Math.PI / 3; // 60度（Cesiumのデフォルト）
    const pitchAngle = Math.PI / 4;   // 45度の見下ろし
    
    // 全データが視野に収まる距離を計算
    // 45度ピッチでの実際の視野範囲を考慮
    const diagonalSpan = Math.sqrt(lonSpanMeters * lonSpanMeters + latSpanMeters * latSpanMeters);
    
    // ピッチ角度を考慮した実効視野範囲の計算
    const effectiveViewAngle = viewingAngle; // 垂直視野角
    const horizontalViewAngle = viewingAngle * (16/9); // アスペクト比考慮（概算）
    
    // データの境界を包含する最小距離を計算
    // 水平方向と垂直方向の両方を考慮
    const requiredDistanceForWidth = (lonSpanMeters / 2) / Math.tan(horizontalViewAngle / 2);
    const requiredDistanceForHeight = (latSpanMeters / 2) / Math.tan(effectiveViewAngle / 2);
    const requiredDistanceForDiagonal = (diagonalSpan / 2) / Math.tan(effectiveViewAngle / 2);
    
    // 最も制約の厳しい距離を選択し、安全マージンを追加
    const baseRequiredDistance = Math.max(
      requiredDistanceForWidth,
      requiredDistanceForHeight, 
      requiredDistanceForDiagonal
    ) * 1.5; // 1.5倍の安全マージン
    
    // 見下ろし角度を考慮した高度
    const optimalHeight = Math.max(
      centroidAlt + baseRequiredDistance * Math.sin(pitchAngle),
      centroidAlt + 500, // 最低500m上空
      maxHorizontalSpan * 1.2, // スパンの1.2倍の高度を確保
      diagonalSpan * 0.8 // 対角線の0.8倍も確保
    );

    // 最大高度制限（20km）
    const finalHeight = Math.min(optimalHeight, 20000);

    // カメラ位置の調整：見下ろし視点のため、データ範囲の南側（手前）に配置
    // 45度の見下ろし角度で全データが見えるように、カメラを南に移動
    const horizontalOffset = finalHeight * Math.cos(pitchAngle) * 0.8; // 0.8倍で調整
    const latOffsetDegrees = (horizontalOffset / DEG_TO_METERS); // 緯度オフセット
    
    // カメラを南側に配置（緯度を減らす）
    const cameraLat = finalCenterLat - latOffsetDegrees;
    const cameraLon = finalCenterLon; // 経度は中心のまま

    const result = {
      centerLon: cameraLon,        // カメラ位置（調整済み）
      centerLat: cameraLat,        // カメラ位置（調整済み）
      optimalHeight: finalHeight,
      // データの中心位置（参考用）
      dataCenterLon: finalCenterLon,
      dataCenterLat: finalCenterLat,
      minLon,
      maxLon,
      minLat,
      maxLat,
      minAlt,
      maxAlt,
      centroidLon,
      centroidLat,
      centroidAlt,
      validCount,
      spanMeters: maxHorizontalSpan,
      diagonalSpan,
      horizontalOffset,
      latOffsetDegrees,
      // 詳細計算情報
      requiredDistanceForWidth,
      requiredDistanceForHeight,
      requiredDistanceForDiagonal,
      baseRequiredDistance
    };

    console.log('Smart camera positioning:', {
      'Data centroid': `${centroidLon.toFixed(4)}, ${centroidLat.toFixed(4)}`,
      'Data center': `${finalCenterLon.toFixed(4)}, ${finalCenterLat.toFixed(4)}`,
      'Camera position': `${cameraLon.toFixed(4)}, ${cameraLat.toFixed(4)}`,
      'Data span': `${lonSpanMeters.toFixed(0)}m × ${latSpanMeters.toFixed(0)}m`,
      'Diagonal span': `${diagonalSpan.toFixed(0)}m`,
      'Required distances': `W:${requiredDistanceForWidth.toFixed(0)}m, H:${requiredDistanceForHeight.toFixed(0)}m, D:${requiredDistanceForDiagonal.toFixed(0)}m`,
      'Base distance': `${baseRequiredDistance.toFixed(0)}m`,
      'Final height': `${finalHeight.toFixed(0)}m`,
      'Horizontal offset': `${horizontalOffset.toFixed(0)}m`,
      'Data points': validCount
    });

    return result;
  }
  
  /**
   * データをヒートマップ用の形式に変換
   */
  prepareDataForHeatmap(data) {
    const heatmapData = [];
    
    data.forEach((item, index) => {
      let lat, lon, weight = 1;
      
      // Cesium Entity の場合
      if (item.position && typeof item.position.getValue === 'function') {
        const cartographic = Cesium.Cartographic.fromCartesian(
          item.position.getValue(Cesium.JulianDate.now())
        );
        lat = Cesium.Math.toDegrees(cartographic.latitude);
        lon = Cesium.Math.toDegrees(cartographic.longitude);
        
        // 重みを取得
        if (item.properties) {
          weight = item.properties.weight?.getValue() || 
                  item.properties.intensity?.getValue() || 
                  item.properties.value?.getValue() || 1;
        }
      }
      // 通常のオブジェクトの場合
      else if (item.position) {
        lat = item.position.latitude;
        lon = item.position.longitude;
        weight = item.weight || 1;
      }
      // GeoJSON形式の場合
      else if (item.geometry && item.geometry.coordinates) {
        lon = item.geometry.coordinates[0];
        lat = item.geometry.coordinates[1];
        weight = item.properties?.weight || item.properties?.value || 1;
      }
      
      if (lat !== undefined && lon !== undefined) {
        heatmapData.push({
          latitude: lat,
          longitude: lon,
          weight: weight
        });
      }
    });
    
    return heatmapData;
  }
  
  /**
   * 手動サイズコントロールの表示/非表示を切り替え
   * v0.1.4: autoVoxelSizeオプションに対応
   */
  toggleManualSizeControls(show) {
    const manualGroup = document.getElementById('manualSizeGroup');
    const gridSizeInput = document.getElementById('gridSize');
    
    if (show) {
      manualGroup.style.opacity = '1';
      manualGroup.style.pointerEvents = 'auto';
      gridSizeInput.disabled = false;
    } else {
      manualGroup.style.opacity = '0.5';
      manualGroup.style.pointerEvents = 'none';
      gridSizeInput.disabled = true;
    }
  }
  
  /**
   * 空ボクセル透明度コントロールの表示/非表示を切り替え
   */
  toggleEmptyOpacityControls(show) {
    const emptyOpacityGroup = document.getElementById('emptyOpacityGroup');
    const emptyOpacityInput = document.getElementById('emptyOpacity');
    
    if (show) {
      emptyOpacityGroup.style.opacity = '1';
      emptyOpacityGroup.style.pointerEvents = 'auto';
      emptyOpacityInput.disabled = false;
    } else {
      emptyOpacityGroup.style.opacity = '0.5';
      emptyOpacityGroup.style.pointerEvents = 'none';
      emptyOpacityInput.disabled = true;
    }
  }
  
  /**
   * v0.1.9: 自動ボクセルサイズモードコントロールの表示/非表示を切り替え
   */
  toggleAutoVoxelModeControls(show) {
    const autoVoxelModeGroup = document.getElementById('autoVoxelModeGroup');
    const autoVoxelSizeModeSelect = document.getElementById('autoVoxelSizeMode');
    
    if (show) {
      autoVoxelModeGroup.style.opacity = '1';
      autoVoxelModeGroup.style.pointerEvents = 'auto';
      autoVoxelSizeModeSelect.disabled = false;
    } else {
      autoVoxelModeGroup.style.opacity = '0.5';
      autoVoxelModeGroup.style.pointerEvents = 'none';
      autoVoxelSizeModeSelect.disabled = true;
    }
  }
  
  /**
   * v0.1.9: FitViewコントロールの表示/非表示を切り替え
   */
  toggleFitViewControls(show) {
    const fitViewGroup = document.getElementById('fitViewGroup');
    const fitViewPitchGroup = document.getElementById('fitViewPitchGroup');
    const fitViewHeadingInput = document.getElementById('fitViewHeading');
    const fitViewPitchInput = document.getElementById('fitViewPitch');
    
    if (show) {
      fitViewGroup.style.opacity = '1';
      fitViewGroup.style.pointerEvents = 'auto';
      fitViewPitchGroup.style.opacity = '1';
      fitViewPitchGroup.style.pointerEvents = 'auto';
      fitViewHeadingInput.disabled = false;
      fitViewPitchInput.disabled = false;
    } else {
      fitViewGroup.style.opacity = '0.5';
      fitViewGroup.style.pointerEvents = 'none';
      fitViewPitchGroup.style.opacity = '0.5';
      fitViewPitchGroup.style.pointerEvents = 'none';
      fitViewHeadingInput.disabled = true;
      fitViewPitchInput.disabled = true;
    }
  }
  
  /**
   * v0.1.5: カスタムカラーコントロールの表示/非表示を切り替え
   */
  toggleCustomColorControls(show) {
    const customColorGroup = document.getElementById('customColorGroup');
    if (show) {
      customColorGroup.style.display = 'flex';
    } else {
      customColorGroup.style.display = 'none';
    }
  }
  
  /**
   * v0.1.5: 二極性コントロールの表示/非表示を切り替え
   */
  toggleDivergingControls(show) {
    const divergingPivotGroup = document.getElementById('divergingPivotGroup');
    const divergingPivotInput = document.getElementById('divergingPivot');
    
    if (show) {
      divergingPivotGroup.style.opacity = '1';
      divergingPivotGroup.style.pointerEvents = 'auto';
      divergingPivotInput.disabled = false;
    } else {
      divergingPivotGroup.style.opacity = '0.5';
      divergingPivotGroup.style.pointerEvents = 'none';
      divergingPivotInput.disabled = true;
    }
  }
  
  /**
   * v0.1.5: 強調スタイルコントロールの表示/非表示を切り替え
   */
  toggleHighlightStyleControls(show) {
    const highlightStyleGroup = document.getElementById('highlightStyleGroup');
    const highlightOpacityInput = document.getElementById('highlightOpacity');
    
    if (show) {
      highlightStyleGroup.style.opacity = '1';
      highlightStyleGroup.style.pointerEvents = 'auto';
      highlightOpacityInput.disabled = false;
    } else {
      highlightStyleGroup.style.opacity = '0.5';
      highlightStyleGroup.style.pointerEvents = 'none';
      highlightOpacityInput.disabled = true;
    }
  }

  /**
   * v0.1.6: 手動枠線太さコントロールの有効/無効を切り替え
   */
  toggleManualOutlineWidthControls(enable) {
    const group = document.getElementById('manualOutlineWidthGroup');
    const input = document.getElementById('outlineWidth');
    if (!group || !input) return;
    if (enable) {
      group.style.opacity = '1';
      group.style.pointerEvents = 'auto';
      input.disabled = false;
    } else {
      group.style.opacity = '0.5';
      group.style.pointerEvents = 'none';
      input.disabled = true;
    }
  }
  
  /**
   * ヒートマップ設定を取得
   * v0.1.6: voxelGap/outlineOpacity/outlineWidthResolver 対応
   */
  getHeatmapOptions() {
    const self = this;
    const autoVoxelSize = document.getElementById('autoVoxelSize').checked;
    const gridSize = parseInt(document.getElementById('gridSize').value);
    const colorMap = document.getElementById('colorMap').value;
    const customColorTheme = document.getElementById('customColorTheme').value;
    const wireframeOnly = document.getElementById('wireframeOnly')?.checked || false;
    const heightBased = document.getElementById('heightBased').checked;
    const debugMode = document.getElementById('debugMode').checked;
    const showBounds = document.getElementById('showBounds').checked;
    const showEmptyVoxels = document.getElementById('showEmptyVoxels').checked;
    const emptyOpacity = parseFloat(document.getElementById('emptyOpacity').value);
    const diverging = document.getElementById('diverging').checked;
    const divergingPivot = parseFloat(document.getElementById('divergingPivot').value);
    const highlightTopN = parseInt(document.getElementById('highlightTopN').value);
    const highlightOpacity = parseFloat(document.getElementById('highlightOpacity').value);
    // v0.1.6: 新オプション
    const voxelGap = parseFloat(document.getElementById('voxelGap')?.value || '0');
    const outlineOpacity = parseFloat(document.getElementById('outlineOpacity')?.value || '1');
    const outlineMode = document.getElementById('outlineMode')?.value || 'adaptive';
    const viewMode = document.getElementById('viewModePreset')?.value || this._currentViewMode || 'boxes';
    const outlineWidthManual = parseInt(document.getElementById('outlineWidth')?.value || '2', 10);
    const outlineEmulationMode = document.getElementById('outlineEmulationMode')?.value || 'off';
    const emulationScope = document.getElementById('emulationScope')?.value || 'off';
    const outlineInset = parseFloat(document.getElementById('outlineInset')?.value || '0');
    const outlineInsetModeSel = document.getElementById('outlineInsetMode')?.value || 'all';
    const enableThickFrames = document.getElementById('enableThickFrames')?.checked || false;
    // v0.1.7: 新オプション
    const outlineRenderMode = document.getElementById('outlineRenderMode')?.value || 'standard';
    const adaptiveOutlines = document.getElementById('adaptiveOutlines')?.checked || false;
    const outlineWidthPreset = document.getElementById('outlineWidthPreset')?.value || 'uniform';
    const boxOpacityMode = document.getElementById('boxOpacityMode')?.value || 'off';
    const outlineOpacityMode = document.getElementById('outlineOpacityMode')?.value || 'off';
    
    // v0.1.9: 新オプション
    const autoVoxelSizeMode = document.getElementById('autoVoxelSizeMode')?.value || 'simple';
    const maxRenderVoxels = document.getElementById('maxRenderVoxels')?.value || 'auto';
    const renderLimitStrategy = document.getElementById('renderLimitStrategy')?.value || 'hybrid';
    const autoView = document.getElementById('autoView')?.checked || false;
    const perfOverlayEnabled = document.getElementById('performanceOverlay')?.checked || false;
    const perfOverlayPos = document.getElementById('overlayPosition')?.value || 'top-right';
    const perfOverlayInterval = parseInt(document.getElementById('overlayUpdateInterval')?.value || '500', 10);
    const fitViewHeading = parseFloat(document.getElementById('fitViewHeading')?.value || '0');
    const fitViewPitch = parseFloat(document.getElementById('fitViewPitch')?.value || '-45');

    // v0.1.6: 枠線太さモード
    let outlineWidthResolver = null;
    let outlineWidthValue = 2;
    if (outlineMode === 'adaptive') {
      outlineWidthResolver = (params) => {
        const { isTopN, normalizedDensity } = params || {};
        // densityベースの連続マッピング（simple.html相当の挙動に近づける）
        const d = Math.max(0, Math.min(1, Number(normalizedDensity) || 0));
        const nd = Math.pow(d, 0.5); // ガンマ補正（コントラスト強化）
        const minW = 1.5;
        const maxW = 10.0;
        let width;
        if (outlineEmulationMode === 'all') {
          // すべて太線モードでは最低太さを確保しつつTopNをわずかに強調
          width = minW + nd * (maxW - minW);
          if (isTopN) width = Math.min(maxW, width + 2);
          width = Math.max(3, width); // すべて太線らしく下限を上げる
        } else {
          width = minW + nd * (maxW - minW);
          if (isTopN) width = Math.min(maxW, width + 2);
        }
        try { self._recordOutlineResolver(width, params); } catch (_) {}
        return width;
      };
      outlineWidthValue = 2; // ベースライン
    } else {
      outlineWidthResolver = null;
      // 「すべて太線」モードの場合は手動設定でも十分な太さを確保
      let baseWidth = isNaN(outlineWidthManual) ? 2 : outlineWidthManual;
      if (outlineEmulationMode === 'all' && baseWidth < 2) {
        baseWidth = 3; // 太線エミュレーションのため最低3px
        console.log('「すべて太線」モード：手動モードでの最小太さを3pxに調整');
      }
      outlineWidthValue = baseWidth;
    }
    
    const options = {
      // v0.1.4: 自動ボクセルサイズ機能
      autoVoxelSize: autoVoxelSize,
      // 手動指定が無効な場合はvoxelSizeを設定しない（自動調整を有効にする）
      // ただし、自動サイズが大きすぎる場合に備えて最大値を制限
      voxelSize: autoVoxelSize ? undefined : gridSize,
      // 自動サイズの場合は最大ボクセルサイズを制限（密集表示を確保）
      maxVoxelSize: autoVoxelSize ? 10 : undefined,  // さらに小さく（15→10）
      // 目標ボクセル数を増やして密度を上げる
      targetCells: autoVoxelSize ? 3000 : undefined,  // さらに増加（2000→3000）
      opacity: wireframeOnly ? 0.0 : 0.7,
      // 空ボクセル表示設定
      emptyOpacity: showEmptyVoxels ? emptyOpacity : 0.0,
      showEmptyVoxels: showEmptyVoxels,
      showOutline: true,
      maxRenderVoxels: 2000,  // 表示数上限を大幅に増加（300→2000）
      wireframeOnly: wireframeOnly,
      heightBased: heightBased,
      outlineWidth: outlineWidthValue,
      // v0.1.5: デバッグ制御の拡張
      debug: debugMode ? { showBounds: showBounds } : false,
      // v0.1.5: カラーマップサポート
      colorMap: colorMap === 'custom' ? 'custom' : colorMap,
      // v0.1.5: 二極性データサポート
      diverging: diverging,
      divergingPivot: diverging ? divergingPivot : undefined,
      // v0.1.5: TopN強調表示
      highlightTopN: highlightTopN > 0 ? highlightTopN : undefined,
      // highlightStyle.boostOpacity: 非TopNの不透明度減衰量（v0.1.6 仕様）
      highlightStyle: highlightTopN > 0 ? { boostOpacity: highlightOpacity } : undefined,
      // v0.1.6: 枠線重なり対策・動的枠線制御
      voxelGap: isNaN(voxelGap) ? 0 : voxelGap,
      outlineOpacity: isNaN(outlineOpacity) ? 1.0 : outlineOpacity,
      outlineWidthResolver: outlineWidthResolver,
      // v0.1.6+: 太線エミュレーション（WebGL制約の回避）
      outlineEmulation: outlineEmulationMode,
      emulationScope: emulationScope,
      // v0.1.7 additions
      outlineRenderMode: outlineRenderMode,
      adaptiveOutlines: adaptiveOutlines,
      outlineWidthPreset: outlineWidthPreset
    };

    // View Mode semantic overrides (preserve per-mode parameters via _viewModeStates)
    switch (viewMode) {
      case 'boxes':
        options.opacity = 0.8;
        options.showOutline = false;
        options.wireframeOnly = false;
        options.outlineRenderMode = 'standard';
        options.emulationScope = 'off';
        options.outlineInset = 0;
        options.outlineInsetMode = 'all';
        break;
      case 'outline-only':
        options.opacity = 0.0;      // hide fill
        options.showOutline = true; // draw outlines only
        options.wireframeOnly = false; // standard outline path
        options.outlineRenderMode = 'standard';
        options.emulationScope = 'off';
        options.outlineInset = 0;
        options.outlineInsetMode = 'all';
        break;
      case 'outline-inset': {
        const st = this._viewModeStates['outline-inset'] || {};
        options.opacity = 0.8;
        options.showOutline = true;
        options.wireframeOnly = false;
        options.outlineRenderMode = 'inset';
        options.emulationScope = 'off';
        options.outlineInset = (typeof st.outlineInset === 'number') ? st.outlineInset : Math.max(0, parseFloat(document.getElementById('outlineInset')?.value) || 2.0);
        options.outlineInsetMode = st.outlineInsetMode || (document.getElementById('outlineInsetMode')?.value || 'all');
        options.enableThickFrames = !!st.enableThickFrames;
        break;
      }
      case 'emulation-only':
        options.opacity = 0.0;      // hide fill
        options.showOutline = true;
        options.wireframeOnly = true; // emulate thick edges only
        options.outlineRenderMode = 'emulation-only';
        options.emulationScope = 'all';
        options.outlineInset = 0;
        options.outlineInsetMode = 'all';
        options.enableThickFrames = true;
        break;
    }

    // v0.1.6.1: インセット枠線（ADR-0004）
    let finalOutlineInset = outlineInset;
    
    // 「すべて太線」モードの場合、重なり防止のため自動的にインセットを適用
    if (outlineEmulationMode === 'all' && finalOutlineInset === 0) {
      finalOutlineInset = 2.0; // 2メートルの内側オフセット
      console.log('「すべて太線」モード：重なり防止のため自動的にインセット枠線を適用 (2m)');
    }
    
    // 「すべて太線」モードかつインセットが設定されている場合、自動で厚い枠線表示を有効化
    let finalEnableThickFrames = enableThickFrames;
    if (outlineEmulationMode === 'all' && finalOutlineInset > 0 && !enableThickFrames) {
      finalEnableThickFrames = true;
      console.log('「すべて太線」モード：視覚効果向上のため自動的に厚い枠線表示を有効化');
    }
    
    // outlineInsetModeの反映（offの場合は0として無効化）
    if (outlineInsetModeSel === 'off') {
      options.outlineInset = 0;
      options.outlineInsetMode = 'all';
    } else if (!isNaN(finalOutlineInset) && finalOutlineInset > 0) {
      options.outlineInset = finalOutlineInset;
      options.outlineInsetMode = outlineInsetModeSel; // 'all' or 'topn'
    }
    
    // 厚い枠線表示（フレーム埋め込み）
    options.enableThickFrames = finalEnableThickFrames;
    
    // v0.1.7: 透明度resolver（簡易プリセット）
    if (boxOpacityMode !== 'off') {
      options.boxOpacityResolver = (ctx) => {
        const d = Number(ctx.normalizedDensity) || 0;
        if (boxOpacityMode === 'density') return Math.max(0.2, Math.min(0.9, 0.2 + d * 0.7));
        if (boxOpacityMode === 'topn') return ctx.isTopN ? 0.95 : 0.5;
        return undefined;
      };
    }
    if (outlineOpacityMode !== 'off') {
      options.outlineOpacityResolver = (ctx) => {
        const d = Number(ctx.normalizedDensity) || 0;
        if (outlineOpacityMode === 'density') return Math.max(0.2, Math.min(1.0, 0.5 + d * 0.5));
        if (outlineOpacityMode === 'topn') return ctx.isTopN ? 1.0 : 0.5;
        return undefined;
      };
    }

    // カスタムカラーマップの場合のみminColor/maxColorを設定
    if (colorMap === 'custom') {
      options.minColor = this.getColorForMap(customColorTheme, 'min');
      options.maxColor = this.getColorForMap(customColorTheme, 'max');
    }
    
    // v0.1.9: 新機能の追加
    if (autoVoxelSize) {
      options.autoVoxelSizeMode = autoVoxelSizeMode;
    }
    
    // maxRenderVoxels の設定
    if (maxRenderVoxels === 'auto') {
      options.maxRenderVoxels = 'auto';  // Auto Render Budget有効
    } else {
      options.maxRenderVoxels = parseInt(maxRenderVoxels);
    }
    
    // Adaptive Rendering Strategy
    options.renderLimitStrategy = renderLimitStrategy;
    
    // Auto View設定はライブラリ自動を使わず、後段でpostRender一回で実行（競合回避）
    this._autoViewRequest = !!autoView;
    this._fitViewOptions = autoView ? {
      headingDegrees: fitViewHeading,
      pitchDegrees: fitViewPitch,
      paddingPercent: 0.1
    } : null;
    options.autoView = false;

    // v0.1.12: Performance overlay initial state
    if (perfOverlayEnabled) {
      options.performanceOverlay = {
        enabled: true,
        position: perfOverlayPos,
        updateIntervalMs: perfOverlayInterval,
        autoShow: true
      };
    }
    
    console.log('Heatbox options (v0.1.9):', options);
    return options;
  }

  /**
   * v0.1.6: outlineWidthResolver の統計を初期化
   */
  _resetOutlineStats() {
    this._outlineStats = {
      calls: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      dmin: Infinity,
      dmax: -Infinity,
      topN: 0
    };
    this._updateOutlineStatsUI();
  }

  /**
   * v0.1.6: resolver呼び出しを記録
   */
  _recordOutlineResolver(width, params = {}) {
    if (!this._outlineStats) this._resetOutlineStats();
    const st = this._outlineStats;
    st.calls += 1;
    st.sum += (Number(width) || 0);
    st.min = Math.min(st.min, Number(width) || 0);
    st.max = Math.max(st.max, Number(width) || 0);
    const nd = Number(params.normalizedDensity);
    if (!Number.isNaN(nd)) {
      st.dmin = Math.min(st.dmin, nd);
      st.dmax = Math.max(st.dmax, nd);
    }
    if (params.isTopN) st.topN += 1;
    // 軽いスロットリング
    if (!this._outlineStatsRAF) {
      this._outlineStatsRAF = requestAnimationFrame(() => {
        this._outlineStatsRAF = null;
        this._updateOutlineStatsUI();
      });
    }
  }

  /**
   * v0.1.6: 統計のUIを更新
   */
  _updateOutlineStatsUI() {
    try {
      const st = this._outlineStats;
      const $ = (id) => document.getElementById(id);
      if (!st) return;
      const avg = st.calls > 0 ? (st.sum / st.calls) : NaN;
      if ($('or_calls')) $('or_calls').textContent = String(st.calls || 0);
      if ($('or_avg')) $('or_avg').textContent = Number.isFinite(avg) ? avg.toFixed(2) : '-';
      if ($('or_min')) $('or_min').textContent = Number.isFinite(st.min) ? st.min.toFixed(0) : '-';
      if ($('or_max')) $('or_max').textContent = Number.isFinite(st.max) ? st.max.toFixed(0) : '-';
      if ($('or_dmin')) $('or_dmin').textContent = Number.isFinite(st.dmin) ? st.dmin.toFixed(2) : '-';
      if ($('or_dmax')) $('or_dmax').textContent = Number.isFinite(st.dmax) ? st.dmax.toFixed(2) : '-';
      if ($('or_topn')) $('or_topn').textContent = String(st.topN || 0);
      // Nav拡張へも反映
      try {
        const set=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val;};
        set('navOrCalls', String(st.calls||0));
        set('navOrAvg', Number.isFinite(avg)?avg.toFixed(2):'-');
        set('navOrMin', Number.isFinite(st.min)?st.min.toFixed(0):'-');
        set('navOrMax', Number.isFinite(st.max)?st.max.toFixed(0):'-');
        set('navOrDMin', Number.isFinite(st.dmin)?st.dmin.toFixed(2):'-');
        set('navOrDMax', Number.isFinite(st.dmax)?st.dmax.toFixed(2):'-');
        set('navOrTopN', String(st.topN||0));
      } catch(_) {}
    } catch (_) {
      // ignore UI errors
    }
  }
  
  /**
   * カラーマップに応じた色を取得
   */
  getColorForMap(colorMap, type) {
    const colorMaps = {
      heat: {
        min: [0, 32, 255],    // 青
        max: [255, 64, 0]     // 赤
      },
      cool: {
        min: [0, 255, 255],   // シアン
        max: [255, 0, 255]    // マゼンタ
      },
      rainbow: {
        min: [128, 0, 255],   // 紫
        max: [255, 0, 0]      // 赤
      },
      viridis: {
        min: [68, 1, 84],     // 濃い紫
        max: [253, 231, 37]   // 黄色
      }
    };
    
    return colorMaps[colorMap] ? colorMaps[colorMap][type] : colorMaps.heat[type];
  }
  
  /**
   * v0.1.9: 手動fitViewを実行
   */
  async executeFitView() {
    if (!this.heatbox) {
      alert('ヒートマップが作成されていません。まずデータを読み込んでヒートマップを作成してください。');
      return;
    }
    
    try {
      const headingDeg = parseFloat(document.getElementById('fitViewHeading').value);
      const pitchDeg = parseFloat(document.getElementById('fitViewPitch').value);
      
      await this.heatbox.fitView(null, {
        headingDegrees: headingDeg,
        pitchDegrees: pitchDeg,
        paddingPercent: 0.1
      });
      
      console.log('✅ Manual fitView completed successfully');
      this.showTemporaryMessage('カメラ位置調整完了', 2000);
      
    } catch (error) {
      console.error('❌ FitView execution failed:', error);
      alert(`FitView実行エラー: ${error.message}`);
    }
  }
  
  /**
   * ヒートマップをクリア
   */
  clearHeatmap() {
    if (this.heatbox) {
      this.heatbox.clear();
      this.heatbox = null;
    }
    
    // 統計情報をリセット
    this.resetStatistics();
    
    console.log('ヒートマップクリア完了');
  }
  
  /**
   * 表示/非表示を切り替え
   */
  toggleVisibility() {
    if (this.heatbox) {
      this.isVisible = !this.isVisible;
      this.heatbox.setVisible(this.isVisible);
      
      console.log('表示状態:', this.isVisible ? '表示' : '非表示');
    }
  }
  
  /**
   * データを出力
   */
  exportData() {
    if (!this.currentData) {
      alert('出力するデータがありません');
      return;
    }
    
    const exportData = {
      metadata: {
        timestamp: new Date().toISOString(),
        count: this.currentData.length,
        version: this.getEnvironmentInfo().version
      },
      data: this.currentData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heatbox-data-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    console.log('データ出力完了');
  }
  
  /**
   * 統計情報を更新
   */
  updateStatistics() {
    if (!this.currentData) return;
    
    // Cesium Entitiesから重み値を取得
    const weights = this.currentData.map(entity => {
      // entity.properties から weight を取得
      if (entity.properties && typeof entity.properties.getValue === 'function') {
        const props = entity.properties.getValue(Cesium.JulianDate.now());
        return props.weight || 1;
      } else if (entity.properties && entity.properties.weight) {
        return entity.properties.weight;
      }
      return 1;
    });
    
    const max = weights.length > 0 ? Math.max(...weights) : 0;
    const min = weights.length > 0 ? Math.min(...weights) : 0;
    const avg = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;
    
    // 右サイドバーの統計情報を更新
    document.getElementById('dataCount').textContent = this.currentData.length;
    document.getElementById('maxValue').textContent = max.toFixed(2);
    document.getElementById('minValue').textContent = min.toFixed(2);
    document.getElementById('avgValue').textContent = avg.toFixed(2);
    // 初期状態では空ボクセル数は不明
    document.getElementById('emptyVoxelCount').textContent = '-';
    
    // ナビゲーションドロップダウンの統計情報も更新
    this.updateNavStats({
      dataCount: this.currentData.length,
      voxelCount: '-',
      maxValue: max.toFixed(2),
      minValue: min.toFixed(2),
      avgValue: avg.toFixed(2),
      emptyVoxelCount: '-'
    });

    // デバッグ: 要素存在と表示状態
    try {
      const ids = ['navDataCount','navVoxelCount','navMaxValue','navMinValue'];
      const state = ids.reduce((acc,id)=>{ const el=document.getElementById(id); acc[id]={exists:!!el,text:el?.textContent}; return acc;},{});
      console.log('[updateStatistics] nav stats element state', state);
    } catch(_) {}
    // 拡張ナビ統計初期化（平均と空ボクセル）
    try {
      const set=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val;};
      set('navAvgValue', avg.toFixed(2));
      set('navEmptyVoxelCount','-');
    } catch(_) {}
  }
  
  /**
   * ヒートマップから統計情報を更新
   * v0.1.4: 自動調整情報を追加
   */
  updateStatisticsFromHeatmap(stats) {
    if (!stats) return;
    
    // ライブラリ側のバージョン差異に備えて各種キーを冗長に解決
    const rendered = stats.renderedVoxels ?? stats.rendered ?? stats.voxelCount ?? 0;
    const total = stats.totalVoxels ?? stats.total ?? rendered;
    const empty = stats.emptyVoxels ?? stats.empty ?? (total - rendered >= 0 ? (total - rendered) : 0);
    const maxVal = stats.maxCount ?? stats.maxValue ?? stats.max ?? 0;
    const minVal = stats.minCount ?? stats.minValue ?? stats.min ?? 0;
    const avgVal = stats.averageCount ?? stats.avgCount ?? stats.mean ?? (rendered ? (stats.sumCount / rendered) : 0) ?? 0;

    // 基本統計情報（右サイド）
    document.getElementById('voxelCount').textContent = (rendered || total || 0).toString();
    document.getElementById('emptyVoxelCount').textContent = empty.toString();
    document.getElementById('maxValue').textContent = Number(maxVal).toFixed(2);
    document.getElementById('minValue').textContent = Number(minVal).toFixed(2);
    document.getElementById('avgValue').textContent = Number(avgVal).toFixed(2);
    
    // デバッグ（初回のみ出力）
    if (!this._navStatDebugLogged) {
      console.log('[NavStats] Resolved stats keys:', { rendered, total, empty, maxVal, minVal, avgVal, raw: stats });
      this._navStatDebugLogged = true;
    }
    
    // v0.1.4: 自動調整情報表示
    const autoSizeInfo = document.getElementById('autoSizeInfo');
    if (stats.autoAdjusted !== undefined) {
      autoSizeInfo.style.display = 'block';
      document.getElementById('autoAdjusted').textContent = stats.autoAdjusted ? 'あり' : 'なし';
      
      if (stats.autoAdjusted && stats.originalVoxelSize && stats.finalVoxelSize) {
        document.getElementById('sizeInfo').textContent = `${stats.originalVoxelSize}m → ${stats.finalVoxelSize}m`;
      } else if (stats.finalVoxelSize) {
        document.getElementById('sizeInfo').textContent = `${stats.finalVoxelSize}m`;
      } else {
        document.getElementById('sizeInfo').textContent = '-';
      }
    } else {
      autoSizeInfo.style.display = 'none';
    }
    
    // v0.1.9: 新統計情報表示
    const v019Stats = document.getElementById('v019Stats');
    if (stats.selectionStrategy || stats.renderBudgetTier) {
      v019Stats.style.display = 'block';
      
      // 選択戦略
      document.getElementById('selectionStrategy').textContent = stats.selectionStrategy || '-';
      
      // レンダー数 (rendered/total)
      const renderedText = stats.renderedVoxels !== undefined && stats.totalVoxels !== undefined 
        ? `${stats.renderedVoxels}/${stats.totalVoxels}`
        : (stats.renderedVoxels || '-');
      document.getElementById('renderedVoxels').textContent = renderedText;
      
      // デバイスティア
      document.getElementById('deviceTier').textContent = stats.renderBudgetTier || '-';
      
      // カバレッジ比率
      const coverageText = stats.coverageRatio !== undefined 
        ? `${(stats.coverageRatio * 100).toFixed(1)}`
        : '-';
      document.getElementById('coverageRatio').textContent = coverageText;
      
    } else {
      v019Stats.style.display = 'none';
    }
    
    // v0.1.4: 追加情報の補足ログ
    if (stats.adjustmentReason) {
      console.log('自動調整理由:', stats.adjustmentReason);
    }
    
    // ナビゲーションドロップダウンの統計情報も更新
    this.updateNavStats({
      dataCount: document.getElementById('dataCount')?.textContent || '0',
      voxelCount: (rendered || total || 0).toString(),
      maxValue: Number(maxVal).toFixed(2),
      minValue: Number(minVal).toFixed(2),
      avgValue: Number(avgVal).toFixed(2),
      emptyVoxelCount: empty.toString()
    });
    // 拡張ナビ統計
    try {
      const set=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val;};
      set('navEmptyVoxelCount', empty.toString());
      set('navAvgValue', Number(avgVal).toFixed(2));
      // 自動調整
      const navAuto = document.getElementById('navAutoSizeInfo');
      if (navAuto) {
        if (stats.autoAdjusted !== undefined) {
          navAuto.style.display='block';
          set('navAutoAdjusted', stats.autoAdjusted ? 'あり':'なし');
          if (stats.autoAdjusted && stats.originalVoxelSize && stats.finalVoxelSize) {
            set('navSizeInfo', `${stats.originalVoxelSize}m→${stats.finalVoxelSize}m`);
          } else if (stats.finalVoxelSize) {
            set('navSizeInfo', `${stats.finalVoxelSize}m`);
          } else {
            set('navSizeInfo','-');
          }
        } else {
          navAuto.style.display='none';
        }
      }
      // v0.1.9 stats
      const nav019 = document.getElementById('navV019Stats');
      if (nav019) {
        if (stats.selectionStrategy || stats.renderBudgetTier) {
          nav019.style.display='block';
          set('navSelectionStrategy', stats.selectionStrategy || '-');
          set('navRenderedVoxels', (stats.renderedVoxels!==undefined && stats.totalVoxels!==undefined) ? `${stats.renderedVoxels}/${stats.totalVoxels}` : (stats.renderedVoxels || '-'));
          set('navDeviceTier', stats.renderBudgetTier || '-');
          set('navCoverageRatio', stats.coverageRatio !== undefined ? (stats.coverageRatio*100).toFixed(1) : '-');
        } else {
          nav019.style.display='none';
        }
      }
    } catch(_) {}
    
    // Update compact nav stats if present (legacy)
    try {
      const nav = document.getElementById('navStatsText');
      if (nav) {
        if (stats.renderedVoxels !== undefined && stats.totalVoxels !== undefined) {
          nav.textContent = `Voxels: ${stats.renderedVoxels}/${stats.totalVoxels}`;
        } else if (stats.renderedVoxels !== undefined) {
          nav.textContent = `Voxels: ${stats.renderedVoxels}`;
        } else {
          nav.textContent = `Voxels: ${document.getElementById('voxelCount')?.textContent || '-'}`;
        }
      }
    } catch (_) {}
  }
  
  /**
   * 統計情報をリセット
   */
  resetStatistics() {
    document.getElementById('voxelCount').textContent = '0';
    document.getElementById('emptyVoxelCount').textContent = '0';
    document.getElementById('maxValue').textContent = '-';
    document.getElementById('minValue').textContent = '-';
    document.getElementById('avgValue').textContent = '-';
    // 自動調整情報も隠す
    document.getElementById('autoSizeInfo').style.display = 'none';
    const nav = document.getElementById('navStatsText');
    if (nav) nav.textContent = 'Voxels: -';
    
    // ナビゲーションドロップダウンの統計情報もリセット
    this.updateNavStats({
      dataCount: '0',
      voxelCount: '0',
      maxValue: '-',
      minValue: '-',
      avgValue: '-',
      emptyVoxelCount: '-'
    });
  }
  
  /**
   * ナビゲーションドロップダウンの統計情報を更新
   */
  updateNavStats(stats) {
    try {
      const elements = {
        navDataCount: document.getElementById('navDataCount'),
        navVoxelCount: document.getElementById('navVoxelCount'),
        navMaxValue: document.getElementById('navMaxValue'),
        navMinValue: document.getElementById('navMinValue'),
        navAvgValue: document.getElementById('navAvgValue'),
        navEmptyVoxelCount: document.getElementById('navEmptyVoxelCount')
      };
      
      if (elements.navDataCount) elements.navDataCount.textContent = stats.dataCount;
      if (elements.navVoxelCount) elements.navVoxelCount.textContent = stats.voxelCount;
      if (elements.navMaxValue) elements.navMaxValue.textContent = stats.maxValue;
      if (elements.navMinValue) elements.navMinValue.textContent = stats.minValue;
      if (elements.navAvgValue && stats.avgValue !== undefined) elements.navAvgValue.textContent = stats.avgValue;
      if (elements.navEmptyVoxelCount && stats.emptyVoxelCount !== undefined) elements.navEmptyVoxelCount.textContent = stats.emptyVoxelCount;
    } catch (error) {
      console.warn('ナビゲーション統計更新エラー:', error);
    }
  }
  
  /**
   * 環境情報を更新
   */
  updateEnvironmentInfo() {
    // UMDバージョンで環境情報を取得
    const envInfo = this.getEnvironmentInfo();
    
    document.getElementById('cesiumVersion').textContent = envInfo.cesiumVersion;
    document.getElementById('heatboxVersion').textContent = envInfo.version;
    document.getElementById('webglSupport').textContent = envInfo.webglSupport ? 'サポート' : '非サポート';
    // ナビ拡張
    try {
      const set=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val;};
      set('navCesiumVersion', envInfo.cesiumVersion);
      set('navHeatboxVersion', envInfo.version);
      set('navWebglSupport', envInfo.webglSupport ? 'サポート':'非サポート');
    } catch(_) {}
  }
  
  /**
   * 環境情報を取得（ローカル実装）
   */
  getEnvironmentInfo() {
    // WebGL サポートの確認
    let webglSupport = false;
    try {
      if (typeof WebGLRenderingContext !== 'undefined') {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        webglSupport = !!gl;
      }
    } catch (e) {
      webglSupport = false;
    }
    
    // Heatboxバージョン推定: ライブラリがVERSIONを持たないため、scriptのクエリ ?v= を優先
    let hbVersion = 'N/A';
    try {
      if (typeof CesiumHeatbox !== 'undefined' && CesiumHeatbox.VERSION) {
        hbVersion = CesiumHeatbox.VERSION;
      } else if (typeof document !== 'undefined') {
        const s = Array.from(document.querySelectorAll('script'))
          .map((el) => el.getAttribute('src') || '')
          .find((src) => src.includes('cesium-heatbox.umd.min.js')) || '';
        const m = s.match(/[?&]v=([^&]+)/);
        if (m) hbVersion = decodeURIComponent(m[1]);
      }
    } catch (_) {}
    
    return {
      version: hbVersion,
      cesiumVersion: typeof Cesium !== 'undefined' ? Cesium.VERSION : 'N/A',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      webglSupport: webglSupport,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * ローディング表示を切り替え
   */
  showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
  }

  /**
   * 基本的なHeatboxテスト
   */
  testHeatboxBasic() {
    console.log('=== Heatbox基本テスト開始 ===');
    
    try {
      // ライブラリの利用可能性チェック
      console.log('1. CesiumHeatbox availability:', typeof CesiumHeatbox);
      
      if (typeof CesiumHeatbox === 'undefined') {
        throw new Error('CesiumHeatbox is not defined');
      }
      
      // まず既存のエンティティをクリア
      this.viewer.entities.removeAll();
      
      // カメラ位置を東京に設定（明示的に）
      this.viewer.scene.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(139.69, 35.69, 1000),
        orientation: {
          heading: 0,
          pitch: -Cesium.Math.PI_OVER_FOUR,
          roll: 0
        }
      });
      
      // 簡単なテスト用エンティティを作成 - 少し範囲を狭めて集中させる
      const testEntities = [];
      for (let i = 0; i < 50; i++) {
        const entity = this.viewer.entities.add({
          id: `test-${i}`,
          position: Cesium.Cartesian3.fromDegrees(
            139.69 + (Math.random() - 0.5) * 0.005,  // 範囲を狭める
            35.69 + (Math.random() - 0.5) * 0.005,   // 範囲を狭める
            Math.random() * 50  // 高さも抑える
          ),
          point: {
            pixelSize: 8,
            color: Cesium.Color.RED
          }
        });
        testEntities.push(entity);
      }
      
      console.log('2. Test entities created:', testEntities.length);
      
      // Heatboxインスタンスを作成 - エンティティベース描画向けの設定
      const options = {
        voxelSize: 25,            // サイズを調整（見やすさ優先）
        opacity: 0.7,             // 少し透明に（重なりを見やすく）
        emptyOpacity: 0.0,        // 空ボクセルは表示しない
        showOutline: true,        // アウトラインを表示
        showEmptyVoxels: false,   // 空ボクセルは表示しない
        maxRenderVoxels: 1000,    // 表示数制限を緩和（100→1000）
        minColor: [0, 128, 255],  // 青
        maxColor: [255, 0, 0]     // 赤
      };
      
      console.log('3. Creating Heatbox instance with options:', options);
      const heatbox = new CesiumHeatbox(this.viewer, options);
      
      // 明示的に現在の状態をログ出力
      console.log('4. Viewer scene primitives before:', this.viewer.scene.primitives.length);
      
      // setDataメソッドを実行
      console.log('5. Calling setData with entities...');
      heatbox.setData(testEntities);
      console.log('6. setData completed');
      
      // 統計情報とデバッグ情報を出力
      const stats = heatbox.getStatistics();
      console.log('7. Statistics:', stats);
      
      // デバッグ情報を詳細に出力
      if (typeof heatbox.getDebugInfo === 'function') {
        const debug = heatbox.getDebugInfo();
        console.log('8. Debug info - bounds:', debug.bounds);
        console.log('9. Debug info - grid:', debug.grid);
        console.log('10. Renderer primitives count:', heatbox.renderer?.primitives?.length || 'N/A');
      }
      
      console.log('11. Scene primitives after:', this.viewer.scene.primitives.length);
      
      // 描画のトラブルシューティング情報
      console.log('12. Scene globe show:', this.viewer.scene.globe.show);
      console.log('13. Scene fog enabled:', this.viewer.scene.fog.enabled);
      
      // 明示的に表示・非表示を切り替えてみる
      console.log('14. Toggle visibility test:');
      heatbox.setVisible(false);
      console.log('   - Visibility set to false');
      setTimeout(() => {
        heatbox.setVisible(true);
        console.log('   - Visibility set to true');
      }, 1000);
      
      // デバッグ用に境界ボックスを明示的に描画
      // (VoxelRenderer自体がデバッグボックスを描画するようになったのでコメントアウト)
      // this._drawDebugBox();
      
      console.log('=== Heatbox基本テスト完了 ===');
      
      // グローバル変数に保持して確認できるようにする
      window.testHeatbox = heatbox;
      window.testEntities = testEntities;
      
      // テスト用エンティティを10秒後に削除
      setTimeout(() => {
        testEntities.forEach(entity => this.viewer.entities.remove(entity));
        heatbox.clear();
        console.log('Test entities and heatbox cleared');
      }, 10000);
      
    } catch (error) {
      console.error('=== Heatbox基本テスト失敗 ===');
      console.error('Error:', error);
      console.error('Stack:', error.stack);
    }
  }
  
  /**
   * v0.1.9: 一時的なメッセージを表示
   */
  showTemporaryMessage(message, duration = 3000) {
    // 既存のメッセージがあれば削除
    const existingMessage = document.getElementById('temporaryMessage');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    // 新しいメッセージ要素を作成
    const messageEl = document.createElement('div');
    messageEl.id = 'temporaryMessage';
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(76, 175, 80, 0.9);
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 16px;
      z-index: 10000;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      animation: fadeInOut ${duration}ms ease-in-out;
    `;
    
    // アニメーションCSS追加
    if (!document.getElementById('temporaryMessageStyle')) {
      const style = document.createElement('style');
      style.id = 'temporaryMessageStyle';
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(messageEl);
    
    // 指定時間後に削除
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
    }, duration);
  }

  /**
   * 統計パネル可視性デバッグ
   */
  debugStatsPanels() {
    try {
      const info = document.getElementById('info');
      const nav = document.querySelector('.nav-dropdown-stats');
      const gather = (el) => el ? {display: el.style.display, computed: getComputedStyle(el).display, size: el.offsetWidth+'x'+el.offsetHeight} : null;
      console.log('[debugStatsPanels]', {
        info: gather(info),
        rightCollapsed: document.body.classList.contains('right-collapsed'),
        nav: gather(nav),
        navValues: {
          data: document.getElementById('navDataCount')?.textContent,
          voxels: document.getElementById('navVoxelCount')?.textContent,
          max: document.getElementById('navMaxValue')?.textContent,
          min: document.getElementById('navMinValue')?.textContent
        }
      });
    } catch(e) { console.warn('debugStatsPanels error', e); }
  }
}

// アプリケーションを開始
window.addEventListener('DOMContentLoaded', () => {
  // Cesiumの読み込み確認
  if (typeof Cesium === 'undefined') {
    console.error('CesiumJS が読み込まれていません');
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loading').innerHTML = '<p>❌ CesiumJS が読み込まれていません</p><p>ネットワーク接続を確認してページを再読み込みしてください</p>';
    return;
  }
  
  // CesiumHeatboxの読み込み確認
  if (typeof CesiumHeatbox === 'undefined') {
    console.error('CesiumHeatbox が読み込まれていません');
    console.error('ファイルパス確認: ../dist/cesium-heatbox.umd.min.js');
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loading').innerHTML = '<p>❌ CesiumHeatbox が読み込まれていません</p><p>ライブラリファイルの場所を確認してください</p><p>期待するパス: ../dist/cesium-heatbox.umd.min.js</p>';
    return;
  }
  
  console.log('CesiumJS version:', Cesium.VERSION);
  console.log('Cesium ion available:', typeof Cesium.Ion !== 'undefined');
  console.log('CesiumHeatbox available:', typeof CesiumHeatbox !== 'undefined');
  console.log('CesiumHeatbox properties:', Object.keys(CesiumHeatbox));
  
  try {
    const app = new HeatboxPlayground();
    // 初期デバッグ
    setTimeout(()=> app.debugStatsPanels(), 500);
  } catch (error) {
    console.error('アプリケーション初期化エラー:', error);
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loading').innerHTML = '<p>❌ アプリケーション初期化エラー</p><p>' + error.message + '</p><p>詳細はブラウザのコンソールを確認してください</p>';
  }
});
