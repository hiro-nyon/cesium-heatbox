import { ZFXYConverter } from './ZFXYConverter.js';

/**
 * Compute SpatialIdEdgeCaseMetrics for a given adapter instance.
 * 指定されたアダプタに対する SpatialIdEdgeCaseMetrics を計算します。
 *
 * 主にテスト用の軽量なQAヘルパーであり、本番運用では明示的に呼び出さない限り
 * メトリクスは計算されません。
 *
 * @param {import('./SpatialIdAdapter.js').SpatialIdAdapter} adapter - Loaded SpatialIdAdapter instance
 * @returns {import('../../Heatbox.js').SpatialIdEdgeCaseMetrics}
 */
export function computeSpatialIdEdgeCaseMetrics(adapter) {
  const datelineZoom = 24;
  const datelineN = Math.pow(2, datelineZoom);
  const datelineY = Math.floor(datelineN / 2);
  const datelineF = 0;

  const tileLeft = { z: datelineZoom, f: datelineF, x: 0, y: datelineY };
  const tileRight = { z: datelineZoom, f: datelineF, x: datelineN - 1, y: datelineY };

  const neighborsLeft = adapter.neighbors(tileLeft);
  const neighborsRight = adapter.neighbors(tileRight);

  let datelineNeighborsChecked = neighborsLeft.length + neighborsRight.length;
  let datelineNeighborsMismatched = 0;

  const hasTile = (list, target) =>
    list.some(n => n.z === target.z && n.f === target.f && n.x === target.x && n.y === target.y);

  if (!hasTile(neighborsLeft, tileRight)) {
    datelineNeighborsMismatched++;
  }
  if (!hasTile(neighborsRight, tileLeft)) {
    datelineNeighborsMismatched++;
  }

  // Polar tiles: evaluate a few representative tiles near ±85°
  const polarZoom = 20;
  const polarTestLats = [80, 82.5, 85];
  const polarLng = 0;

  let polarTilesChecked = 0;
  let polarMaxRelativeErrorXY = 0;

  polarTestLats.forEach((latDeg) => {
    const resultAdapter = adapter.getVoxelBounds(polarLng, latDeg, 0, polarZoom);
    const resultMercator = ZFXYConverter.convert(polarLng, latDeg, 0, polarZoom);

    const adapterLngs = resultAdapter.vertices.map(v => v.lng);
    const adapterLats = resultAdapter.vertices.map(v => v.lat);
    const mercLngs = resultMercator.vertices.map(v => v.lng);
    const mercLats = resultMercator.vertices.map(v => v.lat);

    const widthAdapterX = Math.max(...adapterLngs) - Math.min(...adapterLngs);
    const heightAdapterY = Math.max(...adapterLats) - Math.min(...adapterLats);
    const widthMercX = Math.max(...mercLngs) - Math.min(...mercLngs);
    const heightMercY = Math.max(...mercLats) - Math.min(...mercLats);

    if (widthMercX > 0 && heightMercY > 0) {
      const relativeErrorX = Math.abs(widthAdapterX - widthMercX) / widthMercX;
      const relativeErrorY = Math.abs(heightAdapterY - heightMercY) / heightMercY;
      const maxRelativeErrorXY = Math.max(relativeErrorX, relativeErrorY);
      if (maxRelativeErrorXY > polarMaxRelativeErrorXY) {
        polarMaxRelativeErrorXY = maxRelativeErrorXY;
      }
    }

    polarTilesChecked++;
  });

  // Hemisphere bounds: simple consistency check using dateline tiles as proxy
  const hemisphereBoundsChecked = 1;
  const hemisphereBoundsMismatched = datelineNeighborsMismatched > 0 ? 1 : 0;

  return {
    datelineNeighborsChecked,
    datelineNeighborsMismatched,
    polarTilesChecked,
    polarMaxRelativeErrorXY,
    hemisphereBoundsChecked,
    hemisphereBoundsMismatched
  };
}

