#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const failures = [];

function expectIncludes(content, term, context) {
  if (!content.includes(term)) {
    failures.push(`${context}: missing ${term}`);
  }
}

function splitApiSections(content) {
  const japaneseMarker = '\n## 日本語\n';
  const index = content.indexOf(japaneseMarker);
  if (index < 0) {
    failures.push('docs/API.md: missing Japanese section');
    return { english: content, japanese: '' };
  }
  return {
    english: content.slice(0, index),
    japanese: content.slice(index)
  };
}

const packageJson = JSON.parse(read('package.json'));
const api = read('docs/API.md');
const { english, japanese } = splitApiSections(api);

expectIncludes(api, `v${packageJson.version}`, 'docs/API.md version');

const instanceMethods = [
  'createFromEntities',
  'setData',
  'updateValues',
  'updateOptions',
  'setVisible',
  'clear',
  'destroy',
  'dispose',
  'getStatistics',
  'getBounds',
  'getOptions',
  'getDebugInfo',
  'getEffectiveOptions',
  'fitView',
  'createLegend',
  'updateLegend',
  'destroyLegend',
  'togglePerformanceOverlay',
  'showPerformanceOverlay',
  'hidePerformanceOverlay',
  'setPerformanceOverlayEnabled'
];

const staticMethods = ['listProfiles', 'getProfileDetails', 'filterEntities'];
const documentedOptions = [
  'enableThickFrames',
  'autoVoxelTargetFill',
  'boostOutlineWidth',
  'paddingPercent',
  'altitudeStrategy',
  'adaptiveParams',
  'neighborhoodRadius',
  'densityThreshold',
  'cameraDistanceFactor',
  'overlapRiskFactor',
  'minOutlineWidth',
  'maxOutlineWidth',
  'outlineWidthRange',
  'boxOpacityRange',
  'outlineOpacityRange',
  'adaptiveOpacityEnabled',
  'zScaleCompensation',
  'overlapDetection',
  'spatialId',
  'aggregation'
];

for (const method of [...instanceMethods, ...staticMethods]) {
  expectIncludes(english, method, 'docs/API.md English methods');
  expectIncludes(japanese, method, 'docs/API.md Japanese methods');
}

for (const option of documentedOptions) {
  expectIncludes(english, option, 'docs/API.md English options');
  expectIncludes(japanese, option, 'docs/API.md Japanese options');
}

const knownMethods = new Set([...instanceMethods, ...staticMethods]);
const markdownRoots = ['README.md', 'README.ja.md', 'docs'];
const markdownFiles = [];

function collectMarkdown(target) {
  const absolute = path.join(ROOT, target);
  const stat = fs.statSync(absolute);
  if (stat.isFile()) {
    markdownFiles.push(target);
    return;
  }
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (entry.name === 'api' || entry.name === 'adr') continue;
    const relative = path.join(target, entry.name);
    if (entry.isDirectory()) collectMarkdown(relative);
    else if (entry.name.endsWith('.md')) markdownFiles.push(relative);
  }
}

markdownRoots.forEach(collectMarkdown);

const markdownLinkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
const snippetPattern = /```(?:javascript|js)\s*\n([\s\S]*?)```/g;
const methodCallPattern = /\bheatbox\.([A-Za-z_$][\w$]*)\s*\(/g;

function headingSlug(heading) {
  return heading
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function collectHeadingSlugs(content) {
  const slugs = new Set();
  const counts = new Map();
  for (const match of content.matchAll(/^#{1,6}\s+(.+)$/gm)) {
    const base = headingSlug(match[1]);
    if (!base) continue;
    const count = counts.get(base) || 0;
    slugs.add(count === 0 ? base : `${base}-${count}`);
    counts.set(base, count + 1);
  }
  return slugs;
}

for (const relativePath of markdownFiles) {
  const content = read(relativePath);
  let match;

  while ((match = markdownLinkPattern.exec(content))) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, '');
    if (!rawTarget || rawTarget.startsWith('#') || /^[a-z][a-z+.-]*:/i.test(rawTarget)) continue;
    const fileTarget = decodeURIComponent(rawTarget.split('#')[0]);
    if (!fileTarget) continue;
    const resolved = path.resolve(path.dirname(path.join(ROOT, relativePath)), fileTarget);
    if (!fs.existsSync(resolved)) {
      failures.push(`${relativePath}: broken relative link ${rawTarget}`);
      continue;
    }

    const fragment = rawTarget.includes('#') ? decodeURIComponent(rawTarget.split('#').slice(1).join('#')) : '';
    if (fragment && fs.statSync(resolved).isFile() && resolved.endsWith('.md')) {
      const targetContent = fs.readFileSync(resolved, 'utf8');
      if (!collectHeadingSlugs(targetContent).has(fragment.toLowerCase())) {
        failures.push(`${relativePath}: broken Markdown anchor ${rawTarget}`);
      }
    }
  }

  while ((match = snippetPattern.exec(content))) {
    let call;
    while ((call = methodCallPattern.exec(match[1]))) {
      if (!knownMethods.has(call[1])) {
        failures.push(`${relativePath}: unknown public method heatbox.${call[1]}()`);
      }
    }
  }
}

const wikiDirectory = path.join(ROOT, 'wiki');
if (fs.existsSync(wikiDirectory)) {
  const exactWikiFilenames = new Set(fs.readdirSync(wikiDirectory));
  const generatedWikiFiles = fs.readdirSync(wikiDirectory)
    .filter((name) => name.endsWith('.md'))
    .filter((name) => read(path.join('wiki', name)).startsWith('<!-- Generated from '));

  for (const name of generatedWikiFiles) {
    const relativePath = path.join('wiki', name);
    const content = read(relativePath);
    let match;
    markdownLinkPattern.lastIndex = 0;
    while ((match = markdownLinkPattern.exec(content))) {
      const rawTarget = match[1].trim().replace(/^<|>$/g, '');
      if (!rawTarget || rawTarget.startsWith('#') || /^[a-z][a-z+.-]*:/i.test(rawTarget)) continue;
      const pageTarget = decodeURIComponent(rawTarget.split('#')[0]);
      if (!pageTarget) continue;
      if (pageTarget.includes('/') || pageTarget.endsWith('.md')) {
        failures.push(`${relativePath}: non-Wiki relative link ${rawTarget}`);
        continue;
      }
      if (!exactWikiFilenames.has(`${pageTarget}.md`)) {
        failures.push(`${relativePath}: missing Wiki page ${rawTarget}`);
      }
    }
  }
}

const readmeHeadingLevels = [...read('README.md').matchAll(/^(#{1,6})\s+/gm)].map((match) => match[1].length);
const japaneseHeadingLevels = [...read('README.ja.md').matchAll(/^(#{1,6})\s+/gm)].map((match) => match[1].length);
if (JSON.stringify(readmeHeadingLevels) !== JSON.stringify(japaneseHeadingLevels)) {
  failures.push('README.md and README.ja.md heading structures differ');
}

if (failures.length > 0) {
  console.error('Documentation surface check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Documentation surface OK (${instanceMethods.length + staticMethods.length} methods, ${documentedOptions.length} options, ${markdownFiles.length} Markdown files)`);
