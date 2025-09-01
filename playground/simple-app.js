/**
 * Cesium Heatbox - Simple Quick Start Interface
 * A simplified 3-step workflow for creating 3D heatmaps
 */

let viewer;
let heatbox;
let currentData = null;

// Initialize Cesium viewer
function initializeViewer() {
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
    }),
    
    // Scene settings
    contextOptions: {
      webgl: {
        alpha: false,
        depth: true,
        stencil: false,
        antialias: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false
      },
      allowTextureFilterAnisotropic: false
    }
  });

  // Scene optimizations
  viewer.scene.fog.enabled = false;
  viewer.scene.skyAtmosphere.show = false;
  viewer.scene.moon.show = false;
  viewer.scene.sun.show = false;
  viewer.scene.skyBox.show = true;
  
  // Camera settings
  viewer.scene.camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z;
  
  console.log('✅ Cesium viewer initialized');
}

// Update status display
function updateStatus(elementId, message, isError = false) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.style.color = isError ? '#ff6b6b' : '#4CAF50';
  }
}

// Generate test data
function generateTestData() {
  const features = [];
  const centerLon = 139.6917; // Tokyo
  const centerLat = 35.6895;
  const range = 0.1;
  
  for (let i = 0; i < 100; i++) {
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
        name: `Point ${i + 1}`
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
    updateStatus('dataStatus', 'Loading sample data...');
    
    // Try to load actual sample data first
    try {
      const response = await fetch('./sample-data.geojson');
      if (response.ok) {
        currentData = await response.json();
        updateStatus('dataStatus', `✅ Sample data loaded: ${currentData.features.length} points`);
        enableHeatmapGeneration();
        return;
      }
    } catch (e) {
      console.log('Sample data file not found, generating test data');
    }
    
    // Fallback to generated test data
    currentData = generateTestData();
    updateStatus('dataStatus', `✅ Test data generated: ${currentData.features.length} points`);
    enableHeatmapGeneration();
    
  } catch (error) {
    console.error('Error loading sample data:', error);
    updateStatus('dataStatus', '❌ Failed to load sample data', true);
  }
}

// Handle file input
function handleFileInput(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  updateStatus('dataStatus', 'Loading file...');
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      currentData = JSON.parse(e.target.result);
      
      if (currentData.type === 'FeatureCollection' && currentData.features) {
        updateStatus('dataStatus', `✅ File loaded: ${currentData.features.length} features`);
        enableHeatmapGeneration();
      } else {
        throw new Error('Invalid GeoJSON format');
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      updateStatus('dataStatus', '❌ Invalid file format. Please use GeoJSON.', true);
    }
  };
  
  reader.readAsText(file);
}

// Enable heatmap generation
function enableHeatmapGeneration() {
  const createButton = document.getElementById('createHeatmap');
  if (createButton) {
    createButton.disabled = false;
    updateStatus('heatmapStatus', '✅ Ready to create heatmap! Click "Create Heatmap" to generate.');
  }
}

// Convert GeoJSON to Cesium entities
function convertGeoJSONToEntities(geojson) {
  const entities = [];
  
  if (geojson.type === 'FeatureCollection') {
    geojson.features.forEach((feature, index) => {
      if (feature.geometry && feature.geometry.type === 'Point') {
        const [lon, lat, alt = 0] = feature.geometry.coordinates;
        const value = feature.properties.value || Math.random() * 100;
        
        const entity = viewer.entities.add({
          id: `point-${index}`,
          position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
          point: {
            pixelSize: 1,
            show: false // Hide the visual point, just use for heatmap data
          },
          properties: {
            value: value,
            ...feature.properties
          }
        });
        
        entities.push(entity);
      }
    });
  }
  
  return entities;
}

// Create heatmap
function createHeatmap() {
  if (!currentData) {
    updateStatus('heatmapStatus', '❌ No data loaded', true);
    return;
  }
  
  try {
    updateStatus('heatmapStatus', 'Creating heatmap...');
    
    // Clear existing heatmap
    if (heatbox) {
      heatbox.clear();
    }
    
    // Get configuration values
    const gridSize = parseInt(document.getElementById('gridSize').value);
    const colorScheme = document.getElementById('colorScheme').value;
    const heightBased = document.getElementById('heightBased').checked;
    const autoCamera = document.getElementById('autoCamera').checked;
    
    // Initialize heatbox if needed
    if (!heatbox && window.CesiumHeatbox) {
      heatbox = new window.CesiumHeatbox.default(viewer);
      console.log('✅ Heatbox initialized');
    }
    
    if (!heatbox) {
      throw new Error('Heatbox library not loaded');
    }
    
    // Convert GeoJSON to entities
    const entities = convertGeoJSONToEntities(currentData);
    console.log(`Converted ${entities.length} GeoJSON features to entities`);
    
    // Configure heatbox options
    const options = {
      voxelSize: gridSize,
      heightBased: heightBased,
      autoVoxelSize: true,
      autoVoxelSizeMode: 'simple',
      colorMap: colorScheme === 'viridis' ? 'viridis' : 'custom',
      customColorTheme: colorScheme === 'viridis' ? 'heat' : colorScheme,
      showEmptyVoxels: false,
      wireframeOnly: false,
      autoView: autoCamera
    };
    
    // Create heatmap from entities
    heatbox.setData(entities);
    
    updateStatus('heatmapStatus', '✅ Heatmap created successfully!');
    
    // Enable clear button
    const clearButton = document.getElementById('clearHeatmap');
    if (clearButton) {
      clearButton.disabled = false;
    }
    
    console.log('✅ Heatmap created with options:', options);
    
  } catch (error) {
    console.error('Error creating heatmap:', error);
    updateStatus('heatmapStatus', `❌ Error: ${error.message}`, true);
  }
}

// Clear heatmap
function clearHeatmap() {
  if (heatbox) {
    heatbox.clear();
    updateStatus('heatmapStatus', 'Heatmap cleared. Ready to create new heatmap.');
    
    const clearButton = document.getElementById('clearHeatmap');
    if (clearButton) {
      clearButton.disabled = true;
    }
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

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing Cesium Heatbox Simple Interface');
  
  // Initialize Cesium viewer
  initializeViewer();
  
  // Set up event listeners
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileInput);
  }
  
  const loadSampleButton = document.getElementById('loadSampleData');
  if (loadSampleButton) {
    loadSampleButton.addEventListener('click', loadSampleData);
  }
  
  const generateTestButton = document.getElementById('generateTestData');
  if (generateTestButton) {
    generateTestButton.addEventListener('click', function() {
      currentData = generateTestData();
      updateStatus('dataStatus', `✅ Test data generated: ${currentData.features.length} points`);
      enableHeatmapGeneration();
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
  
  const gridSize = document.getElementById('gridSize');
  if (gridSize) {
    gridSize.addEventListener('input', updateGridSizeDisplay);
    updateGridSizeDisplay(); // Initial update
  }
  
  console.log('✅ Event listeners set up');
  
  // Initial status
  updateStatus('dataStatus', 'Ready to load data. Choose a file or use sample data to get started.');
  updateStatus('heatmapStatus', 'Load data first to enable heatmap generation.');
});

// Error handling
window.addEventListener('error', function(event) {
  console.error('Global error:', event.error);
  updateStatus('heatmapStatus', `❌ Error: ${event.error.message}`, true);
});

// Handle Cesium loading errors
window.addEventListener('cesiumError', function(event) {
  console.error('Cesium error:', event.detail);
  updateStatus('heatmapStatus', '❌ Cesium loading error', true);
});
