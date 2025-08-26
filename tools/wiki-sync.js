#!/usr/bin/env node

/**
 * JSDoc HTML → Markdown 変換ツール (v0.1.6)
 * docs/api/ の HTML ファイルを wiki/ の Markdown に変換する
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// パス設定
const API_DOCS_DIR = path.join(__dirname, '../docs/api');
const WIKI_DIR = path.join(__dirname, '../wiki');

/**
 * HTML文書をMarkdownに変換
 * @param {string} htmlContent - HTML内容
 * @param {string} filename - ファイル名
 * @returns {string} Markdown内容
 */
function convertHtmlToMarkdown(htmlContent, filename) {
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;

  let markdown = '';

  // タイトル抽出
  const titleElement = document.querySelector('h1, .page-title, title');
  if (titleElement) {
    const title = titleElement.textContent.trim().replace(' - Documentation', '');
    markdown += `# ${title}\n\n`;
  }

  // メイン内容の抽出
  const mainContent = document.querySelector('.main-content, .content, #main, main, body');
  if (mainContent) {
    // h1-h6 見出し
    const headings = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(h => {
      const level = parseInt(h.tagName[1]);
      const text = h.textContent.trim();
      if (text && !text.includes('Documentation')) {
        markdown += `${'#'.repeat(level)} ${text}\n\n`;
      }
    });

    // 段落・説明文
    const paragraphs = mainContent.querySelectorAll('p, .description');
    paragraphs.forEach(p => {
      const text = p.textContent.trim();
      if (text && text.length > 10) {
        markdown += `${text}\n\n`;
      }
    });

    // コードブロック
    const codeBlocks = mainContent.querySelectorAll('pre, .prettyprint');
    codeBlocks.forEach(code => {
      const text = code.textContent.trim();
      if (text) {
        markdown += `\`\`\`javascript\n${text}\n\`\`\`\n\n`;
      }
    });

    // テーブル（パラメータなど）
    const tables = mainContent.querySelectorAll('table');
    tables.forEach(table => {
      markdown += convertTableToMarkdown(table);
    });
  }

  // ファイル固有の後処理
  if (filename.includes('Heatbox')) {
    markdown += generateHeatboxUsageExample();
  }

  return markdown.trim() + '\n';
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
const heatbox = new Heatbox(viewer);

// 2. Add sample data
heatbox.addEntityDataArray([
  { position: Cesium.Cartesian3.fromDegrees(139.7, 35.7, 100), userData: { value: 10 } },
  { position: Cesium.Cartesian3.fromDegrees(139.8, 35.8, 100), userData: { value: 20 } }
]);

// 3. Generate heatmap
await heatbox.generateHeatmap({
  voxelSize: 50,
  colorMap: 'viridis',
  highlightTopN: 5
});
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
function generateApiIndex(htmlFiles) {
  let indexContent = `# API Reference

This documentation is auto-generated from JSDoc comments in the source code.

## Classes

`;

  const classes = ['Heatbox', 'VoxelRenderer', 'VoxelGrid', 'DataProcessor', 'CoordinateTransformer'];
  classes.forEach(className => {
    const file = htmlFiles.find(f => f.includes(className));
    if (file) {
      const mdFile = file.replace('.html', '.md');
      indexContent += `- [${className}](${mdFile})\n`;
    }
  });

  indexContent += `
## Version Information

- **Current Version**: 0.1.6
- **Last Updated**: ${new Date().toISOString().split('T')[0]}
- **Generated From**: JSDoc → Markdown conversion

## Quick Links

- [Home](Home.md)
- [Getting Started](Getting-Started.md)
- [Examples](Examples.md)
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
