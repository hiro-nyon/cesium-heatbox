// Cesium Heatbox - Simple App (Quick Start)
// Global variables
let viewer = null;
let heatboxInstance = null;
let currentEntities = [];
let currentData = null;
let isHeatmapVisible = true; // 表示状態を追跡
let arePointsVisible = true;
// QS: 自動カメラ調整のタイミング制御（postRender一回）
let _qsFitOnceHandler = null;
let _qsFitViewOptions = null;
let _quickStartRunInProgress = false;

function setTextContent(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
  return el;
}

function showElement(id, display = 'block') {
  const el = document.getElementById(id);
  if (el && el.style) {
    el.style.display = display;
  }
  return el;
}

function hideElement(id) {
  const el = document.getElementById(id);
  if (el && el.style) {
    el.style.display = 'none';
  }
  return el;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeCesium();
  setupEventListeners();
  // Quick Start mobile: toggle #toolbar (Playground bottom-sheet styles)
  setupQuickStartMobileMenu();
  initializeEnvironmentInfo();
  // setupAutoVoxelSizeToggle(); // QS enforces auto voxel size
  const manualMode = new URLSearchParams(window.location.search).get('manual') === '1';
  if (!manualMode) window.setTimeout(() => runSampleDemo(), 300);
});

// Initialize Cesium viewer
function initializeCesium() {
  try {
    const cartoStyle = 'light_all';
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
        url: `https://{s}.basemaps.cartocdn.com/${cartoStyle}/{z}/{x}/{y}.png`,
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
          url: `https://{s}.basemaps.cartocdn.com/${cartoStyle}/{z}/{x}/{y}.png`,
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
    
  } catch (error) {
    console.error('Failed to initialize Cesium:', error);
    updateStatus('Failed to initialize Cesium: ' + error.message, 'error');
  }
}

// Setup event listeners for all controls
function setupEventListeners() {
  // File input
  document.getElementById('fileInput').addEventListener('change', handleFileInput);
  
  // Sample data buttons
  document.getElementById('loadSampleData')?.addEventListener('click', loadSampleData);
  document.getElementById('generateTestData')?.addEventListener('click', generateTestData);
  document.getElementById('runSampleDemo')?.addEventListener('click', runSampleDemo);
  
  // Base map selector
  const baseMapSelect = document.getElementById('baseMap');
  if (baseMapSelect) {
    baseMapSelect.addEventListener('change', switchBaseMap);
  }
  
  // Heatmap controls
  document.getElementById('createHeatmap')?.addEventListener('click', createHeatmap);
  document.getElementById('clearHeatmap').addEventListener('click', clearHeatmap);
  document.getElementById('togglePoints')?.addEventListener('click', togglePointsVisibility);
  document.getElementById('toggleVoxels')?.addEventListener('click', toggleVoxelsVisibility);

  const wireframeInput = document.getElementById('wireframeOnly');
  const solidButton = document.getElementById('viewStyleSolid');
  const wireframeButton = document.getElementById('viewStyleWireframe');
  const setViewStyle = async (wireframe) => {
    if (wireframeInput) wireframeInput.checked = wireframe;
    solidButton?.classList.toggle('is-selected', !wireframe);
    wireframeButton?.classList.toggle('is-selected', wireframe);
    solidButton?.setAttribute('aria-pressed', String(!wireframe));
    wireframeButton?.setAttribute('aria-pressed', String(wireframe));
    if (currentEntities.length > 0) await createHeatmap();
  };
  solidButton?.addEventListener('click', () => setViewStyle(false));
  wireframeButton?.addEventListener('click', () => setViewStyle(true));
  
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

async function runSampleDemo() {
  if (_quickStartRunInProgress) return;
  _quickStartRunInProgress = true;
  const button = document.getElementById('runSampleDemo');
  if (button) button.disabled = true;
  try {
    await loadSampleData();
    await createHeatmap();
  } finally {
    if (button) button.disabled = false;
    _quickStartRunInProgress = false;
  }
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
    const cesiumVerEl = document.getElementById('cesiumVersion');
    if (cesiumVerEl) cesiumVerEl.textContent = cesiumVersion;
    
    // WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const webglSupport = gl ? 'Supported' : 'Not Supported';
    const webglEl = document.getElementById('webglSupport');
    if (webglEl) webglEl.textContent = webglSupport;
    
    // Heatbox version - will be set when heatbox is initialized
    const hbVerEl = document.getElementById('heatboxVersion');
    if (hbVerEl) hbVerEl.textContent = 'Loading...';
    
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
  reader.onload = async function(e) {
    try {
      const data = JSON.parse(e.target.result);
      await processLoadedData(data, file.name);
      await createHeatmap();
    } catch (error) {
      console.error('Error parsing file:', error);
      updateStatus('Error parsing file: Invalid JSON format', 'error');
    }
  };
  reader.readAsText(file);
}

// Load sample data (align with Playground)
async function loadSampleData() {
  updateStatus('Loading sample data...', 'loading');
  try {
    // Z範囲を拡張しつつ体積密度を維持する（Playground と整合）
    const heroCapture = document.documentElement.classList.contains('hero-capture');
    const baseCount = heroCapture ? 450 : 800;
    const oldZMax = 200;
    const newZMax = 400; // より立体的に（400m）
    const zScale = newZMax / oldZMax;
    const count = Math.round(baseCount * zScale);
    const data = generateTokyoClusterGeoJSON(
      count,
      heroCapture ? 0.018 : 0.02,
      0,
      newZMax,
      heroCapture ? 1 : 3,
      createSeededRandom(1373)
    );
    await processLoadedData(data, 'Playground-style Sample Data');
  } catch (error) {
    console.error('Error generating sample data:', error);
    updateStatus('Error loading sample data: ' + error.message, 'error');
  }
}

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function seededRandom() {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate test data (align with Playground)
async function generateTestData() {
  updateStatus('Generating test data...', 'loading');
  try {
    const testData = generateTokyoBoundsGeoJSON(300);
    await processLoadedData(testData, 'Playground-style Test Data');
  } catch (error) {
    console.error('Error generating test data:', error);
    updateStatus('Error generating test data: ' + error.message, 'error');
  }
}

// Generate Tokyo cluster GeoJSON (like Playground sample)
function generateTokyoClusterGeoJSON(count = 800, radius = 0.02, minAlt = 0, maxAlt = 200, centerCount, random = Math.random) {
  const features = [];
  const centerLon = 139.6917;
  const centerLat = 35.6895;

  // クラスター数（デフォルト: 2〜5のランダム）
  if (typeof centerCount !== 'number' || centerCount < 1) {
    const minCenters = 1;
    const maxCenters = 5;
    centerCount = Math.floor(random() * (maxCenters - minCenters + 1)) + minCenters;
  }

  // クラスター中心を東京中心周辺にばらまく
  // 全体を少し寄せる（中心分布の広がりを縮小）
  const lonSpan = 0.042;
  const latSpan = 0.034;
  const centers = Array.from({ length: centerCount }, () => ({
    lon: centerLon + (random() - 0.5) * lonSpan,
    lat: centerLat + (random() - 0.5) * latSpan,
  }));

  // クラスター半径は 1/sqrt(N) で縮小（少しゆらぎ）し、全体の面積感を維持
  // クラスター半径もわずかに縮小
  const clusterRadii = centers.map(() => radius / Math.sqrt(centerCount) * (0.80 + random() * 0.25));

  // 点数を各クラスターに割当（均等＋余りランダム）
  const counts = new Array(centerCount).fill(Math.floor(count / centerCount));
  let rem = count - counts.reduce((a, b) => a + b, 0);
  while (rem-- > 0) counts[Math.floor(random() * centerCount)]++;

  let idx = 0;
  centers.forEach((c, ci) => {
    const cr = clusterRadii[ci];
    for (let k = 0; k < counts[ci]; k++) {
      const angle = random() * Math.PI * 2;
      const dist = random() * cr;
      const lon = c.lon + Math.cos(angle) * dist;
      const lat = c.lat + Math.sin(angle) * dist;
      const alt = minAlt + random() * (maxAlt - minAlt);
      const value = random() * 100;
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat, alt] },
        properties: {
          value: Math.round(value * 100) / 100,
          name: `Sample ${++idx}`,
          clusterId: ci + 1
        }
      });
    }
  });

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
async function processLoadedData(data, fileName) {
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
    
    // Add entities to viewer and keep actual Cesium Entity references
    const addedEntities = [];
    currentEntities.forEach(entity => {
      const added = viewer.entities.add(entity);
      if (added) addedEntities.push(added);
    });
    currentEntities = addedEntities;
    arePointsVisible = true;
    updateLayerButton('togglePoints', true);
    
    // Update statistics
    updateStatistics();
    
    // Enable controls
    const createButton = document.getElementById('createHeatmap');
    if (createButton) createButton.disabled = false;
    
    // Quick Start always keeps auto-fit enabled.
    await viewer.zoomTo(viewer.entities);
    
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
    const heroCapture = document.documentElement.classList.contains('hero-capture');
    
    const entity = {
      position: position,
      properties: {
        value: parseFloat(value),
        originalProperties: props
      },
      point: {
        pixelSize: heroCapture ? 4 : 5,
        color: Cesium.Color.fromCssColorString('#263238').withAlpha(heroCapture ? 0.5 : 0.58),
        outlineWidth: 0,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
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
      const heroCapture = document.documentElement.classList.contains('hero-capture');
      
      const entity = {
        position: position,
        properties: {
          value: parseFloat(value),
          originalProperties: packet.properties || {}
        },
        point: {
          pixelSize: heroCapture ? 4 : 5,
          color: Cesium.Color.fromCssColorString('#263238').withAlpha(heroCapture ? 0.5 : 0.58),
          outlineWidth: 0,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
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
    const autoCamera = true;

    const wireframe = document.getElementById('wireframeOnly')?.checked || false;
    const heroCapture = document.documentElement.classList.contains('hero-capture');
    const classification = {
      enabled: true,
      scheme: 'jenks',
      classes: 5,
      colorMap: (window.HeatboxLatestPlayground?.PALETTES.viridis || [
        '#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'
      ]).slice(),
      classificationTargets: { color: true, opacity: true, width: false }
    };
    const options = {
      autoVoxelSize: true,
      autoVoxelSizeMode: 'basic',
      voxelSize: undefined,
      maxVoxelSize: 10,
      targetCells: heroCapture ? 350 : 3000,
      maxRenderVoxels: 'auto', 
      renderLimitStrategy: 'hybrid', // バランス重視の戦略
      classification,
      classificationTargets: classification && classification.classificationTargets,
      // TopN強調表示 (Quick Start) は未指定（0を入れず警告を避ける）
      // Hide box fill in emulation-only (wireframe toggle)
      // 非ワイヤーフレーム時も base opacity は指定せず（Resolverが設定）
      opacity: wireframe ? 0.0 : 0.8,
      wireframeOnly: wireframe,
      showEmptyVoxels: false,
      emptyOpacity: 0.0,
      // Do not use standard outlines when emulation-only
      showOutline: wireframe ? false : false,
      outlineRenderMode: wireframe ? 'emulation-only' : 'standard',
      emulationScope: wireframe ? 'all' : 'off',
      outlineInset: 0,
      outlineInsetMode: 'none',
      adaptiveOutlines: true,
      outlineWidthPreset: 'adaptive',
      adaptiveParams: {
        boxOpacityRange: wireframe ? [0, 0] : (heroCapture ? [0.04, 0.92] : [0.08, 0.92]),
        outlineOpacityRange: wireframe ? (heroCapture ? [0.12, 0.82] : [0.15, 1]) : null,
        outlineWidthRange: wireframe ? (heroCapture ? [1, 4] : [1.5, 8]) : [1, 5],
        adaptiveOpacityEnabled: true
      },
      // Quick Start用設定（ライブラリfitViewは使わず、後段でpostRender一回に集約）
      autoView: false,
      debugMode: false // Quick Startはデバッグ無効
    };
    
    // Recreate the instance so classification and renderer state are normalized together.
    if (heatboxInstance) {
      if (typeof heatboxInstance.destroy === 'function') heatboxInstance.destroy();
      else heatboxInstance.clear();
      heatboxInstance = null;
      document.getElementById('quickLegend')?.replaceChildren();
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
      const hv = document.getElementById('heatboxVersion');
      if (hv) hv.textContent = window.HeatboxLatestPlayground?.VERSION || '1.3.7-alpha.3';
      try {
        const eff = typeof heatboxInstance.getEffectiveOptions === 'function' ? heatboxInstance.getEffectiveOptions() : null;
        console.log('[Heatbox] Effective adaptive params after init:', eff?.adaptiveParams, 'opacity:', eff?.opacity);
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
    if (window.HeatboxLatestPlayground) {
      window.HeatboxLatestPlayground.renderLegend(
        heatboxInstance,
        document.getElementById('quickLegend'),
        Boolean(classification)
      );
    }
    try {
      const eff2 = typeof heatboxInstance.getEffectiveOptions === 'function' ? heatboxInstance.getEffectiveOptions() : null;
      console.log('[Heatbox] Effective adaptive params after data:', eff2?.adaptiveParams, 'opacity:', eff2?.opacity);
    } catch (_) {}
    // Post-adjust emulation polylines by density when wireframe is enabled
    if (wireframe) {
      try { adjustEmulationByDensity(); } catch (_) {}
    }
    currentEntities.forEach((entity) => { entity.show = arePointsVisible; });
    
    // Update statistics with heatmap info
    updateStatisticsWithHeatmap(options);
    
    // 表示状態を初期化
    // Enable additional controls
    document.getElementById('clearHeatmap').disabled = false;
    const voxelButton = document.getElementById('toggleVoxels');
    if (voxelButton) voxelButton.disabled = false;
    updateLayerButton('toggleVoxels', isHeatmapVisible);
    if (!isHeatmapVisible) setHeatmapVisibility(false);
    
    updateStatus(`Heatmap created successfully with ${currentEntities.length} entities`, 'success');

    // 自動カメラ位置調整（postRenderで一回だけ実行して競合回避）
    try {
      if (autoCamera && viewer && viewer.scene && !_qsFitOnceHandler) {
        _qsFitViewOptions = heroCapture
          ? { headingDegrees: -12, pitchDegrees: -30, rangeMultiplier: 1.45 }
          : { headingDegrees: 0, pitchDegrees: -35, rangeMultiplier: 2.2 };
        let fired = false;
        _qsFitOnceHandler = async () => {
          if (fired) return;
          fired = true;
          try { await qsZoomToHeatboxBounds(); } catch (e) { console.warn('[QS] auto zoom failed:', e); }
          try { viewer.scene.postRender.removeEventListener(_qsFitOnceHandler); } catch (_) {}
          _qsFitOnceHandler = null;
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
        const rect = Cesium.Rectangle.fromDegrees(bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat);
        const bs = Cesium.BoundingSphere.fromRectangle3D(rect, Cesium.Ellipsoid.WGS84, Math.max(0, bounds.minAlt || 0));
        const heading = Cesium.Math.toRadians(_qsFitViewOptions?.headingDegrees ?? 0);
        const pitch = Cesium.Math.toRadians(_qsFitViewOptions?.pitchDegrees ?? -35);
        const range = Math.max(bs.radius * (_qsFitViewOptions?.rangeMultiplier ?? 2.2), 1000.0);
        await viewer.camera.flyToBoundingSphere(bs, { duration: 1.2, offset: new Cesium.HeadingPitchRange(heading, pitch, range) });
        return;
      }
    }
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
    const now = Cesium.JulianDate.now();
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
      // opacity (preserve base color if available; fallback to black)
      const op = Math.max(0.05, Math.min(1.0, 0.15 + nd * 0.85));
      let baseColor = null;
      try {
        const mat = e.polyline.material;
        if (mat) {
          if (typeof mat.withAlpha === 'function') {
            // Already a Cesium.Color
            baseColor = mat;
          } else if (typeof mat.getValue === 'function') {
            const val = mat.getValue(now);
            // ColorMaterialProperty#getValue may return a Color or an object with .color
            if (val && typeof val.withAlpha === 'function') {
              baseColor = val;
            } else if (val && val.color && typeof val.color.withAlpha === 'function') {
              baseColor = val.color;
            }
          }
        }
      } catch (_) { /* noop */ }
      if (!baseColor && window.Cesium && Cesium.Color) baseColor = Cesium.Color.BLACK;
      if (baseColor) e.polyline.material = baseColor.withAlpha(op);
    }
    try { viewer.scene.requestRender && viewer.scene.requestRender(); } catch (_) {}
  } catch (_) {}
}

// Clear heatmap
function clearHeatmap() {
  try {
    if (heatboxInstance) {
      if (typeof heatboxInstance.destroy === 'function') heatboxInstance.destroy();
      else heatboxInstance.clear();
      heatboxInstance = null;
      isHeatmapVisible = true; // 表示状態もリセット
      updateStatus('Heatmap cleared', 'success');
      
      // Update statistics - より完全なリセット
      setTextContent('voxelCount', '0');
      setTextContent('emptyVoxelCount', '0');
      hideElement('autoSizeInfo');
      hideElement('v019Stats');
      document.getElementById('quickLegend')?.replaceChildren();
      currentEntities.forEach((entity) => { entity.show = true; });
      arePointsVisible = true;
      updateLayerButton('togglePoints', true);
      
      // Disable controls and reset button text
      const clearBtn = document.getElementById('clearHeatmap');
      if (clearBtn) clearBtn.disabled = true;
      const voxelButton = document.getElementById('toggleVoxels');
      if (voxelButton) voxelButton.disabled = true;
      updateLayerButton('toggleVoxels', true);
      
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

function updateLayerButton(id, visible) {
  const button = document.getElementById(id);
  if (!button) return;
  button.classList.toggle('is-selected', visible);
  button.setAttribute('aria-pressed', String(visible));
}

function togglePointsVisibility() {
  arePointsVisible = !arePointsVisible;
  currentEntities.forEach((entity) => { entity.show = arePointsVisible; });
  updateLayerButton('togglePoints', arePointsVisible);
  viewer?.scene?.requestRender();
}

function setHeatmapVisibility(visible) {
  isHeatmapVisible = visible;
  if (!heatboxInstance) return;
  if (typeof heatboxInstance.setVisible === 'function') heatboxInstance.setVisible(visible);
  else heatboxInstance.visible = visible;
  updateLayerButton('toggleVoxels', visible);
  viewer?.scene?.requestRender();
}

// Toggle voxel visibility
function toggleVoxelsVisibility() {
  try {
    if (heatboxInstance) {
      setHeatmapVisibility(!isHeatmapVisible);
    }
  } catch (error) {
    console.error('Error toggling voxel visibility:', error);
    updateStatus('Error toggling voxel visibility: ' + error.message, 'error');
  }
}

// Update statistics display
function updateStatistics() {
  if (!currentEntities) return;

  const time = viewer?.clock?.currentTime || Cesium.JulianDate.now();
  const values = currentEntities.map((entity) => {
    const properties = entity?.properties;
    if (!properties) return 0;
    if (typeof properties.getValue === 'function') {
      const resolved = properties.getValue(time) || {};
      return Number(resolved.value ?? resolved.weight ?? resolved.intensity ?? 0) || 0;
    }
    const candidate = properties.value ?? properties.weight ?? properties.intensity ?? 0;
    const resolved = candidate && typeof candidate.getValue === 'function' ? candidate.getValue(time) : candidate;
    return Number(resolved) || 0;
  });
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
    if (heatboxInstance && typeof heatboxInstance.getStatistics === 'function') {
      const stats = heatboxInstance.getStatistics();
      if (stats) {
        setTextContent('voxelCount', stats.totalVoxels?.toLocaleString() || '0');
        if (stats.emptyVoxels !== undefined) {
          setTextContent('emptyVoxelCount', stats.emptyVoxels.toLocaleString());
        }
        
        // VoxelSelector統計 (v0.1.11-alpha対応)
        if (stats.selectionStats && showElement('v019Stats')) {
          setTextContent('selectionStrategy', stats.selectionStats.strategy || '-');
          setTextContent('renderedVoxels', stats.selectionStats.selectedCount?.toLocaleString() || '0');
          const coverage = stats.selectionStats.coverageRatio;
          if (typeof coverage === 'number' && isFinite(coverage)) {
            setTextContent('coverageRatio', (coverage * 100).toFixed(1));
          }
        }
        
        // 自動サイズ情報表示
        if (stats.autoSizeInfo && showElement('autoSizeInfo')) {
          setTextContent('autoAdjusted', stats.autoSizeInfo.adjusted ? 'Yes' : 'No');
          if (stats.autoSizeInfo.voxelSize !== undefined) {
            setTextContent('sizeInfo', `${stats.autoSizeInfo.voxelSize}m`);
          }
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
      showElement('autoSizeInfo');
      setTextContent('autoAdjusted', options.autoVoxelSizeMode || 'basic');
      
      // Estimate based on data density
      const dataCount = currentEntities.length;
      if (options.autoVoxelSizeMode === 'occupancy') {
        estimatedVoxels = Math.min(dataCount * 2, 10000);
        finalSize = 'Optimized for density';
      } else {
        estimatedVoxels = Math.min(dataCount, 5000);
        finalSize = 'Balanced performance';
      }
      
      setTextContent('sizeInfo', finalSize);
    } else {
      hideElement('autoSizeInfo');
      // Manual size calculation
      const gridSize = options.gridSize || 20;
      estimatedVoxels = Math.pow(gridSize, 3);
    }
    
    setTextContent('voxelCount', estimatedVoxels.toLocaleString());
    
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
