/* global Cesium */
(function () {
  'use strict';

  const Heatbox = window.CesiumHeatbox || window.Heatbox;
  const CameraHelper = window.HeatboxDemoCamera || null;

  if (!Heatbox) {
    console.error('Heatbox UMD build is not loaded.');
    return;
  }

  const SHINJUKU_CENTER = { lon: 139.6917, lat: 35.6895 };
  const CAMERA_DEFAULTS = {
    headingDegrees: -15,
    pitchDegrees: -42,
    altitude: 2600,
    altitudeScale: 0.5,
    cameraLatOffset: -0.02,
    ...(CameraHelper?.DEFAULT_OPTIONS ?? {})
  };

  const paletteMap = {
    sunset: ['#0f172a', '#1e1b4b', '#7c2d12', '#f97316', '#fde047'],
    aurora: ['#042f2e', '#0f766e', '#06b6d4', '#7dd3fc'],
    heatmap: ['#00429d', '#73a2c6', '#f4777f', '#93003a'],
    contrast: [
      { position: 0, color: '#0f172a' },
      { position: 0.5, color: '#f8fafc' },
      { position: 1, color: '#be123c' }
    ]
  };

  const ui = {
    schemeSelect: document.getElementById('schemeSelect'),
    classCount: document.getElementById('classCount'),
    classCountValue: document.getElementById('classCountValue'),
    paletteSelect: document.getElementById('paletteSelect'),
    palettePreview: document.getElementById('palettePreview'),
    thresholdsInput: document.getElementById('thresholdsInput'),
    datasetPreset: document.getElementById('datasetPreset'),
    generateBtn: document.getElementById('generateBtn'),
    applyBtn: document.getElementById('applyBtn'),
    generateStatus: document.getElementById('generateStatus'),
    applyStatus: document.getElementById('applyStatus'),
    classesGroup: document.getElementById('classesGroup'),
    thresholdGroup: document.getElementById('thresholdGroup'),
    statsList: document.getElementById('statsList'),
    breaksList: document.getElementById('breaksList')
  };

  let viewer = null;
  let heatbox = null;
  let currentEntities = [];
  let isBusy = false;

  init();

  function init() {
    try {
      initializeViewer();
      initializeHeatbox();
      wireUIEvents();
      updatePalettePreview();
      syncSchemeSpecificFields();
      ui.generateStatus.textContent = 'Ready - Generate sample data to begin.';
      ui.applyStatus.textContent = 'Waiting for data...';
    } catch (error) {
      console.error('Failed to initialize classification demo:', error);
      if (ui.generateStatus) {
        ui.generateStatus.textContent = 'Initialization error';
      }
    }
  }

  function initializeViewer() {
    const imageryProvider = createImageryProvider();
    const terrainProvider = createTerrainProvider();
    viewer = new Cesium.Viewer('cesiumContainer', {
      imageryProvider,
      terrainProvider,
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      homeButton: false,
      sceneModePicker: false,
      fullscreenButton: false,
      navigationHelpButton: false,
      infoBox: true,
      geocoder: false,
      creditContainer: document.createElement('div')
    });
    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(imageryProvider);
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0f172a');
    focusCamera();
  }

  function initializeHeatbox() {
    heatbox = new Heatbox(viewer, {
      voxelSize: 35,
      showOutline: true,
      opacity: 0.78,
      colorMap: 'custom',
      classification: {
        enabled: true,
        scheme: ui.schemeSelect.value,
        classes: Number(ui.classCount.value),
        colorMap: paletteMap[ui.paletteSelect.value]
      }
    });
  }

  function createImageryProvider() {
    return new Cesium.UrlTemplateImageryProvider({
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      subdomains: 'abcd',
      maximumLevel: 19,
      credit: '© OpenStreetMap contributors © CARTO'
    });
  }

  function createTerrainProvider() {
    try {
      if (Cesium.Ion && Cesium.Ion.defaultAccessToken && Cesium.Ion.defaultAccessToken !== 'null') {
        return Cesium.createWorldTerrain();
      }
    } catch (error) {
      console.warn('World Terrain unavailable, using EllipsoidTerrainProvider.', error);
    }
    return new Cesium.EllipsoidTerrainProvider();
  }

  function focusCamera(bounds = null) {
    if (!viewer || !viewer.camera) return;
    if (CameraHelper?.focus) {
      CameraHelper.focus(viewer, {
        ...CAMERA_DEFAULTS,
        bounds,
        useDefaultBounds: !bounds
      });
      return;
    }

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        SHINJUKU_CENTER.lon,
        SHINJUKU_CENTER.lat + (CAMERA_DEFAULTS.cameraLatOffset ?? 0),
        CAMERA_DEFAULTS.altitude
      ),
      orientation: {
        heading: Cesium.Math.toRadians(CAMERA_DEFAULTS.headingDegrees ?? 0),
        pitch: Cesium.Math.toRadians(CAMERA_DEFAULTS.pitchDegrees ?? -40),
        roll: 0
      }
    });
  }

  function wireUIEvents() {
    ui.schemeSelect.addEventListener('change', () => {
      syncSchemeSpecificFields();
      queueApply();
    });

    document.querySelectorAll('.scheme-badges button').forEach((button) => {
      button.addEventListener('click', () => {
        ui.schemeSelect.value = button.dataset.scheme;
        if (button.dataset.scheme !== 'threshold' && Number(ui.classCount.value) < 5) {
          ui.classCount.value = 5;
          ui.classCountValue.textContent = '5';
        }
        syncSchemeSpecificFields();
        queueApply();
      });
    });

    ui.classCount.addEventListener('input', () => {
      ui.classCountValue.textContent = ui.classCount.value;
      queueApply();
    });

    ui.thresholdsInput.addEventListener('change', queueApply);
    ui.paletteSelect.addEventListener('change', () => {
      updatePalettePreview();
      queueApply();
    });
    ui.datasetPreset.addEventListener('change', () => queueGenerate());
    ui.generateBtn.addEventListener('click', () => queueGenerate(true));
    ui.applyBtn.addEventListener('click', () => queueApply(true));
  }

  function queueGenerate(force = false) {
    if (isBusy && !force) {
      return;
    }
    regenerateData().catch((error) => {
      console.error('Failed to regenerate dataset:', error);
      ui.generateStatus.textContent = 'Dataset generation failed';
      setBusyState(false);
    });
  }

  function queueApply(force = false) {
    if (!currentEntities.length || (isBusy && !force)) {
      return;
    }
    applyClassification(true).catch((error) => {
      console.error('Failed to apply classification:', error);
      ui.applyStatus.textContent = 'Classification update failed';
      setBusyState(false);
    });
  }

  function setBusyState(flag, { forApply = false } = {}) {
    isBusy = flag;
    ui.generateBtn.disabled = flag;
    ui.applyBtn.disabled = flag || !currentEntities.length;

    if (forApply && flag) {
      ui.applyStatus.textContent = 'Updating classification...';
    } else if (!flag && currentEntities.length) {
      ui.applyStatus.textContent = 'Ready';
    }
  }

  async function regenerateData() {
    setBusyState(true);
    ui.generateStatus.textContent = 'Generating entities...';
    viewer.entities.removeAll();
    currentEntities = [];

    if (ui.datasetPreset.value === 'gradient') {
      currentEntities = generateGradientEntities(viewer);
    } else {
      currentEntities = generateClusterEntities(viewer);
    }

    focusCamera();
    ui.generateStatus.textContent = `${currentEntities.length} entities generated`;

    await heatbox.createFromEntities(currentEntities);
    await applyClassification(false);
    setBusyState(false);
  }

  async function applyClassification(showMessage = true) {
    const classificationOptions = buildClassificationOptions();
    setBusyState(true, { forApply: true });
    heatbox.updateOptions({ classification: classificationOptions });
    if (currentEntities.length) {
      await heatbox.createFromEntities(currentEntities);
    }
    updateStats();
    if (showMessage) {
      ui.applyStatus.textContent = `Applied scheme "${classificationOptions.scheme}"`;
    }
    setBusyState(false);
  }

  function buildClassificationOptions() {
    const scheme = ui.schemeSelect.value;
    const classes = Number(ui.classCount.value);
    const palette = paletteMap[ui.paletteSelect.value] || paletteMap.sunset;
    const options = {
      enabled: true,
      scheme,
      classes,
      colorMap: palette,
      classificationTargets: { color: true }
    };
    if (scheme === 'threshold') {
      const thresholds = parseThresholds(ui.thresholdsInput.value);
      options.thresholds = thresholds.length ? thresholds : [50];
    }
    return options;
  }

  function parseThresholds(raw) {
    return raw
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);
  }

  function generateClusterEntities(viewerInstance) {
    const clusters = [
      { lon: SHINJUKU_CENTER.lon - 0.002, lat: SHINJUKU_CENTER.lat + 0.002, count: 500, altitude: [0, 40] },
      { lon: SHINJUKU_CENTER.lon + 0.002, lat: SHINJUKU_CENTER.lat + 0.001, count: 350, altitude: [20, 60] },
      { lon: SHINJUKU_CENTER.lon, lat: SHINJUKU_CENTER.lat - 0.002, count: 220, altitude: [10, 80] }
    ];
    const jitter = 0.001;
    const entities = [];
    clusters.forEach((cluster) => {
      for (let i = 0; i < cluster.count; i++) {
        const lon = cluster.lon + (Math.random() - 0.5) * jitter;
        const lat = cluster.lat + (Math.random() - 0.5) * jitter;
        const alt = cluster.altitude[0] + Math.random() * (cluster.altitude[1] - cluster.altitude[0]);
        entities.push(createPointEntity(viewerInstance, lon, lat, alt));
      }
    });

    for (let i = 0; i < 30; i++) {
      const lon = SHINJUKU_CENTER.lon - 0.004 + Math.random() * 0.008;
      const lat = SHINJUKU_CENTER.lat - 0.004 + Math.random() * 0.008;
      const alt = 10 + Math.random() * 50;
      entities.push(createPointEntity(viewerInstance, lon, lat, alt));
    }

    return entities;
  }

  function generateGradientEntities(viewerInstance) {
    const entities = [];
    const steps = 18;
    for (let i = 0; i < steps; i++) {
      const baseLon = SHINJUKU_CENTER.lon - 0.004 + (i / steps) * 0.008;
      const density = 80 + i * 12;
      for (let k = 0; k < density; k++) {
        const lon = baseLon + (Math.random() - 0.5) * 0.001;
        const lat = SHINJUKU_CENTER.lat - 0.003 + (Math.random() - 0.5) * 0.006;
        const alt = 5 + (i / steps) * 60 + Math.random() * 10;
        entities.push(createPointEntity(viewerInstance, lon, lat, alt));
      }
    }
    return entities;
  }

  function createPointEntity(viewerInstance, lon, lat, altitude) {
    return viewerInstance.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, altitude),
      point: {
        pixelSize: 3,
        color: Cesium.Color.fromCssColorString('#fcd34d'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1
      }
    });
  }

  function updateStats() {
    const stats = heatbox?.getStatistics();
    if (!stats || !stats.classification) {
      ui.statsList.querySelectorAll('dd').forEach((node) => {
        node.textContent = '-';
      });
      ui.breaksList.innerHTML = '';
      return;
    }

    const classification = stats.classification;
    const entries = ui.statsList.querySelectorAll('dd');
    entries[0].textContent = classification.scheme ?? 'linear';
    entries[1].textContent = formatDomain(classification.domain);
    entries[2].textContent = classification.classes ?? '-';
    entries[3].textContent = classification.sampleSize ?? 0;
    entries[4].textContent = formatQuantiles(classification.quantiles);
    entries[5].textContent = classification.breaks ? `${classification.breaks.length} values` : 'auto';

    ui.breaksList.innerHTML = '';
    if (classification.breaks && classification.breaks.length) {
      classification.breaks.forEach((value, index) => {
        const item = document.createElement('li');
        item.textContent = `Break ${index + 1}: ${formatNumber(value)}`;
        ui.breaksList.appendChild(item);
      });
    }
  }

  function formatDomain(domain) {
    if (!Array.isArray(domain) || domain.length !== 2) {
      return '-';
    }
    return `${formatNumber(domain[0])} – ${formatNumber(domain[1])}`;
  }

  function formatQuantiles(values) {
    if (!Array.isArray(values) || values.length !== 3) {
      return 'n/a';
    }
    return values.map(formatNumber).join(' / ');
  }

  function formatNumber(value) {
    return Number.isFinite(value) ? value.toFixed(2) : '-';
  }

  function updatePalettePreview() {
    const palette = paletteMap[ui.paletteSelect.value] || paletteMap.sunset;
    if (Array.isArray(palette)) {
      const colors = palette.map((entry) => (typeof entry === 'string' ? entry : entry.color));
      ui.palettePreview.style.background = `linear-gradient(90deg, ${colors.join(',')})`;
    } else {
      ui.palettePreview.style.background = '#1e293b';
    }
  }

  function syncSchemeSpecificFields() {
    const scheme = ui.schemeSelect.value;
    const isThreshold = scheme === 'threshold';
    ui.classesGroup.style.display = isThreshold ? 'none' : 'block';
    ui.thresholdGroup.style.display = isThreshold ? 'block' : 'none';
    ui.applyBtn.disabled = !currentEntities.length;
  }
})();
