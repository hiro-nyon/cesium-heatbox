import * as Cesium from 'cesium';

/**
 * Resolve Cesium Property or raw value to plain data.
 * CesiumのPropertyまたは生値をプレーンな値に解決します。
 * @param {*} property - Cesium Property / raw value
 * @param {Cesium.JulianDate} [time] - Evaluation time / 評価時刻
 * @returns {*} resolved value / 解決後の値
 */
export function resolvePropertyValue(property, time = Cesium.JulianDate.now()) {
  if (property == null) {
    return property;
  }

  try {
    if (typeof property.getValue === 'function') {
      return property.getValue(time);
    }

    if (typeof property.get === 'function') {
      return property.get(time);
    }
  } catch (_error) {
    return undefined;
  }

  return property;
}
