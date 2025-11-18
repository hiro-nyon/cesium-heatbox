import * as Cesium from 'cesium';
import { interpolateColorMap } from './colorMap.js';
import { getBackend } from './classificationBackend.js';

function normalizeColorStops (colorMap) {
  if (!Array.isArray(colorMap) || colorMap.length === 0) {
    return null;
  }

  const isStopObject = colorMap.every((entry) => entry && typeof entry === 'object' && Object.prototype.hasOwnProperty.call(entry, 'position'));
  if (isStopObject) {
    return colorMap;
  }

  const lastIndex = colorMap.length > 1 ? colorMap.length - 1 : 1;
  return colorMap.map((color, index) => ({
    position: colorMap.length === 1 ? 0 : index / lastIndex,
    color
  }));
}

export function createClassifier (options = {}) {
  const {
    scheme = 'linear',
    values = null,
    domain = null,
    classes: rawClasses = 5,
    thresholds = null,
    colorMap = null
  } = options;

  const classes = Math.max(2, rawClasses || 2);

  let min = 0;
  let max = 1;

  if (Array.isArray(domain) && domain.length === 2) {
    [min, max] = domain;
  } else if (Array.isArray(values) && values.length > 0) {
    const backend = getBackend();
    const stats = backend.summary(values);
    min = stats.min;
    max = stats.max;
  }

  if (max === min) {
    max = min + 1;
  }

  let normalize;
  let breaks = [];

  switch (scheme) {
    case 'linear': {
      const span = max - min || 1;
      normalize = (value) => (value - min) / span;
      breaks = [min, max];
      break;
    }
    case 'log': {
      if (min <= 0) {
        min = 1;
      }
      const logMin = Math.log(min);
      const logMax = Math.log(max > min ? max : min + 1);
      const span = logMax - logMin || 1;
      normalize = (value) => {
        if (value <= 0) return 0;
        const v = Math.log(value);
        return (v - logMin) / span;
      };
      breaks = [min, max];
      break;
    }
    case 'equal-interval': {
      breaks = [];
      for (let i = 0; i <= classes; i++) {
        breaks.push(min + (max - min) * (i / classes));
      }
      normalize = (value) => {
        for (let i = 0; i < breaks.length - 1; i++) {
          const a = breaks[i];
          const b = breaks[i + 1];
          if (value <= b) {
            const span = b - a || 1;
            return (i + (value - a) / span) / classes;
          }
        }
        return 1;
      };
      break;
    }
    case 'quantize': {
      breaks = [];
      for (let i = 0; i <= classes; i++) {
        breaks.push(min + (max - min) * (i / classes));
      }
      normalize = (value) => {
        for (let i = 0; i < breaks.length - 1; i++) {
          if (value <= breaks[i + 1]) {
            return i / (classes - 1);
          }
        }
        return 1;
      };
      break;
    }
    case 'threshold': {
      if (!Array.isArray(thresholds) || thresholds.length === 0) {
        throw new Error('threshold scheme requires thresholds array');
      }
      breaks = [min, ...thresholds, max];
      normalize = (value) => {
        for (let i = 0; i < breaks.length - 1; i++) {
          if (value <= breaks[i + 1]) {
            return i / (breaks.length - 2);
          }
        }
        return 1;
      };
      break;
    }
    case 'quantile':
    case 'jenks':
      throw new Error(`scheme '${scheme}' is not supported in v1.0.0 (planned for v1.1.0)`);
    default:
      throw new Error(`unknown classification scheme: ${scheme}`);
  }

  const normalizedStops = normalizeColorStops(colorMap);
  const getColorFromPalette = normalizedStops
    ? (t) => interpolateColorMap(normalizedStops, Math.max(0, Math.min(1, t)))
    : (t) => Cesium.Color.lerp(
        Cesium.Color.BLUE || new Cesium.Color(0, 0, 1, 1),
        Cesium.Color.RED || new Cesium.Color(1, 0, 0, 1),
        Math.max(0, Math.min(1, t)),
        new Cesium.Color()
      );

  const classCount = scheme === 'threshold'
    ? Math.max(1, (breaks.length > 1 ? breaks.length - 1 : classes))
    : Math.max(1, classes);

  const getColorForClass = (classIndex) => {
    const safeIndex = Number.isFinite(classIndex) ? Math.max(0, Math.min(classCount - 1, Math.round(classIndex))) : 0;
    if (classCount === 1) {
      return getColorFromPalette(0);
    }
    const ratio = safeIndex / (classCount - 1);
    return getColorFromPalette(ratio);
  };

  const getColor = (t) => getColorFromPalette(Math.max(0, Math.min(1, t)));

  let classify;

  if (scheme === 'threshold') {
    classify = (value) => {
      for (let i = 0; i < breaks.length - 1; i++) {
        if (value <= breaks[i + 1]) {
          return i;
        }
      }
      return breaks.length - 2;
    };
  } else {
    classify = (value) => {
      const n = Math.max(0, Math.min(1, normalize(value)));
      return Math.min(classes - 1, Math.floor(n * classes));
    };
  }

  return {
    scheme,
    domain: [min, max],
    breaks,
    classes: scheme === 'threshold' ? (breaks.length > 1 ? breaks.length - 1 : classes) : classes,
    normalize,
    getColorForClass,
    getColor,
    classify
  };
}
