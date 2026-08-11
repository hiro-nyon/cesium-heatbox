(function exposeLatestPlaygroundFeatures(global) {
  'use strict';

  const VERSION = '1.3.7-alpha.3';

  const PALETTES = {
    viridis: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'],
    inferno: ['#000004', '#420a68', '#932667', '#dd513a', '#fca50a', '#fcffa4'],
    heat: ['#152a6a', '#276fbf', '#f1d35a', '#ed7a32', '#b52422']
  };

  function getElementValue(doc, id, fallback) {
    const element = doc.getElementById(id);
    return element && element.value !== undefined ? element.value : fallback;
  }

  function getElementChecked(doc, id, fallback = false) {
    const element = doc.getElementById(id);
    return element ? Boolean(element.checked) : fallback;
  }

  function getPropertyValue(value, time) {
    if (value && typeof value.getValue === 'function') {
      try { return value.getValue(time); } catch (_) { return undefined; }
    }
    return value;
  }

  function readEntityProperties(entity, time) {
    const bag = entity && entity.properties;
    if (!bag) return {};
    if (typeof bag.getValue === 'function') {
      try { return bag.getValue(time) || {}; } catch (_) { return {}; }
    }
    const result = {};
    Object.keys(bag).forEach((key) => {
      const resolved = getPropertyValue(bag[key], time);
      if (resolved !== undefined) result[key] = resolved;
    });
    return result;
  }

  function buildClassification(doc) {
    const scheme = getElementValue(doc, 'classificationScheme', 'quantile');
    if (scheme === 'off') return false;

    const classes = Math.max(2, Math.min(9, Number(getElementValue(doc, 'classificationClasses', 5)) || 5));
    const paletteName = getElementValue(doc, 'classificationPalette', 'viridis');
    const classification = {
      enabled: true,
      scheme,
      classes,
      colorMap: (PALETTES[paletteName] || PALETTES.viridis).slice(),
      classificationTargets: {
        color: true,
        opacity: getElementChecked(doc, 'classificationOpacity'),
        width: getElementChecked(doc, 'classificationWidth')
      }
    };

    if (scheme === 'threshold') {
      classification.thresholds = [20, 40, 60, 80];
    }

    return classification;
  }

  function buildTemporalOptions(doc, viewer, entities) {
    if (!getElementChecked(doc, 'temporalDemo')) return null;
    const Cesium = global.Cesium;
    if (!Cesium || !Array.isArray(entities) || entities.length === 0) return null;

    const referenceTime = viewer && viewer.clock ? viewer.clock.currentTime : Cesium.JulianDate.now();
    const start = Cesium.JulianDate.fromIso8601('2026-08-11T00:00:00Z');
    const data = [];

    for (let sliceIndex = 0; sliceIndex < 4; sliceIndex += 1) {
      const sliceStart = Cesium.JulianDate.addHours(start, sliceIndex, new Cesium.JulianDate());
      const sliceStop = Cesium.JulianDate.addHours(start, sliceIndex + 1, new Cesium.JulianDate());
      const factor = [0.62, 1, 1.35, 0.82][sliceIndex];
      const sliceEntities = entities.map((entity, index) => {
        const position = getPropertyValue(entity.position, referenceTime) || entity.position;
        const properties = readEntityProperties(entity, referenceTime);
        const baseValue = Number(properties.value ?? properties.weight ?? properties.intensity ?? 1) || 1;
        return {
          id: `temporal-${sliceIndex}-${entity.id || index}`,
          position,
          properties: {
            ...properties,
            value: Math.max(0.01, baseValue * factor),
            weight: Math.max(0.01, baseValue * factor)
          }
        };
      });
      data.push({
        start: Cesium.JulianDate.toIso8601(sliceStart),
        stop: Cesium.JulianDate.toIso8601(sliceStop),
        data: sliceEntities
      });
    }

    return {
      enabled: true,
      data,
      classificationScope: getElementValue(doc, 'temporalClassificationScope', 'global'),
      updateInterval: 150,
      outOfRangeBehavior: 'hold',
      overlapResolution: 'prefer-later',
      interpolate: true,
      useWorker: true
    };
  }

  function buildOptions(doc, viewer, entities) {
    const classification = buildClassification(doc);
    const aggregationEnabled = getElementChecked(doc, 'aggregationEnabled');
    const spatialIdEnabled = getElementChecked(doc, 'spatialIdEnabled');
    const spatialZoom = getElementValue(doc, 'spatialIdZoom', 'auto');
    const temporal = buildTemporalOptions(doc, viewer, entities);

    return {
      classification,
      classificationTargets: classification && classification.classificationTargets,
      adaptiveParams: {
        outlineWidthRange: classification?.classificationTargets.width ? [1, 6] : null,
        boxOpacityRange: classification?.classificationTargets.opacity ? [0.2, 0.92] : null,
        outlineOpacityRange: null,
        adaptiveOpacityEnabled: Boolean(classification?.classificationTargets.opacity)
      },
      aggregation: {
        enabled: aggregationEnabled,
        byProperty: aggregationEnabled ? getElementValue(doc, 'aggregationProperty', 'clusterId') : null,
        showInDescription: true,
        topN: 6
      },
      spatialId: {
        enabled: spatialIdEnabled,
        mode: 'tile-grid',
        provider: 'ouranos-gex',
        zoom: spatialZoom === 'auto' ? 'auto' : Number(spatialZoom),
        zoomControl: spatialZoom === 'auto' ? 'auto' : 'manual',
        zoomTolerancePct: 10
      },
      temporal
    };
  }

  function prepareTemporalViewer(viewer, temporal) {
    const Cesium = global.Cesium;
    if (!Cesium || !viewer || !temporal?.enabled || !temporal.data?.length) return;
    const start = Cesium.JulianDate.fromIso8601(temporal.data[0].start);
    const stop = Cesium.JulianDate.fromIso8601(temporal.data[temporal.data.length - 1].stop);
    viewer.clock.startTime = start.clone();
    viewer.clock.stopTime = stop.clone();
    viewer.clock.currentTime = start.clone();
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewer.clock.multiplier = 240;
    viewer.clock.shouldAnimate = true;
    if (viewer.timeline && typeof viewer.timeline.zoomTo === 'function') viewer.timeline.zoomTo(start, stop);
  }

  function renderLegend(heatbox, container, enabled) {
    if (!heatbox || !container) return;
    if (!enabled) {
      if (typeof heatbox.destroyLegend === 'function') heatbox.destroyLegend();
      container.replaceChildren();
      return;
    }
    if (typeof heatbox.createLegend === 'function') heatbox.createLegend(container);
  }

  function renderFeatureStats(doc, stats, options) {
    const target = doc.getElementById('latestFeatureStats');
    if (!target) return;
    const classification = stats?.classification;
    const spatial = stats?.spatialId;
    const layers = Array.isArray(stats?.layers) ? stats.layers : [];
    const rows = [
      ['Classification', classification?.scheme || 'off'],
      ['Temporal', options?.temporal?.enabled ? '4 slices' : 'off'],
      ['Spatial ID', spatial?.enabled ? `z${spatial.zoom ?? 'auto'}` : 'off'],
      ['Layers', layers.length ? layers.map((layer) => layer.key || layer.name).slice(0, 3).join(', ') : 'off']
    ];
    target.replaceChildren(...rows.map(([label, value]) => {
      const row = doc.createElement('div');
      const labelElement = doc.createElement('span');
      const valueElement = doc.createElement('strong');
      labelElement.textContent = label;
      valueElement.textContent = String(value);
      row.append(labelElement, valueElement);
      return row;
    }));
  }

  global.HeatboxLatestPlayground = {
    VERSION,
    PALETTES,
    buildClassification,
    buildOptions,
    prepareTemporalViewer,
    renderLegend,
    renderFeatureStats
  };
}(typeof window !== 'undefined' ? window : globalThis));
