import * as ss from 'simple-statistics';

const defaultBackend = {
  quantile (values, p) {
    if (!Array.isArray(values) || values.length === 0) {
      return NaN;
    }
    const sorted = [...values].sort((a, b) => a - b);
    return ss.quantileSorted(sorted, p);
  },

  jenksBreaks (values, k) {
    if (!Array.isArray(values) || values.length === 0 || !k || k < 2) {
      return [];
    }
    const clusters = ss.ckmeans(values, k);
    return clusters.map(cluster => cluster[0]);
  },

  summary (values) {
    if (!Array.isArray(values) || values.length === 0) {
      return {
        min: NaN,
        max: NaN,
        mean: NaN,
        stddev: NaN
      };
    }
    return {
      min: ss.min(values),
      max: ss.max(values),
      mean: ss.mean(values),
      stddev: ss.standardDeviation(values)
    };
  }
};

let backend = defaultBackend;

export function setClassificationBackend (nextBackend) {
  backend = { ...backend, ...(nextBackend || {}) };
}

export function getBackend () {
  return backend;
}

