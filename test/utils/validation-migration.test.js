import { validateAndNormalizeOptions } from '../../src/utils/validation.js';
import { clearWarnings } from '../../src/utils/deprecate.js';
import { Logger } from '../../src/utils/logger.js';

describe('Validation migration mapping (v0.1.12)', () => {
  beforeEach(() => {
    clearWarnings();
    jest.spyOn(Logger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('outlineEmulation boolean → outlineRenderMode/emulationScope', () => {
    const a = validateAndNormalizeOptions({ outlineEmulation: true });
    expect(a.outlineRenderMode).toBe('emulation-only');
    expect(a.emulationScope).toBe('all');

    const b = validateAndNormalizeOptions({ outlineEmulation: false });
    expect(b.outlineRenderMode).toBe('standard');
    expect(b.emulationScope === undefined || b.emulationScope === 'off').toBe(true);
  });

  test('outlineEmulation string variants → mapping', () => {
    const off = validateAndNormalizeOptions({ outlineEmulation: 'off' });
    expect(off.outlineRenderMode).toBe('standard');

    const all = validateAndNormalizeOptions({ outlineEmulation: 'all' });
    expect(all.outlineRenderMode).toBe('emulation-only');
    expect(all.emulationScope).toBe('all');

    const topn = validateAndNormalizeOptions({ outlineEmulation: 'topn' });
    expect(topn.outlineRenderMode).toBe('standard');
    expect(topn.emulationScope).toBe('topn');

    const nontopn = validateAndNormalizeOptions({ outlineEmulation: 'non-topn' });
    expect(nontopn.outlineRenderMode).toBe('standard');
    expect(nontopn.emulationScope).toBe('non-topn');
  });

  test('legacy preset names → new names', () => {
    const a = validateAndNormalizeOptions({ outlineWidthPreset: 'uniform' });
    expect(a.outlineWidthPreset).toBe('medium');

    const b = validateAndNormalizeOptions({ outlineWidthPreset: 'adaptive-density' });
    expect(b.outlineWidthPreset).toBe('adaptive');

    const c = validateAndNormalizeOptions({ outlineWidthPreset: 'topn-focus' });
    expect(c.outlineWidthPreset).toBe('thick');
  });

  test('fitViewOptions pitch/heading → pitchDegrees/headingDegrees', () => {
    const opt = validateAndNormalizeOptions({
      fitViewOptions: { paddingPercent: 0.2, pitch: -80, heading: 33.3 }
    });
    expect(opt.fitViewOptions.paddingPercent).toBeCloseTo(0.2, 6);
    expect(opt.fitViewOptions.pitchDegrees).toBeCloseTo(-80, 6);
    expect(opt.fitViewOptions.headingDegrees).toBeCloseTo(33.3, 6);
  });

  test('warnOnce emits only one unique message per code', () => {
    const warnSpy = jest.spyOn(Logger, 'warn').mockImplementation(() => {});
    clearWarnings();

    // Trigger the same deprecation twice
    validateAndNormalizeOptions({ outlineEmulation: true });
    validateAndNormalizeOptions({ outlineEmulation: true });

    // Only a single unique deprecation message should appear for the same code
    const calls = warnSpy.mock.calls.map(args => args.join(' '));
    const outlineEmulationWarnings = calls.filter(msg => msg.includes('outlineEmulation is deprecated'));
    const unique = new Set(outlineEmulationWarnings);
    expect(outlineEmulationWarnings.length).toBeGreaterThanOrEqual(1);
    expect(unique.size).toBe(1);
  });
});
