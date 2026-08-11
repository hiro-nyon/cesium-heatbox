const { findClassPageLink, rewriteLinksForWiki } = require('../../tools/wiki-sync.js');

describe('wiki-sync link rewriting', () => {
  test('maps canonical Markdown pages to Wiki page names', () => {
    const source = [
      '[Japanese](README.ja.md)',
      '[API](docs/API.md#classificationoptions-v110)',
      '[Release](docs/RELEASE_RUNBOOK.md)'
    ].join('\n');

    expect(rewriteLinksForWiki(source, 'README.md')).toBe([
      '[Japanese](Home-ja)',
      '[API](API#classificationoptions-v110)',
      '[Release](Release-Runbook)'
    ].join('\n'));
  });

  test('resolves links relative to the canonical source', () => {
    const source = '[README](../README.ja.md#主要機能) [Setup](development-setup.md)';

    expect(rewriteLinksForWiki(source, 'docs/quick-start.md')).toBe(
      '[README](Home-ja#主要機能) [Setup](Development-Setup)'
    );
  });

  test('uses repository URLs for content that is not a Wiki page', () => {
    const source = '[Example](../examples/README.md) [External](https://example.com) [Anchor](#local)';
    const rewritten = rewriteLinksForWiki(source, 'docs/quick-start.md');

    expect(rewritten).toContain(
      '[Example](https://github.com/hiro-nyon/cesium-heatbox/blob/main/examples/README.md)'
    );
    expect(rewritten).toContain('[External](https://example.com)');
    expect(rewritten).toContain('[Anchor](#local)');
  });

  test('preserves the exact class-page filename casing', () => {
    expect(findClassPageLink('performanceOverlay', [
      'utils_performanceOverlay.js.html',
      'PerformanceOverlay.html'
    ])).toBe('PerformanceOverlay');
    expect(findClassPageLink('sampleData', ['utils_sampleData.js.html'])).toBe('');
  });
});
