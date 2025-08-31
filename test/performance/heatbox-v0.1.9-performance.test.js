/* eslint-env browser */
/**
 * CesiumJS Heatbox v0.1.9 Performance Test
 * 
 * v0.1.9で追加された適応的レンダリング機能の性能テストを実行します。
 */

import * as Cesium from 'cesium';
import { Heatbox } from '../src/index.js';
import { generateSampleData } from '../src/utils/sampleData.js';

/**
 * Performance Test Suite for v0.1.9
 */
export class HeatboxPerformanceTest {
  constructor() {
    this.results = [];
    this.viewer = null;
  }

  /**
   * Initialize test environment
   */
  async initialize() {
    // Create a headless viewer for testing
    const container = document.createElement('div');
    container.style.width = '1024px';
    container.style.height = '768px';
    container.style.position = 'absolute';
    container.style.top = '-2000px'; // Hide off-screen
    document.body.appendChild(container);

    this.viewer = new Cesium.Viewer(container, {
      shouldAnimate: false,
      homeButton: false,
      sceneModePicker: false,
      baseLayerPicker: false,
      geocoder: false,
      navigationHelpButton: false,
      timeline: false,
      fullscreenButton: false
    });

    console.log('🧪 Performance test environment initialized');
  }

  /**
   * Clean up test environment
   */
  cleanup() {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
  }

  /**
   * Run comprehensive performance test suite
   */
  async runFullSuite() {
    console.log('🚀 Starting v0.1.9 Performance Test Suite...');
    
    await this.initialize();
    
    try {
      // Test 1: Rendering strategy comparison
      await this.testRenderingStrategies();
      
      // Test 2: Auto Render Budget performance
      await this.testAutoRenderBudget();
      
      // Test 3: Enhanced auto voxel size performance
      await this.testEnhancedAutoVoxelSize();
      
      // Test 4: fitView performance
      await this.testFitViewPerformance();
      
      // Test 5: Memory usage analysis
      await this.testMemoryUsage();
      
      // Test 6: Large dataset scalability
      await this.testScalability();
      
      // Generate summary report
      this.generateReport();
      
    } finally {
      this.cleanup();
    }
  }

  /**
   * Test rendering strategy performance comparison
   */
  async testRenderingStrategies() {
    console.log('📊 Testing rendering strategies...');
    
    const datasets = [
      { name: 'Dense Cluster', size: 10000, type: 'dense' },
      { name: 'Sparse Distribution', size: 10000, type: 'sparse' },
      { name: 'Mixed Pattern', size: 10000, type: 'mixed' }
    ];
    
    const strategies = ['density', 'coverage', 'hybrid'];
    
    for (const dataset of datasets) {
      const data = this.generateTestData(dataset.size, dataset.type);
      
      for (const strategy of strategies) {
        const testResult = await this.measurePerformance(
          `Strategy-${strategy}-${dataset.name}`,
          async () => {
            const heatbox = new Heatbox(this.viewer, {
              voxelSize: 500,
              renderLimitStrategy: strategy,
              maxRenderVoxels: 5000,
              debug: false
            });
            
            await heatbox.setData(data);
            const stats = heatbox.getStatistics();
            
            heatbox.dispose();
            return stats;
          }
        );
        
        this.results.push({
          category: 'Rendering Strategy',
          test: `${strategy} - ${dataset.name}`,
          ...testResult
        });
      }
    }
  }

  /**
   * Test Auto Render Budget performance
   */
  async testAutoRenderBudget() {
    console.log('💻 Testing Auto Render Budget...');
    
    const data = this.generateTestData(15000, 'mixed');
    
    // Test with auto budget
    const autoResult = await this.measurePerformance(
      'Auto-Render-Budget',
      async () => {
        const heatbox = new Heatbox(this.viewer, {
          voxelSize: 400,
          maxRenderVoxels: 'auto',
          renderLimitStrategy: 'hybrid',
          debug: false
        });
        
        await heatbox.setData(data);
        const stats = heatbox.getStatistics();
        
        heatbox.dispose();
        return stats;
      }
    );
    
    // Test with fixed budget
    const fixedResult = await this.measurePerformance(
      'Fixed-Render-Budget',
      async () => {
        const heatbox = new Heatbox(this.viewer, {
          voxelSize: 400,
          maxRenderVoxels: 8000,
          renderLimitStrategy: 'hybrid',
          debug: false
        });
        
        await heatbox.setData(data);
        const stats = heatbox.getStatistics();
        
        heatbox.dispose();
        return stats;
      }
    );
    
    this.results.push({
      category: 'Auto Render Budget',
      test: 'Auto vs Fixed Budget',
      autoTime: autoResult.executionTime,
      fixedTime: fixedResult.executionTime,
      autoStats: autoResult.result,
      fixedStats: fixedResult.result
    });
  }

  /**
   * Test enhanced auto voxel size performance
   */
  async testEnhancedAutoVoxelSize() {
    console.log('📏 Testing Enhanced Auto Voxel Size...');
    
    const data = this.generateTestData(12000, 'mixed');
    
    // Test occupancy mode
    const occupancyResult = await this.measurePerformance(
      'Occupancy-Auto-Voxel-Size',
      async () => {
        const heatbox = new Heatbox(this.viewer, {
          autoVoxelSize: true,
          autoVoxelSizeMode: 'occupancy',
          maxRenderVoxels: 8000,
          debug: false
        });
        
        await heatbox.setData(data);
        const stats = heatbox.getStatistics();
        
        heatbox.dispose();
        return stats;
      }
    );
    
    // Test simple mode
    const simpleResult = await this.measurePerformance(
      'Simple-Auto-Voxel-Size',
      async () => {
        const heatbox = new Heatbox(this.viewer, {
          autoVoxelSize: true,
          autoVoxelSizeMode: 'basic',
          maxRenderVoxels: 8000,
          debug: false
        });
        
        await heatbox.setData(data);
        const stats = heatbox.getStatistics();
        
        heatbox.dispose();
        return stats;
      }
    );
    
    this.results.push({
      category: 'Auto Voxel Size',
      test: 'Occupancy vs Simple Mode',
      occupancyTime: occupancyResult.executionTime,
      simpleTime: simpleResult.executionTime,
      occupancyStats: occupancyResult.result,
      simpleStats: simpleResult.result
    });
  }

  /**
   * Test fitView performance
   */
  async testFitViewPerformance() {
    console.log('🎯 Testing fitView performance...');
    
    const scenarios = [
      { name: 'Small Area', size: 5000, spread: 0.01 },
      { name: 'Medium Area', size: 8000, spread: 0.05 },
      { name: 'Large Area', size: 10000, spread: 0.1 }
    ];
    
    for (const scenario of scenarios) {
      const data = this.generateTestData(scenario.size, 'mixed', scenario.spread);
      
      const result = await this.measurePerformance(
        `FitView-${scenario.name}`,
        async () => {
          const heatbox = new Heatbox(this.viewer, {
            voxelSize: 600,
            renderLimitStrategy: 'hybrid',
            maxRenderVoxels: 'auto',
            debug: false
          });
          
          await heatbox.setData(data);
          
          // Measure fitView specifically
          const fitViewStart = performance.now();
          await heatbox.fitView();
          const fitViewTime = performance.now() - fitViewStart;
          
          const stats = heatbox.getStatistics();
          
          heatbox.dispose();
          return { stats, fitViewTime };
        }
      );
      
      this.results.push({
        category: 'FitView Performance',
        test: scenario.name,
        ...result,
        fitViewTime: result.result.fitViewTime
      });
    }
  }

  /**
   * Test memory usage patterns
   */
  async testMemoryUsage() {
    console.log('💾 Testing memory usage...');
    
    if (!performance.memory) {
      console.warn('⚠️ Performance.memory not available, skipping memory test');
      return;
    }
    
    const initialMemory = performance.memory.usedJSHeapSize;
    const data = this.generateTestData(20000, 'mixed');
    
    let heatbox = new Heatbox(this.viewer, {
      voxelSize: 400,
      renderLimitStrategy: 'hybrid',
      maxRenderVoxels: 'auto',
      debug: false
    });
    
    await heatbox.setData(data);
    const afterLoadMemory = performance.memory.usedJSHeapSize;
    
    // Test memory cleanup
    heatbox.dispose();
    heatbox = null;
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    const afterDisposeMemory = performance.memory.usedJSHeapSize;
    
    this.results.push({
      category: 'Memory Usage',
      test: 'Memory Lifecycle',
      initialMemory: this.formatBytes(initialMemory),
      afterLoadMemory: this.formatBytes(afterLoadMemory),
      afterDisposeMemory: this.formatBytes(afterDisposeMemory),
      memoryIncrease: this.formatBytes(afterLoadMemory - initialMemory),
      memoryCleanup: this.formatBytes(afterLoadMemory - afterDisposeMemory)
    });
  }

  /**
   * Test scalability with large datasets
   */
  async testScalability() {
    console.log('📈 Testing scalability...');
    
    const sizes = [5000, 10000, 20000, 35000];
    
    for (const size of sizes) {
      const data = this.generateTestData(size, 'mixed');
      
      const result = await this.measurePerformance(
        `Scalability-${size}`,
        async () => {
          const heatbox = new Heatbox(this.viewer, {
            voxelSize: 500,
            renderLimitStrategy: 'hybrid',
            maxRenderVoxels: 'auto',
            debug: false
          });
          
          await heatbox.setData(data);
          const stats = heatbox.getStatistics();
          
          heatbox.dispose();
          return stats;
        }
      );
      
      this.results.push({
        category: 'Scalability',
        test: `${size} entities`,
        entityCount: size,
        ...result
      });
    }
  }

  /**
   * Measure performance of a function
   */
  async measurePerformance(testName, testFunction) {
    console.log(`  ⏱️ Running: ${testName}`);
    
    const startTime = performance.now();
    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    let result;
    let error = null;
    
    try {
      result = await testFunction();
    } catch (e) {
      error = e;
      console.error(`❌ Test failed: ${testName}`, e);
    }
    
    const endTime = performance.now();
    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    return {
      testName,
      executionTime: Math.round(endTime - startTime),
      memoryDelta: endMemory - startMemory,
      result,
      error: error ? error.message : null
    };
  }

  /**
   * Generate test data
   */
  generateTestData(size, type, spread = 0.05) {
    const configs = {
      dense: {
        clusters: [
          { center: [139.7, 35.7, 50], radius: 0.01, density: 0.9, count: size }
        ]
      },
      sparse: {
        clusters: [
          { center: [139.7, 35.7, 50], radius: spread, density: 0.1, count: size }
        ]
      },
      mixed: {
        clusters: [
          { center: [139.7, 35.7, 50], radius: 0.02, density: 0.7, count: Math.floor(size * 0.4) },
          { center: [139.75, 35.72, 100], radius: 0.015, density: 0.5, count: Math.floor(size * 0.3) },
          { center: [139.8, 35.75, 30], radius: spread, density: 0.2, count: Math.floor(size * 0.3) }
        ]
      }
    };
    
    return generateSampleData(size, configs[type] || configs.mixed);
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport() {
    console.log('\n📋 Performance Test Report - CesiumJS Heatbox v0.1.9');
    console.log('='.repeat(60));
    
    // Group results by category
    const categories = {};
    this.results.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = [];
      }
      categories[result.category].push(result);
    });
    
    // Print results by category
    Object.entries(categories).forEach(([category, results]) => {
      console.log(`\n📊 ${category}`);
      console.log('-'.repeat(40));
      
      results.forEach(result => {
        if (result.error) {
          console.log(`❌ ${result.test}: FAILED - ${result.error}`);
        } else {
          console.log(`✅ ${result.test}: ${result.executionTime}ms`);
          
          if (result.result && result.result.renderedVoxels) {
            console.log(`   🎨 Rendered: ${result.result.renderedVoxels}/${result.result.totalVoxels} voxels`);
          }
          
          if (result.memoryDelta) {
            console.log(`   💾 Memory: ${this.formatBytes(result.memoryDelta)}`);
          }
        }
      });
    });
    
    // Performance summary
    const allExecutionTimes = this.results
      .filter(r => !r.error && r.executionTime)
      .map(r => r.executionTime);
    
    if (allExecutionTimes.length > 0) {
      const avgTime = allExecutionTimes.reduce((a, b) => a + b, 0) / allExecutionTimes.length;
      const maxTime = Math.max(...allExecutionTimes);
      const minTime = Math.min(...allExecutionTimes);
      
      console.log('\n📈 Performance Summary');
      console.log('-'.repeat(40));
      console.log(`Average execution time: ${avgTime.toFixed(1)}ms`);
      console.log(`Fastest test: ${minTime}ms`);
      console.log(`Slowest test: ${maxTime}ms`);
    }
    
    // Export results for further analysis
    if (typeof window !== 'undefined') {
      window.heatboxPerformanceResults = this.results;
      console.log('\n💾 Results exported to window.heatboxPerformanceResults');
    }
    
    console.log('\n✅ Performance test suite completed!');
    
    return this.results;
  }
}

// Export for use in browser or Node.js
export default HeatboxPerformanceTest;

// Browser usage example
if (typeof window !== 'undefined') {
  window.HeatboxPerformanceTest = HeatboxPerformanceTest;
  
  // Quick test function
  window.runQuickPerformanceTest = async function() {
    const tester = new HeatboxPerformanceTest();
    return await tester.runFullSuite();
  };
  
  console.log('🧪 Performance test utilities loaded. Run window.runQuickPerformanceTest() to start.');
}
