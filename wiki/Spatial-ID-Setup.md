# Spatial ID Setup Guide / 空間IDセットアップガイド

**日本語** | [English](#english)

## English

English
Overview
The Spatial ID feature in cesium-heatbox (v0.1.17+) allows you to generate voxels based on geospatial tile systems (METI-compliant Spatial ID / Ouranos). This provides:
Geographic accuracy: Voxels aligned to standardized spatial ID tiles
Zoom level control: Flexible cell size selection via zoom levels (15-30)
Two modes:
Fallback mode (built-in): Works immediately, no extra setup
Ouranos mode (optional): High-precision METI-compliant conversion
Key Challenge: The official ouranos-gex-lib-for-javascript repository does not include pre-built distribution files. Standard npm install will download the source code but not the compiled library, causing runtime errors.
Solution: This package includes a helper script (tools/install-ouranos.js) that automates the build process.
Installation Options
Option 1: Fallback Mode (Recommended for Quick Start)
No additional setup required.
npm install cesium-heatbox
Advantages:
✅ Zero configuration
✅ Works immediately
✅ Sufficient accuracy for most use cases
✅ No external dependencies
How it works:
The built-in ZFXYConverter uses Web Mercator projection for tile calculation. This provides good accuracy within ±85.0511° latitude.
Option 2: Ouranos Mode (High Precision)
Requires special setup.
This mode uses the official METI-compliant Ouranos library for maximum accuracy.
Detailed Setup Steps
Prerequisites
Node.js >= 18.0.0
npm >= 8.0.0
Git (for cloning Ouranos repository)
Step-by-Step Installation
Step 1: Install cesium-heatbox
npm install cesium-heatbox
This installs the core library with built-in fallback support.
Step 2: Install Ouranos as Optional Dependency
npm install ouranos-gex-lib-for-javascript@github:ouranos-gex/ouranos-gex-lib-for-JavaScript --no-save
Why --no-save?
The --no-save flag prevents adding Ouranos to your package.json dependencies. This is intentional because:
Ouranos is already listed in cesium-heatbox's optionalDependencies
Adding it again would create redundant entries
Optional dependencies should not be enforced on downstream users
Step 3: Build and Setup Ouranos
npx cesium-heatbox-install-ouranos
This command:
Checks if node_modules/ouranos-gex-lib-for-javascript exists
Clones the Ouranos repository to vendor/ouranos-gex-lib-for-JavaScript
Installs Ouranos dependencies (npm install inside vendor)
Builds the library (npm run build)
Copies dist/ files to node_modules/ouranos-gex-lib-for-javascript/dist/
Step 4: Verify Installation
Check that the built files exist:
ls -la node_modules/ouranos-gex-lib-for-javascript/dist/
You should see index.js and related files.
Test in your code:
import { Heatbox } from 'cesium-heatbox';
const heatbox = new Heatbox(viewer, {
spatialId: {
enabled: true,
zoomControl: 'auto'
},
voxelSize: 30
});
await heatbox.createFromEntities(entities);
const stats = heatbox.getStatistics();
console.log('Provider:', stats.spatialIdProvider);
// Expected: "ouranos-gex" (if setup successful)
// Expected: "fallback" or null (if Ouranos not available)
Step 5: Rebuild Heatbox
Rebuild the library so the newly prepared provider shim is bundled:
npm run build
Step 6: Serve over HTTP
Dynamic import() requires the examples to be served via HTTP(S). Launch the dev server before opening the spatial ID demos:
npm run dev
Important: Opening the HTML files directly with file:// will prevent the browser from loading the ouranos provider chunk, forcing fallback mode.
Troubleshooting
Issue 1: npx cesium-heatbox-install-ouranos command not found
Symptom:
zsh: command not found: cesium-heatbox-install-ouranos
Cause: The bin entry in package.json is not recognized, or the package is installed locally but not globally.
Solution:
Use the full path to the script:
node node_modules/cesium-heatbox/tools/install-ouranos.js
Or if developing cesium-heatbox itself:
node tools/install-ouranos.js
Issue 2: Ouranos build fails
Symptom:
[ouranos] building upstream library...
Error: ...
Possible Causes:
Missing Git: Cloning requires Git installed
Solution: Install Git from https://git-scm.com/
Network Issues: Cannot reach GitHub
Solution: Check your internet connection and proxy settings
Node/npm Version Mismatch: Ouranos may have specific requirements
Solution: Ensure Node >= 18, npm >= 8
Corrupted Clone: Previous failed attempt left incomplete files
Solution: Delete vendor/ directory and retry:
rm -rf vendor/
npx cesium-heatbox-install-ouranos
Issue 3: Webpack warning Module not found: ouranos-gex-lib-for-javascript
Symptom:
WARNING in ./src/core/spatial/SpatialIdAdapter.js
Module not found: Error: Can't resolve 'ouranos-gex-lib-for-javascript'
Cause: Webpack tries to statically resolve the import, but Ouranos is an optional dependency loaded via dynamic import().
Solution:
This warning is normal and safe to ignore.
The code uses try-catch and fallback logic:
try {
const module = await import('ouranos-gex-lib-for-javascript');
// Use Ouranos
} catch (error) {
// Fall back to ZFXYConverter
}
At runtime, if Ouranos is available, it will be loaded. Otherwise, the fallback converter is used.
To suppress the warning (optional), add to your webpack config:
module.exports = {
externals: {
'ouranos-gex-lib-for-javascript': 'commonjs ouranos-gex-lib-for-javascript'
}
};
Issue 4: Spatial ID not working, provider is null
Symptom:
const stats = heatbox.getStatistics();
console.log(stats.spatialIdProvider); // null or "fallback"
Cause: Ouranos is not correctly installed or built.
Solution:
Check if dist exists:
ls -la node_modules/ouranos-gex-lib-for-javascript/dist/index.js
If missing, run setup:
npx cesium-heatbox-install-ouranos
Check for errors in browser console:
Open DevTools → Console
Look for import errors or module not found messages
Verify that spatialId.enabled is true:
const heatbox = new Heatbox(viewer, {
spatialId: { enabled: true }  // ← Must be true
});
Architecture
How Dynamic Import Works
// src/core/spatial/SpatialIdAdapter.js
async loadProvider() {
if (this.options.provider === 'ouranos-gex') {
try {
const module = await import('ouranos-gex-lib-for-javascript');
this._converter = module;
this._providerName = 'ouranos-gex';
Logger.info('SpatialIdAdapter: loaded ouranos-gex');
} catch (error) {
Logger.warn('SpatialIdAdapter: ouranos-gex not available, using fallback');
this._useFallback();
}
} else {
this._useFallback();
}
}
Key Points:
Try-Catch Pattern: If import() fails, fallback is used automatically
No Hard Dependency: Code gracefully degrades without Ouranos
Optional Setup: Users can choose whether to install Ouranos
Vertex Normalization: Regardless of provider, Heatbox normalizes vertices to {lng, lat, alt} objects before rendering
File Structure
cesium-heatbox/
├── node_modules/
│   └── ouranos-gex-lib-for-javascript/
│       ├── dist/               ← Built by install-ouranos.js
│       │   └── index.js
│       ├── src/                ← Source code from GitHub
│       └── package.json
├── vendor/                     ← Created by install-ouranos.js
│   └── ouranos-gex-lib-for-JavaScript/
│       ├── dist/               ← Build output
│       ├── src/
│       └── package.json
├── tools/
│   └── install-ouranos.js      ← Setup automation script
└── src/
└── core/spatial/
├── SpatialIdAdapter.js ← Dynamic import logic
└── ZFXYConverter.js    ← Built-in fallback
FAQ
Q1: Do I need Ouranos for basic Spatial ID functionality?
A: No. The built-in fallback mode works without Ouranos and is sufficient for most applications.
Q2: What's the difference between Ouranos and fallback mode?
A:
Ouranos: Official METI-compliant implementation, higher precision
Fallback: Built-in Web Mercator-based converter, simpler, no dependencies
For most visualization purposes, the difference is negligible.
Q3: Can I distribute my app without Ouranos?
A: Yes. If you use fallback mode, your app has no dependency on Ouranos. Users will automatically get the built-in converter.
Q4: Why not include Ouranos pre-built in cesium-heatbox?
A:
Licensing: Ouranos has its own license terms
Size: Adding pre-built files would increase package size
Maintenance: Ouranos is actively developed; bundling could cause version conflicts
Flexibility: Users can choose their preferred mode
Q5: Is there a Docker/CI-friendly setup?
A: Yes. Add this to your Dockerfile or CI script:
# Dockerfile
RUN npm install cesium-heatbox
RUN npm install ouranos-gex-lib-for-javascript@github:ouranos-gex/ouranos-gex-lib-for-JavaScript --no-save
RUN npx cesium-heatbox-install-ouranos
Or in .github/workflows/:
- name: Setup Spatial ID
run: |
npm install cesium-heatbox
npm install ouranos-gex-lib-for-javascript@github:ouranos-gex/ouranos-gex-lib-for-JavaScript --no-save
npx cesium-heatbox-install-ouranos
Additional Resources
Main README - Quick start and API overview
Spatial ID Examples - Live demos
ADR-0013 - Architecture decision record
Ouranos GitHub - Official repository
npm install cesium-heatbox
Node.js >= 18.0.0
npm >= 8.0.0
npm install cesium-heatbox
npm install ouranos-gex-lib-for-javascript@github:ouranos-gex/ouranos-gex-lib-for-JavaScript --no-save
npx cesium-heatbox-install-ouranos
ls -la node_modules/ouranos-gex-lib-for-javascript/dist/
import { Heatbox } from 'cesium-heatbox';
const heatbox = new Heatbox(viewer, {
spatialId: {
enabled: true,
zoomControl: 'auto'
},
voxelSize: 30
});
await heatbox.createFromEntities(entities);
const stats = heatbox.getStatistics();
console.log('Provider:', stats.spatialIdProvider);
npm run build
npm run dev
zsh: command not found: cesium-heatbox-install-ouranos
node node_modules/cesium-heatbox/tools/install-ouranos.js
node tools/install-ouranos.js
[ouranos] building upstream library...
Error: ...
rm -rf vendor/
npx cesium-heatbox-install-ouranos
WARNING in ./src/core/spatial/SpatialIdAdapter.js
Module not found: Error: Can't resolve 'ouranos-gex-lib-for-javascript'
try {
const module = await import('ouranos-gex-lib-for-javascript');
} catch (error) {
}
module.exports = {
externals: {
'ouranos-gex-lib-for-javascript': 'commonjs ouranos-gex-lib-for-javascript'
}
};
const stats = heatbox.getStatistics();
ls -la node_modules/ouranos-gex-lib-for-javascript/dist/index.js
npx cesium-heatbox-install-ouranos
const heatbox = new Heatbox(viewer, {
});
// src/core/spatial/SpatialIdAdapter.js
async loadProvider() {
if (this.options.provider === 'ouranos-gex') {
try {
const module = await import('ouranos-gex-lib-for-javascript');
this._converter = module;
this._providerName = 'ouranos-gex';
Logger.info('SpatialIdAdapter: loaded ouranos-gex');
} catch (error) {
Logger.warn('SpatialIdAdapter: ouranos-gex not available, using fallback');
this._useFallback();
}
} else {
this._useFallback();
}
}
cesium-heatbox/
├── node_modules/
│   └── ouranos-gex-lib-for-javascript/
│       │   └── index.js
│       └── package.json
│   └── ouranos-gex-lib-for-JavaScript/
│       ├── src/
│       └── package.json
├── tools/
└── src/
└── core/spatial/
A:
A:
# Dockerfile
RUN npm install cesium-heatbox
RUN npm install ouranos-gex-lib-for-javascript@github:ouranos-gex/ouranos-gex-lib-for-JavaScript --no-save
RUN npx cesium-heatbox-install-ouranos
- name: Setup Spatial ID
run: |
npm install cesium-heatbox
npm install ouranos-gex-lib-for-javascript@github:ouranos-gex/ouranos-gex-lib-for-JavaScript --no-save
npx cesium-heatbox-install-ouranos
Last Updated: 2024-11-02
Version: cesium-heatbox v0.1.17


## 日本語

日本語
概要
cesium-heatboxの空間ID機能（v0.1.17以降）は、地理空間タイルシステム（METI準拠空間ID / Ouranos）に基づいてボクセルを生成します。以下の利点があります：
地理的精度: 標準化された空間IDタイルに整合したボクセル配置
ズームレベル制御: ズームレベル（15-30）による柔軟なセルサイズ選択
2つのモード:
フォールバックモード（内蔵）: すぐに動作、追加セットアップ不要
Ouranosモード（オプション）: 高精度なMETI準拠変換
主な課題: 公式のouranos-gex-lib-for-javascriptリポジトリにはビルド済み配布ファイルが含まれていません。通常のnpm installではソースコードがダウンロードされますが、コンパイル済みライブラリがないため実行時エラーが発生します。
解決策: このパッケージにはビルドプロセスを自動化するヘルパースクリプト（tools/install-ouranos.js）が含まれています。
インストールオプション
オプション1: フォールバックモード（クイックスタート推奨）
追加セットアップ不要。
利点:
✅ 設定不要
✅ すぐに動作
✅ 多くの用途で十分な精度
✅ 外部依存なし
動作原理:
内蔵のZFXYConverterはタイル計算にWeb Mercator投影を使用します。これは緯度±85.0511°以内で良好な精度を提供します。
オプション2: Ouranosモード（高精度）
特別なセットアップが必要。
このモードは公式のMETI準拠Ouranosライブラリを使用して最高精度を実現します。
詳細なセットアップ手順
前提条件
Git（Ouranosリポジトリのクローンに必要）
ステップバイステップのインストール
ステップ1: cesium-heatboxのインストール
これにより、内蔵フォールバック機能を含むコアライブラリがインストールされます。
ステップ2: Ouranosをオプショナル依存としてインストール
なぜ--no-save?
--no-saveフラグはOuranosをpackage.jsonの依存関係に追加することを防ぎます。これは意図的です：
Ouranosはすでにcesium-heatboxのoptionalDependenciesに記載されています
再度追加すると冗長なエントリが作成されます
オプショナル依存は下流ユーザーに強制されるべきではありません
ステップ3: Ouranosのビルドとセットアップ
このコマンドは：
node_modules/ouranos-gex-lib-for-javascriptの存在を確認
Ouranosリポジトリをvendor/ouranos-gex-lib-for-JavaScriptにクローン
Ouranosの依存関係をインストール（vendor内でnpm install）
ライブラリをビルド（npm run build）
dist/ファイルをnode_modules/ouranos-gex-lib-for-javascript/dist/にコピー
ステップ4: インストールの確認
ビルド済みファイルが存在することを確認：
index.jsおよび関連ファイルが表示されるはずです。
コードでテスト：
// 期待値: "ouranos-gex"（セットアップ成功時）
// 期待値: "fallback" または null（Ouranos利用不可時）
ステップ5: Heatboxを再ビルド
準備したプロバイダーをバンドルに含めるため、ライブラリを再ビルドします：
ステップ6: HTTP経由で提供
動的import()を使用するため、空間IDのデモはHTTP(S)経由で提供する必要があります。HTMLを開く前に開発サーバーを起動してください：
重要: file://で直接HTMLを開くと、ouranosプロバイダーチャンクの読み込みに失敗しフォールバックモードになります。
トラブルシューティング
問題1: npx cesium-heatbox-install-ouranosコマンドが見つからない
症状:
原因: package.jsonのbinエントリが認識されていない、またはパッケージがグローバルではなくローカルにインストールされています。
解決策:
スクリプトのフルパスを使用：
または、cesium-heatbox自体を開発している場合：
問題2: Ouranosのビルドが失敗する
症状:
考えられる原因:
Gitがない: クローンにはGitのインストールが必要
解決策: https://git-scm.com/ からGitをインストール
ネットワーク問題: GitHubに到達できない
解決策: インターネット接続とプロキシ設定を確認
Node/npmバージョン不一致: Ouranosに特定の要件がある可能性
解決策: Node >= 18、npm >= 8を確認
破損したクローン: 以前の失敗した試行で不完全なファイルが残っている
解決策: vendor/ディレクトリを削除して再試行：
問題3: Webpack警告 Module not found: ouranos-gex-lib-for-javascript
症状:
原因: Webpackはimportを静的に解決しようとしますが、Ouranosは動的import()で読み込まれるオプショナル依存です。
解決策:
この警告は正常で、無視しても問題ありません。
コードはtry-catchとフォールバックロジックを使用：
// Ouranosを使用
// ZFXYConverterにフォールバック
実行時にOuranosが利用可能であれば読み込まれます。そうでなければフォールバックコンバーターが使用されます。
警告を抑制する（オプション）には、webpackの設定に追加：
問題4: 空間IDが動作せず、プロバイダーがnull
症状:
console.log(stats.spatialIdProvider); // null または "fallback"
原因: Ouranosが正しくインストールまたはビルドされていません。
解決策:
distが存在するか確認：
存在しない場合、セットアップを実行：
ブラウザコンソールでエラーを確認：
DevTools → Console を開く
importエラーやモジュールが見つからないメッセージを確認
spatialId.enabledがtrueであることを確認：
spatialId: { enabled: true }  // ← trueである必要があります
アーキテクチャ
動的インポートの仕組み
重要なポイント:
Try-Catchパターン: import()が失敗すると、フォールバックが自動的に使用されます
ハード依存なし: Ouranosなしでもコードは適切に機能低下します
オプションのセットアップ: ユーザーはOuranosをインストールするかどうかを選択できます
頂点の正規化: プロバイダーに関係なく、描画前に頂点は{lng, lat, alt}形式へ正規化されます
ファイル構造
│       ├── dist/               ← install-ouranos.jsでビルド
│       ├── src/                ← GitHubからのソースコード
├── vendor/                     ← install-ouranos.jsで作成
│       ├── dist/               ← ビルド出力
│   └── install-ouranos.js      ← セットアップ自動化スクリプト
├── SpatialIdAdapter.js ← 動的インポートロジック
└── ZFXYConverter.js    ← 内蔵フォールバック
よくある質問
Q1: 基本的な空間ID機能にOuranosは必要ですか？
A: いいえ。内蔵のフォールバックモードはOuranosなしで動作し、ほとんどのアプリケーションで十分です。
Q2: Ouranosとフォールバックモードの違いは何ですか？
Ouranos: 公式のMETI準拠実装、高精度
フォールバック: 内蔵のWeb Mercatorベースコンバーター、シンプル、依存なし
ほとんどの可視化目的では、違いは無視できます。
Q3: Ouranosなしでアプリを配布できますか？
A: はい。フォールバックモードを使用する場合、アプリはOuranosに依存しません。ユーザーは自動的に内蔵コンバーターを使用します。
Q4: なぜcesium-heatboxにOuranosをビルド済みで含めないのですか？
ライセンス: Ouranosには独自のライセンス条項があります
サイズ: ビルド済みファイルを追加するとパッケージサイズが増加します
メンテナンス: Ouranosは活発に開発されています。バンドルするとバージョン競合が発生する可能性があります
柔軟性: ユーザーは希望するモードを選択できます
Q5: Docker/CIフレンドリーなセットアップはありますか？
A: はい。DockerfileまたはCIスクリプトに以下を追加：
または.github/workflows/内：
追加リソース
メインREADME - クイックスタートとAPI概要
空間ID使用例 - ライブデモ
ADR-0013 - アーキテクチャ決定記録
Ouranos GitHub - 公式リポジトリ
