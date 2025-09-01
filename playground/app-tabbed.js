/**
 * Cesium Heatbox - Tabbed Playground Application
 * Full-featured playground with all customization options
 */

let viewer;
let heatbox;
let currentData = null;

// Mobile menu toggle functionality
function initializeMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const toolbar = document.getElementById('toolbar');
  
  if (mobileMenuToggle && toolbar) {
    mobileMenuToggle.addEventListener('click', function() {
      toolbar.classList.toggle('open');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!toolbar.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
        toolbar.classList.remove('open');
      }
    });
  }
}

// Initialize Cesium viewer
function initializeViewer() {
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
      
      // Terrain and imagery
      terrainProvider: Cesium.createWorldTerrain(),
      imageryProvider: new Cesium.OpenStreetMapImageryProvider({
        url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
        credit: '© CartoDB © OpenStreetMap contributors'
      })
    });

    // Scene optimizations
    viewer.scene.fog.enabled = false;
    viewer.scene.skyAtmosphere.show = false;
    viewer.scene.moon.show = false;
    viewer.scene.sun.show = false;
    
    console.log('✅ Cesium viewer initialized');
    updateEnvironmentInfo();
    
  } catch (error) {
    console.error('Error initializing Cesium viewer:', error);
  }
}

// Update environment information
function updateEnvironmentInfo() {
  const cesiumVersion = document.getElementById('cesiumVersion');
  const heatboxVersion = document.getElementById('heatboxVersion');
  const webglSupport = document.getElementById('webglSupport');
  
  if (cesiumVersion) {
    cesiumVersion.textContent = typeof Cesium !== 'undefined' ? Cesium.VERSION || '1.120' : 'Not loaded';
  }
  
  if (heatboxVersion) {
    heatboxVersion.textContent = typeof window.CesiumHeatbox !== 'undefined' ? '0.1.9' : 'Not loaded';
  }
  
  if (webglSupport) {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    webglSupport.textContent = gl ? 'Supported' : 'Not supported';
  }
}

// Generate test data
function generateTestData() {
  const features = [];
  const centerLon = 139.6917; // Tokyo
  const centerLat = 35.6895;
  const range = 0.1;
  
  for (let i = 0; i < 200; i++) {
    const lon = centerLon + (Math.random() - 0.5) * range;
    const lat = centerLat + (Math.random() - 0.5) * range;
    const value = Math.random() * 100;
    
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lon, lat]
      },
      properties: {
        value: value,
        name: `Point ${i + 1}`,
        category: Math.floor(Math.random() * 5) + 1
      }
    });
  }
  
  return {
    type: 'FeatureCollection',
    features: features
  };
}

// Load sample data
async function loadSampleData() {
  try {
    console.log('Loading sample data...');
    
    // Try to load actual sample data first
    try {
      const response = await fetch('./sample-data.geojson');
      if (response.ok) {
        currentData = await response.json();
        updateDataInfo(currentData);
        return;
      }
    } catch (e) {
      console.log('Sample data file not found, generating test data');
    }
    
    // Fallback to generated test data
    currentData = generateTestData();
    updateDataInfo(currentData);
    
  } catch (error) {
    console.error('Error loading sample data:', error);
  }
}

// Update data information display
function updateDataInfo(data) {
  const dataCount = document.getElementById('dataCount');
  if (dataCount && data && data.features) {
    dataCount.textContent = data.features.length;
  }
  
  console.log(`✅ Data loaded: ${data.features.length} features`);
}

// Create heatmap
function createHeatmap() {
  if (!currentData) {
    console.warn('No data loaded');
    return;
  }
  
  try {
    console.log('Creating heatmap...');
    
    // Initialize heatbox if needed
    if (!heatbox && window.CesiumHeatbox) {
      heatbox = new window.CesiumHeatbox.Heatbox(viewer);
      console.log('✅ Heatbox initialized');
    }
    
    if (!heatbox) {
      throw new Error('Heatbox library not loaded');
    }
    
    // Get configuration from UI
    const gridSize = parseInt(document.getElementById('gridSize')?.value || 20);
    const heightBased = document.getElementById('heightBased')?.checked || false;
    const autoView = document.getElementById('autoView')?.checked || true;
    
    const options = {
      gridSize: gridSize,
      heightBased: heightBased,
      autoVoxelSize: true,
      autoVoxelSizeMode: 'simple',
      colorMap: 'viridis',
      showEmptyVoxels: false,
      wireframeOnly: false,
      autoView: autoView
    };
    
    // Clear existing heatmap
    heatbox.clear();
    
    // Create new heatmap
    heatbox.createFromGeoJSON(currentData, options);
    
    console.log('✅ Heatmap created successfully');
    
  } catch (error) {
    console.error('Error creating heatmap:', error);
  }
}

// Clear heatmap
function clearHeatmap() {
  if (heatbox) {
    heatbox.clear();
    console.log('✅ Heatmap cleared');
  }
}

// Toggle heatmap visibility
function toggleVisibility() {
  if (heatbox) {
    heatbox.toggleVisibility();
    console.log('✅ Heatmap visibility toggled');
  }
}

// Update grid size display
function updateGridSizeDisplay() {
  const gridSize = document.getElementById('gridSize');
  const gridSizeValue = document.getElementById('gridSizeValue');
  if (gridSize && gridSizeValue) {
    gridSizeValue.textContent = gridSize.value;
  }
}

// Test heatbox functionality
function testHeatbox() {
  console.log('🧪 Testing Heatbox functionality...');
  
  if (typeof window.CesiumHeatbox === 'undefined') {
    console.error('❌ CesiumHeatbox library not loaded');
    return;
  }
  
  if (!viewer) {
    console.error('❌ Cesium viewer not initialized');
    return;
  }
  
  console.log('✅ Heatbox library loaded');
  console.log('✅ Cesium viewer ready');
  console.log('✅ Test passed');
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing Cesium Heatbox Playground');
  
  // Initialize Cesium viewer
  initializeViewer();
  
  // Initialize mobile menu
  initializeMobileMenu();
  
  // Set up event listeners
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          currentData = JSON.parse(e.target.result);
          updateDataInfo(currentData);
        } catch (error) {
          console.error('Error parsing file:', error);
        }
      };
      reader.readAsText(file);
    });
  }
  
  // Button event listeners
  const loadSampleButton = document.getElementById('loadSampleData');
  if (loadSampleButton) {
    loadSampleButton.addEventListener('click', loadSampleData);
  }
  
  const generateTestButton = document.getElementById('generateTestData');
  if (generateTestButton) {
    generateTestButton.addEventListener('click', function() {
      currentData = generateTestData();
      updateDataInfo(currentData);
    });
  }
  
  const createButton = document.getElementById('createHeatmap');
  if (createButton) {
    createButton.addEventListener('click', createHeatmap);
  }
  
  const clearButton = document.getElementById('clearHeatmap');
  if (clearButton) {
    clearButton.addEventListener('click', clearHeatmap);
  }
  
  const toggleButton = document.getElementById('toggleVisibility');
  if (toggleButton) {
    toggleButton.addEventListener('click', toggleVisibility);
  }
  
  const testButton = document.getElementById('testHeatbox');
  if (testButton) {
    testButton.addEventListener('click', testHeatbox);
  }
  
  const gridSize = document.getElementById('gridSize');
  if (gridSize) {
    gridSize.addEventListener('input', updateGridSizeDisplay);
    updateGridSizeDisplay(); // Initial update
  }
  
  console.log('✅ Event listeners set up');
});

// Error handling
window.addEventListener('error', function(event) {
  console.error('Global error:', event.error);
});

console.log('📦 Cesium Heatbox Tabbed App loaded');
