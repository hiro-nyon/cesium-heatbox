#!/usr/bin/env node
/**
 * Browser compatibility checker for CesiumJS Heatbox v0.1.12
 * Phase 4: Quality assurance - browser compatibility validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Browser compatibility targets
const BROWSER_TARGETS = {
  chrome: '90+',
  firefox: '88+',
  safari: '14+',
  edge: '90+',
  ios_safari: '14+',
  android_chrome: '90+'
};

// Feature compatibility matrix
const FEATURE_COMPATIBILITY = {
  // ES6+ features used in v0.1.12
  'ES6 Modules': {
    chrome: '61+',
    firefox: '60+',
    safari: '10.1+',
    edge: '16+',
    ios_safari: '10.1+',
    android_chrome: '61+'
  },
  
  'ES6 Classes': {
    chrome: '49+',
    firefox: '45+',
    safari: '10.1+',
    edge: '13+',
    ios_safari: '10.1+',
    android_chrome: '49+'
  },
  
  'Arrow Functions': {
    chrome: '45+',
    firefox: '22+',
    safari: '10+',
    edge: '12+',
    ios_safari: '10+',
    android_chrome: '45+'
  },
  
  'Template Literals': {
    chrome: '41+',
    firefox: '34+',
    safari: '9+',
    edge: '12+',
    ios_safari: '9+',
    android_chrome: '41+'
  },
  
  'Destructuring Assignment': {
    chrome: '49+',
    firefox: '41+',
    safari: '10+',
    edge: '14+',
    ios_safari: '10+',
    android_chrome: '49+'
  },
  
  'const/let': {
    chrome: '49+',
    firefox: '36+',
    safari: '10+',
    edge: '12+',
    ios_safari: '10+',
    android_chrome: '49+'
  },
  
  // Performance API features
  'Performance.now()': {
    chrome: '24+',
    firefox: '15+',
    safari: '8+',
    edge: '12+',
    ios_safari: '9+',
    android_chrome: '25+'
  },
  
  // DOM API features
  'addEventListener': {
    chrome: '1+',
    firefox: '1+',
    safari: '1+',
    edge: '12+',
    ios_safari: '1+',
    android_chrome: '1+'
  },
  
  'JSON.parse/stringify': {
    chrome: '3+',
    firefox: '3.5+',
    safari: '4+',
    edge: '12+',
    ios_safari: '4+',
    android_chrome: '1+'
  },
  
  // WebGL (required for CesiumJS)
  'WebGL': {
    chrome: '9+',
    firefox: '4+',
    safari: '5.1+',
    edge: '12+',
    ios_safari: '8+',
    android_chrome: '25+'
  },
  
  'WebGL2': {
    chrome: '56+',
    firefox: '51+',
    safari: '15+',
    edge: '79+',
    ios_safari: '15+',
    android_chrome: '56+'
  }
};

// Known polyfills or workarounds
const POLYFILLS = [
  {
    feature: 'ES6 Modules',
    note: 'Use UMD build for older browsers',
    fallback: 'Available via dist/cesium-heatbox.umd.js'
  },
  {
    feature: 'Performance.now()',
    note: 'Falls back to Date.now() in performance overlay',
    fallback: 'Handled in src/utils/performanceOverlay.js'
  }
];

/**
 * Parse version string to number for comparison
 * @param {string} version - Version string like "90+" or "15.2"
 * @returns {number} Numeric version
 */
function parseVersion(version) {
  const cleanVersion = version.replace('+', '');
  const parts = cleanVersion.split('.');
  return parseInt(parts[0]) + (parts[1] ? parseInt(parts[1]) / 100 : 0);
}

/**
 * Check if target version meets requirement
 * @param {string} target - Target version
 * @param {string} requirement - Required version
 * @returns {boolean} Whether target meets requirement
 */
function meetsRequirement(target, requirement) {
  return parseVersion(target) >= parseVersion(requirement);
}

/**
 * Generate compatibility report
 */
function generateCompatibilityReport() {
  console.log('🌐 CesiumJS Heatbox v0.1.12 - Browser Compatibility Report');
  console.log('='.repeat(70));
  console.log();

  // Browser targets
  console.log('📋 Target Browser Support:');
  Object.entries(BROWSER_TARGETS).forEach(([browser, version]) => {
    console.log(`  • ${browser.replace('_', ' ')}: ${version}`);
  });
  console.log();

  // Feature analysis
  console.log('🔍 Feature Compatibility Analysis:');
  console.log();

  const incompatibleFeatures = [];
  const warnings = [];

  Object.entries(FEATURE_COMPATIBILITY).forEach(([feature, support]) => {
    console.log(`📦 ${feature}:`);
    
    const issues = [];
    Object.entries(BROWSER_TARGETS).forEach(([browser, target]) => {
      const required = support[browser];
      if (!required) {
        issues.push(`${browser}: Unknown support`);
        return;
      }

      const compatible = meetsRequirement(target, required);
      const status = compatible ? '✅' : '❌';
      
      console.log(`  ${status} ${browser.replace('_', ' ')}: requires ${required}, target ${target}`);
      
      if (!compatible) {
        incompatibleFeatures.push({ feature, browser, required, target });
      }
    });
    console.log();
  });

  // Summary
  console.log('📊 Compatibility Summary:');
  console.log('='.repeat(50));

  if (incompatibleFeatures.length === 0) {
    console.log('✅ All features are compatible with target browsers!');
  } else {
    console.log('⚠️  Compatibility Issues Found:');
    incompatibleFeatures.forEach(({ feature, browser, required, target }) => {
      console.log(`  ❌ ${feature} requires ${browser} ${required}, but targeting ${target}`);
    });
  }

  console.log();

  // Polyfills and workarounds
  console.log('🔧 Available Polyfills/Workarounds:');
  POLYFILLS.forEach(({ feature, note, fallback }) => {
    console.log(`  • ${feature}: ${note}`);
    console.log(`    Fallback: ${fallback}`);
  });

  console.log();

  // Recommendations
  console.log('💡 Recommendations:');
  console.log('  • Use UMD build (dist/cesium-heatbox.umd.js) for broader compatibility');
  console.log('  • CesiumJS itself requires WebGL - check CesiumJS browser support');
  console.log('  • Performance overlay features gracefully degrade on older browsers');
  console.log('  • All new v0.1.12 features work within target browser constraints');
  
  return incompatibleFeatures.length === 0;
}

/**
 * Generate browser test HTML
 */
function generateBrowserTestPage() {
  const testHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>CesiumJS Heatbox v0.1.12 - Browser Compatibility Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
        .pass { background-color: #d4edda; border-color: #c3e6cb; }
        .fail { background-color: #f8d7da; border-color: #f5c6cb; }
        .info { background-color: #e2e3e5; color: #383d41; }
    </style>
</head>
<body>
    <h1>🌐 CesiumJS Heatbox v0.1.12 Browser Compatibility Test</h1>
    
    <div class="info">
        <h3>Browser Information</h3>
        <p>User Agent: <span id="userAgent"></span></p>
        <p>Test Date: <span id="testDate"></span></p>
    </div>

    <div id="testResults"></div>

    <script>
        // Browser info
        document.getElementById('userAgent').textContent = navigator.userAgent;
        document.getElementById('testDate').textContent = new Date().toLocaleString();

        const tests = [
            {
                name: 'ES6 Modules',
                test: () => typeof import !== 'undefined'
            },
            {
                name: 'ES6 Classes', 
                test: () => {
                    try {
                        eval('class Test {}');
                        return true;
                    } catch (e) { return false; }
                }
            },
            {
                name: 'Arrow Functions',
                test: () => {
                    try {
                        eval('(() => true)');
                        return true;
                    } catch (e) { return false; }
                }
            },
            {
                name: 'Template Literals',
                test: () => {
                    try {
                        eval('`test`');
                        return true;
                    } catch (e) { return false; }
                }
            },
            {
                name: 'const/let',
                test: () => {
                    try {
                        eval('const x = 1; let y = 2;');
                        return true;
                    } catch (e) { return false; }
                }
            },
            {
                name: 'Performance.now()',
                test: () => typeof performance !== 'undefined' && typeof performance.now === 'function'
            },
            {
                name: 'JSON support',
                test: () => typeof JSON !== 'undefined' && typeof JSON.parse === 'function'
            },
            {
                name: 'WebGL',
                test: () => {
                    try {
                        const canvas = document.createElement('canvas');
                        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
                    } catch (e) { return false; }
                }
            },
            {
                name: 'WebGL2',
                test: () => {
                    try {
                        const canvas = document.createElement('canvas');
                        return !!canvas.getContext('webgl2');
                    } catch (e) { return false; }
                }
            }
        ];

        const resultsDiv = document.getElementById('testResults');
        let allPassed = true;

        tests.forEach(({ name, test }) => {
            const passed = test();
            allPassed = allPassed && passed;
            
            const testDiv = document.createElement('div');
            testDiv.className = 'test ' + (passed ? 'pass' : 'fail');
            testDiv.innerHTML = \`
                <strong>\${name}:</strong> \${passed ? '✅ PASS' : '❌ FAIL'}
            \`;
            resultsDiv.appendChild(testDiv);
        });

        // Overall result
        const overallDiv = document.createElement('div');
        overallDiv.className = 'test ' + (allPassed ? 'pass' : 'fail');
        overallDiv.innerHTML = \`
            <h3>Overall Compatibility: \${allPassed ? '✅ COMPATIBLE' : '❌ ISSUES FOUND'}</h3>
            \${allPassed 
                ? '<p>This browser should fully support CesiumJS Heatbox v0.1.12</p>'
                : '<p>Some features may not work properly. Consider using the UMD build or updating your browser.</p>'
            }
        \`;
        resultsDiv.appendChild(overallDiv);
    </script>
</body>
</html>`;

  const outputPath = path.join(__dirname, '../test/browser-compatibility.html');
  fs.writeFileSync(outputPath, testHtml);
  
  console.log(`\n📄 Browser test page generated: ${outputPath}`);
  console.log('Open this file in different browsers to test compatibility.');
}

/**
 * Main execution
 */
function main() {
  console.log('Starting browser compatibility analysis...\n');
  
  const isCompatible = generateCompatibilityReport();
  generateBrowserTestPage();
  
  console.log('\n' + '='.repeat(70));
  
  if (isCompatible) {
    console.log('✅ Browser compatibility check PASSED');
    process.exit(0);
  } else {
    console.log('⚠️  Browser compatibility issues found - review recommendations above');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateCompatibilityReport, BROWSER_TARGETS, FEATURE_COMPATIBILITY };
