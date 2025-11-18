/**
 * Legend UI component for Heatbox classification.
 * Heatboxの分類用凡例コンポーネント。
 */

function colorToCss(color) {
  if (!color) return 'rgba(0,0,0,0)';
  if (typeof color === 'string') {
    return color;
  }
  if (typeof color.toCssHexString === 'function') {
    return color.toCssHexString();
  }
  if (typeof color.toCssColorString === 'function') {
    return color.toCssColorString();
  }
  if (typeof color.withAlpha === 'function') {
    const c = color.withAlpha(1);
    if (c && typeof c.toCssColorString === 'function') {
      return c.toCssColorString();
    }
  }
  const r = Math.min(255, Math.max(0, Math.round((color.red ?? 0) * 255)));
  const g = Math.min(255, Math.max(0, Math.round((color.green ?? 0) * 255)));
  const b = Math.min(255, Math.max(0, Math.round((color.blue ?? 0) * 255)));
  const a = Math.min(1, Math.max(0, color.alpha ?? 1));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export class Legend {
  constructor(options = {}) {
    this.document = options.documentRef || (typeof document !== 'undefined' ? document : null);
    this.container = options.container || null;
    this._ownsContainer = false;
    this._classifier = null;
    this._classificationOptions = null;

    if (!this.document) {
      return;
    }

    if (!this.container) {
      this.container = this.document.createElement('div');
      this.container.className = 'heatbox-legend';
      this.document.body.appendChild(this.container);
      this._ownsContainer = true;
    }
  }

  render(classifier, classificationOptions = {}) {
    if (!this.container || !this.document) {
      return null;
    }

    this._classifier = classifier;
    this._classificationOptions = classificationOptions;

    // reset content
    this.container.innerHTML = '';
    this.container.style.padding = '8px';
    this.container.style.background = 'rgba(0,0,0,0.6)';
    this.container.style.color = '#fff';
    this.container.style.fontSize = '12px';
    this.container.style.borderRadius = '4px';
    this.container.style.maxWidth = '240px';

    const title = this.document.createElement('div');
    title.textContent = 'Legend';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '6px';
    this.container.appendChild(title);

    if (!classifier) {
      const empty = this.document.createElement('div');
      empty.textContent = '分類が有効ではありません';
      this.container.appendChild(empty);
      return this.container;
    }

    const targets = classificationOptions.classificationTargets || {};
    const enabledTargets = Object.entries(targets)
      .filter(([, value]) => value !== false)
      .map(([key]) => key);

    if (enabledTargets.length > 0) {
      const targetLine = this.document.createElement('div');
      targetLine.textContent = `Targets: ${enabledTargets.join(', ')}`;
      targetLine.style.marginBottom = '4px';
      this.container.appendChild(targetLine);
    }

    const list = this.document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '4px';

    const breaks = classifier.breaks || [];
    const classCount = classifier.classes ?? (breaks.length > 1 ? breaks.length - 1 : 0);

    for (let i = 0; i < classCount; i++) {
      const item = this.document.createElement('div');
      item.className = 'heatbox-legend-item';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '6px';

      const swatch = this.document.createElement('span');
      swatch.className = 'heatbox-legend-swatch';
      swatch.style.display = 'inline-block';
      swatch.style.width = '12px';
      swatch.style.height = '12px';
      swatch.style.borderRadius = '2px';
      swatch.style.border = '1px solid rgba(255,255,255,0.3)';
      swatch.style.background = colorToCss(classifier.getColorForClass(i));

      const label = this.document.createElement('span');
      let rangeLabel = `Class ${i + 1}`;
      if (breaks.length > i + 1) {
        rangeLabel = `${breaks[i]} - ${breaks[i + 1]}`;
      }
      label.textContent = rangeLabel;

      item.appendChild(swatch);
      item.appendChild(label);
      list.appendChild(item);
    }

    this.container.appendChild(list);
    return this.container;
  }

  update(classifier, classificationOptions) {
    return this.render(
      classifier ?? this._classifier,
      classificationOptions ?? this._classificationOptions
    );
  }

  destroy() {
    if (this.container && this._ownsContainer && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.document = null;
  }
}
