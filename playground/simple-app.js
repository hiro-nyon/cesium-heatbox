// Cesium Heatbox - Simple App (Quick Start)
// Global variables
let viewer = null;
let heatboxInstance = null;
let currentEntities = [];
let currentData = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeCesium();
  setupEventListeners();
  // Quick Start mobile: toggle #toolbar (Playground bottom-sheet styles)
  setupQuickStartMobileMenu();
  initializeEnvironmentInfo();
  // setupAutoVoxelSizeToggle(); // QS enforces auto voxel size
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
    Object.assign(heatboxInstance.options, {
      showOutline: wireframe ? true : false,
      opacity: wireframe ? 0.0 : 1.0,
      boxOpacityResolver: !wireframe ? (ctx => {
        const d = Math.max(0, Math.min(1, Number(ctx?.normalizedDensity) || 0));
        const nd = Math.pow(d, 0.5);
        return 0.05 + nd * 0.95; // 0.05–1.0
      }) : (() => 0),
      outlineEmulation: wireframe ? 'all' : 'off',
      outlineInset: wireframe ? 2.0 : 0,
      outlineInsetMode: 'all',
      // Wireframe: solid outline (no density-based opacity), thicker width
      ...(wireframe ? { outlineOpacity: 1.0, outlineOpacityResolver: undefined, outlineWidth: 10, outlineWidthResolver: undefined } : {})
    });
    if (typeof heatboxInstance.createFromEntities === 'function') {
      heatboxInstance.createFromEntities(currentEntities);
    } else {
      heatboxInstance.setData(currentEntities);
      if (typeof heatboxInstance.update === 'function') heatboxInstance.update();
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
    const cesiumEl = document.getElementById('cesiumVersion');
    if (cesiumEl) cesiumEl.textContent = cesiumVersion;
    
    // WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const webglSupport = gl ? 'Supported' : 'Not Supported';
    const webglEl = document.getElementById('webglSupport');
    if (webglEl) webglEl.textContent = webglSupport;
    
    // Heatbox version - will be set when heatbox is initialized
    const heatboxEl = document.getElementById('heatboxVersion');
    if (heatboxEl) heatboxEl.textContent = 'Loading...';
    
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
    
    // Add entities to viewer and keep actual Cesium Entity references
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
    
    // Auto-adjust camera if enabled
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

    // Quick Start: fixed auto settings
    const autoCamera = document.getElementById('autoCamera').checked;

    const wireframe = document.getElementById('wireframeOnly')?.checked || false;
    const options = {
      autoVoxelSize: true,
      autoVoxelSizeMode: 'basic',
      voxelSize: undefined,
      maxVoxelSize: 10,
      targetCells: 3000,
      // Avoid auto render budget to prevent oversized geometry
      maxRenderVoxels: 8000,
      renderLimitStrategy: 'density',
      colorMap: 'viridis',
      // Global opacity lets resolver drive contrast more clearly
      opacity: wireframe ? 0.0 : 1.0,
      showEmptyVoxels: false,
      emptyOpacity: 0.0,
      showOutline: wireframe ? true : false,
      // Default: density-driven fill shading
      boxOpacityResolver: !wireframe ? (ctx => {
        const d = Math.max(0, Math.min(1, Number(ctx?.normalizedDensity) || 0));
        const nd = Math.pow(d, 0.5); // stronger gamma for contrast
        return 0.05 + nd * 0.95; // 0.05–1.0 by density (stronger)
      }) : (() => 0),
      // Wireframe emulation (outlines only)
      outlineEmulation: wireframe ? 'all' : 'off',
      outlineInset: wireframe ? 2.0 : 0,
      outlineInsetMode: 'all',
      outlineOpacityResolver: wireframe ? (ctx => {
        const d = Math.max(0, Math.min(1, Number(ctx?.normalizedDensity) || 0));
        const nd = Math.pow(d, 0.5);
        return 0.05 + nd * 0.95; // match box density mapping (0.05–1.0)
      }) : undefined,
      outlineWidthResolver: wireframe ? (ctx => {
        const d = Math.max(0, Math.min(1, Number(ctx?.normalizedDensity) || 0));
        const nd = Math.pow(d, 0.5);
        return 6 + Math.round(nd * 6); // 6–12 px (thicker)
      }) : undefined,
      autoView: autoCamera
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
      const hv = document.getElementById('heatboxVersion');
      if (hv) hv.textContent = 'Loaded';
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
    
    // Update statistics with heatmap info
    updateStatisticsWithHeatmap(options);
    
    // Enable additional controls
    document.getElementById('clearHeatmap').disabled = false;
    document.getElementById('toggleVisibility').disabled = false;
    
    updateStatus(`Heatmap created successfully with ${currentEntities.length} entities`, 'success');
    
  } catch (error) {
    console.error('Error creating heatmap:', error);
    updateStatus('Error creating heatmap: ' + error.message, 'error');
  }
}

// Clear heatmap
function clearHeatmap() {
  try {
    if (heatboxInstance) {
      heatboxInstance.clear();
      // Fully reset instance so next create uses fresh options
      heatboxInstance = null;
      updateStatus('Heatmap cleared', 'success');
      
      // Update statistics
      document.getElementById('voxelCount').textContent = '0';
      document.getElementById('autoSizeInfo').style.display = 'none';
      
      // Disable controls
      document.getElementById('clearHeatmap').disabled = true;
      document.getElementById('toggleVisibility').disabled = true;
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
      heatboxInstance.toggleVisibility();
      updateStatus('Heatmap visibility toggled', 'success');
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
    // Estimate voxel count (this is an approximation)
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
      const gridSize = options.gridSize || 20;
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
