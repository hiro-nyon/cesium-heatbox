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

  // タイトルを日英併記に整形
  const makeBilingualTitle = (title) => {
    // 代表的なパターン: "Class: Heatbox" → "Class: Heatbox（Heatboxクラス）"
    if (/^Class:\s*(.+)$/i.test(title)) {
      const m = title.match(/^Class:\s*(.+)$/i);
      const cls = m && m[1] ? m[1].trim() : title;
      return `Class: ${cls}（${cls}クラス）`;
    }
    if (/^API Reference$/i.test(title)) {
      return `API Reference（APIリファレンス）`;
    }
    return title;
  };

  // 言語判定の簡易関数
  const isJapanese = (text) => /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(text || '');

  // 構造化抽出
  const classDesc = main.querySelector('.class-description');
  const classDescText = classDesc ? classDesc.textContent.trim() : '';

  const ctorHeader = main.querySelector('h2 + h4.name') || main.querySelector('h4.name');
  const ctorParamsTable = ctorHeader?.nextElementSibling?.tagName === 'TABLE' ? ctorHeader.nextElementSibling : null;

  const seen = new Set();
  const methodHeaders = Array.from(main.querySelectorAll('h4.name[id]'));
  const methods = [];
  methodHeaders.forEach(h4 => {
    const id = h4.getAttribute('id');
    const title = h4.textContent.trim();
    if (!id || seen.has(id)) return;
    if (title.toLowerCase().includes('new ') || title.includes('VoxelRenderer(') || title.includes('Heatbox(')) {
      return;
    }
    seen.add(id);

    // 説明
    let descNode = h4.nextElementSibling;
    while (descNode && !(descNode.classList?.contains('description'))) {
      if (descNode.tagName === 'H4') break;
      descNode = descNode.nextElementSibling;
    }
    const descText = (descNode && descNode.classList.contains('description')) ? (descNode.textContent.trim()) : '';

    // パラメータ表
    let tableNode = h4.nextElementSibling;
    while (tableNode && !(tableNode.tagName === 'TABLE' && tableNode.classList.contains('params'))) {
      if (tableNode.tagName === 'H4') break;
      tableNode = tableNode.nextElementSibling;
    }

    methods.push({ title, descText, tableNode });
  });

  // 英語セクションの描画
  let en = '';
  en += `## English\n\n`;
  if (classDescText) {
    if (isJapanese(classDescText)) {
      en += `> English translation pending. See Japanese section below.\n\n`;
    } else {
      en += `${classDescText}\n\n`;
    }
  }
  if (ctorHeader) {
    en += `### Constructor\n\n`;
    en += `#### ${ctorHeader.textContent.trim()}\n\n`;
    if (ctorParamsTable) {
      en += convertTableToMarkdown(ctorParamsTable, 'en');
    }
  }
  if (methods.length) {
    en += `### Methods\n\n`;
    for (const m of methods) {
      en += `#### ${m.title}\n\n`;
      if (m.descText) {
        if (isJapanese(m.descText)) {
          en += `> English translation pending. See Japanese section below.\n\n`;
        } else {
          en += `${m.descText}\n\n`;
        }
      }
      if (m.tableNode) en += convertTableToMarkdown(m.tableNode, 'en');
    }
  }

  // 追加: Heatbox英語使用例
  if (/Heatbox\.html$/.test(filename)) {
    en += generateHeatboxUsageExample();
  }

  // 日本語セクションの描画
  let ja = '';
  ja += `## 日本語\n\n`;
  if (classDescText) ja += `${classDescText}\n\n`;
  if (ctorHeader) {
    ja += `### コンストラクタ\n\n`;
    ja += `#### ${ctorHeader.textContent.trim()}\n\n`;
    if (ctorParamsTable) {
      ja += convertTableToMarkdown(ctorParamsTable, 'ja');
    }
  }
  if (methods.length) {
    ja += `### メソッド\n\n`;
    for (const m of methods) {
      ja += `#### ${m.title}\n\n`;
      if (m.descText) ja += `${m.descText}\n\n`;
      if (m.tableNode) ja += convertTableToMarkdown(m.tableNode, 'ja');
    }
  }

  // 仕上げ: タイトル + 言語スイッチ + 言語順に結合（英語→日本語）
  let md = `# ${makeBilingualTitle(pageTitle)}\n\n`;
  md += `[English](#english) | [日本語](#日本語)\n\n`;
  md += en + '\n' + ja + '\n';

  return md.trim() + '\n';
}

/**
 * HTMLテーブルをMarkdownに変換
 * @param {Element} table - テーブル要素
 * @returns {string} Markdownテーブル
 */
function convertTableToMarkdown(table, lang = 'bi') {
  let markdown = '';
  const rows = table.querySelectorAll('tr');
  
  if (rows.length === 0) return '';

  // ヘッダー
  const headerCells = rows[0].querySelectorAll('th, td');
  if (headerCells.length > 0) {
    const toJa = (h) => {
      const t = h.toLowerCase();
      if (t === 'name') return '名前';
      if (t === 'type') return '型';
      if (t === 'attributes') return '属性';
      if (t === 'default') return '既定値';
      if (t === 'description') return '説明';
      if (t === 'returns') return '返り値';
      return h; // 既知以外はそのまま
    };
    const headers = Array.from(headerCells).map(cell => {
      const en = cell.textContent.trim();
      if (lang === 'en') return en;
      if (lang === 'ja') return toJa(en);
      const ja = toJa(en);
      return ja === en ? en : `${en} / ${ja}`;
    });
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
  let indexContent = `# API Reference（APIリファレンス）

[English](#english) | [日本語](#日本語)

## English

This documentation is auto-generated from JSDoc comments in the source code.

### Classes

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
### Version Information

- **Current Version**: ${version}
- **Last Updated**: ${new Date().toISOString().split('T')[0]}
- **Generated From**: JSDoc → Markdown conversion

### Quick Links

- [Home](Home)
- [Getting Started](Getting-Started)
- [Examples](Examples)

## 日本語

このドキュメントは、ソースコードのJSDocコメントから自動生成されます。

### クラス

`;

  classes.forEach(className => {
    const file = htmlFiles.find(f => f.includes(className));
    if (file) {
      indexContent += `- [${className}](${className})\n`;
    }
  });

  indexContent += `
### バージョン情報

- **現在のバージョン**: ${version}
- **最終更新**: ${new Date().toISOString().split('T')[0]}
- **生成元**: JSDoc → Markdown変換

### クイックリンク

- [Home](Home) - ホーム
- [Getting Started](Getting-Started) - はじめに
- [Examples](Examples) - サンプル
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
