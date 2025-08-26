#!/usr/bin/env node

/**
 * JSDoc HTML → Markdown 変換ツール (v0.1.6.1)
 * docs/api/ の HTML ファイルを wiki/ の Markdown に変換する
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// パス設定
const API_DOCS_DIR = path.join(__dirname, '../docs/api');
const WIKI_DIR = path.join(__dirname, '../wiki');

/**
 * HTML文書（JSDoc）をMarkdown（クラス中心）に変換
 * - タイトル、クラス説明、コンストラクタ、メソッド（重複除去）を整形
 */
function convertHtmlToMarkdown(htmlContent, filename) {
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;

  const main = document.querySelector('#main') || document.body;
  const pageTitle = main.querySelector('.page-title')?.textContent?.trim() || 'API Reference';

  let md = `# ${pageTitle}\n\n`;

  // クラス説明
  const classDesc = main.querySelector('.class-description');
  if (classDesc) {
    md += `${classDesc.textContent.trim()}\n\n`;
  }

  // コンストラクタ
  const ctor = main.querySelector('h4.name#' + (pageTitle.split(':').pop()?.trim().replace('Class', '').trim() || ''));
  const ctorHeader = main.querySelector('h2 + h4.name') || main.querySelector('h4.name');
  const ctorParamsTable = ctorHeader?.nextElementSibling?.tagName === 'TABLE' ? ctorHeader.nextElementSibling : null;
  if (ctorHeader) {
    md += `## Constructor\n\n`;
    md += `### ${ctorHeader.textContent.trim()}\n\n`;
    if (ctorParamsTable) {
      md += convertTableToMarkdown(ctorParamsTable);
    }
  }

  // メソッド一覧（重複除去）
  const seen = new Set();
  const methodHeaders = main.querySelectorAll('h4.name[id]');
  if (methodHeaders.length) {
    md += `## Methods\n\n`;
  }
  methodHeaders.forEach(h4 => {
    const id = h4.getAttribute('id');
    const title = h4.textContent.trim();
    if (!id || seen.has(id)) return;
    // クラス名と同名の見出しはコンストラクタなのでスキップ
    if (title.toLowerCase().includes('new ') || title.includes('VoxelRenderer(') || title.includes('Heatbox(')) {
      return;
    }
    seen.add(id);
    md += `### ${title}\n\n`;

    // 説明（直後の .description を拾う）
    let descNode = h4.nextElementSibling;
    while (descNode && !(descNode.classList?.contains('description'))) {
      if (descNode.tagName === 'H4') break;
      descNode = descNode.nextElementSibling;
    }
    if (descNode && descNode.classList.contains('description')) {
      md += `${descNode.textContent.trim()}\n\n`;
    }

    // パラメータ表（直後の table.params を拾う）
    let tableNode = h4.nextElementSibling;
    while (tableNode && !(tableNode.tagName === 'TABLE' && tableNode.classList.contains('params'))) {
      if (tableNode.tagName === 'H4') break;
      tableNode = tableNode.nextElementSibling;
    }
    if (tableNode) {
      md += convertTableToMarkdown(tableNode);
    }
  });

  // 追加: Heatboxの使用例（実APIベース）
  if (/Heatbox\.html$/.test(filename)) {
    md += generateHeatboxUsageExample();
  }

  return md.trim() + '\n';
}

/**
 * HTMLテーブルをMarkdownに変換
 * @param {Element} table - テーブル要素
 * @returns {string} Markdownテーブル
 */
function convertTableToMarkdown(table) {
  let markdown = '';
  const rows = table.querySelectorAll('tr');
  
  if (rows.length === 0) return '';

  // ヘッダー
  const headerCells = rows[0].querySelectorAll('th, td');
  if (headerCells.length > 0) {
    const headers = Array.from(headerCells).map(cell => cell.textContent.trim());
    markdown += `| ${headers.join(' | ')} |\n`;
    markdown += `|${headers.map(() => '---').join('|')}|\n`;

    // データ行
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll('td');
      if (cells.length > 0) {
        const data = Array.from(cells).map(cell => cell.textContent.trim().replace(/\|/g, '\\|'));
        markdown += `| ${data.join(' | ')} |\n`;
      }
    }
    markdown += '\n';
  }

  return markdown;
}

/**
 * Heatbox用の使用例を生成
 * @returns {string} 使用例Markdown
 */
function generateHeatboxUsageExample() {
  return `
## Quick Start Example

\`\`\`javascript
// 1. Initialize Heatbox
const viewer = new Cesium.Viewer('cesiumContainer');
const heatbox = new Heatbox(viewer, { voxelSize: 30, opacity: 0.8 });

// 2. Collect entities (example)
const entities = viewer.entities.values; // or build your own array

// 3. Create heatmap from entities
const stats = await heatbox.createFromEntities(entities);
console.log('rendered voxels:', stats.renderedVoxels);
\`\`\`

## v0.1.6 New Features

\`\`\`javascript
// Adaptive outline width control
const options = {
  outlineWidthResolver: ({ voxel, isTopN, normalizedDensity }) => {
    if (isTopN) return 6;           // TopN: thick outline
    if (normalizedDensity > 0.7) return 1; // Dense: thin
    return 3;                       // Sparse: normal
  },
  voxelGap: 1.5,        // Gap between voxels (meters)
  outlineOpacity: 0.8   // Outline transparency
};
\`\`\`
`;
}

/**
 * メイン処理
 */
async function main() {
  console.log('🔄 JSDoc HTML → Markdown 変換を開始...');

  // wiki ディレクトリの確認・作成
  if (!fs.existsSync(WIKI_DIR)) {
    fs.mkdirSync(WIKI_DIR, { recursive: true });
    console.log(`📁 Created ${WIKI_DIR}`);
  }

  // API docs ディレクトリの確認
  if (!fs.existsSync(API_DOCS_DIR)) {
    console.error(`❌ Error: ${API_DOCS_DIR} not found. Run 'npm run docs' first.`);
    process.exit(1);
  }

  let convertedCount = 0;
  const htmlFiles = fs.readdirSync(API_DOCS_DIR)
    .filter(file => file.endsWith('.html') && file !== 'index.html');

  console.log(`📄 Found ${htmlFiles.length} HTML files to convert`);

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(API_DOCS_DIR, htmlFile);
    const markdownFile = htmlFile.replace('.html', '.md');
    const markdownPath = path.join(WIKI_DIR, markdownFile);

    try {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      const markdownContent = convertHtmlToMarkdown(htmlContent, htmlFile);

      fs.writeFileSync(markdownPath, markdownContent);
      console.log(`✅ Converted: ${htmlFile} → ${markdownFile}`);
      convertedCount++;

    } catch (error) {
      console.error(`❌ Error converting ${htmlFile}:`, error.message);
    }
  }

  // API Reference インデックスを生成
  generateApiIndex(htmlFiles);

  console.log(`🎉 Conversion completed! ${convertedCount}/${htmlFiles.length} files converted.`);
}

/**
 * API Reference インデックスファイルを生成
 * @param {string[]} htmlFiles - 変換したHTMLファイル一覧
 */
function getVersion() {
  try {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
    const m = src.match(/export const VERSION\s*=\s*['\"]([^'\"]+)['\"]/);
    if (m) return m[1];
  } catch (_) {}
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    return pkg.version || '0.1.6.1';
  } catch (_) {}
  return '0.1.6.1';
}

function generateApiIndex(htmlFiles) {
  const version = getVersion();
  let indexContent = `# API Reference

This documentation is auto-generated from JSDoc comments in the source code.

## Classes

`;

  const classes = ['Heatbox', 'VoxelRenderer', 'VoxelGrid', 'DataProcessor', 'CoordinateTransformer'];
  classes.forEach(className => {
    const file = htmlFiles.find(f => f.includes(className));
    if (file) {
      // GitHub Wikiはページ名でリンクされるため拡張子は不要
      indexContent += `- [${className}](${className})\n`;
    }
  });

  indexContent += `
## Version Information

- **Current Version**: ${version}
- **Last Updated**: ${new Date().toISOString().split('T')[0]}
- **Generated From**: JSDoc → Markdown conversion

## Quick Links

- [Home](Home)
- [Getting Started](Getting-Started)
- [Examples](Examples)
`;

  fs.writeFileSync(path.join(WIKI_DIR, 'API-Reference.md'), indexContent);
  console.log('📚 Generated API-Reference.md index');
}

// スクリプト実行
if (require.main === module) {
  // jsdomが必要な場合はインストール確認
  try {
    require('jsdom');
  } catch (error) {
    console.error('❌ Missing dependency: jsdom');
    console.log('💡 Install with: npm install --save-dev jsdom');
    process.exit(1);
  }

  main().catch(error => {
    console.error('❌ Wiki sync failed:', error);
    process.exit(1);
  });
}

module.exports = { convertHtmlToMarkdown, convertTableToMarkdown };
