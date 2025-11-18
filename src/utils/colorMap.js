import * as Cesium from 'cesium';

function parseColor (input) {
  if (input instanceof Cesium.Color) {
    return input;
  }
  if (Array.isArray(input)) {
    const [r, g, b, a = 1] = input;
    return new Cesium.Color(r, g, b, a);
  }
  if (typeof input === 'string') {
    return Cesium.Color.fromCssColorString(input);
  }
  return Cesium.Color.WHITE.clone();
}

export function interpolateColorMap (stops, t) {
  if (!Array.isArray(stops) || stops.length === 0) {
    return Cesium.Color.WHITE.clone();
  }

  if (stops.length === 1) {
    return parseColor(stops[0].color).clone();
  }

  const clampedT = Math.max(0, Math.min(1, t));
  const sorted = [...stops].sort((a, b) => a.position - b.position);

  if (clampedT <= sorted[0].position) {
    return parseColor(sorted[0].color).clone();
  }
  if (clampedT >= sorted[sorted.length - 1].position) {
    return parseColor(sorted[sorted.length - 1].color).clone();
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const left = sorted[i];
    const right = sorted[i + 1];
    if (clampedT >= left.position && clampedT <= right.position) {
      const span = right.position - left.position || 1;
      const localT = (clampedT - left.position) / span;
      const leftColor = parseColor(left.color);
      const rightColor = parseColor(right.color);
      return Cesium.Color.lerp(leftColor, rightColor, localT, new Cesium.Color());
    }
  }

  return parseColor(sorted[sorted.length - 1].color).clone();
}

export { parseColor };
