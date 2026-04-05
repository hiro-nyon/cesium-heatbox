import {
  calculateTemporalMedian,
  calculateTemporalQuantiles,
  calculateTemporalStats,
  interpolateTemporalData,
  interpolateTemporalItem
} from './temporalWorkerTasks.js';

export function getTemporalWorkerScript() {
  return `
const interpolateTemporalItem = ${interpolateTemporalItem.toString()};
const interpolateTemporalData = ${interpolateTemporalData.toString()};
const calculateTemporalMedian = ${calculateTemporalMedian.toString()};
const calculateTemporalQuantiles = ${calculateTemporalQuantiles.toString()};
const calculateTemporalStats = ${calculateTemporalStats.toString()};

self.onmessage = function onmessage(event) {
  const { id, task, payload } = event.data || {};

  try {
    let result = null;

    if (task === 'interpolate') {
      result = interpolateTemporalData(payload.previousData, payload.nextData, payload.ratio);
    } else if (task === 'stats') {
      result = calculateTemporalStats(payload.entries, payload.valueProperty);
    } else {
      throw new Error('Unsupported temporal worker task: ' + task);
    }

    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
`;
}
