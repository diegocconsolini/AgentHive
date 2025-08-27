/**
 * Performance Optimizer
 * Advanced optimization strategies for memory management system
 */

import PerformanceMonitor from './PerformanceMonitor.js';

class PerformanceOptimizer {
  constructor(monitor) {
    this.monitor = monitor || new PerformanceMonitor();
    this.optimizationHistory = [];
    this.strategies = this._initializeStrategies();
    this.thresholds = this._initializeThresholds();
    this.recommendations = [];
  }

  /**
   * Initialize optimization strategies
   * @private
   */
  _initializeStrategies() {
    return {
      cacheOptimization: {
        name: 'Cache Optimization',
        check: () => this._checkCacheEfficiency(),
        optimize: () => this._optimizeCache(),
        priority: 'high'
      },
      memoryOptimization: {
        name: 'Memory Optimization',
        check: () => this._checkMemoryUsage(),
        optimize: () => this._optimizeMemory(),
        priority: 'high'
      },
      compressionOptimization: {
        name: 'Compression Optimization',
        check: () => this._checkCompressionNeeds(),
        optimize: () => this._optimizeCompression(),
        priority: 'medium'
      },
      accessPatternOptimization: {
        name: 'Access Pattern Optimization',
        check: () => this._checkAccessPatterns(),
        optimize: () => this._optimizeAccessPatterns(),
        priority: 'low'
      },
      cleanupOptimization: {
        name: 'Cleanup Optimization',
        check: () => this._checkCleanupEffectiveness(),
        optimize: () => this._optimizeCleanup(),
        priority: 'medium'
      }
    };
  }

  /**
   * Initialize performance thresholds
   * @private
   */
  _initializeThresholds() {
    return {
      cacheHitRatio: {
        critical: 0.5,
        warning: 0.7,
        optimal: 0.85
      },
      memoryUsage: {
        critical: 0.9,
        warning: 0.75,
        optimal: 0.6
      },
      responseTime: {
        critical: 200, // ms
        warning: 100,
        optimal: 50
      },
      compressionRatio: {
        critical: 0.3,
        warning: 0.5,
        optimal: 0.7
      },
      cleanupEfficiency: {
        critical: 0.1,
        warning: 0.3,
        optimal: 0.5
      }
    };
  }

  /**
   * Run optimization analysis
   */
  async analyze() {
    const metrics = this.monitor.getPerformanceMetrics();
    const report = this.monitor.getFullReport();
    const issues = [];
    const recommendations = [];

    // Check each strategy
    for (const [key, strategy] of Object.entries(this.strategies)) {
      const issue = strategy.check();
      if (issue) {
        issues.push({
          strategy: key,
          ...issue
        });

        recommendations.push({
          strategy: strategy.name,
          priority: strategy.priority,
          action: `Run ${key} optimization`,
          reason: issue.reason
        });
      }
    }

    this.recommendations = recommendations;

    return {
      timestamp: Date.now(),
      metrics,
      issues,
      recommendations,
      performanceScore: this._calculatePerformanceScore(metrics)
    };
  }

  /**
   * Execute optimizations
   */
  async optimize(strategies = null) {
    const results = [];
    const strategiesToRun = strategies || Object.keys(this.strategies);

    for (const strategyKey of strategiesToRun) {
      const strategy = this.strategies[strategyKey];
      if (!strategy) continue;

      const issue = strategy.check();
      if (issue && issue.severity !== 'info') {
        const result = await strategy.optimize();
        results.push({
          strategy: strategy.name,
          ...result
        });

        this.optimizationHistory.push({
          timestamp: Date.now(),
          strategy: strategy.name,
          result
        });
      }
    }

    // Limit history size
    if (this.optimizationHistory.length > 100) {
      this.optimizationHistory = this.optimizationHistory.slice(-100);
    }

    return {
      optimizationsRun: results.length,
      results,
      overallSuccess: results.every(r => r.success)
    };
  }

  /**
   * Check cache efficiency
   * @private
   */
  _checkCacheEfficiency() {
    const stats = this.monitor.cache.getStats();
    const threshold = this.thresholds.cacheHitRatio;

    if (stats.hitRate < threshold.critical) {
      return {
        severity: 'critical',
        reason: `Cache hit rate (${(stats.hitRate * 100).toFixed(1)}%) is critically low`,
        value: stats.hitRate,
        threshold: threshold.critical
      };
    }

    if (stats.hitRate < threshold.warning) {
      return {
        severity: 'warning',
        reason: `Cache hit rate (${(stats.hitRate * 100).toFixed(1)}%) is below optimal`,
        value: stats.hitRate,
        threshold: threshold.warning
      };
    }

    return null;
  }

  /**
   * Optimize cache
   * @private
   */
  async _optimizeCache() {
    try {
      // Clear expired entries
      const expired = this.monitor.cache.clearExpired();

      // Optimize based on access patterns
      const optimization = this.monitor.optimizeCache();

      // Adjust cache size if needed
      const stats = this.monitor.cache.getStats();
      let sizeAdjusted = false;

      if (stats.evictions > stats.size * 0.5) {
        // Too many evictions, consider increasing cache size
        this.monitor.cache.maxSize = Math.min(
          this.monitor.cache.maxSize * 1.5,
          1000
        );
        sizeAdjusted = true;
      }

      return {
        success: true,
        actions: {
          expiredCleared: expired,
          optimizationsApplied: optimization.optimizationsApplied,
          sizeAdjusted
        },
        message: 'Cache optimization completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check memory usage
   * @private
   */
  _checkMemoryUsage() {
    const memUsage = this.monitor.monitorMemoryUsage();
    const heapUsedRatio = memUsage.heapUsedMB / memUsage.heapTotalMB;
    const threshold = this.thresholds.memoryUsage;

    if (heapUsedRatio > threshold.critical) {
      return {
        severity: 'critical',
        reason: `Memory usage (${(heapUsedRatio * 100).toFixed(1)}%) is critical`,
        value: heapUsedRatio,
        threshold: threshold.critical
      };
    }

    if (heapUsedRatio > threshold.warning) {
      return {
        severity: 'warning',
        reason: `Memory usage (${(heapUsedRatio * 100).toFixed(1)}%) is high`,
        value: heapUsedRatio,
        threshold: threshold.warning
      };
    }

    return null;
  }

  /**
   * Optimize memory
   * @private
   */
  async _optimizeMemory() {
    try {
      // Force cleanup
      const cleanup = await this.monitor.forceCleanup();

      // Reduce cache size if memory is critical
      const memUsage = this.monitor.monitorMemoryUsage();
      const heapUsedRatio = memUsage.heapUsedMB / memUsage.heapTotalMB;

      let cacheReduced = false;
      if (heapUsedRatio > 0.8) {
        // Reduce cache size by 50%
        const currentSize = this.monitor.cache.cache.size;
        const toEvict = Math.floor(currentSize / 2);
        
        for (let i = 0; i < toEvict; i++) {
          this.monitor.cache.evictLRU();
        }
        cacheReduced = true;
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      return {
        success: true,
        actions: {
          cleanup,
          cacheReduced,
          memoryFreedMB: cleanup.cleanup?.memoryFreedMB || 0
        },
        message: 'Memory optimization completed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check compression needs
   * @private
   */
  _checkCompressionNeeds() {
    const report = this.monitor.getCompressionEffectivenessReport();
    const cacheStats = this.monitor.cache.getStats();

    // Check if we have uncompressed large items
    let uncompressedLarge = 0;
    for (const [, entry] of this.monitor.cache.cache.entries()) {
      if (!entry.compressed && entry.size > 1024 * 1024) {
        uncompressedLarge++;
      }
    }

    if (uncompressedLarge > 5) {
      return {
        severity: 'warning',
        reason: `${uncompressedLarge} large uncompressed items in cache`,
        value: uncompressedLarge,
        threshold: 5
      };
    }

    if (cacheStats.memoryUsageMB > this.monitor.config.cacheMaxMemoryMB * 0.8) {
      return {
        severity: 'info',
        reason: 'High memory usage could benefit from compression',
        value: cacheStats.memoryUsageMB,
        threshold: this.monitor.config.cacheMaxMemoryMB * 0.8
      };
    }

    return null;
  }

  /**
   * Optimize compression
   * @private
   */
  async _optimizeCompression() {
    try {
      // Run compression
      const result = await this.monitor.performBackgroundCompression();

      // Adjust compression threshold if needed
      if (result.savedMB > 10) {
        // Lower threshold to compress more aggressively
        this.monitor.config.compressionThresholdMB = Math.max(
          this.monitor.config.compressionThresholdMB * 0.8,
          0.5
        );
      }

      return {
        success: true,
        actions: {
          itemsCompressed: result.itemsCompressed,
          savedMB: result.savedMB
        },
        message: `Compressed ${result.itemsCompressed} items, saved ${result.savedMB.toFixed(2)}MB`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check access patterns
   * @private
   */
  _checkAccessPatterns() {
    const analysis = this.monitor.getAccessPatternsAnalysis();

    // Check for inefficient access patterns
    if (analysis.coldContexts > analysis.totalContexts * 0.7) {
      return {
        severity: 'info',
        reason: 'Many cold contexts could be evicted',
        value: analysis.coldContexts,
        threshold: analysis.totalContexts * 0.7
      };
    }

    // Check for hotspots
    if (analysis.hotContexts.length > 0) {
      const topHot = analysis.hotContexts[0];
      if (topHot.accessFrequency > 10) {
        return {
          severity: 'info',
          reason: 'Hot contexts could benefit from optimization',
          value: topHot.accessFrequency,
          threshold: 10
        };
      }
    }

    return null;
  }

  /**
   * Optimize access patterns
   * @private
   */
  async _optimizeAccessPatterns() {
    try {
      const analysis = this.monitor.getAccessPatternsAnalysis();
      
      // Preload hot contexts
      let preloaded = 0;
      for (const hot of analysis.hotContexts.slice(0, 5)) {
        const entry = this.monitor.cache.cache.get(hot.contextId);
        if (entry) {
          entry.priority = 'high';
          preloaded++;
        }
      }

      // Evict cold contexts
      let evicted = 0;
      const coldThreshold = Date.now() - 3600000; // 1 hour
      for (const [contextId, pattern] of this.monitor.accessPatterns.entries()) {
        if (pattern.lastAccess < coldThreshold && pattern.reads < 2) {
          this.monitor.cache.cache.delete(contextId);
          evicted++;
        }
      }

      return {
        success: true,
        actions: {
          hotContextsPrioritized: preloaded,
          coldContextsEvicted: evicted
        },
        message: 'Access pattern optimization completed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check cleanup effectiveness
   * @private
   */
  _checkCleanupEffectiveness() {
    const report = this.monitor.getCleanupEffectivenessReport();
    
    if (report.effectiveness === 'minimal') {
      return {
        severity: 'info',
        reason: 'Cleanup effectiveness is minimal',
        value: report.totalMemoryFreedMB,
        threshold: 1
      };
    }

    return null;
  }

  /**
   * Optimize cleanup
   * @private
   */
  async _optimizeCleanup() {
    try {
      // Adjust cleanup interval based on memory pressure
      const memUsage = this.monitor.monitorMemoryUsage();
      const heapUsedRatio = memUsage.heapUsedMB / memUsage.heapTotalMB;

      let intervalAdjusted = false;
      if (heapUsedRatio > 0.7) {
        // Increase cleanup frequency
        const newInterval = Math.max(
          this.monitor.config.cleanupIntervalMs * 0.5,
          10000
        );
        
        if (newInterval !== this.monitor.config.cleanupIntervalMs) {
          this.monitor.config.cleanupIntervalMs = newInterval;
          intervalAdjusted = true;
          
          // Restart background processes with new interval
          this.monitor.stopBackgroundProcesses();
          this.monitor.startBackgroundProcesses();
        }
      }

      // Run immediate cleanup
      const cleanup = await this.monitor.performBackgroundCleanup();

      return {
        success: true,
        actions: {
          intervalAdjusted,
          cleanupResult: cleanup
        },
        message: 'Cleanup optimization completed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate overall performance score
   * @private
   */
  _calculatePerformanceScore(metrics) {
    const weights = {
      cacheHitRatio: 0.3,
      responseTime: 0.3,
      memoryUsage: 0.2,
      compression: 0.1,
      cleanup: 0.1
    };

    let score = 0;

    // Cache hit ratio score
    const cacheScore = Math.min(metrics.cache.hitRate / this.thresholds.cacheHitRatio.optimal, 1);
    score += cacheScore * weights.cacheHitRatio;

    // Response time score
    const responseScore = Math.max(0, 1 - (metrics.performance.contextRetrievalP95.value / this.thresholds.responseTime.optimal));
    score += responseScore * weights.responseTime;

    // Memory usage score
    const memUsage = metrics.memory.heapUsedMB / metrics.memory.heapTotalMB;
    const memScore = Math.max(0, 1 - (memUsage / this.thresholds.memoryUsage.optimal));
    score += memScore * weights.memoryUsage;

    // Compression effectiveness score (simplified)
    score += 0.5 * weights.compression;

    // Cleanup effectiveness score (simplified)
    score += 0.5 * weights.cleanup;

    return {
      overall: (score * 100).toFixed(1),
      breakdown: {
        cacheHitRatio: (cacheScore * 100).toFixed(1),
        responseTime: (responseScore * 100).toFixed(1),
        memoryUsage: (memScore * 100).toFixed(1),
        compression: 50,
        cleanup: 50
      }
    };
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations() {
    return this.recommendations;
  }

  /**
   * Get optimization history
   */
  getHistory(limit = 50) {
    return this.optimizationHistory.slice(-limit);
  }

  /**
   * Auto-tune performance parameters
   */
  async autoTune() {
    const analysis = await this.analyze();
    const adjustments = [];

    // Auto-tune cache size
    if (analysis.performanceScore.breakdown.cacheHitRatio < 70) {
      const newSize = Math.min(this.monitor.cache.maxSize * 1.2, 500);
      this.monitor.cache.maxSize = Math.floor(newSize);
      adjustments.push({
        parameter: 'cacheMaxSize',
        oldValue: this.monitor.cache.maxSize,
        newValue: Math.floor(newSize),
        reason: 'Low cache hit ratio'
      });
    }

    // Auto-tune compression threshold
    const memUsage = this.monitor.monitorMemoryUsage();
    if (memUsage.cacheMemoryMB > this.monitor.config.cacheMaxMemoryMB * 0.7) {
      const newThreshold = Math.max(
        this.monitor.config.compressionThresholdMB * 0.7,
        0.1
      );
      this.monitor.config.compressionThresholdMB = newThreshold;
      adjustments.push({
        parameter: 'compressionThresholdMB',
        oldValue: this.monitor.config.compressionThresholdMB,
        newValue: newThreshold,
        reason: 'High cache memory usage'
      });
    }

    // Auto-tune cleanup interval
    if (analysis.performanceScore.breakdown.memoryUsage < 50) {
      const newInterval = Math.min(
        this.monitor.config.cleanupIntervalMs * 0.8,
        300000
      );
      this.monitor.config.cleanupIntervalMs = newInterval;
      adjustments.push({
        parameter: 'cleanupIntervalMs',
        oldValue: this.monitor.config.cleanupIntervalMs,
        newValue: newInterval,
        reason: 'High memory usage'
      });
    }

    return {
      timestamp: Date.now(),
      adjustmentsMade: adjustments.length,
      adjustments,
      newPerformanceScore: analysis.performanceScore
    };
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const analysis = this.analyze();
    const fullReport = this.monitor.getFullReport();

    return {
      timestamp: Date.now(),
      summary: {
        performanceScore: analysis.performanceScore,
        issues: analysis.issues.length,
        recommendations: analysis.recommendations.length,
        criticalIssues: analysis.issues.filter(i => i.severity === 'critical').length
      },
      details: {
        analysis,
        metrics: fullReport.metrics,
        patterns: fullReport.accessPatterns,
        cleanup: fullReport.cleanupEffectiveness,
        compression: fullReport.compressionEffectiveness
      },
      recommendations: this.recommendations,
      history: this.getHistory(10)
    };
  }
}

export default PerformanceOptimizer;