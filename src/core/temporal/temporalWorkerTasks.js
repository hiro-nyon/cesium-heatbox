export function interpolateTemporalItem(previous, next, ratio) {
  const clone = { ...(previous || next) };
  const sourceKeys = new Set([
    ...Object.keys(previous || {}),
    ...Object.keys(next || {})
  ]);

  for (const key of sourceKeys) {
    if (key === 'position') {
      clone.position = previous?.position ?? next?.position;
      continue;
    }

    const previousValue = previous?.[key];
    const nextValue = next?.[key];

    if (typeof previousValue === 'number' && typeof nextValue === 'number') {
      clone[key] = previousValue + ((nextValue - previousValue) * ratio);
      continue;
    }

    if (
      previousValue &&
      nextValue &&
      typeof previousValue === 'object' &&
      typeof nextValue === 'object' &&
      !Array.isArray(previousValue) &&
      !Array.isArray(nextValue)
    ) {
      clone[key] = { ...previousValue };
      for (const nestedKey of new Set([...Object.keys(previousValue), ...Object.keys(nextValue)])) {
        const left = previousValue[nestedKey];
        const right = nextValue[nestedKey];
        clone[key][nestedKey] = (typeof left === 'number' && typeof right === 'number')
          ? left + ((right - left) * ratio)
          : (left ?? right);
      }
      continue;
    }

    clone[key] = previousValue ?? nextValue;
  }

  return clone;
}

export function interpolateTemporalData(previousData = [], nextData = [], ratio) {
  const maxLength = Math.max(previousData.length, nextData.length);
  const merged = [];

  for (let index = 0; index < maxLength; index++) {
    const previous = previousData[index] || previousData.find(item => item?.id === nextData[index]?.id) || null;
    const next = nextData[index] || nextData.find(item => item?.id === previousData[index]?.id) || null;

    if (!previous && !next) {
      continue;
    }

    merged.push(interpolateTemporalItem(previous || next, next || previous, ratio));
  }

  return merged;
}

export function calculateTemporalMedian(sortedValues) {
  if (sortedValues.length === 0) return 0;
  const mid = Math.floor(sortedValues.length / 2);
  if (sortedValues.length % 2 === 0) {
    return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
  }
  return sortedValues[mid];
}

export function calculateTemporalQuantiles(sortedValues, quantiles) {
  return quantiles.map(q => {
    const index = Math.floor(sortedValues.length * q);
    return sortedValues[Math.min(index, sortedValues.length - 1)];
  });
}

export function calculateTemporalStats(entries = [], valueProperty = 'weight') {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let count = 0;
  const allValues = [];

  for (const entry of entries) {
    if (!Array.isArray(entry?.data)) continue;

    for (const point of entry.data) {
      const value = point?.[valueProperty] ?? 1;
      if (typeof value !== 'number') continue;

      min = Math.min(min, value);
      max = Math.max(max, value);
      sum += value;
      count++;
      allValues.push(value);
    }
  }

  if (count === 0) {
    return null;
  }

  allValues.sort((a, b) => a - b);

  return {
    min,
    max,
    minCount: min,
    maxCount: max,
    mean: sum / count,
    median: calculateTemporalMedian(allValues),
    quantiles: calculateTemporalQuantiles(allValues, [0.25, 0.5, 0.75]),
    domain: [min, max],
    count
  };
}
