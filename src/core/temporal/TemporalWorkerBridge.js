import { Logger } from '../../utils/logger.js';
import { getTemporalWorkerScript } from './TemporalWorkerScript.js';

export class TemporalWorkerBridge {
  constructor(options = {}) {
    this._enabled = Boolean(options.useWorker);
    this._workerFactory = typeof options._workerFactory === 'function' ? options._workerFactory : null;
    this._worker = null;
    this._workerUrl = null;
    this._requestId = 0;
    this._pending = new Map();
  }

  isEnabled() {
    return this._enabled;
  }

  async run(task, payload) {
    if (!this._enabled) {
      return null;
    }

    const worker = this._ensureWorker();
    if (!worker) {
      return null;
    }

    const requestId = ++this._requestId;

    return new Promise((resolve, reject) => {
      this._pending.set(requestId, { resolve, reject });
      worker.postMessage({
        id: requestId,
        task,
        payload
      });
    });
  }

  destroy() {
    for (const pending of this._pending.values()) {
      pending.reject(new Error('Temporal worker bridge destroyed'));
    }
    this._pending.clear();

    if (this._worker && typeof this._worker.terminate === 'function') {
      this._worker.terminate();
    }
    this._worker = null;

    if (this._workerUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(this._workerUrl);
    }
    this._workerUrl = null;
  }

  _ensureWorker() {
    if (this._worker) {
      return this._worker;
    }

    try {
      this._worker = this._workerFactory
        ? this._workerFactory()
        : this._createBrowserWorker();
    } catch (error) {
      Logger.warn('Failed to initialize temporal worker, falling back to main thread:', error);
      this._worker = null;
    }

    if (!this._worker) {
      return null;
    }

    this._worker.onmessage = event => {
      const { id, result, error } = event.data || {};
      const pending = this._pending.get(id);
      if (!pending) {
        return;
      }

      this._pending.delete(id);
      if (error) {
        pending.reject(new Error(error));
        return;
      }
      pending.resolve(result);
    };

    this._worker.onerror = error => {
      Logger.warn('Temporal worker failed, falling back to main thread:', error);
      for (const pending of this._pending.values()) {
        pending.reject(error instanceof Error ? error : new Error(String(error)));
      }
      this._pending.clear();

      if (this._worker && typeof this._worker.terminate === 'function') {
        this._worker.terminate();
      }
      this._worker = null;
    };

    return this._worker;
  }

  _createBrowserWorker() {
    if (
      typeof Worker === 'undefined' ||
      typeof Blob === 'undefined' ||
      typeof URL === 'undefined' ||
      typeof URL.createObjectURL !== 'function'
    ) {
      return null;
    }

    const script = getTemporalWorkerScript();
    this._workerUrl = URL.createObjectURL(
      new Blob([script], { type: 'text/javascript' })
    );
    return new Worker(this._workerUrl);
  }
}
