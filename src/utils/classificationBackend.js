import * as ss from 'simple-statistics';

const defaultBackend = {
  quantile (values, p) {
    if (!Array.isArray(values) || values.length === 0) {
      return NaN;
    }
    const sorted = [...values].sort((a, b) => a - b);
    return ss.quantileSorted(sorted, p);
  },

  ckmeans (values, k) {
    if (!Array.isArray(values) || values.length === 0 || !k || k < 2) {
      return [];
    }
    try {
      return ss.ckmeans(values, k);
    } catch (_error) {
      return [];
    }
  },

  jenksBreaks (values, k) {
    if (!Array.isArray(values) || values.length === 0 || !k || k < 2) {
      return [];
    }
    const clusters = typeof this?.ckmeans === 'function'
      ? this.ckmeans(values, k)
      : [];
    const breaks = [];
    // 各クラスタの上限値（最後の値）を境界として返す（最終クラスタは除外）
    for (let i = 0; i < clusters.length - 1; i++) {
      const cluster = clusters[i];
      if (Array.isArray(cluster) && cluster.length > 0) {
        breaks.push(cluster[cluster.length - 1]);
      }
    }
    return breaks;
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
