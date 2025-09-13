// Cesium Heatbox - Simple App (Quick Start) - Playground-based rewrite
// Global variables
let viewer = null;
let heatboxInstance = null;
let currentEntities = [];
let currentData = null;
let isHeatmapVisible = true;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  console.log('=== Quick Start 初期化開始 ===');
  console.log('Cesium available:', typeof Cesium !== 'undefined');
  console.log('CesiumHeatbox available:', typeof CesiumHeatbox !== 'undefined');
  
  initializeCesium();
  setupEventListeners();
  setupQuickStartMobileMenu();
  updateEnvironmentInfo();
  
  console.log('=== Quick Start 初期化完了 ===');
});

/**
 * Heatboxコンストラクタを堅牢に取得（Playgroundと同じ実装）
 */
function getHeatboxCtor() {
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
    console.log('Cesium viewer initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize Cesium:', error);
    updateStatus('Failed to initialize Cesium: ' + error.message, 'error');
  }
}

// Setup event listeners for all controls
function setupEventListeners() {
  // File input
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileInput);
  }
  
  // Sample data buttons
  const loadSampleBtn = document.getElementById('loadSampleData');
  const generateTestBtn = document.getElementById('generateTestData');
  if (loadSampleBtn) loadSampleBtn.addEventListener('click', loadSampleData);
  if (generateTestBtn) generateTestBtn.addEventListener('click', generateTestData);
  
  // Heatmap controls
  const createBtn = document.getElementById('createHeatmap');
  const clearBtn = document.getElementById('clearHeatmap');
  const toggleBtn = document.getElementById('toggleVisibility');
  if (createBtn) createBtn.addEventListener('click', createHeatmap);
  if (clearBtn) clearBtn.addEventListener('click', clearHeatmap);
  if (toggleBtn) toggleBtn.addEventListener('click', toggleHeatmapVisibility);
  
  // Visualization controls
  const wireframeCheck = document.getElementById('wireframeMode');
  const autoCameraCheck = document.getElementById('autoCamera');
  if (wireframeCheck) wireframeCheck.addEventListener('change', reRenderHeatmap);
  if (autoCameraCheck) autoCameraCheck.addEventListener('change', reRenderHeatmap);
}

// Mobile menu setup
function setupQuickStartMobileMenu() {
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const toolbar = document.getElementById('toolbar');
  const cesiumContainer = document.getElementById('cesiumContainer');
  
  if (!mobileToggle || !toolbar) {
    console.log('Mobile UI elements not found, skipping mobile setup');
    return;
  }

  let isMenuOpen = false;
  
  const toggleMenu = () => {
    isMenuOpen = !isMenuOpen;
    
    if (isMenuOpen) {
      toolbar.classList.add('open');
      mobileToggle.innerHTML = '✕';
      mobileToggle.setAttribute('aria-label', 'Close navigation');
      mobileToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    } else {
      toolbar.classList.remove('open');
      mobileToggle.innerHTML = '☰';
      mobileToggle.setAttribute('aria-label', 'Open navigation');
      mobileToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  };

  mobileToggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });

  if (cesiumContainer) {
    cesiumContainer.addEventListener('click', () => {
      if (isMenuOpen) toggleMenu();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen) {
      toggleMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && isMenuOpen) {
      isMenuOpen = false;
      toolbar.classList.remove('open');
      mobileToggle.innerHTML = '☰';
      document.body.style.overflow = '';
    }
  });
}

// Update environment information (safely handle missing elements)
function updateEnvironmentInfo() {
  try {
    const cesiumVersionEl = document.getElementById('cesiumVersion');
    const heatboxVersionEl = document.getElementById('heatboxVersion');
    const webglSupportEl = document.getElementById('webglSupport');
    
    if (cesiumVersionEl && typeof Cesium !== 'undefined') {
      cesiumVersionEl.textContent = Cesium.VERSION || 'Unknown';
    }
    
    if (heatboxVersionEl) {
      const HeatboxCtor = getHeatboxCtor();
      if (HeatboxCtor && HeatboxCtor.VERSION) {
        heatboxVersionEl.textContent = HeatboxCtor.VERSION;
      } else if (HeatboxCtor && HeatboxCtor.prototype && HeatboxCtor.prototype.version) {
        heatboxVersionEl.textContent = HeatboxCtor.prototype.version;
      } else {
        heatboxVersionEl.textContent = 'v0.1.12-alpha.8';
      }
    }
    
    if (webglSupportEl) {
      const canvas = document.createElement('canvas');
      const webglSupported = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      webglSupportEl.textContent = webglSupported ? 'Supported' : 'Not Supported';
    }
  } catch (error) {
    console.warn('Failed to update environment info:', error);
  }
}

// Handle file input
function handleFileInput(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  updateStatus('Loading file: ' + file.name, 'info');
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      processLoadedData(data, file.name);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      updateStatus('Error parsing JSON file: ' + error.message, 'error');
    }
  };
  
  reader.onerror = function() {
    updateStatus('Error reading file', 'error');
  };
  
  reader.readAsText(file);
}

// Load sample data (from Playground's working pattern)
function loadSampleData() {
  try {
    updateStatus('Loading sample data...', 'info');
    
    // Use the same sample data pattern as Playground
    const sampleData = [
      { lon: 139.6917, lat: 35.6895, value: 85.2 }, // Tokyo
      { lon: 139.7673, lat: 35.6809, value: 92.1 }, // Shimbashi
      { lon: 139.7007, lat: 35.6733, value: 78.5 }, // Ginza
      { lon: 139.6503, lat: 35.7021, value: 94.8 }, // Shinjuku
      { lon: 139.7314, lat: 35.7006, value: 67.3 }, // Ueno
      { lon: 139.7454, lat: 35.6586, value: 89.7 }, // Tsukiji
      { lon: 139.6310, lat: 35.6906, value: 76.4 }, // Harajuku
      { lon: 139.7410, lat: 35.6912, value: 88.9 }, // Akihabara
      { lon: 139.6687, lat: 35.6584, value: 91.5 }, // Roppongi
      { lon: 139.7191, lat: 35.6804, value: 83.2 }  // Marunouchi
    ];
    
    processLoadedData(sampleData, 'Sample Data (Tokyo)');
    
  } catch (error) {
    console.error('Error loading sample data:', error);
    updateStatus('Error loading sample data: ' + error.message, 'error');
  }
}

// Generate test data
function generateTestData() {
  try {
    updateStatus('Generating test data...', 'info');
    
    const testData = [];
    const centerLon = 139.6917; // Tokyo
    const centerLat = 35.6895;
    const range = 0.1; // ~11km radius
    const count = 50;
    
    for (let i = 0; i < count; i++) {
      const lon = centerLon + (Math.random() - 0.5) * range;
      const lat = centerLat + (Math.random() - 0.5) * range;
      const value = Math.random() * 100;
      testData.push({ lon, lat, value });
    }
    
    processLoadedData(testData, `Generated Test Data (${count} points)`);
    
  } catch (error) {
    console.error('Error generating test data:', error);
    updateStatus('Error generating test data: ' + error.message, 'error');
  }
}

// Process loaded data
function processLoadedData(data, sourceName) {
  try {
    // Validate and normalize data
    let normalizedData = [];
    
    if (Array.isArray(data)) {
      normalizedData = data.filter(point => {
        return point &&
               typeof point.lon === 'number' && isFinite(point.lon) &&
               typeof point.lat === 'number' && isFinite(point.lat) &&
               typeof point.value === 'number' && isFinite(point.value);
      });
    } else if (data.features && Array.isArray(data.features)) {
      // GeoJSON format
      normalizedData = data.features.map(feature => {
        const coords = feature.geometry?.coordinates;
        const value = feature.properties?.value || feature.properties?.intensity || 1;
        return coords && coords.length >= 2 ? {
          lon: coords[0],
          lat: coords[1],
          value: value
        } : null;
      }).filter(point => point && 
               typeof point.lon === 'number' && isFinite(point.lon) &&
               typeof point.lat === 'number' && isFinite(point.lat) &&
               typeof point.value === 'number' && isFinite(point.value));
    }
    
    if (normalizedData.length === 0) {
      throw new Error('No valid data points found');
    }
    
    currentData = normalizedData;
    updateStatus(`Loaded ${normalizedData.length} data points from ${sourceName}`, 'success');
    
    // Auto-create heatmap if enabled
    const autoCamera = document.getElementById('autoCamera');
    if (autoCamera && autoCamera.checked) {
      setTimeout(() => createHeatmap(), 100);
    }
    
  } catch (error) {
    console.error('Error processing data:', error);
    updateStatus('Error processing data: ' + error.message, 'error');
  }
}

// Create heatmap (with robust error handling from Playground)
function createHeatmap() {
  if (!currentData || currentData.length === 0) {
    updateStatus('No data loaded. Please load data first.', 'warning');
    return;
  }
  
  if (!viewer) {
    updateStatus('Cesium viewer not initialized', 'error');
    return;
  }
  
  try {
    updateStatus('Creating heatmap...', 'info');
    
    // Clear existing heatmap
    clearHeatmap();
    
    // Get Heatbox constructor safely
    const HeatboxCtor = getHeatboxCtor();
    if (!HeatboxCtor) {
      throw new Error('Heatbox constructor not available');
    }
    
    console.log('Using HeatboxCtor:', HeatboxCtor);
    
    // Get visualization mode
    const wireframe = document.getElementById('wireframeMode')?.checked || false;
    const autoCamera = document.getElementById('autoCamera')?.checked || false;
    
    // Create heatmap options (using stable v0.1.12 API)
    const options = {
      // Data and positioning
      data: currentData,
      dataMapping: {
        longitude: 'lon',
        latitude: 'lat',
        value: 'value'
      },
      
      // Auto-sizing (enforced in QS)
      autoVoxelSize: true,
      voxelSize: 1000, // Will be overridden by auto-sizing
      
      // Visual settings
      showOutline: false,
      opacity: wireframe ? 0.0 : 0.85,
      adaptiveOutlines: true,
      outlineWidthPreset: 'adaptive',
      outlineRenderMode: wireframe ? 'emulation-only' : 'standard',
      emulationScope: wireframe ? 'all' : 'off',
      outlineInset: 0,
      outlineInsetMode: 'off',
      
      // Camera
      autoFitCamera: autoCamera,
      headingDegrees: 0,
      pitchDegrees: -45,
      
      // Performance
      profile: 'mobile-fast'
    };
    
    console.log('Creating heatmap with options:', options);
    
    // Create heatbox instance
    heatboxInstance = new HeatboxCtor(viewer, options);
    
    // Render
    heatboxInstance.render();
    
    isHeatmapVisible = true;
    updateStatus(`Heatmap created successfully with ${currentData.length} points`, 'success');
    
  } catch (error) {
    console.error('Error creating heatmap:', error);
    updateStatus('Error creating heatmap: ' + error.message, 'error');
    
    // Additional debugging info
    if (currentData && currentData.length > 0) {
      console.log('Sample data point:', currentData[0]);
      console.log('Data bounds:', {
        lon: [Math.min(...currentData.map(d => d.lon)), Math.max(...currentData.map(d => d.lon))],
        lat: [Math.min(...currentData.map(d => d.lat)), Math.max(...currentData.map(d => d.lat))],
        value: [Math.min(...currentData.map(d => d.value)), Math.max(...currentData.map(d => d.value))]
      });
    }
  }
}

// Re-render heatmap with current settings
function reRenderHeatmap() {
  if (!heatboxInstance || !currentData) return;
  
  try {
    const wireframe = document.getElementById('wireframeMode')?.checked || false;
    const autoCamera = document.getElementById('autoCamera')?.checked || false;
    
    // Update options (safe approach)
    const updated = {
      showOutline: false,
      opacity: wireframe ? 0.0 : 0.85,
      adaptiveOutlines: true,
      outlineWidthPreset: 'adaptive',
      outlineRenderMode: wireframe ? 'emulation-only' : 'standard',
      emulationScope: wireframe ? 'all' : 'off',
      outlineInset: 0,
      outlineInsetMode: 'off',
      autoFitCamera: autoCamera
    };
    
    heatboxInstance.updateOptions(updated);
    heatboxInstance.render();
    
    updateStatus('Heatmap updated', 'success');
    
  } catch (error) {
    console.error('Error re-rendering heatmap:', error);
    updateStatus('Error updating heatmap: ' + error.message, 'error');
  }
}

// Clear heatmap
function clearHeatmap() {
  try {
    if (heatboxInstance) {
      heatboxInstance.destroy();
      heatboxInstance = null;
    }
    
    // Clear any remaining entities
    if (viewer && viewer.entities) {
      currentEntities.forEach(entity => {
        try {
          viewer.entities.remove(entity);
        } catch (_) {}
      });
      currentEntities = [];
    }
    
    isHeatmapVisible = false;
    updateStatus('Heatmap cleared', 'info');
    
  } catch (error) {
    console.error('Error clearing heatmap:', error);
    updateStatus('Error clearing heatmap: ' + error.message, 'error');
  }
}

// Toggle heatmap visibility
function toggleHeatmapVisibility() {
  if (!heatboxInstance) {
    updateStatus('No heatmap to toggle', 'warning');
    return;
  }
  
  try {
    isHeatmapVisible = !isHeatmapVisible;
    
    if (isHeatmapVisible) {
      heatboxInstance.show();
      updateStatus('Heatmap shown', 'info');
    } else {
      heatboxInstance.hide();
      updateStatus('Heatmap hidden', 'info');
    }
    
  } catch (error) {
    console.error('Error toggling visibility:', error);
    updateStatus('Error toggling visibility: ' + error.message, 'error');
  }
}

// Update status message
function updateStatus(message, type = 'info') {
  const statusEl = document.getElementById('dataStatus');
  if (!statusEl) return;
  
  statusEl.textContent = message;
  statusEl.className = type;
  
  // Auto-clear success/info messages after delay
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      if (statusEl.textContent === message) {
        statusEl.textContent = 'Ready';
        statusEl.className = '';
      }
    }, 3000);
  }
  
  console.log(`[${type.toUpperCase()}] ${message}`);
}