#!/usr/bin/env node
/**
 * Documentation consistency checker for CesiumJS Heatbox v0.1.12
 * Phase 4: Quality assurance - documentation integrity validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Files to check
const DOCS_TO_CHECK = {
  README: path.join(PROJECT_ROOT, 'README.md'),
  MIGRATION: path.join(PROJECT_ROOT, 'MIGRATION.md'),
  API: path.join(PROJECT_ROOT, 'docs/API.md'),
  BASIC_EXAMPLE: path.join(PROJECT_ROOT, 'examples/basic/app.js'),
  ADVANCED_DEMO: path.join(PROJECT_ROOT, 'examples/advanced/v0.1.12-features-demo.html'),
  PERFORMANCE_DEMO: path.join(PROJECT_ROOT, 'examples/advanced/performance-overlay-demo.html')
};

// v0.1.12 API terms that should be consistently documented
const API_TERMS = {
  // New options
  'pitchDegrees': { type: 'option', context: 'fitViewOptions' },
  'headingDegrees': { type: 'option', context: 'fitViewOptions' },
  'outlineRenderMode': { type: 'option', values: ['standard', 'inset', 'emulation-only'] },
  'emulationScope': { type: 'option', values: ['off', 'topn', 'non-topn', 'all'] },
  'performanceOverlay': { type: 'option', context: 'configuration' },
  
  // Profiles
  'mobile-fast': { type: 'profile' },
  'desktop-balanced': { type: 'profile' },
  'dense-data': { type: 'profile' },
  'sparse-data': { type: 'profile' },
  
  // Methods
  'getEffectiveOptions': { type: 'method', since: 'v0.1.12' },
  'listProfiles': { type: 'static-method', since: 'v0.1.12' },
  'getProfileDetails': { type: 'static-method', since: 'v0.1.12' },
  'togglePerformanceOverlay': { type: 'method', since: 'v0.1.12' },
  'setPerformanceOverlayEnabled': { type: 'method', since: 'v0.1.12' },
  
  // Deprecated terms (should be mentioned with warnings)
  'pitch': { type: 'deprecated', replacement: 'pitchDegrees' },
  'heading': { type: 'deprecated', replacement: 'headingDegrees' },
  'outlineEmulation': { type: 'deprecated', replacement: 'outlineRenderMode + emulationScope' },
  'outlineWidthResolver': { type: 'deprecated', replacement: 'adaptiveParams' },
  'outlineOpacityResolver': { type: 'deprecated', replacement: 'adaptiveParams' },
  
  // Updated presets
  'medium': { type: 'preset', replaces: 'uniform' },
  'adaptive': { type: 'preset', replaces: 'adaptive-density' },
  'thick': { type: 'preset', replaces: 'topn-focus' }
};

/**
 * Read file content safely
 * @param {string} filePath - Path to file
 * @returns {string|null} File content or null if error
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.warn(`⚠️  Could not read ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Check if term appears in content
 * @param {string} content - File content
 * @param {string} term - Term to search for
 * @returns {boolean} Whether term is found
 */
function termExists(content, term) {
  return content.toLowerCase().includes(term.toLowerCase());
}

/**
 * Count occurrences of term in content
 * @param {string} content - File content
 * @param {string} term - Term to count
 * @returns {number} Number of occurrences
 */
function countTerm(content, term) {
  const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return (content.match(regex) || []).length;
}

/**
 * Check documentation consistency
 */
function checkDocumentationConsistency() {
  console.log('📚 CesiumJS Heatbox v0.1.12 - Documentation Consistency Check');
  console.log('='.repeat(70));
  console.log();

  const results = {
    files: {},
    issues: [],
    warnings: [],
    summary: {
      totalTerms: Object.keys(API_TERMS).length,
      documentedTerms: 0,
      missingTerms: [],
      inconsistencies: []
    }
  };

  // Read all documentation files
  Object.entries(DOCS_TO_CHECK).forEach(([name, filePath]) => {
    const content = readFile(filePath);
    if (content) {
      results.files[name] = {
        path: filePath,
        content: content,
        exists: true,
        lineCount: content.split('\n').length
      };
      console.log(`✅ Loaded ${name}: ${results.files[name].lineCount} lines`);
    } else {
      results.files[name] = { path: filePath, exists: false };
      results.issues.push(`❌ Could not load ${name} at ${filePath}`);
    }
  });

  console.log();

  // Check API term consistency
  console.log('🔍 Checking API Term Consistency:');
  console.log('='.repeat(50));

  Object.entries(API_TERMS).forEach(([term, info]) => {
    console.log(`\n📖 Checking term: "${term}" (${info.type})`);
    
    const termResults = {};
    let foundInAnyDoc = false;

    Object.entries(results.files).forEach(([docName, docInfo]) => {
      if (!docInfo.exists) return;

      const found = termExists(docInfo.content, term);
      const count = countTerm(docInfo.content, term);
      
      termResults[docName] = { found, count };
      if (found) foundInAnyDoc = true;

      const status = found ? '✅' : '❌';
      console.log(`  ${status} ${docName}: ${found ? `${count} occurrences` : 'Not found'}`);
    });

    // Check for expected documentation patterns
    if (info.type === 'option') {
      // Options should be in README, MIGRATION, and examples
      const expectedDocs = ['README', 'MIGRATION'];
      expectedDocs.forEach(docName => {
        if (results.files[docName]?.exists && !termResults[docName]?.found) {
          results.issues.push(`❌ Option "${term}" missing from ${docName}`);
        }
      });
    }

    if (info.type === 'method' || info.type === 'static-method') {
      // Methods should be in README and examples
      if (results.files.README?.exists && !termResults.README?.found) {
        results.warnings.push(`⚠️  Method "${term}" not mentioned in README`);
      }
    }

    if (info.type === 'deprecated') {
      // Deprecated terms should be in MIGRATION with warnings
      if (results.files.MIGRATION?.exists) {
        const migrationContent = results.files.MIGRATION.content;
        if (!termExists(migrationContent, term)) {
          results.issues.push(`❌ Deprecated term "${term}" not documented in MIGRATION`);
        } else if (!termExists(migrationContent, info.replacement)) {
          results.issues.push(`❌ Replacement for "${term}" (${info.replacement}) not mentioned in MIGRATION`);
        }
      }
    }

    if (foundInAnyDoc) {
      results.summary.documentedTerms++;
    } else {
      results.summary.missingTerms.push(term);
    }
  });

  // Check for consistency between examples
  console.log('\n🎯 Checking Example Consistency:');
  console.log('='.repeat(40));

  if (results.files.BASIC_EXAMPLE?.exists && results.files.ADVANCED_DEMO?.exists) {
    const basicContent = results.files.BASIC_EXAMPLE.content;
    const advancedContent = results.files.ADVANCED_DEMO.content;

    // Check that advanced example uses new API
    const newApiTerms = ['pitchDegrees', 'headingDegrees', 'outlineRenderMode', 'profile'];
    newApiTerms.forEach(term => {
      if (!termExists(advancedContent, term)) {
        results.warnings.push(`⚠️  Advanced demo should demonstrate "${term}"`);
      }
    });

    // Check that examples don't contradict each other
    const importStatements = {
      basic: (basicContent.match(/import.*from.*['"]/g) || []),
      advanced: (advancedContent.match(/import.*from.*['"]/g) || [])
    };

    console.log(`  ✅ Basic example imports: ${importStatements.basic.length}`);
    console.log(`  ✅ Advanced demo references: Import patterns checked`);
  }

  // Check version consistency
  console.log('\n🏷️  Checking Version References:');
  console.log('='.repeat(35));

  const versionPattern = /v?0\.1\.12/gi;
  Object.entries(results.files).forEach(([docName, docInfo]) => {
    if (!docInfo.exists) return;

    const versionMatches = docInfo.content.match(versionPattern) || [];
    console.log(`  ✅ ${docName}: ${versionMatches.length} v0.1.12 references`);

    if (versionMatches.length === 0 && ['README', 'MIGRATION'].includes(docName)) {
      results.warnings.push(`⚠️  No v0.1.12 version references in ${docName}`);
    }
  });

  // Generate summary
  console.log('\n📊 Documentation Consistency Summary:');
  console.log('='.repeat(45));

  console.log(`📚 Files checked: ${Object.keys(results.files).length}`);
  console.log(`📖 API terms: ${results.summary.totalTerms}`);
  console.log(`✅ Documented terms: ${results.summary.documentedTerms}`);
  console.log(`❌ Issues found: ${results.issues.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);

  if (results.summary.missingTerms.length > 0) {
    console.log(`\n🔍 Missing terms (${results.summary.missingTerms.length}):`);
    results.summary.missingTerms.forEach(term => {
      console.log(`  • ${term} (${API_TERMS[term].type})`);
    });
  }

  if (results.issues.length > 0) {
    console.log('\n❌ Issues found:');
    results.issues.forEach(issue => console.log(`  ${issue}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(warning => console.log(`  ${warning}`));
  }

  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('  • Ensure all new v0.1.12 options are documented in README');
  console.log('  • Verify MIGRATION.md covers all deprecated features');
  console.log('  • Update examples to use new API consistently');
  console.log('  • Check that JSDoc comments match implementation');

  return {
    passed: results.issues.length === 0,
    results
  };
}

/**
 * Check bilingual consistency
 */
function checkBilingualConsistency() {
  console.log('\n🌐 Bilingual Consistency Check:');
  console.log('='.repeat(40));

  const bilingualFiles = ['README'];
  const issues = [];

  bilingualFiles.forEach(fileName => {
    const file = DOCS_TO_CHECK[fileName];
    const content = readFile(file);
    
    if (!content) {
      issues.push(`Could not read ${fileName}`);
      return;
    }

    // Check for Japanese content
    const hasJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(content);
    
    // Check for English content  
    const hasEnglish = /[a-zA-Z]/.test(content);

    // Check for proper section markers
    const hasJapaneseSection = /### 日本語|### Japanese/.test(content);
    const hasEnglishSection = /### English|### 英語/.test(content);

    console.log(`  📄 ${fileName}:`);
    console.log(`    ${hasJapanese ? '✅' : '❌'} Japanese content`);
    console.log(`    ${hasEnglish ? '✅' : '❌'} English content`);
    console.log(`    ${hasJapaneseSection ? '✅' : '⚠️ '} Japanese section markers`);
    console.log(`    ${hasEnglishSection ? '✅' : '⚠️ '} English section markers`);

    if (!hasJapanese || !hasEnglish) {
      issues.push(`${fileName} should have both Japanese and English content`);
    }
  });

  return {
    passed: issues.length === 0,
    issues
  };
}

/**
 * Main execution
 */
function main() {
  console.log('Starting documentation consistency check...\n');

  const docCheck = checkDocumentationConsistency();
  const bilingualCheck = checkBilingualConsistency();

  console.log('\n' + '='.repeat(70));
  console.log('🏁 Final Results:');
  console.log('='.repeat(20));

  const allPassed = docCheck.passed && bilingualCheck.passed;
  const totalIssues = docCheck.results.issues.length + bilingualCheck.issues.length;

  if (allPassed) {
    console.log('✅ All documentation consistency checks PASSED');
    console.log(`📊 Summary: ${docCheck.results.summary.documentedTerms}/${docCheck.results.summary.totalTerms} terms documented`);
  } else {
    console.log(`❌ Documentation consistency issues found: ${totalIssues} issues`);
    console.log('Review the recommendations above to improve documentation quality');
  }

  // Write detailed report
  const reportPath = path.join(PROJECT_ROOT, 'test/documentation-consistency-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    version: '0.1.12',
    documentation: docCheck.results,
    bilingual: bilingualCheck,
    passed: allPassed
  };

  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
  } catch (error) {
    console.warn(`⚠️  Could not save report: ${error.message}`);
  }

  process.exit(allPassed ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkDocumentationConsistency, checkBilingualConsistency, API_TERMS };
