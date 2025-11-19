/**
 * Legend UI tests
 */

import { Legend } from '../../src/ui/Legend.js';

describe('Legend UI', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const createMockClassifier = () => ({
    breaks: [0, 10, 20],
    classes: 2,
    getColorForClass: jest.fn((index) => (index === 0 ? '#111111' : '#999999'))
  });

  test('renders entries for each class', () => {
    const legend = new Legend();
    const classifier = createMockClassifier();

    const element = legend.render(classifier, {
      classificationTargets: { color: true, opacity: true }
    });

    expect(element).toBeTruthy();
    const items = element.querySelectorAll('.heatbox-legend-item');
    expect(items.length).toBe(2);
    legend.destroy();
  });

  test('updates when new classifier provided', () => {
    const legend = new Legend();
    const classifier = createMockClassifier();
    legend.render(classifier, {});

    const newClassifier = {
      breaks: [0, 5, 10, 15],
      classes: 3,
      getColorForClass: jest.fn(() => '#222222')
    };
    legend.update(newClassifier, {});

    const items = legend.container.querySelectorAll('.heatbox-legend-item');
    expect(items.length).toBe(3);
    legend.destroy();
  });

  test('destroy removes owned container from DOM', () => {
    const legend = new Legend();
    legend.render(createMockClassifier(), {});
    const container = legend.container;

    expect(document.body.contains(container)).toBe(true);
    legend.destroy();
    expect(document.body.contains(container)).toBe(false);
  });
});
