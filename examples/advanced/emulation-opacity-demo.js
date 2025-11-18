/* global Cesium */
(function () {
  'use strict';

  const Heatbox = window.CesiumHeatbox || window.Heatbox;
  if (!Heatbox) {
    console.error('Heatbox UMD build is not loaded.');
    return;
  }

  const ui = {
    scheme: document.getElementById('schemeSelect'),
    range: document.getElementById('rangeSlider'),
    rangeValue: document.getElementById('rangeValue'),
    regen: document.getElementById('regenBtn'),
    apply: document.getElementById('applyBtn'),
    breaks: document.getElementById('breaksText'),
    rangeText: document.getElementById('rangeText')
  };

  const CENTER = { lon: 139.71, lat: 35.67, height: 2600 };
  let viewer;
  let heatbox;
  let entities = [];

  init();

  function init() {
    ui.rangeValue.textContent = Number(ui.range.value).toFixed(2);
    ui.range.addEventListener('input', () => {
      ui.rangeValue.textContent = Number(ui.range.value).toFixed(2);
      ui.rangeText.textContent = `[0.4, ${Number(ui.range.value).toFixed(2)}]`;
    });

    ui.apply.addEventListener('click', apply);
    ui.regen.addEventListener('click', () => {
      generateEntities();
      apply();
    });

    const imageryProvider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
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
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0f172a');
    focusCamera();

    heatbox = new Heatbox(viewer, {
      voxelSize: 50,
      opacity: 0.8,
      showOutline: true,
      outlineRenderMode: 'emulation-only',
      emulationScope: 'all',
      classification: {
        enabled: true,
        scheme: ui.scheme.value,
        classes: 4,
        classificationTargets: { color: true, opacity: true, width: true },
        colorMap: ['#1e3a8a', '#00bcd4', '#f59e0b', '#f43f5e']
      },
      adaptiveParams: {
        outlineOpacityRange: [0.4, Number(ui.range.value)],
        outlineWidthRange: [1, 6],
        boxOpacityRange: [0.3, 0.9]
      }
    });

    generateEntities();
    apply();
  }

  function focusCamera() {
    if (!viewer?.camera) return;
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        CENTER.lon,
        CENTER.lat,
        CENTER.height
      ),
      orientation: {
        heading: Cesium.Math.toRadians(-25),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0
      }
    });
  }

  function generateEntities() {
    viewer.entities.removeAll();
    entities = [];
    const lon0 = 139.71;
    const lat0 = 35.67;

    for (let i = 0; i < 240; i++) {
      const lon = lon0 + (Math.random() - 0.5) * 0.05;
      const lat = lat0 + (Math.random() - 0.5) * 0.04;
      const alt = 20 + Math.random() * 40;
      const value = Math.max(1, Math.round(5 + Math.random() * 80));
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
        properties: { value }
      });
      entities.push(entity);
    }
  }

  function apply() {
    const maxOpacity = Number(ui.range.value);
    heatbox.updateOptions({
      classification: {
        ...heatbox.options.classification,
        scheme: ui.scheme.value
      },
      adaptiveParams: {
        ...heatbox.options.adaptiveParams,
        outlineOpacityRange: [0.4, maxOpacity]
      }
    });

    heatbox.createFromEntities(viewer.entities.values, {
      classification: heatbox.options.classification
    }).then(() => {
      const stats = heatbox.getStatistics()?.classification;
      ui.breaks.textContent = Array.isArray(stats?.breaks) ? stats.breaks.join(', ') : '-';
      ui.rangeText.textContent = `[0.4, ${maxOpacity.toFixed(2)}]`;
    }).catch((error) => {
      console.error('Failed to render emulation opacity demo:', error);
    });
  }
})();
