/* global Cesium */
(function () {
  'use strict';

  const DEFAULT_CENTER = { lon: 139.6917, lat: 35.6895 };

  const DEFAULT_OPTIONS = {
    altitude: 12000,
    headingDegrees: 25,
    pitchDegrees: -55,
    altitudeScale: 1.8
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

  function getDefaultView(options = {}) {
    const merged = { ...DEFAULT_OPTIONS, ...options };
    const destination = Cesium.Cartesian3.fromDegrees(
      DEFAULT_CENTER.lon,
      DEFAULT_CENTER.lat,
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
    const view = getDefaultView(options);
    return applyCameraView(viewer, view);
  }

  function setViewToBounds(viewer, boundsInput, options = {}) {
    const view = getViewFromBounds(boundsInput, options) || getDefaultView(options);
    return applyCameraView(viewer, view);
  }

  function focus(viewer, config = {}) {
    if (!viewer || !viewer.camera) return null;
    const { bounds, ...options } = config;
    if (bounds) {
      return setViewToBounds(viewer, bounds, options);
    }
    return setViewToShinjuku(viewer, options);
  }

  window.HeatboxDemoCamera = {
    DEFAULT_CENTER,
    DEFAULT_OPTIONS,
    setViewToBounds,
    setViewToShinjuku,
    getDefaultView,
    getViewFromBounds,
    focus,
    applyDefaultView: setViewToShinjuku,
    applyBoundsView: setViewToBounds
  };
})();
