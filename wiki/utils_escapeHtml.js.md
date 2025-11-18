# Source: utils/escapeHtml.js

**日本語** | [English](#english)

## English

See also: [Class: escapeHtml](escapeHtml)

```javascript
const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;'
};

const ESCAPE_REGEX = /[&<>"'`]/g;

/**
 * Escape special HTML characters.
 * HTMLの特殊文字をエスケープします。
 * @param {string} value - 対象文字列
 * @returns {string} Escaped string / エスケープ後文字列
 */
export function escapeHtml(value) {
  if (typeof value !== 'string') {
    return value == null ? '' : String(value);
  }

  return value.replace(ESCAPE_REGEX, (char) => ESCAPE_MAP[char] || char);
}

```

## 日本語

関連: [escapeHtmlクラス](escapeHtml)

```javascript
const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;'
};

const ESCAPE_REGEX = /[&<>"'`]/g;

/**
 * Escape special HTML characters.
 * HTMLの特殊文字をエスケープします。
 * @param {string} value - 対象文字列
 * @returns {string} Escaped string / エスケープ後文字列
 */
export function escapeHtml(value) {
  if (typeof value !== 'string') {
    return value == null ? '' : String(value);
  }

  return value.replace(ESCAPE_REGEX, (char) => ESCAPE_MAP[char] || char);
}

```
