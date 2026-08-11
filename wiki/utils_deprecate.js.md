<!-- Generated from docs/api/utils_deprecate.js.html by npm run wiki:sync. Edit JSDoc in src/, not this page. -->

# Source: utils/deprecate.js

**日本語** | [English](#english)

## English

```javascript
/**
 * Deprecation utilities for Heatbox
 * ヒートボックスの廃止予定機能ユーティリティ
 *
 * @version 0.1.12
 */

// Track warned deprecations to avoid spam
const warnedDeprecations = new Set();

import { Logger } from './logger.js';

/**
 * Warn once about deprecated feature
 * 廃止予定機能について一度だけ警告する
 *
 * @param {string} code - Unique warning code / 一意の警告コード
 * @param {string} message - Warning message / 警告メッセージ
 */
export function warnOnce(code, message) {
  if (warnedDeprecations.has(code)) {
    return;
  }

  warnedDeprecations.add(code);
  Logger.warn(message);
}

/**
 * Clear all warning states (for testing)
 * すべての警告状態をクリア（テスト用）
 */
export function clearWarnings() {
  warnedDeprecations.clear();
}

```

## 日本語

```javascript
/**
 * Deprecation utilities for Heatbox
 * ヒートボックスの廃止予定機能ユーティリティ
 *
 * @version 0.1.12
 */

// Track warned deprecations to avoid spam
const warnedDeprecations = new Set();

import { Logger } from './logger.js';

/**
 * Warn once about deprecated feature
 * 廃止予定機能について一度だけ警告する
 *
 * @param {string} code - Unique warning code / 一意の警告コード
 * @param {string} message - Warning message / 警告メッセージ
 */
export function warnOnce(code, message) {
  if (warnedDeprecations.has(code)) {
    return;
  }

  warnedDeprecations.add(code);
  Logger.warn(message);
}

/**
 * Clear all warning states (for testing)
 * すべての警告状態をクリア（テスト用）
 */
export function clearWarnings() {
  warnedDeprecations.clear();
}

```
