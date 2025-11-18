/* global Cesium */
(function () {
  'use strict';

  const Heatbox = window.CesiumHeatbox || window.Heatbox;
  const CameraHelper = window.HeatboxDemoCamera || null;
  if (!Heatbox) {
    console.error('Heatbox UMD build is not loaded.');
    return;
  }

  const palette = ['#0f172a', '#1d4ed8', '#22d3ee', '#f97316', '#facc15'];
  const ui = {
    scheme: document.getElementById('scheme'),
    classes: document.getElementById('classes'),
    classesValue: document.getElementById('classesValue'),
    targetColor: document.getElementById('targetColor'),
    targetOpacity: document.getElementById('targetOpacity'),
    targetWidth: document.getElementById('targetWidth'),
    regen: document.getElementById('regen'),
    apply: document.getElementById('apply'),
    domain: document.getElementById('domain'),
    breaks: document.getElementById('breaks'),
    targets: document.getElementById('targets'),
    legend: document.getElementById('legendContainer')
  };

  const CENTER = { lon: 139.6917, lat: 35.6895, height: 2600 };
  let viewer;
  let heatbox;
  let entities = [];
  let dataBounds = null;

  init();

  function init() {
    const imageryProvider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      subdomains: 'abcd',
      maximumLevel: 19,
      credit: '© OpenStreetMap contributors © CARTO'
    });

    viewer = new Cesium.Viewer('cesiumContainer', {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      geocoder: false,
      infoBox: true,
      creditContainer: document.createElement('div'),
      imageryProvider,
      terrainProvider: new Cesium.EllipsoidTerrainProvider()
    });
    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(imageryProvider);
    focusCamera();

    heatbox = new Heatbox(viewer, {
      voxelSize: 40,
      opacity: 0.85,
      showOutline: true,
      outlineRenderMode: 'emulation-only',
      emulationScope: 'all',
      classification: {
        enabled: true,
        scheme: ui.scheme.value,
        classes: Number(ui.classes.value),
        colorMap: palette,
        classificationTargets: { color: true, opacity: true, width: true }
      },
      adaptiveParams: {
        boxOpacityRange: [0.35, 0.95],
        outlineOpacityRange: [0.4, 1.0],
        outlineWidthRange: [1, 5]
      }
    });

    ui.classes.addEventListener('input', () => {
      ui.classesValue.textContent = ui.classes.value;
    });
    ui.apply.addEventListener('click', applyClassification);
    ui.regen.addEventListener('click', () => {
      generateEntities();
      applyClassification();
    });

    generateEntities();
    applyClassification();
  }

  function focusCamera(bounds = null) {
    if (CameraHelper?.focus) {
      CameraHelper.focus(viewer, { bounds: bounds || dataBounds, useDefaultBounds: true });
      return;
    }
    if (!viewer?.camera) return;
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        CENTER.lon,
        CENTER.lat,
        CENTER.height
      ),
      orientation: {
        heading: Cesium.Math.toRadians(-20),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0
      }
    });
  }

  function generateEntities() {
    viewer.entities.removeAll();
    entities = [];
    const baseLon = CENTER.lon;
    const baseLat = CENTER.lat;
    const bounds = {
      minLon: Infinity,
      maxLon: -Infinity,
      minLat: Infinity,
      maxLat: -Infinity,
      minAlt: Infinity,
      maxAlt: -Infinity
    };

    // 3 クラスタ + ばらつき
    const clusters = [
      { center: [baseLon, baseLat, 20], spread: 0.008, base: 5 },
      { center: [baseLon + 0.01, baseLat + 0.01, 35], spread: 0.006, base: 25 },
      { center: [baseLon - 0.012, baseLat + 0.012, 50], spread: 0.01, base: 60 }
    ];

    clusters.forEach((cluster) => {
      for (let i = 0; i < 120; i++) {
        const lon = cluster.center[0] + (Math.random() - 0.5) * cluster.spread;
        const lat = cluster.center[1] + (Math.random() - 0.5) * cluster.spread;
        const alt = cluster.center[2] + (Math.random() - 0.5) * 15;
        const count = Math.max(1, Math.round(cluster.base + Math.random() * cluster.base));
        const entity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
          properties: {
            type: 'sample',
            value: count
          }
        });
        entities.push(entity);
        bounds.minLon = Math.min(bounds.minLon, lon);
        bounds.maxLon = Math.max(bounds.maxLon, lon);
        bounds.minLat = Math.min(bounds.minLat, lat);
        bounds.maxLat = Math.max(bounds.maxLat, lat);
        bounds.minAlt = Math.min(bounds.minAlt, alt);
        bounds.maxAlt = Math.max(bounds.maxAlt, alt);
      }
    });

    dataBounds = bounds;
    focusCamera(bounds);
  }

  function applyClassification() {
    const scheme = ui.scheme.value;
    const classes = Number(ui.classes.value);
    const classificationTargets = {
      color: ui.targetColor.checked,
      opacity: ui.targetOpacity.checked,
      width: ui.targetWidth.checked
    };

    heatbox.updateOptions({
      classification: {
        enabled: true,
        scheme,
        classes,
        colorMap: palette,
        classificationTargets
      }
    });

    heatbox.createLegend(ui.legend);

    heatbox.createFromEntities(viewer.entities.values, {
      classification: heatbox.options.classification
    }).then(() => {
      heatbox.updateLegend();
      updateStats();
    }).catch((error) => {
      console.error('Failed to render classification extension demo:', error);
    });
  }

  function updateStats() {
    const stats = heatbox.getStatistics()?.classification;
    if (!stats) return;
    ui.domain.textContent = Array.isArray(stats.domain) ? stats.domain.join(' - ') : '-';
    ui.breaks.textContent = Array.isArray(stats.breaks) ? stats.breaks.join(', ') : '-';
    const targets = stats?.classificationTargets || heatbox.options.classification?.classificationTargets || {};
    const enabledTargets = Object.entries(targets)
      .filter(([, enabled]) => enabled !== false)
      .map(([k]) => k)
      .join(', ');
    ui.targets.textContent = enabledTargets || '-';
  }
})();
