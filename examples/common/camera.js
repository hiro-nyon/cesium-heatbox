/* global Cesium */
(function () {
  'use strict';

  // 新宿駅中心 (Shinjuku Station)
  const DEFAULT_CENTER = { lon: 139.6917, lat: 35.6895 };
  const DEFAULT_BOUNDS = {
    minLon: DEFAULT_CENTER.lon - 0.012,
    maxLon: DEFAULT_CENTER.lon + 0.012,
    minLat: DEFAULT_CENTER.lat - 0.012,
    maxLat: DEFAULT_CENTER.lat + 0.012,
    minAlt: 0,
    maxAlt: 220
  };

  const DEFAULT_OPTIONS = {
    altitude: 3200,
    headingDegrees: 0,
    pitchDegrees: -48,
    altitudeScale: 0.55,
    cameraLatOffset: -0.022
  };

  function toRadians(degrees) {
    return Cesium.Math.toRadians(degrees);
  }

  function clampPitch(degrees) {
    return Math.max(-85, Math.min(-20, degrees));
  }

  function normalizeBounds(bounds) {
    if (!bounds) return null;
    const requiredKeys = ['minLon', 'maxLon', 'minLat', 'maxLat'];
    const missing = requiredKeys.some((key) => typeof bounds[key] !== 'number' || Number.isNaN(bounds[key]));
    if (missing) return null;
    return {
      minLon: bounds.minLon,
      maxLon: bounds.maxLon,
      minLat: bounds.minLat,
      maxLat: bounds.maxLat,
      minAlt: typeof bounds.minAlt === 'number' ? bounds.minAlt : 0,
      maxAlt: typeof bounds.maxAlt === 'number' ? bounds.maxAlt : 0
    };
  }

  function computeAltitude(bounds, options) {
    const diagStart = Cesium.Cartesian3.fromDegrees(bounds.minLon, bounds.minLat, bounds.minAlt);
    const diagEnd = Cesium.Cartesian3.fromDegrees(bounds.maxLon, bounds.maxLat, bounds.maxAlt);
    const diagonal = Cesium.Cartesian3.distance(diagStart, diagEnd);
    const baseAltitude = options.altitude ?? DEFAULT_OPTIONS.altitude;
    const scale = options.altitudeScale ?? DEFAULT_OPTIONS.altitudeScale;
    const altitudeFromDiagonal = diagonal * scale + bounds.maxAlt + 2000;
    return Math.max(baseAltitude, altitudeFromDiagonal);
  }

  function buildCameraView(destination, orientation) {
    return { destination, orientation };
  }

  function applyCameraView(viewer, view) {
    if (!viewer || !viewer.camera || !view) return null;
    viewer.camera.setView(view);
    return view;
  }

  function cloneBounds(bounds) {
    if (!bounds) return null;
    return {
      minLon: bounds.minLon,
      maxLon: bounds.maxLon,
      minLat: bounds.minLat,
      maxLat: bounds.maxLat,
      minAlt: bounds.minAlt,
      maxAlt: bounds.maxAlt
    };
  }

  function getDefaultView(options = {}) {
    const merged = { ...DEFAULT_OPTIONS, ...options };
    const destination = Cesium.Cartesian3.fromDegrees(
      DEFAULT_CENTER.lon,
      DEFAULT_CENTER.lat + (merged.cameraLatOffset ?? 0),
      merged.altitude
    );
    const orientation = {
      heading: toRadians(merged.headingDegrees),
      pitch: toRadians(clampPitch(merged.pitchDegrees)),
      roll: 0
    };
    return buildCameraView(destination, orientation);
  }

  function getViewFromBounds(boundsInput, options = {}) {
    const bounds = normalizeBounds(boundsInput);
    if (!bounds) return null;
    const merged = { ...DEFAULT_OPTIONS, ...options };
    const centerLon = (bounds.minLon + bounds.maxLon) / 2;
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const altitude = computeAltitude(bounds, merged);
    // カメラ位置のオフセット（視界調整用）
    const cameraLatOffset = merged.cameraLatOffset ?? 0;
    const destination = Cesium.Cartesian3.fromDegrees(centerLon, centerLat + cameraLatOffset, altitude);
    const orientation = {
      heading: toRadians(merged.headingDegrees),
      pitch: toRadians(clampPitch(merged.pitchDegrees)),
      roll: 0
    };

    return buildCameraView(destination, orientation);
  }

  function setViewToShinjuku(viewer, options = {}) {
    const { useDefaultBounds = true, ...rest } = options;
    if (useDefaultBounds) {
      const viewFromBounds = getViewFromBounds(DEFAULT_BOUNDS, rest);
      if (viewFromBounds) {
        return applyCameraView(viewer, viewFromBounds);
      }
    }
    const view = getDefaultView(rest);
    return applyCameraView(viewer, view);
  }

  function setViewToBounds(viewer, boundsInput, options = {}) {
    const view = getViewFromBounds(boundsInput, options) || getDefaultView(options);
    return applyCameraView(viewer, view);
  }

  function focus(viewer, config = {}) {
    if (!viewer || !viewer.camera) return null;
    const {
      bounds,
      useDefaultBounds = true,
      ...options
    } = config;
    if (bounds) {
      return setViewToBounds(viewer, bounds, options);
    }
    if (useDefaultBounds) {
      return setViewToBounds(viewer, DEFAULT_BOUNDS, options);
    }
    return setViewToShinjuku(viewer, options);
  }

  window.HeatboxDemoCamera = {
    DEFAULT_CENTER,
    DEFAULT_BOUNDS,
    DEFAULT_OPTIONS,
    cloneBounds,
    setViewToBounds,
    setViewToShinjuku,
    getDefaultView,
    getViewFromBounds,
    focus,
    applyDefaultView: setViewToShinjuku,
    applyBoundsView: setViewToBounds
  };
})();
