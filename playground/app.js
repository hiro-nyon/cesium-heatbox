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
    
    console.log('=== HeatboxPlayground 初期化完了 ===');
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
        }
      });
      
      console.log('=== Cesium Viewer 初期化完了 ===');
      
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
    });
    
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
    
    // 東京周辺のサンプルデータをCesium Entityとして生成
    this.viewer.entities.removeAll(); // 既存のエンティティをクリア
    
    const centerLon = 139.6917;
    const centerLat = 35.6895;
    const radius = 0.1; // 約10km
    
    for (let i = 0; i < 500; i++) {
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
          color: Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1
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
    
    // カメラを移動
    this.viewer.scene.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 5000),
      orientation: {
        heading: 0,
        pitch: -Cesium.Math.PI_OVER_FOUR,
        roll: 0
      }
    });
    
    console.log('サンプルデータ読み込み完了:', this.currentData.length, '個のエンティティ');
    this.showLoading(false);
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
        
        // カテゴリ別の色
        const colors = {
          residential: Cesium.Color.BLUE,
          commercial: Cesium.Color.RED,
          industrial: Cesium.Color.ORANGE,
          park: Cesium.Color.GREEN
        };
        
        this.viewer.entities.add({
          id: `test-${i}`,
          position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
          point: {
            pixelSize: 4,
            color: colors[category],
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 1
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
      
      // カメラを移動
      this.viewer.scene.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(139.69, 35.69, 5000),
        orientation: {
          heading: 0,
          pitch: -Cesium.Math.PI_OVER_FOUR,
          roll: 0
        }
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
      this.heatbox = new CesiumHeatbox(this.viewer, options);
      console.log('Heatboxインスタンス作成完了:', this.heatbox);
      console.log('Heatboxインスタンスのメソッド:', Object.getOwnPropertyNames(this.heatbox));
      
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
        
        // 統計情報を出力するため、非同期メソッドを使用
        console.log('createFromEntitiesメソッドを使用');
        await this.heatbox.createFromEntities(validEntities);
        console.log('createFromEntities完了');
        
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
        
        // カメラを最適な位置に移動
        this._zoomToHeatboxBounds();
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
      if (!this.heatbox || typeof this.heatbox.getBounds !== 'function') return;
      const bounds = this.heatbox.getBounds();
      if (!bounds) return;
      const centerLon = bounds.centerLon ?? (bounds.minLon + bounds.maxLon) / 2;
      const centerLat = bounds.centerLat ?? (bounds.minLat + bounds.maxLat) / 2;
      // 矩形サイズから最適高度を推定（近めに設定して可視性を確保）
      const DEG2M = 111000;
      const lonMeters = Math.abs(bounds.maxLon - bounds.minLon) * DEG2M * Math.cos((centerLat * Math.PI) / 180);
      const latMeters = Math.abs(bounds.maxLat - bounds.minLat) * DEG2M;
      const span = Math.max(lonMeters, latMeters);
      const altitude = Math.min(Math.max(span * 0.6, 800), 4000); // 0.6xスパン、高度800〜4000mに収める
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, altitude),
        orientation: {
          heading: 0,
          pitch: -Cesium.Math.PI_OVER_THREE, // 約 -60度
          roll: 0
        },
        duration: 0.8
      });
      console.log('Camera zoomed to heatbox bounds:', bounds);
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
    const wireframeOnly = document.getElementById('wireframeOnly').checked;
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
    const outlineWidthManual = parseInt(document.getElementById('outlineWidth')?.value || '2', 10);
    const outlineEmulationMode = document.getElementById('outlineEmulationMode')?.value || 'off';
    const outlineInset = parseFloat(document.getElementById('outlineInset')?.value || '0');
    const outlineInsetModeSel = document.getElementById('outlineInsetMode')?.value || 'all';
    const enableThickFrames = document.getElementById('enableThickFrames')?.checked || false;
    // v0.1.7: 新オプション
    const outlineRenderMode = document.getElementById('outlineRenderMode')?.value || 'standard';
    const adaptiveOutlines = document.getElementById('adaptiveOutlines')?.checked || false;
    const outlineWidthPreset = document.getElementById('outlineWidthPreset')?.value || 'uniform';
    const boxOpacityMode = document.getElementById('boxOpacityMode')?.value || 'off';
    const outlineOpacityMode = document.getElementById('outlineOpacityMode')?.value || 'off';

    // v0.1.6: 枠線太さモード
    let outlineWidthResolver = null;
    let outlineWidthValue = 2;
    if (outlineMode === 'adaptive') {
      outlineWidthResolver = (params) => {
        const { isTopN, normalizedDensity } = params || {};
        let width;
        
        // 「すべて太線」モードの場合は、すべてを太くする
        if (outlineEmulationMode === 'all') {
          if (isTopN) width = 6;           // TopNをさらに強調
          else width = 4;                  // その他も太線に
        } else {
          // 通常のadaptiveモード
          if (isTopN) width = 6;           // TopNを強調
          else if (normalizedDensity > 0.7) width = 1; // 高密度は細く
          else if (normalizedDensity > 0.3) width = 2; // 中密度は標準
          else width = 3;                  // 低密度は太く
        }
        
        // 統計を記録
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
      voxelSize: autoVoxelSize ? undefined : gridSize,
      opacity: wireframeOnly ? 0.0 : 0.7,
      // 空ボクセル表示設定
      emptyOpacity: showEmptyVoxels ? emptyOpacity : 0.0,
      showEmptyVoxels: showEmptyVoxels,
      showOutline: true,
      maxRenderVoxels: 300,
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
      // v0.1.7 additions
      outlineRenderMode: outlineRenderMode,
      adaptiveOutlines: adaptiveOutlines,
      outlineWidthPreset: outlineWidthPreset
    };

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
        if (boxOpacityMode === 'density') return Math.max(0.2, Math.min(1.0, 0.3 + d * 0.7));
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
    
    console.log('Heatbox options (v0.1.7):', options);
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
    
    document.getElementById('dataCount').textContent = this.currentData.length;
    document.getElementById('maxValue').textContent = max.toFixed(2);
    document.getElementById('minValue').textContent = min.toFixed(2);
    document.getElementById('avgValue').textContent = avg.toFixed(2);
    // 初期状態では空ボクセル数は不明
    document.getElementById('emptyVoxelCount').textContent = '-';
  }
  
  /**
   * ヒートマップから統計情報を更新
   * v0.1.4: 自動調整情報を追加
   */
  updateStatisticsFromHeatmap(stats) {
    if (!stats) return;
    
    // 基本統計情報
    document.getElementById('voxelCount').textContent = (stats.renderedVoxels ?? stats.totalVoxels ?? 0).toString();
    document.getElementById('emptyVoxelCount').textContent = (stats.emptyVoxels ?? 0).toString();
    document.getElementById('maxValue').textContent = (stats.maxCount ?? 0).toFixed(2);
    document.getElementById('minValue').textContent = (stats.minCount ?? 0).toFixed(2);
    document.getElementById('avgValue').textContent = (stats.averageCount ?? 0).toFixed(2);
    
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
      
      // 調整理由がある場合はコンソールに出力
      if (stats.adjustmentReason) {
        console.log('自動調整理由:', stats.adjustmentReason);
      }
    } else {
      autoSizeInfo.style.display = 'none';
    }
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
        maxRenderVoxels: 100,     // 表示数を制限
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
    console.error('ファイルパス確認: ../cesium-heatbox/dist/cesium-heatbox.umd.min.js');
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loading').innerHTML = '<p>❌ CesiumHeatbox が読み込まれていません</p><p>ライブラリファイルの場所を確認してください</p><p>期待するパス: ../cesium-heatbox/dist/cesium-heatbox.umd.min.js</p>';
    return;
  }
  
  console.log('CesiumJS version:', Cesium.VERSION);
  console.log('Cesium ion available:', typeof Cesium.Ion !== 'undefined');
  console.log('CesiumHeatbox available:', typeof CesiumHeatbox !== 'undefined');
  console.log('CesiumHeatbox properties:', Object.keys(CesiumHeatbox));
  
  try {
    new HeatboxPlayground();
  } catch (error) {
    console.error('アプリケーション初期化エラー:', error);
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loading').innerHTML = '<p>❌ アプリケーション初期化エラー</p><p>' + error.message + '</p><p>詳細はブラウザのコンソールを確認してください</p>';
  }
});
