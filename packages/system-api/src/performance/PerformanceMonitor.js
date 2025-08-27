/**
 * Performance Monitor
 * Complete performance monitoring and optimization system with:
 * - LRU caching for context data
 * - Performance monitoring for context access patterns
 * - Memory usage and cleanup effectiveness monitoring
 * - Background compression and cleanup processes
 */

import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * LRU Cache implementation for context data
 */
class LRUCache {
  constructor(maxSize = 100, maxMemoryMB = 500) {
    this.maxSize = maxSize;
    this.maxMemoryMB = maxMemoryMB * 1024 * 1024; // Convert to bytes
    this.cache = new Map();
    this.accessOrder = [];
    this.memoryUsage = 0;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      compressions: 0
    };
  }

  /**
   * Get item from cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined
   */
  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      this.updateAccessOrder(key);
      this.stats.hits++;
      
      const entry = this.cache.get(key);
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      
      return entry.value;
    }
    
    this.stats.misses++;
    return undefined;
  }

  /**
   * Set item in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {Object} options - Cache options
   */
  async set(key, value, options = {}) {
    const size = this.calculateSize(value);
    
    // Check if we need to make space
    while (this.memoryUsage + size > this.maxMemoryMB || this.cache.size >= this.maxSize) {
      if (!this.evictLRU()) {
        break; // No more items to evict
      }
    }

    // Compress if large
    let storedValue = value;
    let compressed = false;
    
    if (size > 1024 * 1024 && options.compress !== false) { // > 1MB
      try {
        const json = JSON.stringify(value);
        const compressedData = await gzip(json);
        if (compressedData.length < size * 0.8) { // Only use if 20% smaller
          storedValue = compressedData;
          compressed = true;
          this.stats.compressions++;
        }
      } catch (error) {
        // Compression failed, store uncompressed
      }
    }

    const entry = {
      value: storedValue,
      size: compressed ? storedValue.length : size,
      compressed,
      created: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      ttl: options.ttl || null,
      priority: options.priority || 'normal'
    };

    this.cache.set(key, entry);
    this.accessOrder.push(key);
    this.memoryUsage += entry.size;
  }

  /**
   * Update access order for LRU
   * @private
   */
  updateAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(key);
    }
  }

  /**
   * Evict least recently used item
   * @private
   */
  evictLRU() {
    if (this.accessOrder.length === 0) {
      return false;
    }

    // Find item to evict (considering priority)
    let victimIndex = 0;
    for (let i = 0; i < Math.min(10, this.accessOrder.length); i++) {
      const key = this.accessOrder[i];
      const entry = this.cache.get(key);
      if (entry && entry.priority === 'low') {
        victimIndex = i;
        break;
      }
    }

    const key = this.accessOrder[victimIndex];
    const entry = this.cache.get(key);
    
    if (entry) {
      this.memoryUsage -= entry.size;
      this.cache.delete(key);
      this.accessOrder.splice(victimIndex, 1);
      this.stats.evictions++;
      return true;
    }
    
    return false;
  }

  /**
   * Calculate size of value
   * @private
   */
  calculateSize(value) {
    if (Buffer.isBuffer(value)) {
      return value.length;
    }
    
    const json = JSON.stringify(value);
    return Buffer.byteLength(json, 'utf8');
  }

  /**
   * Clear expired entries
   */
  clearExpired() {
    const now = Date.now();
    let cleared = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now - entry.created > entry.ttl) {
        this.memoryUsage -= entry.size;
        this.cache.delete(key);
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
          this.accessOrder.splice(index, 1);
        }
        cleared++;
      }
    }
    
    return cleared;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    
    return {
      ...this.stats,
      hitRate,
      size: this.cache.size,
      memoryUsageMB: this.memoryUsage / (1024 * 1024),
      maxMemoryMB: this.maxMemoryMB / (1024 * 1024)
    };
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
    this.memoryUsage = 0;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      compressions: 0
    };
  }
}

/**
 * Performance Monitor class
 */
class PerformanceMonitor {
  constructor(config = {}) {
    this.config = {
      cacheMaxSize: config.cacheMaxSize || 100,
      cacheMaxMemoryMB: config.cacheMaxMemoryMB || 500,
      compressionThresholdMB: config.compressionThresholdMB || 1,
      cleanupIntervalMs: config.cleanupIntervalMs || 60000, // 1 minute
      compressionIntervalMs: config.compressionIntervalMs || 300000, // 5 minutes
      metricsRetentionMs: config.metricsRetentionMs || 3600000, // 1 hour
      performanceTargets: {
        contextRetrievalP95Ms: config.contextRetrievalP95Ms || 100,
        memoryFootprintMB: config.memoryFootprintMB || 500,
        cacheHitRatio: config.cacheHitRatio || 0.8
      },
      ...config
    };

    // Initialize components
    this.cache = new LRUCache(this.config.cacheMaxSize, this.config.cacheMaxMemoryMB);
    this.metrics = {
      contextAccess: [],
      memoryUsage: [],
      cleanupEffectiveness: [],
      compressionStats: [],
      performanceTimings: []
    };
    
    this.accessPatterns = new Map(); // Track access patterns per context
    this.backgroundProcesses = new Map(); // Track background processes
    
    // Start background processes
    this.startBackgroundProcesses();
  }

  /**
   * Start background processes
   * @private
   */
  startBackgroundProcesses() {
    // Background cleanup process
    const cleanupProcess = setInterval(() => {
      this.performBackgroundCleanup();
    }, this.config.cleanupIntervalMs);
    
    this.backgroundProcesses.set('cleanup', cleanupProcess);

    // Background compression process
    const compressionProcess = setInterval(() => {
      this.performBackgroundCompression();
    }, this.config.compressionIntervalMs);
    
    this.backgroundProcesses.set('compression', compressionProcess);

    // Metrics cleanup process
    const metricsProcess = setInterval(() => {
      this.cleanupOldMetrics();
    }, this.config.cleanupIntervalMs);
    
    this.backgroundProcesses.set('metrics', metricsProcess);
  }

  /**
   * Stop background processes
   */
  stopBackgroundProcesses() {
    for (const [name, process] of this.backgroundProcesses.entries()) {
      clearInterval(process);
    }
    this.backgroundProcesses.clear();
  }

  /**
   * Store context with caching
   * @param {string} contextId - Context ID
   * @param {Object} context - Context data
   * @param {Object} options - Storage options
   */
  async storeContext(contextId, context, options = {}) {
    const startTime = Date.now();
    
    try {
      // Store in cache
      await this.cache.set(contextId, context, {
        ttl: options.ttl,
        priority: options.priority || 'normal',
        compress: options.compress !== false
      });

      // Track access pattern
      this.trackAccessPattern(contextId, 'write');

      // Record performance timing
      const duration = Date.now() - startTime;
      this.recordPerformanceTiming('store', duration);

      return {
        success: true,
        cached: true,
        duration
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Retrieve context with caching
   * @param {string} contextId - Context ID
   * @returns {Object} Context data or null
   */
  async retrieveContext(contextId) {
    const startTime = Date.now();
    
    try {
      // Check cache first
      let context = this.cache.get(contextId);
      
      if (context) {
        // Handle decompression if needed
        const entry = this.cache.cache.get(contextId);
        if (entry && entry.compressed) {
          const decompressed = await gunzip(context);
          context = JSON.parse(decompressed.toString());
        }

        // Track access pattern
        this.trackAccessPattern(contextId, 'read');

        // Record performance timing
        const duration = Date.now() - startTime;
        this.recordPerformanceTiming('retrieve', duration);

        return {
          success: true,
          context,
          cached: true,
          duration
        };
      }

      // Track cache miss
      this.trackAccessPattern(contextId, 'miss');
      
      return {
        success: false,
        cached: false,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Track access patterns
   * @private
   */
  trackAccessPattern(contextId, type) {
    if (!this.accessPatterns.has(contextId)) {
      this.accessPatterns.set(contextId, {
        reads: 0,
        writes: 0,
        misses: 0,
        firstAccess: Date.now(),
        lastAccess: Date.now(),
        accessHistory: []
      });
    }

    const pattern = this.accessPatterns.get(contextId);
    pattern.lastAccess = Date.now();
    pattern[type === 'read' ? 'reads' : type === 'write' ? 'writes' : 'misses']++;
    
    // Keep limited history
    pattern.accessHistory.push({
      type,
      timestamp: Date.now()
    });
    
    if (pattern.accessHistory.length > 100) {
      pattern.accessHistory.shift();
    }

    // Record metric
    this.metrics.contextAccess.push({
      contextId,
      type,
      timestamp: Date.now()
    });
  }

  /**
   * Record performance timing
   * @private
   */
  recordPerformanceTiming(operation, duration) {
    this.metrics.performanceTimings.push({
      operation,
      duration,
      timestamp: Date.now()
    });

    // Keep limited history
    if (this.metrics.performanceTimings.length > 10000) {
      this.metrics.performanceTimings.splice(0, 1000);
    }
  }

  /**
   * Perform background cleanup
   * @private
   */
  async performBackgroundCleanup() {
    const startTime = Date.now();
    const initialMemory = process.memoryUsage();
    
    try {
      // Clear expired cache entries
      const expiredCleared = this.cache.clearExpired();
      
      // Clean up old access patterns
      const now = Date.now();
      const patternTimeout = 24 * 60 * 60 * 1000; // 24 hours
      let patternsCleared = 0;
      
      for (const [contextId, pattern] of this.accessPatterns.entries()) {
        if (now - pattern.lastAccess > patternTimeout) {
          this.accessPatterns.delete(contextId);
          patternsCleared++;
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryFreed = initialMemory.heapUsed - finalMemory.heapUsed;

      // Record cleanup effectiveness
      this.metrics.cleanupEffectiveness.push({
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        expiredCleared,
        patternsCleared,
        memoryFreedMB: memoryFreed / (1024 * 1024),
        initialMemoryMB: initialMemory.heapUsed / (1024 * 1024),
        finalMemoryMB: finalMemory.heapUsed / (1024 * 1024)
      });

      return {
        success: true,
        expiredCleared,
        patternsCleared,
        memoryFreedMB: memoryFreed / (1024 * 1024)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Perform background compression
   * @private
   */
  async performBackgroundCompression() {
    const startTime = Date.now();
    let compressed = 0;
    let savedBytes = 0;

    try {
      // Find uncompressed large entries
      for (const [key, entry] of this.cache.cache.entries()) {
        if (!entry.compressed && entry.size > this.config.compressionThresholdMB * 1024 * 1024) {
          try {
            const json = JSON.stringify(entry.value);
            const compressedData = await gzip(json);
            
            if (compressedData.length < entry.size * 0.8) {
              const savedSize = entry.size - compressedData.length;
              
              // Update entry
              entry.value = compressedData;
              entry.compressed = true;
              this.cache.memoryUsage -= savedSize;
              entry.size = compressedData.length;
              
              compressed++;
              savedBytes += savedSize;
            }
          } catch (error) {
            // Skip this entry
          }
        }
      }

      // Record compression stats
      this.metrics.compressionStats.push({
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        itemsCompressed: compressed,
        savedMB: savedBytes / (1024 * 1024)
      });

      return {
        success: true,
        itemsCompressed: compressed,
        savedMB: savedBytes / (1024 * 1024)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up old metrics
   * @private
   */
  cleanupOldMetrics() {
    const cutoff = Date.now() - this.config.metricsRetentionMs;
    
    // Clean up each metric type
    for (const metricType of Object.keys(this.metrics)) {
      const metrics = this.metrics[metricType];
      if (Array.isArray(metrics)) {
        this.metrics[metricType] = metrics.filter(m => m.timestamp > cutoff);
      }
    }
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    const memUsage = process.memoryUsage();
    
    const usage = {
      timestamp: Date.now(),
      heapUsedMB: memUsage.heapUsed / (1024 * 1024),
      heapTotalMB: memUsage.heapTotal / (1024 * 1024),
      rssMB: memUsage.rss / (1024 * 1024),
      externalMB: memUsage.external / (1024 * 1024),
      cacheMemoryMB: this.cache.memoryUsage / (1024 * 1024),
      cacheSize: this.cache.cache.size
    };

    this.metrics.memoryUsage.push(usage);
    
    return usage;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const now = Date.now();
    const recentTimings = this.metrics.performanceTimings.filter(
      t => now - t.timestamp < 300000 // Last 5 minutes
    );

    // Calculate percentiles for retrieval times
    const retrievalTimings = recentTimings
      .filter(t => t.operation === 'retrieve')
      .map(t => t.duration)
      .sort((a, b) => a - b);

    const p95Index = Math.floor(retrievalTimings.length * 0.95);
    const p95Retrieval = retrievalTimings[p95Index] || 0;

    // Get cache stats
    const cacheStats = this.cache.getStats();

    // Get memory stats
    const currentMemory = this.monitorMemoryUsage();

    // Check against performance targets
    const targets = this.config.performanceTargets;
    const performance = {
      contextRetrievalP95: {
        value: p95Retrieval,
        target: targets.contextRetrievalP95Ms,
        meets: p95Retrieval <= targets.contextRetrievalP95Ms
      },
      memoryFootprint: {
        value: currentMemory.heapUsedMB,
        target: targets.memoryFootprintMB,
        meets: currentMemory.heapUsedMB <= targets.memoryFootprintMB
      },
      cacheHitRatio: {
        value: cacheStats.hitRate,
        target: targets.cacheHitRatio,
        meets: cacheStats.hitRate >= targets.cacheHitRatio
      }
    };

    return {
      timestamp: now,
      performance,
      cache: cacheStats,
      memory: currentMemory,
      recentOperations: {
        total: recentTimings.length,
        byType: {
          store: recentTimings.filter(t => t.operation === 'store').length,
          retrieve: recentTimings.filter(t => t.operation === 'retrieve').length
        }
      }
    };
  }

  /**
   * Get access patterns analysis
   */
  getAccessPatternsAnalysis() {
    const patterns = [];
    
    for (const [contextId, pattern] of this.accessPatterns.entries()) {
      const frequency = pattern.accessHistory.length > 0
        ? pattern.accessHistory.length / ((Date.now() - pattern.firstAccess) / 1000)
        : 0;

      patterns.push({
        contextId,
        reads: pattern.reads,
        writes: pattern.writes,
        misses: pattern.misses,
        totalAccesses: pattern.reads + pattern.writes,
        accessFrequency: frequency,
        lastAccess: new Date(pattern.lastAccess),
        age: (Date.now() - pattern.firstAccess) / 1000 // seconds
      });
    }

    // Sort by access frequency
    patterns.sort((a, b) => b.accessFrequency - a.accessFrequency);

    // Analyze patterns
    const hotContexts = patterns.slice(0, 10);
    const coldContexts = patterns.filter(p => p.accessFrequency < 0.01);

    return {
      totalContexts: patterns.length,
      hotContexts,
      coldContexts: coldContexts.length,
      averageAccessFrequency: patterns.reduce((sum, p) => sum + p.accessFrequency, 0) / patterns.length || 0,
      patterns: patterns.slice(0, 50) // Return top 50
    };
  }

  /**
   * Get cleanup effectiveness report
   */
  getCleanupEffectivenessReport() {
    const recent = this.metrics.cleanupEffectiveness.slice(-10);
    
    if (recent.length === 0) {
      return {
        message: 'No cleanup operations performed yet'
      };
    }

    const totalMemoryFreed = recent.reduce((sum, c) => sum + (c.memoryFreedMB || 0), 0);
    const totalItemsCleaned = recent.reduce((sum, c) => sum + c.expiredCleared + c.patternsCleared, 0);
    const averageDuration = recent.reduce((sum, c) => sum + c.duration, 0) / recent.length;

    return {
      recentCleanups: recent.length,
      totalMemoryFreedMB: totalMemoryFreed,
      totalItemsCleaned,
      averageDurationMs: averageDuration,
      lastCleanup: recent[recent.length - 1],
      effectiveness: totalMemoryFreed > 0 ? 'effective' : 'minimal'
    };
  }

  /**
   * Get compression effectiveness report
   */
  getCompressionEffectivenessReport() {
    const recent = this.metrics.compressionStats.slice(-10);
    
    if (recent.length === 0) {
      return {
        message: 'No compression operations performed yet'
      };
    }

    const totalSaved = recent.reduce((sum, c) => sum + (c.savedMB || 0), 0);
    const totalCompressed = recent.reduce((sum, c) => sum + c.itemsCompressed, 0);
    const averageDuration = recent.reduce((sum, c) => sum + c.duration, 0) / recent.length;

    return {
      recentCompressions: recent.length,
      totalSavedMB: totalSaved,
      totalItemsCompressed: totalCompressed,
      averageDurationMs: averageDuration,
      lastCompression: recent[recent.length - 1],
      effectiveness: totalSaved > 10 ? 'highly effective' : totalSaved > 1 ? 'effective' : 'minimal'
    };
  }

  /**
   * Optimize cache based on access patterns
   */
  optimizeCache() {
    const analysis = this.getAccessPatternsAnalysis();
    const optimizations = [];

    // Prioritize hot contexts
    for (const context of analysis.hotContexts) {
      const entry = this.cache.cache.get(context.contextId);
      if (entry) {
        entry.priority = 'high';
        optimizations.push({
          contextId: context.contextId,
          action: 'prioritized',
          reason: 'high access frequency'
        });
      }
    }

    // Consider evicting cold contexts
    const coldThreshold = Date.now() - 3600000; // 1 hour
    for (const [contextId, pattern] of this.accessPatterns.entries()) {
      if (pattern.lastAccess < coldThreshold && pattern.reads < 2) {
        const entry = this.cache.cache.get(contextId);
        if (entry) {
          entry.priority = 'low';
          optimizations.push({
            contextId,
            action: 'deprioritized',
            reason: 'low access frequency'
          });
        }
      }
    }

    return {
      optimizationsApplied: optimizations.length,
      optimizations
    };
  }

  /**
   * Force cleanup
   */
  async forceCleanup() {
    const results = {
      cleanup: await this.performBackgroundCleanup(),
      compression: await this.performBackgroundCompression(),
      cacheCleared: false
    };

    // Clear cache if memory pressure is high
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
      this.cache.clear();
      results.cacheCleared = true;
    }

    return results;
  }

  /**
   * Get full performance report
   */
  getFullReport() {
    return {
      timestamp: Date.now(),
      metrics: this.getPerformanceMetrics(),
      accessPatterns: this.getAccessPatternsAnalysis(),
      cleanupEffectiveness: this.getCleanupEffectivenessReport(),
      compressionEffectiveness: this.getCompressionEffectivenessReport(),
      cacheOptimizations: this.optimizeCache()
    };
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      config: this.config,
      metrics: this.metrics,
      cacheStats: this.cache.getStats(),
      accessPatterns: Array.from(this.accessPatterns.entries()).map(([id, pattern]) => ({
        contextId: id,
        ...pattern
      }))
    };
  }

  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.metrics = {
      contextAccess: [],
      memoryUsage: [],
      cleanupEffectiveness: [],
      compressionStats: [],
      performanceTimings: []
    };
    
    this.cache.clear();
    this.accessPatterns.clear();
  }

  /**
   * Shutdown monitor
   */
  shutdown() {
    this.stopBackgroundProcesses();
    this.cache.clear();
  }
}

export default PerformanceMonitor;