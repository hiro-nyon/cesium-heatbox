import { TemporalWorkerBridge } from '../../../src/core/temporal/TemporalWorkerBridge.js';

describe('TemporalWorkerBridge', () => {
  function createWorker() {
    return {
      postMessage: jest.fn(),
      terminate: jest.fn(),
      onmessage: null,
      onerror: null
    };
  }

  test('disabled bridge returns null without creating a worker', async () => {
    const factory = jest.fn();
    const bridge = new TemporalWorkerBridge({ useWorker: false, _workerFactory: factory });

    await expect(bridge.run('interpolate', {})).resolves.toBeNull();
    expect(bridge.isEnabled()).toBe(false);
    expect(factory).not.toHaveBeenCalled();
  });

  test('posts a task and resolves the matching worker response', async () => {
    const worker = createWorker();
    const bridge = new TemporalWorkerBridge({ useWorker: true, _workerFactory: () => worker });

    const pending = bridge.run('stats', { values: [1, 2] });
    expect(worker.postMessage).toHaveBeenCalledWith({
      id: 1,
      task: 'stats',
      payload: { values: [1, 2] }
    });

    worker.onmessage({ data: { id: 999, result: 'ignored' } });
    worker.onmessage({ data: { id: 1, result: { max: 2 } } });
    await expect(pending).resolves.toEqual({ max: 2 });

    bridge.destroy();
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  test('rejects worker task errors', async () => {
    const worker = createWorker();
    const bridge = new TemporalWorkerBridge({ useWorker: true, _workerFactory: () => worker });
    const pending = bridge.run('stats', {});

    worker.onmessage({ data: { id: 1, error: 'calculation failed' } });

    await expect(pending).rejects.toThrow('calculation failed');
  });

  test('worker failure rejects all pending tasks and terminates worker', async () => {
    const worker = createWorker();
    const bridge = new TemporalWorkerBridge({ useWorker: true, _workerFactory: () => worker });
    const first = bridge.run('first', {});
    const second = bridge.run('second', {});
    const error = new Error('worker crashed');

    worker.onerror(error);

    await expect(first).rejects.toBe(error);
    await expect(second).rejects.toBe(error);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(bridge._worker).toBeNull();
  });

  test('destroy rejects pending work and revokes a worker URL', async () => {
    const worker = createWorker();
    const bridge = new TemporalWorkerBridge({ useWorker: true, _workerFactory: () => worker });
    const pending = bridge.run('pending', {});
    const revokeSpy = jest.fn();
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeSpy
    });
    bridge._workerUrl = 'blob:test';

    bridge.destroy();

    await expect(pending).rejects.toThrow('Temporal worker bridge destroyed');
    expect(revokeSpy).toHaveBeenCalledWith('blob:test');
  });

  test('factory initialization errors fall back to null', async () => {
    const bridge = new TemporalWorkerBridge({
      useWorker: true,
      _workerFactory: () => {
        throw new Error('unavailable');
      }
    });

    await expect(bridge.run('stats', {})).resolves.toBeNull();
  });
});
