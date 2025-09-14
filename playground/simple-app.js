// Cesium Heatbox - Simple App (Quick Start)
// Global variables
let viewer = null;
let heatboxInstance = null;
let currentEntities = [];
let currentData = null;
let isHeatmapVisible = true; // 表示状態を追跡
// QS: 自動カメラ調整のタイミング制御
let _qsAutoViewRequest = false;
let _qsFitOnceHandler = null;
let _qsFitViewOptions = null;
// QSデバッグ用トグル
const QS_DISABLE_WIREFRAME_AT_CREATE = true; // 初回作成時は必ずstandardに固定
const QS_HIDE_RAW_POINTS_AFTER_CREATE = true; // 元のPointエンティティを非表示にして切り分け

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeCesium();
  setupEventListeners();
  // Quick Start mobile: toggle #toolbar (Playground bottom-sheet styles)
  setupQuickStartMobileMenu();
  initializeEnvironmentInfo();
  // setupAutoVoxelSizeToggle(); // QS enforces auto voxel size
  // QS: デバッグフックを初期化
  try { installDebugHooks(); } catch (_) {}
});

// Initialize Cesium viewer
function initializeCesium() {
  try {
    viewer = new Cesium.Viewer('cesiumContainer', {
      // UI components
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: true,
      geocoder: false,
      homeButton: true,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      
      // Performance optimizations
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
      
      // Terrain and imagery (no Ion dependency)
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      imageryProvider: new Cesium.UrlTemplateImageryProvider({
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        subdomains: 'abcd',
        maximumLevel: 19,
        credit: '© OpenStreetMap contributors © CARTO'
      })
    });

    // Scene/globe settings to ensure visibility
    viewer.scene.fog.enabled = false;
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.moon.show = false;
    viewer.scene.sun.show = true;
    viewer.scene.skyBox.show = true;
    viewer.scene.globe.show = true;
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.backgroundColor = Cesium.Color.DARKSLATEGRAY;

    // Ensure imagery layer is present (some environments skip initial layer)
    try {
      const layers = viewer.imageryLayers;
      if (!layers || layers.length === 0 || !layers.get(0)) {
        console.warn('No imagery layer detected at init. Forcing Carto Light add.');
        layers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
          url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          subdomains: 'abcd',
          maximumLevel: 19,
          credit: '© OpenStreetMap contributors © CARTO'
        }));
        viewer.scene.requestRender();
      }
    } catch (_) {}

    // Set an initial camera view (Tokyo)
    try {
      viewer.scene.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(139.6917, 35.6895, 15000),
        orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_FOUR, roll: 0 }
      });
    } catch (_) {}

    updateStatus('Cesium initialized successfully', 'success');
    // QS: 安定性対策 - 半透明/OIT/ログ深度/ポストプロセスを抑止
    try {
      if (viewer && viewer.scene) {
        if (typeof viewer.scene.orderIndependentTranslucency !== 'undefined') {
          viewer.scene.orderIndependentTranslucency = false;
        }
        if (typeof viewer.scene.logarithmicDepthBuffer !== 'undefined') {
          viewer.scene.logarithmicDepthBuffer = false;
        }
        if (typeof viewer.scene.sunBloom !== 'undefined') {
          viewer.scene.sunBloom = false;
        }
        if (typeof viewer.scene.requestRenderMode !== 'undefined') {
          viewer.scene.requestRenderMode = false;
        }
      }
    } catch (_) {}
    
  } catch (error) {
    console.error('Failed to initialize Cesium:', error);
    updateStatus('Failed to initialize Cesium: ' + error.message, 'error');
  }
}

// ===== Debug hooks (QS専用) =====
function installDebugHooks() {
  if (!window || !viewer || !viewer.scene) return;
  // renderError にフック
  try {
    const errEv = viewer.scene.renderError;
    if (errEv && typeof errEv.addEventListener === 'function') {
      errEv.addEventListener(function() {
        const args = Array.prototype.slice.call(arguments || []);
        console.error('[QS][renderError] captured', args && args[0] && args[0].message ? args[0].message : args[0]);
        safeDebugSnapshot('renderError');
      });
    }
  } catch(_) {}

  // グローバル onerror
  try {
    window.addEventListener('error', function(e){
      console.error('[QS][window.error]', e && e.message);
      safeDebugSnapshot('window.error');
    });
  } catch(_) {}

  // コンソールから手動呼び出し可能
  window.heatboxDebugDump = function(label){ safeDebugSnapshot(label || 'manual'); };
}

function safeGetValue(prop) {
  try {
    if (!prop) return null;
    if (typeof prop.getValue === 'function') return prop.getValue(Cesium.JulianDate.now());
    return prop;
  } catch(_) { return null; }
}

function safeDebugSnapshot(label) {
  try {
    const stats = { label, t: Date.now() };
    // viewer全体
    const values = (viewer && viewer.entities && viewer.entities.values) ? viewer.entities.values : [];
    stats.viewerEntities = values.length;

    // Heatbox内部（可能なら）
    let hbEntities = 0;
    try { hbEntities = heatboxInstance && heatboxInstance.renderer && heatboxInstance.renderer.geometryRenderer && Array.isArray(heatboxInstance.renderer.geometryRenderer.entities) ? heatboxInstance.renderer.geometryRenderer.entities.length : 0; } catch(_) {}
    stats.heatboxEntities = hbEntities;

    // Box/Polylineの簡易統計
    let boxCount = 0, plCount = 0;
    const dimMin = { x: Infinity, y: Infinity, z: Infinity };
    const dimMax = { x: -Infinity, y: -Infinity, z: -Infinity };
    let invalidDims = 0, invalidPos = 0;

    for (let i = 0; i < values.length; i++) {
      const e = values[i];
      if (!e) continue;
      // Box
      if (e.box) {
        boxCount++;
        const dims = safeGetValue(e.box.dimensions);
        if (!dims || !isFinite(dims.x) || !isFinite(dims.y) || !isFinite(dims.z) || dims.x <= 0 || dims.y <= 0 || dims.z <= 0) {
          invalidDims++;
        } else {
          dimMin.x = Math.min(dimMin.x, dims.x); dimMax.x = Math.max(dimMax.x, dims.x);
          dimMin.y = Math.min(dimMin.y, dims.y); dimMax.y = Math.max(dimMax.y, dims.y);
          dimMin.z = Math.min(dimMin.z, dims.z); dimMax.z = Math.max(dimMax.z, dims.z);
        }
      }
      // Polyline
      if (e.polyline) {
        plCount++;
      }
      // 位置
      const pos = safeGetValue(e.position);
      if (!pos || !isFinite(pos.x) || !isFinite(pos.y) || !isFinite(pos.z)) invalidPos++;
    }

    stats.boxCount = boxCount;
    stats.polylineCount = plCount;
    stats.invalidDims = invalidDims;
    stats.invalidPos = invalidPos;
    stats.dimMin = dimMin;
    stats.dimMax = dimMax;

    console.warn('[QS][debugSnapshot]', stats);
  } catch (err) {
    console.error('[QS][debugSnapshot] failed', err);
  }
}

// Setup event listeners for all controls
function setupEventListeners() {
  // File input
  document.getElementById('fileInput').addEventListener('change', handleFileInput);
  
  // Sample data buttons
  document.getElementById('loadSampleData').addEventListener('click', loadSampleData);
  document.getElementById('generateTestData').addEventListener('click', generateTestData);
  
  // Base map selector
  const baseMapSelect = document.getElementById('baseMap');
  if (baseMapSelect) {
    baseMapSelect.addEventListener('change', switchBaseMap);
  }
  
  // Heatmap controls
  document.getElementById('createHeatmap').addEventListener('click', createHeatmap);
  document.getElementById('clearHeatmap').addEventListener('click', clearHeatmap);
  document.getElementById('toggleVisibility').addEventListener('click', toggleVisibility);
  
  // Live updates for wireframe
  const wireframeCb = document.getElementById('wireframeOnly');
  if (wireframeCb) wireframeCb.addEventListener('change', reRenderHeatmap);
  
  // Quick Start: no manual grid in UI; guard if remnants exist
  const gridSizeSlider = document.getElementById('gridSize');
  const gridSizeValue = document.getElementById('gridSizeValue');
  if (gridSizeSlider && gridSizeValue) {
    gridSizeSlider.addEventListener('input', function() {
      gridSizeValue.textContent = this.value;
    });
  }
  
  // Mobile menu handled by setupMobileMenu()
}

// Quick Start mobile bottom-sheet toggle (reuse Playground toolbar styles)
function setupQuickStartMobileMenu() {
  try {
    const toggle = document.getElementById('mobileMenuToggle');
    const panel = document.getElementById('toolbar');
    if (!toggle || !panel) return;
    const close = () => panel.classList.remove('open');
    const flip = () => panel.classList.toggle('open');
    toggle.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); flip(); });
    document.addEventListener('click', (e) => { if (!panel.contains(e.target) && !toggle.contains(e.target)) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  } catch (_) {}
}

// Re-render heatmap with updated emulation/opacity settings
function reRenderHeatmap() {
  if (!heatboxInstance || !currentEntities || currentEntities.length === 0) return;
  try {
    const wireframe = document.getElementById('wireframeOnly')?.checked || false;
    const updated = {
      showOutline: false,
      opacity: wireframe ? 0.0 : 0.85,
      // QSでは適応制御を無効化（安定優先）
      adaptiveOutlines: false,
      outlineWidthPreset: 'medium',
      outlineRenderMode: 'standard',
      emulationScope: 'off',
      outlineInset: 0,
      outlineInsetMode: 'none'
    };

    Object.assign(heatboxInstance.options, updated);
    if (typeof heatboxInstance.createFromEntities === 'function') {
      heatboxInstance.createFromEntities(currentEntities);
    } else {
      heatboxInstance.setData(currentEntities);
      if (typeof heatboxInstance.update === 'function') heatboxInstance.update();
    }
    
    // 重要: 再描画後の即座な画面更新を要求
    if (viewer && viewer.scene) {
      viewer.scene.requestRender();
    }
    
  } catch (e) {
    console.error('Re-render failed:', e);
  }
}

// Setup mobile hamburger to toggle bottom-sheet toolbar
function setupMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const toolbar = document.getElementById('toolbar');
  if (!mobileMenuToggle || !toolbar) return;

  const closeMenu = () => toolbar.classList.remove('open');
  const toggleMenu = () => toolbar.classList.toggle('open');

  mobileMenuToggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });

  // Close when tapping outside toolbar
  document.addEventListener('click', (e) => {
    if (!toolbar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
      closeMenu();
    }
  });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

// Setup auto voxel size toggle functionality
function setupAutoVoxelSizeToggle() {
  const autoVoxelCheckbox = document.getElementById('autoVoxelSize');
  const autoVoxelModeGroup = document.getElementById('autoVoxelModeGroup');
  const manualSizeGroup = document.getElementById('manualSizeGroup');
  const gridSizeInput = document.getElementById('gridSize');
  
  function toggleAutoVoxelSize() {
    const isAuto = autoVoxelCheckbox.checked;
    
    if (isAuto) {
      // Enable auto mode
      autoVoxelModeGroup.style.opacity = '1';
      autoVoxelModeGroup.style.pointerEvents = 'auto';
      manualSizeGroup.style.opacity = '0.5';
      manualSizeGroup.style.pointerEvents = 'none';
      gridSizeInput.disabled = true;
    } else {
      // Enable manual mode
      autoVoxelModeGroup.style.opacity = '0.5';
      autoVoxelModeGroup.style.pointerEvents = 'none';
      manualSizeGroup.style.opacity = '1';
      manualSizeGroup.style.pointerEvents = 'auto';
      gridSizeInput.disabled = false;
    }
  }
  
  // Initial state
  toggleAutoVoxelSize();
  
  // Add event listener
  autoVoxelCheckbox.addEventListener('change', toggleAutoVoxelSize);
}

// Switch base map imagery provider
function switchBaseMap() {
  const baseMapSelect = document.getElementById('baseMap');
  const selectedValue = baseMapSelect.value;
  
  let imageryProvider;
  
  switch (selectedValue) {
    case 'carto-dark':
      imageryProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        credit: '© CartoDB © OpenStreetMap contributors'
      });
      break;
    case 'osm-standard':
      imageryProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        credit: '© OpenStreetMap contributors'
      });
      break;
    case 'osm-humanitarian':
      imageryProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        credit: '© OpenStreetMap contributors, Tiles courtesy of Humanitarian OpenStreetMap Team'
      });
      break;
    case 'carto-light':
    default:
      imageryProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        credit: '© CartoDB © OpenStreetMap contributors'
      });
      break;
  }
  
  // Remove all existing imagery layers
  viewer.imageryLayers.removeAll();
  
  // Add the new imagery provider
  viewer.imageryLayers.addImageryProvider(imageryProvider);
  
  console.log(`Base map switched to: ${selectedValue}`);
}

// Initialize environment information
function initializeEnvironmentInfo() {
  try {
    // Cesium version
    const cesiumVersion = typeof Cesium !== 'undefined' ? Cesium.VERSION : 'Unknown';
    const cesiumEl = document.getElementById('cesiumVersion') || document.getElementById('navCesiumVersion');
    if (cesiumEl) cesiumEl.textContent = cesiumVersion;
    
    // WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const webglSupport = gl ? 'Supported' : 'Not Supported';
    const webglEl = document.getElementById('webglSupport') || document.getElementById('navWebglSupport');
    if (webglEl) webglEl.textContent = webglSupport;
    
    // Heatbox version - will be set when heatbox is initialized
    const hbEl = document.getElementById('heatboxVersion') || document.getElementById('navHeatboxVersion');
    if (hbEl) hbEl.textContent = 'Loading...';
    
  } catch (error) {
    console.error('Error initializing environment info:', error);
  }
}

// Handle file input
function handleFileInput(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  updateStatus('Loading file: ' + file.name, 'loading');
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      processLoadedData(data, file.name);
    } catch (error) {
      console.error('Error parsing file:', error);
      updateStatus('Error parsing file: Invalid JSON format', 'error');
    }
  };
  reader.readAsText(file);
}

// Load sample data (align with Playground)
function loadSampleData() {
  updateStatus('Loading sample data...', 'loading');
  try {
    const data = generateTokyoClusterGeoJSON(800, 0.02, 0, 200);
    processLoadedData(data, 'Playground-style Sample Data');
  } catch (error) {
    console.error('Error generating sample data:', error);
    updateStatus('Error loading sample data: ' + error.message, 'error');
  }
}

// Generate test data (align with Playground)
function generateTestData() {
  updateStatus('Generating test data...', 'loading');
  try {
    const testData = generateTokyoBoundsGeoJSON(300);
    processLoadedData(testData, 'Playground-style Test Data');
  } catch (error) {
    console.error('Error generating test data:', error);
    updateStatus('Error generating test data: ' + error.message, 'error');
  }
}

// Generate Tokyo cluster GeoJSON (like Playground sample)
function generateTokyoClusterGeoJSON(count = 800, radius = 0.02, minAlt = 0, maxAlt = 200) {
  const features = [];
  const centerLon = 139.6917;
  const centerLat = 35.6895;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * radius;
    const lon = centerLon + Math.cos(angle) * dist;
    const lat = centerLat + Math.sin(angle) * dist;
    const alt = minAlt + Math.random() * (maxAlt - minAlt);
    const value = Math.random() * 100;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat, alt] },
      properties: {
        value: Math.round(value * 100) / 100,
        name: `Sample ${i + 1}`
      }
    });
  }
  return { type: 'FeatureCollection', features };
}

// Generate Tokyo bounds GeoJSON (like Playground test)
function generateTokyoBoundsGeoJSON(count = 300) {
  const features = [];
  const bounds = { minLon: 139.68, maxLon: 139.70, minLat: 35.685, maxLat: 35.695, minAlt: 0, maxAlt: 200 };
  for (let i = 0; i < count; i++) {
    const lon = bounds.minLon + (bounds.maxLon - bounds.minLon) * Math.random();
    const lat = bounds.minLat + (bounds.maxLat - bounds.minLat) * Math.random();
    const alt = bounds.minAlt + (bounds.maxAlt - bounds.minAlt) * Math.random();
    const value = Math.random() * 100;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat, alt] },
      properties: {
        value: Math.round(value * 100) / 100,
        name: `Test ${i + 1}`
      }
    });
  }
  return { type: 'FeatureCollection', features };
}

// Process loaded data (GeoJSON or CZML)
function processLoadedData(data, fileName) {
  try {
    currentData = data;
    
    // Clear existing entities
    viewer.entities.removeAll();
    currentEntities = [];
    
    // Convert to entities based on data type
    if (data.type === 'FeatureCollection' || data.type === 'Feature') {
      // GeoJSON
      currentEntities = convertGeoJSONToEntities(data);
    } else if (Array.isArray(data)) {
      // CZML
      currentEntities = convertCZMLToEntities(data);
    } else {
      throw new Error('Unsupported data format');
    }
    
    // 従来通り: ロード直後に元Pointをviewerへ追加
    const addedEntities = [];
    currentEntities.forEach(entity => {
      const added = viewer.entities.add(entity);
      if (added) addedEntities.push(added);
    });
    currentEntities = addedEntities;
    
    // Update statistics
    updateStatistics();
    
    // Enable controls
    document.getElementById('createHeatmap').disabled = false;
    
    // 従来通り: ロード直後にオートカメラ調整
    if (document.getElementById('autoCamera').checked) {
      viewer.zoomTo(viewer.entities);
    }
    
    updateStatus(`Successfully loaded ${currentEntities.length} data points from ${fileName}`, 'success');
    
  } catch (error) {
    console.error('Error processing data:', error);
    updateStatus('Error processing data: ' + error.message, 'error');
  }
}

// Convert GeoJSON to Cesium entities
function convertGeoJSONToEntities(geojson) {
  const entities = [];
  
  function processFeature(feature) {
    if (!feature.geometry || !feature.geometry.coordinates) return;
    
    const coords = feature.geometry.coordinates;
    const props = feature.properties || {};
    
    let position;
    if (feature.geometry.type === 'Point') {
      position = Cesium.Cartesian3.fromDegrees(coords[0], coords[1], coords[2] || 0);
    } else {
      // For non-point geometries, use centroid
      return;
    }
    
    // Extract value for heatmap
    const value = props.value || props.intensity || props.weight || 1;
    
    const entity = {
      position: position,
      properties: {
        value: parseFloat(value),
        originalProperties: props
      },
      point: {
        pixelSize: 5,
        color: Cesium.Color.fromCssColorString('#1976D2').withAlpha(0.85),
        outlineWidth: 0
      }
    };
    
    entities.push(entity);
  }
  
  if (geojson.type === 'FeatureCollection') {
    geojson.features.forEach(processFeature);
  } else if (geojson.type === 'Feature') {
    processFeature(geojson);
  }
  
  return entities;
}

// Convert CZML to entities (basic implementation)
function convertCZMLToEntities(czml) {
  const entities = [];
  
  czml.forEach(packet => {
    if (packet.position && packet.position.cartographicDegrees) {
      const coords = packet.position.cartographicDegrees;
      const position = Cesium.Cartesian3.fromDegrees(coords[0], coords[1], coords[2] || 0);
      
      const value = packet.properties?.value || 1;
      
      const entity = {
        position: position,
        properties: {
          value: parseFloat(value),
          originalProperties: packet.properties || {}
        },
        point: {
          pixelSize: 5,
          color: Cesium.Color.fromCssColorString('#1976D2').withAlpha(0.85),
          outlineWidth: 0
        }
      };
      
      entities.push(entity);
    }
  });
  
  return entities;
}

// Create heatmap
async function createHeatmap() {
  if (!currentEntities || currentEntities.length === 0) {
    updateStatus('No data loaded to create heatmap', 'error');
    return;
  }
  
  try {
    updateStatus('Creating heatmap...', 'loading');

    // Quick Start: fixed auto settings (Safe fallback)
    const autoCamera = document.getElementById('autoCamera')?.checked || true;

    // 初回は必ずstandardに固定（ポリライン大量生成を抑止）
    const wireframe = QS_DISABLE_WIREFRAME_AT_CREATE ? false : (document.getElementById('wireframeOnly')?.checked || false);
    const options = {
      autoVoxelSize: true,
      autoVoxelSizeMode: 'basic',
      voxelSize: undefined,
      maxVoxelSize: 10,
      targetCells: 3000,
      // Safety cap for GH Pages demo to avoid excessive entities
      maxRenderVoxels: 8000,
      renderLimitStrategy: 'hybrid', // バランス重視の戦略
      colorMap: 'viridis',
      // QS安定化: 初回作成は不透明ボックスでOIT経路を回避
      opacity: 1.0,
      showEmptyVoxels: false,
      emptyOpacity: 0.0,
      // Do not use standard outlines when emulation-only
      showOutline: false,
      // EmulationはQSではオフ固定（安定化）
      outlineRenderMode: 'standard',
      emulationScope: 'off', // v0.1.12: outlineEmulation → emulationScope
      outlineInset: 0,
      outlineInsetMode: 'none',
      // QSでは適応制御を無効化（安定優先）
      adaptiveOutlines: false,
      outlineWidthPreset: 'medium',
      // Deprecated resolver系は使用しない（サンプル安定化）
      // Quick Start用設定（ライブラリの自動fitは使わず、後段でpostRender一回に集約）
      autoView: false,
      debugMode: false // Quick Startはデバッグ無効
    };
    
    // Clear existing heatmap and apply new options when reusing instance
    if (heatboxInstance) {
      heatboxInstance.clear();
      try { Object.assign(heatboxInstance.options, options); } catch (_) {}
    }
    
    // Initialize heatbox if needed
    if (!heatboxInstance) {
      const g = (typeof window !== 'undefined') ? window : globalThis;
      const HB = (g && typeof g.CesiumHeatbox === 'function') ? g.CesiumHeatbox
        : (g && g.CesiumHeatbox && typeof g.CesiumHeatbox.default === 'function') ? g.CesiumHeatbox.default
        : (g && g.CesiumHeatbox && typeof g.CesiumHeatbox.Heatbox === 'function') ? g.CesiumHeatbox.Heatbox
        : null;
      if (!HB) throw new Error('Heatbox constructor not found');
      heatboxInstance = new HB(viewer, options);
      // Update heatbox version info
      try {
        const version = (g && g.CesiumHeatbox && (g.CesiumHeatbox.VERSION || g.CesiumHeatbox.default?.VERSION || g.CesiumHeatbox.Heatbox?.VERSION)) || 'Loaded';
        const hv1 = document.getElementById('heatboxVersion');
        const hv2 = document.getElementById('navHeatboxVersion');
        if (hv1) hv1.textContent = String(version);
        if (hv2) hv2.textContent = String(version);
      } catch (_) {}
    }
    
    // Create heatmap from Cesium Entities
    if (typeof heatboxInstance.createFromEntities === 'function') {
      await heatboxInstance.createFromEntities(currentEntities);
    } else {
      heatboxInstance.setData(currentEntities);
      if (typeof heatboxInstance.update === 'function') {
        heatboxInstance.update();
      }
    }
    // デバッグ: 実効オプションとスナップショット
    try {
      if (typeof heatboxInstance.getEffectiveOptions === 'function') {
        console.warn('[QS] Effective options', heatboxInstance.getEffectiveOptions());
      }
      safeDebugSnapshot('after-create');
    } catch(_) {}
    // Do not post-adjust polylines in QS（安定性優先）
    
    // QS: 元のPointエンティティを一旦隠す（切り分け用）
    try {
      if (QS_HIDE_RAW_POINTS_AFTER_CREATE && viewer && viewer.entities && viewer.entities.values) {
        const vs = viewer.entities.values;
        for (let i = 0; i < vs.length; i++) {
          const e = vs[i];
          if (e && e.point && !e.box && !e.polyline) {
            e.show = false;
          }
        }
        console.warn('[QS] hid raw points for isolation');
      }
    } catch(_) {}
    
    // Update statistics with heatmap info
    updateStatisticsWithHeatmap(options);
    
    // 表示状態を初期化
    isHeatmapVisible = true;
    
    // Enable additional controls
    document.getElementById('clearHeatmap').disabled = false;
    const toggleButton = document.getElementById('toggleVisibility');
    if (toggleButton) {
      toggleButton.disabled = false;
      toggleButton.textContent = 'Hide'; // 初期状態は表示中なのでHide
    }
    
    updateStatus(`Heatmap created successfully with ${currentEntities.length} entities`, 'success');

    // 自動カメラ位置調整（postRenderで一回だけ実行して競合回避）
    try {
      if (autoCamera && viewer && viewer.scene && !_qsFitOnceHandler) {
        _qsAutoViewRequest = true;
        _qsFitViewOptions = { headingDegrees: 0, pitchDegrees: -35, paddingPercent: 0.1 };
        let fired = false;
        _qsFitOnceHandler = async () => {
          if (fired) return;
          fired = true;
          try { await qsZoomToHeatboxBounds(); } catch (e) { console.warn('[QS] auto zoom failed:', e); }
          try { viewer.scene.postRender.removeEventListener(_qsFitOnceHandler); } catch (_) {}
          _qsFitOnceHandler = null;
          _qsAutoViewRequest = false;
        };
        viewer.scene.postRender.addEventListener(_qsFitOnceHandler);
      }
    } catch (_) {}
    
    // 重要: ヒートマップ作成後の即座な画面更新を要求
    if (viewer && viewer.scene) {
      viewer.scene.requestRender();
    }
    
  } catch (error) {
    console.error('Error creating heatmap:', error);
    updateStatus('Error creating heatmap: ' + error.message, 'error');
  }
}

// QS: Heatboxの境界に基づき安定的にズームする
async function qsZoomToHeatboxBounds() {
  if (!viewer) return;
  try {
    if (heatboxInstance && typeof heatboxInstance.getBounds === 'function') {
      const bounds = heatboxInstance.getBounds();
      if (bounds) {
        // 境界矩形からバウンディングスフィアを生成し、オフセット指定で確実に可視化
        const rect = Cesium.Rectangle.fromDegrees(bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat);
        const bs = Cesium.BoundingSphere.fromRectangle3D(rect, Cesium.Ellipsoid.WGS84, Math.max(0, bounds.minAlt || 0));
        const heading = Cesium.Math.toRadians(_qsFitViewOptions?.headingDegrees ?? 0);
        const pitch = Cesium.Math.toRadians(_qsFitViewOptions?.pitchDegrees ?? -35);
        const range = Math.max(bs.radius * 2.2, 1500.0);
        await viewer.camera.flyToBoundingSphere(bs, {
          duration: 1.2,
          offset: new Cesium.HeadingPitchRange(heading, pitch, range)
        });
        return;        
      }
    }
    // フォールバック: viewer.entitiesへズーム
    if (viewer.entities) await viewer.zoomTo(viewer.entities);
  } catch (e) {
    console.warn('[QS] qsZoomToHeatboxBounds failed:', e);
  }
}

// Post-process polyline emulation (opacity/width) by density using rendered entities
function adjustEmulationByDensity() {
  try {
    if (!viewer || !viewer.entities || !viewer.entities.values) return;
    const values = viewer.entities.values;
    const countByKey = new Map();
    let minC = Infinity, maxC = -Infinity;
    for (let i = 0; i < values.length; i++) {
      const e = values[i];
      const p = e && e.properties;
      if (!p) continue;
      const type = p.type && (p.type.getValue ? p.type.getValue() : p.type);
      if (type === 'voxel') {
        const key = p.key && (p.key.getValue ? p.key.getValue() : p.key);
        const c = p.count && (p.count.getValue ? p.count.getValue() : p.count);
        if (key != null && Number.isFinite(c)) {
          countByKey.set(key, c);
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
        }
      }
    }
    if (countByKey.size === 0 || !Number.isFinite(minC) || !Number.isFinite(maxC) || maxC === minC) return;
    const minW = 1.5, maxW = 10;
    for (let i = 0; i < values.length; i++) {
      const e = values[i];
      const p = e && e.properties;
      if (!p || !e.polyline) continue;
      const type = p.type && (p.type.getValue ? p.type.getValue() : p.type);
      if (type !== 'voxel-edge-polyline') continue;
      const parentKey = p.parentKey && (p.parentKey.getValue ? p.parentKey.getValue() : p.parentKey);
      const c = countByKey.get(parentKey);
      if (!Number.isFinite(c)) continue;
      const nd = Math.max(0, Math.min(1, (c - minC) / (maxC - minC)));
      // width
      const w = minW + nd * (maxW - minW);
      if (typeof e.polyline.width === 'number') e.polyline.width = w;
      else if (e.polyline.width && typeof e.polyline.width.setValue === 'function') e.polyline.width.setValue(w);
      // opacity
      const op = Math.max(0.05, Math.min(1.0, 0.15 + nd * 0.85));
      const mat = e.polyline.material;
      if (mat && typeof mat.withAlpha === 'function') {
        e.polyline.material = mat.withAlpha(op);
      } else if (window.Cesium && Cesium.Color) {
        e.polyline.material = Cesium.Color.WHITE.withAlpha(op);
      }
    }
    try { viewer.scene.requestRender && viewer.scene.requestRender(); } catch (_) {}
  } catch (_) {}
}

// Clear heatmap
function clearHeatmap() {
  try {
    if (heatboxInstance) {
      heatboxInstance.clear();
      // Fully reset instance so next create uses fresh options
      heatboxInstance = null;
      isHeatmapVisible = true; // 表示状態もリセット
      updateStatus('Heatmap cleared', 'success');
      
      // Update statistics - より完全なリセット
      document.getElementById('voxelCount').textContent = '0';
      document.getElementById('emptyVoxelCount').textContent = '0';
      document.getElementById('autoSizeInfo').style.display = 'none';
      document.getElementById('v019Stats').style.display = 'none';
      
      // Disable controls and reset button text
      document.getElementById('clearHeatmap').disabled = true;
      const toggleButton = document.getElementById('toggleVisibility');
      if (toggleButton) {
        toggleButton.disabled = true;
        toggleButton.textContent = 'Toggle Visibility'; // デフォルトに戻す
      }
      
      // 重要: 画面の即座な更新を要求
      if (viewer && viewer.scene) {
        viewer.scene.requestRender();
      }
    }
  } catch (error) {
    console.error('Error clearing heatmap:', error);
    updateStatus('Error clearing heatmap: ' + error.message, 'error');
  }
}

// Toggle heatmap visibility
function toggleVisibility() {
  try {
    if (heatboxInstance) {
      // ADR-0009 Phase 5: 新しいAPI使用 - setVisible()で状態を手動管理
      isHeatmapVisible = !isHeatmapVisible;
      
      if (typeof heatboxInstance.setVisible === 'function') {
        heatboxInstance.setVisible(isHeatmapVisible);
      } else {
        // フォールバック: visible プロパティを直接設定
        heatboxInstance.visible = isHeatmapVisible;
      }
      
      const statusText = isHeatmapVisible ? 'Heatmap shown' : 'Heatmap hidden';
      updateStatus(statusText, 'success');
      
      // ボタンのテキストを状態に応じて更新
      const toggleButton = document.getElementById('toggleVisibility');
      if (toggleButton) {
        toggleButton.textContent = isHeatmapVisible ? 'Hide' : 'Show';
      }
      
      // 重要: 表示切替後の即座な画面更新を要求
      if (viewer && viewer.scene) {
        viewer.scene.requestRender();
      }
    }
  } catch (error) {
    console.error('Error toggling visibility:', error);
    updateStatus('Error toggling visibility: ' + error.message, 'error');
  }
}

// Update statistics display
function updateStatistics() {
  if (!currentEntities) return;
  
  const values = currentEntities.map(e => e.properties.value || 0);
  const count = values.length;
  const maxValue = count > 0 ? Math.max(...values) : 0;
  const minValue = count > 0 ? Math.min(...values) : 0;
  
  document.getElementById('dataCount').textContent = count.toLocaleString();
  document.getElementById('maxValue').textContent = maxValue.toFixed(2);
  document.getElementById('minValue').textContent = minValue.toFixed(2);
}

// Update statistics with heatmap information  
function updateStatisticsWithHeatmap(options) {
  try {
    // ADR-0009 Phase 5: 新しい統計API利用
    if (heatboxInstance && typeof heatboxInstance.getStats === 'function') {
      const stats = heatboxInstance.getStats();
      if (stats) {
        document.getElementById('voxelCount').textContent = stats.totalVoxels?.toLocaleString() || '0';
        if (stats.emptyVoxels !== undefined) {
          document.getElementById('emptyVoxelCount').textContent = stats.emptyVoxels.toLocaleString();
        }
        
        // VoxelSelector統計 (v0.1.11-alpha対応)
        if (stats.selectionStats && document.getElementById('v019Stats')) {
          document.getElementById('selectionStrategy').textContent = stats.selectionStats.strategy || '-';
          document.getElementById('renderedVoxels').textContent = stats.selectionStats.selectedCount?.toLocaleString() || '0';
          document.getElementById('coverageRatio').textContent = (stats.selectionStats.coverageRatio * 100).toFixed(1) || '0';
          document.getElementById('v019Stats').style.display = 'block';
        }
        
        // 自動サイズ情報表示
        if (stats.autoSizeInfo && document.getElementById('autoSizeInfo')) {
          document.getElementById('autoAdjusted').textContent = stats.autoSizeInfo.adjusted ? 'Yes' : 'No';
          document.getElementById('sizeInfo').textContent = `${stats.autoSizeInfo.voxelSize}m`;
          document.getElementById('autoSizeInfo').style.display = 'block';
        }
        return; // 新API使用時は以下の推定処理をスキップ
      }
    }
    
    // Fallback: Estimate voxel count (legacy approximation)
    const autoVoxelSize = options.autoVoxelSize;
    let estimatedVoxels = 0;
    let finalSize = 'N/A';
    
    if (autoVoxelSize) {
      // Show auto size information
      document.getElementById('autoSizeInfo').style.display = 'block';
      document.getElementById('autoAdjusted').textContent = options.autoVoxelSizeMode || 'basic';
      
      // Estimate based on data density
      const dataCount = currentEntities.length;
      if (options.autoVoxelSizeMode === 'occupancy') {
        estimatedVoxels = Math.min(dataCount * 2, 10000);
        finalSize = 'Optimized for density';
      } else {
        estimatedVoxels = Math.min(dataCount, 5000);
        finalSize = 'Balanced performance';
      }
      
      document.getElementById('sizeInfo').textContent = finalSize;
    } else {
      document.getElementById('autoSizeInfo').style.display = 'none';
    // Manual size calculation
    const gridSize = Math.max(1, Math.min(100, options.gridSize || 20)); // Safe bounds
    estimatedVoxels = Math.pow(gridSize, 3);
    }
    
    document.getElementById('voxelCount').textContent = estimatedVoxels.toLocaleString();
    
  } catch (error) {
    console.error('Error updating heatmap statistics:', error);
  }
}

// Get color scheme array based on name
function getColorSchemeArray(schemeName) {
  const schemes = {
    viridis: [
      '#440154', '#482777', '#3f4a8a', '#31678e', '#26838f',
      '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825', '#f0f921'
    ],
    heat: [
      '#000080', '#0000ff', '#0080ff', '#00ffff', '#80ff80',
      '#ffff00', '#ff8000', '#ff0000', '#ff0080', '#ff00ff'
    ],
    cool: [
      '#00ffff', '#10f0ff', '#20e0ff', '#30d0ff', '#40c0ff',
      '#50b0ff', '#60a0ff', '#7090ff', '#8080ff', '#9070ff'
    ],
    inferno: [
      '#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60',
      '#cf4446', '#ed6925', '#fb9b06', '#f7d03c', '#fcffa4'
    ]
  };
  
  return schemes[schemeName] || schemes.viridis;
}

// Update status display
function updateStatus(message, type = 'info') {
  const statusElement = document.getElementById('dataStatus');
  const heatmapStatusElement = document.getElementById('heatmapStatus');
  
  // Update appropriate status element
  if (message.includes('heatmap') || message.includes('Heatmap')) {
    if (heatmapStatusElement) {
      heatmapStatusElement.textContent = message;
      heatmapStatusElement.style.color = getStatusColor(type);
    }
  } else {
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.style.color = getStatusColor(type);
    }
  }
  
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// Get status color based on type
function getStatusColor(type) {
  switch (type) {
    case 'success': return '#64b5f6';
    case 'error': return '#ef5350';
    case 'warning': return '#ffa726';
    case 'loading': return '#90caf9';
    default: return '#b0bec5';
  }
}
