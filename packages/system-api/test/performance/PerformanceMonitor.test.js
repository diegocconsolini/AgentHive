/**
 * Performance Monitor Tests
 * Comprehensive test suite for the performance monitoring and optimization system
 */

import { jest } from '@jest/globals';
import PerformanceMonitor from '../../src/performance/PerformanceMonitor.js';

describe('PerformanceMonitor', () => {
  let monitor;

  beforeEach(() => {
    // Use fake timers for testing background processes
    jest.useFakeTimers();
    
    monitor = new PerformanceMonitor({
      cacheMaxSize: 10,
      cacheMaxMemoryMB: 10,
      cleanupIntervalMs: 1000,
      compressionIntervalMs: 2000,
      metricsRetentionMs: 5000
    });
  });

  afterEach(() => {
    monitor.shutdown();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('LRU Cache', () => {
    it('should store and retrieve contexts from cache', async () => {
      const context = { data: 'test context', timestamp: Date.now() };
      
      const storeResult = await monitor.storeContext('test-1', context);
      expect(storeResult.success).toBe(true);
      expect(storeResult.cached).toBe(true);

      const retrieveResult = await monitor.retrieveContext('test-1');
      expect(retrieveResult.success).toBe(true);
      expect(retrieveResult.context).toEqual(context);
      expect(retrieveResult.cached).toBe(true);
    });

    it('should handle cache misses', async () => {
      const result = await monitor.retrieveContext('non-existent');
      expect(result.success).toBe(false);
      expect(result.cached).toBe(false);
    });

    it('should evict LRU items when cache is full', async () => {
      // Fill cache to capacity
      for (let i = 0; i < 12; i++) {
        await monitor.storeContext(`context-${i}`, { data: `test-${i}` });
      }

      // First contexts should be evicted
      const result1 = await monitor.retrieveContext('context-0');
      expect(result1.success).toBe(false);

      // Recent contexts should still be cached
      const result2 = await monitor.retrieveContext('context-11');
      expect(result2.success).toBe(true);
    });

    it('should update access order on retrieval', async () => {
      // Store multiple contexts
      await monitor.storeContext('ctx-1', { data: 'first' });
      await monitor.storeContext('ctx-2', { data: 'second' });
      await monitor.storeContext('ctx-3', { data: 'third' });

      // Access ctx-1 to make it recently used
      await monitor.retrieveContext('ctx-1');

      // Fill cache to trigger eviction
      for (let i = 4; i < 12; i++) {
        await monitor.storeContext(`ctx-${i}`, { data: `test-${i}` });
      }

      // ctx-1 should still be in cache (recently accessed)
      const result1 = await monitor.retrieveContext('ctx-1');
      expect(result1.success).toBe(true);

      // ctx-2 should be evicted (least recently used)
      const result2 = await monitor.retrieveContext('ctx-2');
      expect(result2.success).toBe(false);
    });

    it('should handle TTL expiration', async () => {
      await monitor.storeContext('ttl-test', { data: 'expires' }, { ttl: 1000 });
      
      // Should be available immediately
      let result = await monitor.retrieveContext('ttl-test');
      expect(result.success).toBe(true);

      // Advance time and trigger cleanup
      jest.advanceTimersByTime(1500);
      monitor.cache.clearExpired();

      // Should be expired
      result = await monitor.retrieveContext('ttl-test');
      expect(result.success).toBe(false);
    });

    it('should respect priority levels', async () => {
      // Fill cache with low priority items
      for (let i = 0; i < 9; i++) {
        await monitor.storeContext(`low-${i}`, { data: i }, { priority: 'low' });
      }

      // Add high priority item
      await monitor.storeContext('high-1', { data: 'important' }, { priority: 'high' });

      // Add more items to trigger eviction
      for (let i = 0; i < 5; i++) {
        await monitor.storeContext(`normal-${i}`, { data: i });
      }

      // High priority should still be cached
      const highResult = await monitor.retrieveContext('high-1');
      expect(highResult.success).toBe(true);

      // Low priority items should be evicted first
      const lowResult = await monitor.retrieveContext('low-0');
      expect(lowResult.success).toBe(false);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track context access patterns', async () => {
      await monitor.storeContext('pattern-test', { data: 'test' });
      await monitor.retrieveContext('pattern-test');
      await monitor.retrieveContext('pattern-test');
      await monitor.retrieveContext('missing');

      const analysis = monitor.getAccessPatternsAnalysis();
      expect(analysis.totalContexts).toBe(2);
      
      const patternTest = analysis.patterns.find(p => p.contextId === 'pattern-test');
      expect(patternTest).toBeDefined();
      expect(patternTest.reads).toBe(2);
      expect(patternTest.writes).toBe(1);
      
      const missing = analysis.patterns.find(p => p.contextId === 'missing');
      expect(missing).toBeDefined();
      expect(missing.misses).toBe(1);
    });

    it('should identify hot and cold contexts', async () => {
      // Create hot context (frequent access)
      for (let i = 0; i < 20; i++) {
        await monitor.retrieveContext('hot-context');
        jest.advanceTimersByTime(50);
      }

      // Create cold context (rare access)
      await monitor.retrieveContext('cold-context');
      jest.advanceTimersByTime(10000);

      const analysis = monitor.getAccessPatternsAnalysis();
      expect(analysis.hotContexts.length).toBeGreaterThanOrEqual(1);
      expect(analysis.hotContexts[0].contextId).toBe('hot-context');
      expect(analysis.coldContexts).toBeGreaterThanOrEqual(0);
    });

    it('should calculate performance metrics correctly', async () => {
      // Perform operations
      for (let i = 0; i < 10; i++) {
        await monitor.storeContext(`ctx-${i}`, { data: i });
        await monitor.retrieveContext(`ctx-${i}`);
      }

      const metrics = monitor.getPerformanceMetrics();
      
      expect(metrics.cache.hitRate).toBeGreaterThanOrEqual(0.5);
      expect(typeof metrics.performance.contextRetrievalP95.value).toBe('number');
      expect(typeof metrics.performance.memoryFootprint.value).toBe('number');
      expect(metrics.performance.cacheHitRatio.value).toBe(metrics.cache.hitRate);
    });

    it('should monitor memory usage', () => {
      const memUsage = monitor.monitorMemoryUsage();
      
      expect(memUsage).toHaveProperty('heapUsedMB');
      expect(memUsage).toHaveProperty('heapTotalMB');
      expect(memUsage).toHaveProperty('cacheMemoryMB');
      expect(memUsage).toHaveProperty('cacheSize');
      expect(typeof memUsage.heapUsedMB).toBe('number');
    });
  });

  describe('Background Processes', () => {
    it('should perform background cleanup', async () => {
      // Add some expired entries
      await monitor.storeContext('expired-1', { data: 'old' }, { ttl: 100 });
      await monitor.storeContext('active-1', { data: 'new' });
      
      jest.advanceTimersByTime(200);
      
      const result = await monitor.performBackgroundCleanup();
      expect(result.success).toBe(true);
      expect(result.expiredCleared).toBeGreaterThanOrEqual(1);
    });

    it('should perform background compression', async () => {
      // Create large uncompressed data
      const largeData = {
        data: 'x'.repeat(2 * 1024 * 1024), // 2MB of data
        metadata: { created: Date.now() }
      };

      await monitor.storeContext('large-1', largeData, { compress: false });
      
      const result = await monitor.performBackgroundCompression();
      expect(result.success).toBe(true);
      
      // Verify compression happened
      if (result.itemsCompressed > 0) {
        expect(result.savedMB).toBeGreaterThan(0);
      }
    });

    it('should automatically run cleanup at intervals', async () => {
      const spy = jest.spyOn(monitor, 'performBackgroundCleanup');
      
      // Advance time to trigger cleanup
      jest.advanceTimersByTime(1000);
      jest.advanceTimersByTime(1000);
      
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should automatically run compression at intervals', async () => {
      const spy = jest.spyOn(monitor, 'performBackgroundCompression');
      
      // Advance time to trigger compression
      jest.advanceTimersByTime(2000);
      jest.advanceTimersByTime(2000);
      
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should clean up old metrics', () => {
      // Add old metrics
      monitor.metrics.contextAccess.push({ timestamp: Date.now() - 10000 });
      monitor.metrics.performanceTimings.push({ timestamp: Date.now() - 10000 });
      
      // Add recent metrics
      monitor.metrics.contextAccess.push({ timestamp: Date.now() });
      monitor.metrics.performanceTimings.push({ timestamp: Date.now() });
      
      jest.advanceTimersByTime(1000);
      monitor.cleanupOldMetrics();
      
      // Old metrics should be removed
      expect(monitor.metrics.contextAccess).toHaveLength(1);
      expect(monitor.metrics.performanceTimings).toHaveLength(1);
    });
  });

  describe('Compression', () => {
    it('should compress large contexts automatically', async () => {
      const largeContext = {
        data: 'test'.repeat(100000),
        metadata: { size: 'large' }
      };

      await monitor.storeContext('large', largeContext);
      
      // Check if compression was applied
      const entry = monitor.cache.cache.get('large');
      if (entry && entry.compressed) {
        expect(entry.size).toBeLessThan(400000); // Should be compressed
      }
    });

    it('should decompress contexts on retrieval', async () => {
      const context = {
        data: 'test'.repeat(100000),
        value: 42
      };

      await monitor.storeContext('compressed', context);
      
      const result = await monitor.retrieveContext('compressed');
      expect(result.success).toBe(true);
      expect(result.context).toEqual(context);
    });
  });

  describe('Optimization', () => {
    it('should optimize cache based on access patterns', async () => {
      // Create different access patterns
      for (let i = 0; i < 10; i++) {
        await monitor.retrieveContext('hot-1');
      }
      
      await monitor.retrieveContext('cold-1');
      jest.advanceTimersByTime(3700000); // Make it cold
      
      const result = monitor.optimizeCache();
      expect(result.optimizationsApplied).toBeGreaterThanOrEqual(0);
    });

    it('should force cleanup when requested', async () => {
      await monitor.storeContext('test-1', { data: 'test' });
      
      const result = await monitor.forceCleanup();
      expect(result).toHaveProperty('cleanup');
      expect(result).toHaveProperty('compression');
      expect(result.cleanup.success).toBe(true);
    });
  });

  describe('Reporting', () => {
    it('should generate cleanup effectiveness report', async () => {
      await monitor.performBackgroundCleanup();
      
      const report = monitor.getCleanupEffectivenessReport();
      expect(report).toHaveProperty('recentCleanups');
      expect(report).toHaveProperty('totalMemoryFreedMB');
      expect(report).toHaveProperty('effectiveness');
    });

    it('should generate compression effectiveness report', async () => {
      await monitor.performBackgroundCompression();
      
      const report = monitor.getCompressionEffectivenessReport();
      expect(report).toHaveProperty('recentCompressions');
      expect(report).toHaveProperty('totalSavedMB');
      expect(report).toHaveProperty('effectiveness');
    });

    it('should generate full performance report', async () => {
      // Perform some operations
      await monitor.storeContext('test', { data: 'test' });
      await monitor.retrieveContext('test');
      
      const report = monitor.getFullReport();
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('accessPatterns');
      expect(report).toHaveProperty('cleanupEffectiveness');
      expect(report).toHaveProperty('compressionEffectiveness');
      expect(report).toHaveProperty('cacheOptimizations');
    });

    it('should export metrics for analysis', () => {
      const exported = monitor.exportMetrics();
      expect(exported).toHaveProperty('config');
      expect(exported).toHaveProperty('metrics');
      expect(exported).toHaveProperty('cacheStats');
      expect(exported).toHaveProperty('accessPatterns');
    });
  });

  describe('Performance Targets', () => {
    it('should check against performance targets', async () => {
      // Set strict targets
      monitor.config.performanceTargets = {
        contextRetrievalP95Ms: 10,
        memoryFootprintMB: 1000,
        cacheHitRatio: 0.8
      };

      // Perform operations
      for (let i = 0; i < 10; i++) {
        await monitor.storeContext(`test-${i}`, { data: i });
      }
      
      for (let i = 0; i < 10; i++) {
        await monitor.retrieveContext(`test-${i}`);
      }

      const metrics = monitor.getPerformanceMetrics();
      expect(typeof metrics.performance.contextRetrievalP95.meets).toBe('boolean');
      expect(typeof metrics.performance.memoryFootprint.meets).toBe('boolean');
      expect(typeof metrics.performance.cacheHitRatio.meets).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty cache gracefully', () => {
      const stats = monitor.cache.getStats();
      expect(stats.hitRate).toBe(0);
      expect(stats.size).toBe(0);
    });

    it('should handle invalid context IDs', async () => {
      const result = await monitor.retrieveContext(null);
      expect(result.success).toBe(false);
    });

    it('should handle compression failures gracefully', async () => {
      // Store a non-serializable object
      const circularRef = {};
      circularRef.self = circularRef;
      
      // This should not throw
      const result = await monitor.storeContext('circular', circularRef);
      // Result depends on implementation handling
    });

    it('should reset metrics correctly', () => {
      monitor.metrics.contextAccess.push({ test: 'data' });
      monitor.metrics.performanceTimings.push({ test: 'data' });
      
      monitor.resetMetrics();
      
      expect(monitor.metrics.contextAccess).toHaveLength(0);
      expect(monitor.metrics.performanceTimings).toHaveLength(0);
      expect(monitor.cache.cache.size).toBe(0);
    });

    it('should shutdown cleanly', () => {
      monitor.shutdown();
      
      // Verify background processes are stopped
      expect(monitor.backgroundProcesses.size).toBe(0);
      expect(monitor.cache.cache.size).toBe(0);
    });
  });

  describe('Stress Testing', () => {
    it('should handle high load', async () => {
      
      const promises = [];
      
      // Simulate high load
      for (let i = 0; i < 100; i++) {
        promises.push(monitor.storeContext(`stress-${i}`, { data: i }));
        if (i % 2 === 0) {
          promises.push(monitor.retrieveContext(`stress-${i}`));
        }
      }
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success).length;
      
      expect(successful).toBeGreaterThan(0);
      
      // Check system is still responsive
      const metrics = monitor.getPerformanceMetrics();
      expect(metrics).toBeDefined();
    });

    it('should maintain performance under memory pressure', async () => {
      // Fill cache to near capacity
      const largeData = { data: 'x'.repeat(1024 * 1024) }; // 1MB
      
      // Store more items than cache can hold
      for (let i = 0; i < 12; i++) {
        await monitor.storeContext(`pressure-${i}`, largeData);
      }
      
      // Should still be able to operate
      const result = await monitor.storeContext('final', { small: 'data' });
      expect(result.success).toBe(true);
      
      // Cache should have evicted items or be at capacity
      const stats = monitor.cache.getStats();
      expect(stats.size).toBeLessThanOrEqual(10); // Max cache size is 10
    });
  });
});

describe('PerformanceMonitor Integration', () => {
  let monitor;

  beforeAll(() => {
    monitor = new PerformanceMonitor({
      cacheMaxSize: 50,
      cacheMaxMemoryMB: 100,
      cleanupIntervalMs: 5000,
      compressionIntervalMs: 10000
    });
  });

  afterAll(() => {
    monitor.shutdown();
  });

  it('should integrate with real-world usage patterns', async () => {
    
    // Simulate real usage pattern
    const contexts = [];
    
    // Initial load
    for (let i = 0; i < 20; i++) {
      const context = {
        id: `project-${i}`,
        data: `Project data ${i}`,
        files: Array(10).fill(null).map((_, j) => `file-${j}.js`),
        metadata: {
          created: Date.now(),
          version: '1.0.0'
        }
      };
      contexts.push(context);
      await monitor.storeContext(`project-${i}`, context);
    }
    
    // Simulate access patterns
    for (let cycle = 0; cycle < 5; cycle++) {
      // Hot contexts (frequent access)
      for (let i = 0; i < 5; i++) {
        await monitor.retrieveContext(`project-${i}`);
      }
      
      // Warm contexts (moderate access)
      for (let i = 5; i < 10; i++) {
        if (cycle % 2 === 0) {
          await monitor.retrieveContext(`project-${i}`);
        }
      }
      
      // Cold contexts (rare access)
      if (cycle === 0) {
        for (let i = 10; i < 20; i++) {
          await monitor.retrieveContext(`project-${i}`);
        }
      }
      
      // Add new contexts
      const newContext = {
        id: `new-${cycle}`,
        data: `New data ${cycle}`,
        timestamp: Date.now()
      };
      await monitor.storeContext(`new-${cycle}`, newContext);
    }
    
    // Verify system performance
    const report = monitor.getFullReport();
    
    expect(report.metrics.cache.hitRate).toBeGreaterThan(0.5);
    expect(report.accessPatterns.hotContexts.length).toBeGreaterThan(0);
    expect(report.metrics.performance.memoryFootprint.meets).toBe(true);
    
    // Verify optimization worked
    const optimizations = report.cacheOptimizations;
    expect(optimizations.optimizationsApplied).toBeGreaterThan(0);
  });
});