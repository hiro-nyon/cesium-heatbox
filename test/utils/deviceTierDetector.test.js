import { applyAutoRenderBudget, detectDeviceTier } from '../../src/utils/deviceTierDetector.js';
/* global document, navigator */

describe('deviceTierDetector', () => {
  const originalDescriptors = {};

  beforeEach(() => {
    for (const [object, key] of [[navigator, 'deviceMemory'], [navigator, 'hardwareConcurrency'], [navigator, 'userAgent']]) {
      originalDescriptors[key] = Object.getOwnPropertyDescriptor(object, key);
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
    for (const [key, descriptor] of Object.entries(originalDescriptors)) {
      if (descriptor) {
        Object.defineProperty(navigator, key, descriptor);
      } else {
        delete navigator[key];
      }
    }
  });

  function setNavigatorValue(key, value) {
    Object.defineProperty(navigator, key, { configurable: true, value });
  }

  function mockWebGL({ webgl2 = true, maxTextureSize = 8192 } = {}) {
    const createElement = document.createElement.bind(document);
    const gl = {
      MAX_TEXTURE_SIZE: 'MAX_TEXTURE_SIZE',
      MAX_RENDERBUFFER_SIZE: 'MAX_RENDERBUFFER_SIZE',
      getParameter: jest.fn(parameter => parameter === 'MAX_TEXTURE_SIZE' ? maxTextureSize : 8192)
    };
    jest.spyOn(document, 'createElement').mockImplementation(tagName => {
      const element = createElement(tagName);
      if (tagName === 'canvas') {
        element.getContext = jest.fn(type => {
          if (type === 'webgl2') return webgl2 ? gl : null;
          if (type === 'webgl') return gl;
          return null;
        });
      }
      return element;
    });
  }

  test('deviceMemoryを優先してhigh tierを選ぶ', () => {
    setNavigatorValue('deviceMemory', 16);
    setNavigatorValue('userAgent', 'Chrome/120');
    mockWebGL();

    expect(detectDeviceTier()).toEqual(expect.objectContaining({
      tier: 'high',
      maxRenderVoxels: 20000,
      detectionMethod: 'deviceMemory'
    }));
  });

  test('WebGL制限によりtierを引き下げる', () => {
    setNavigatorValue('deviceMemory', 16);
    setNavigatorValue('userAgent', 'Chrome/120');
    mockWebGL({ webgl2: false, maxTextureSize: 2048 });

    expect(detectDeviceTier()).toEqual(expect.objectContaining({
      tier: 'mid',
      maxRenderVoxels: 11500,
      detectionMethod: 'deviceMemory+webglLimits'
    }));
  });

  test('Safariでは描画上限を12000に抑える', () => {
    setNavigatorValue('deviceMemory', 16);
    setNavigatorValue('userAgent', 'Version/17.0 Safari/605.1.15');
    mockWebGL();

    expect(detectDeviceTier().maxRenderVoxels).toBe(12000);
  });

  test('auto render budgetだけを検出結果で置換する', () => {
    const manual = { renderBudgetMode: 'manual', maxRenderVoxels: 1234 };
    expect(applyAutoRenderBudget(manual)).toBe(manual);

    setNavigatorValue('deviceMemory', 2);
    setNavigatorValue('userAgent', 'Chrome/120');
    mockWebGL();
    const automatic = applyAutoRenderBudget({ renderBudgetMode: 'auto', maxRenderVoxels: 'auto' });

    expect(automatic).toEqual(expect.objectContaining({
      maxRenderVoxels: 6000,
      _autoRenderBudget: expect.objectContaining({ tier: 'low' })
    }));
  });
});
