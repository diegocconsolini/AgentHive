/**
 * Performance Optimizer
 * Agent performance monitoring, analysis, and optimization recommendations
 */
class PerformanceOptimizer {
  constructor() {
    this.performanceData = new Map(); // agentId -> performance history
    this.benchmarks = new Map(); // agentType -> benchmark data
    this.optimizationRules = this._initializeRules();
    this.anomalyDetector = this._initializeAnomalyDetector();
    this.recommendations = new Map(); // agentId -> recommendations
    this.optimizationHistory = [];
  }

  /**
   * Initialize optimization rules
   * @private
   */
  _initializeRules() {
    return {
      performance: [
        {
          name: 'low-success-rate',
          condition: (metrics) => metrics.successRate < 0.7,
          recommendation: 'Consider additional training or reassigning to simpler tasks',
          severity: 'high',
          actions: ['retrain', 'reassign', 'pair-programming']
        },
        {
          name: 'high-failure-spike',
          condition: (metrics) => metrics.recentFailureRate > metrics.historicalFailureRate * 2,
          recommendation: 'Investigate recent failures for common patterns',
          severity: 'medium',
          actions: ['investigate', 'debug', 'rollback']
        },
        {
          name: 'slow-response',
          condition: (metrics) => metrics.averageResponseTime > metrics.expectedResponseTime * 1.5,
          recommendation: 'Optimize processing pipeline or allocate more resources',
          severity: 'medium',
          actions: ['optimize', 'scale-up', 'cache']
        }
      ],
      resource: [
        {
          name: 'high-memory-usage',
          condition: (metrics) => metrics.memoryUsage > 0.8,
          recommendation: 'Implement memory cleanup or increase memory allocation',
          severity: 'high',
          actions: ['cleanup', 'garbage-collect', 'increase-memory']
        },
        {
          name: 'cpu-bottleneck',
          condition: (metrics) => metrics.cpuUsage > 0.9,
          recommendation: 'Optimize CPU-intensive operations or distribute load',
          severity: 'high',
          actions: ['optimize-cpu', 'distribute', 'async-processing']
        },
        {
          name: 'context-overflow',
          condition: (metrics) => metrics.contextSize > metrics.maxContextSize * 0.9,
          recommendation: 'Reduce context size or implement context compression',
          severity: 'medium',
          actions: ['compress', 'summarize', 'prune-context']
        }
      ],
      efficiency: [
        {
          name: 'low-utilization',
          condition: (metrics) => metrics.utilization < 0.3,
          recommendation: 'Increase task assignment or consider scaling down',
          severity: 'low',
          actions: ['increase-load', 'scale-down', 'consolidate']
        },
        {
          name: 'task-timeout',
          condition: (metrics) => metrics.timeoutRate > 0.1,
          recommendation: 'Extend timeouts or break down complex tasks',
          severity: 'medium',
          actions: ['extend-timeout', 'decompose-tasks', 'parallel-processing']
        },
        {
          name: 'inefficient-batching',
          condition: (metrics) => metrics.batchEfficiency < 0.5,
          recommendation: 'Optimize batch sizes or processing order',
          severity: 'low',
          actions: ['optimize-batch', 'reorder', 'pipeline']
        }
      ]
    };
  }

  /**
   * Initialize anomaly detector
   * @private
   */
  _initializeAnomalyDetector() {
    return {
      thresholds: {
        successRateDeviation: 0.2,
        responseTimeDeviation: 2.0,
        memorySpike: 1.5,
        errorRateSpike: 3.0
      },
      detectionWindow: 3600000, // 1 hour
      minDataPoints: 10
    };
  }

  /**
   * Track agent performance
   * @param {string} agentId - Agent ID
   * @param {Object} metrics - Performance metrics
   */
  trackPerformance(agentId, metrics) {
    if (!this.performanceData.has(agentId)) {
      this.performanceData.set(agentId, {
        history: [],
        statistics: this._initializeStatistics(),
        anomalies: []
      });
    }

    const data = this.performanceData.get(agentId);
    
    // Add metrics to history
    const entry = {
      ...metrics,
      timestamp: Date.now()
    };
    data.history.push(entry);

    // Limit history size
    if (data.history.length > 1000) {
      data.history.shift();
    }

    // Update statistics
    this._updateStatistics(data);

    // Detect anomalies
    const anomalies = this._detectAnomalies(data);
    if (anomalies.length > 0) {
      data.anomalies.push(...anomalies);
    }

    // Generate recommendations
    this._generateRecommendations(agentId, data);
  }

  /**
   * Initialize statistics
   * @private
   */
  _initializeStatistics() {
    return {
      mean: {},
      median: {},
      stdDev: {},
      percentiles: {},
      trends: {},
      correlations: {}
    };
  }

  /**
   * Update statistics
   * @private
   */
  _updateStatistics(data) {
    const recent = data.history.slice(-100);
    if (recent.length < 5) return;

    // Calculate basic statistics
    const metrics = ['successRate', 'responseTime', 'memoryUsage', 'cpuUsage'];
    
    metrics.forEach(metric => {
      const values = recent.map(h => h[metric]).filter(v => v !== undefined);
      if (values.length > 0) {
        data.statistics.mean[metric] = this._calculateMean(values);
        data.statistics.median[metric] = this._calculateMedian(values);
        data.statistics.stdDev[metric] = this._calculateStdDev(values);
        data.statistics.percentiles[metric] = this._calculatePercentiles(values);
        data.statistics.trends[metric] = this._calculateTrend(values);
      }
    });

    // Calculate correlations
    data.statistics.correlations = this._calculateCorrelations(recent);
  }

  /**
   * Detect anomalies
   * @private
   */
  _detectAnomalies(data) {
    const anomalies = [];
    const recent = data.history.slice(-10);
    if (recent.length < this.anomalyDetector.minDataPoints) return anomalies;

    const latest = recent[recent.length - 1];
    const stats = data.statistics;

    // Check for success rate anomaly
    if (stats.mean.successRate !== undefined) {
      const deviation = Math.abs(latest.successRate - stats.mean.successRate);
      if (deviation > this.anomalyDetector.thresholds.successRateDeviation) {
        anomalies.push({
          type: 'success-rate-anomaly',
          value: latest.successRate,
          expected: stats.mean.successRate,
          deviation,
          timestamp: latest.timestamp
        });
      }
    }

    // Check for response time anomaly
    if (stats.mean.responseTime !== undefined) {
      const zScore = (latest.responseTime - stats.mean.responseTime) / stats.stdDev.responseTime;
      if (Math.abs(zScore) > this.anomalyDetector.thresholds.responseTimeDeviation) {
        anomalies.push({
          type: 'response-time-anomaly',
          value: latest.responseTime,
          expected: stats.mean.responseTime,
          zScore,
          timestamp: latest.timestamp
        });
      }
    }

    // Check for memory spike
    if (stats.mean.memoryUsage !== undefined) {
      const ratio = latest.memoryUsage / stats.mean.memoryUsage;
      if (ratio > this.anomalyDetector.thresholds.memorySpike) {
        anomalies.push({
          type: 'memory-spike',
          value: latest.memoryUsage,
          expected: stats.mean.memoryUsage,
          ratio,
          timestamp: latest.timestamp
        });
      }
    }

    return anomalies;
  }

  /**
   * Generate recommendations
   * @private
   */
  _generateRecommendations(agentId, data) {
    const recommendations = [];
    const latest = data.history[data.history.length - 1];
    const stats = data.statistics;

    // Prepare metrics for rule evaluation
    const metrics = {
      ...latest,
      ...stats.mean,
      historicalFailureRate: 1 - stats.mean.successRate,
      recentFailureRate: 1 - latest.successRate,
      expectedResponseTime: stats.percentiles.responseTime?.p50 || latest.responseTime,
      utilization: latest.workload / 100,
      timeoutRate: latest.timeouts / (latest.totalTasks || 1),
      batchEfficiency: latest.batchSuccess / (latest.batchTotal || 1),
      maxContextSize: 100, // MB
      contextSize: latest.contextSize || 0
    };

    // Apply rules
    Object.values(this.optimizationRules).forEach(category => {
      category.forEach(rule => {
        if (rule.condition(metrics)) {
          recommendations.push({
            rule: rule.name,
            recommendation: rule.recommendation,
            severity: rule.severity,
            actions: rule.actions,
            metrics: {
              current: latest,
              historical: stats.mean
            }
          });
        }
      });
    });

    // Add anomaly-based recommendations
    data.anomalies.slice(-5).forEach(anomaly => {
      recommendations.push({
        rule: `anomaly-${anomaly.type}`,
        recommendation: this._getAnomalyRecommendation(anomaly),
        severity: 'medium',
        actions: ['investigate', 'monitor'],
        anomaly
      });
    });

    // Store recommendations
    this.recommendations.set(agentId, recommendations);

    return recommendations;
  }

  /**
   * Get anomaly recommendation
   * @private
   */
  _getAnomalyRecommendation(anomaly) {
    const recommendations = {
      'success-rate-anomaly': 'Success rate significantly deviates from historical average',
      'response-time-anomaly': 'Response time is abnormal compared to recent history',
      'memory-spike': 'Memory usage spike detected, potential memory leak',
      'error-rate-spike': 'Error rate spike detected, investigate recent changes'
    };
    return recommendations[anomaly.type] || 'Anomaly detected, manual investigation required';
  }

  /**
   * Get optimization recommendations for an agent
   * @param {string} agentId - Agent ID
   * @returns {Array<Object>} Recommendations
   */
  getRecommendations(agentId) {
    return this.recommendations.get(agentId) || [];
  }

  /**
   * Get performance report for an agent
   * @param {string} agentId - Agent ID
   * @param {Object} options - Report options
   * @returns {Object} Performance report
   */
  getPerformanceReport(agentId, options = {}) {
    const {
      period = 3600000, // 1 hour
      includeHistory = false,
      includeAnomalies = true,
      includeRecommendations = true
    } = options;

    const data = this.performanceData.get(agentId);
    if (!data) {
      return { error: 'No performance data available for agent' };
    }

    const now = Date.now();
    const recentHistory = data.history.filter(h => now - h.timestamp < period);

    const report = {
      agentId,
      period: {
        start: new Date(now - period),
        end: new Date(now)
      },
      statistics: data.statistics,
      summary: this._generateSummary(recentHistory),
      trends: this._analyzeTrends(recentHistory)
    };

    if (includeHistory) {
      report.history = recentHistory;
    }

    if (includeAnomalies) {
      report.anomalies = data.anomalies.filter(a => now - a.timestamp < period);
    }

    if (includeRecommendations) {
      report.recommendations = this.getRecommendations(agentId);
    }

    return report;
  }

  /**
   * Generate performance summary
   * @private
   */
  _generateSummary(history) {
    if (history.length === 0) {
      return { dataPoints: 0 };
    }

    const summary = {
      dataPoints: history.length,
      averageSuccessRate: 0,
      averageResponseTime: 0,
      totalTasks: 0,
      totalFailures: 0,
      peakMemoryUsage: 0,
      peakCpuUsage: 0
    };

    history.forEach(h => {
      summary.averageSuccessRate += h.successRate || 0;
      summary.averageResponseTime += h.responseTime || 0;
      summary.totalTasks += h.totalTasks || 0;
      summary.totalFailures += h.failures || 0;
      summary.peakMemoryUsage = Math.max(summary.peakMemoryUsage, h.memoryUsage || 0);
      summary.peakCpuUsage = Math.max(summary.peakCpuUsage, h.cpuUsage || 0);
    });

    summary.averageSuccessRate /= history.length;
    summary.averageResponseTime /= history.length;

    return summary;
  }

  /**
   * Analyze performance trends
   * @private
   */
  _analyzeTrends(history) {
    if (history.length < 10) {
      return { insufficient_data: true };
    }

    const trends = {};
    const metrics = ['successRate', 'responseTime', 'memoryUsage'];

    metrics.forEach(metric => {
      const values = history.map(h => h[metric]).filter(v => v !== undefined);
      if (values.length >= 10) {
        const trend = this._calculateTrend(values);
        trends[metric] = {
          direction: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable',
          slope: trend,
          confidence: this._calculateTrendConfidence(values)
        };
      }
    });

    return trends;
  }

  /**
   * Apply optimization
   * @param {string} agentId - Agent ID
   * @param {string} action - Optimization action
   * @param {Object} parameters - Action parameters
   * @returns {Object} Optimization result
   */
  applyOptimization(agentId, action, parameters = {}) {
    const optimization = {
      agentId,
      action,
      parameters,
      timestamp: Date.now(),
      status: 'pending'
    };

    // Execute optimization based on action
    const result = this._executeOptimization(agentId, action, parameters);
    
    optimization.status = result.success ? 'completed' : 'failed';
    optimization.result = result;

    // Track optimization history
    this.optimizationHistory.push(optimization);

    // Limit history size
    if (this.optimizationHistory.length > 1000) {
      this.optimizationHistory.shift();
    }

    return result;
  }

  /**
   * Execute optimization
   * @private
   */
  _executeOptimization(agentId, action, parameters) {
    const optimizations = {
      'increase-memory': () => ({
        success: true,
        message: `Memory increased by ${parameters.amount || 256}MB`,
        newLimit: parameters.newLimit
      }),
      'optimize-cpu': () => ({
        success: true,
        message: 'CPU optimization applied',
        optimizations: ['async-processing', 'batch-optimization']
      }),
      'cleanup': () => ({
        success: true,
        message: 'Memory cleanup performed',
        freedMemory: parameters.freedMemory || 100
      }),
      'scale-up': () => ({
        success: true,
        message: `Scaled up to ${parameters.instances || 2} instances`,
        newCapacity: parameters.newCapacity
      }),
      'retrain': () => ({
        success: true,
        message: 'Agent retrained with updated model',
        modelVersion: parameters.modelVersion
      }),
      'compress': () => ({
        success: true,
        message: 'Context compression applied',
        compressionRatio: parameters.ratio || 0.7
      })
    };

    const optimization = optimizations[action];
    if (optimization) {
      return optimization();
    }

    return {
      success: false,
      message: `Unknown optimization action: ${action}`
    };
  }

  /**
   * Benchmark agent performance
   * @param {string} agentType - Agent type
   * @param {Object} testSuite - Test suite to run
   * @returns {Object} Benchmark results
   */
  async runBenchmark(agentType, testSuite) {
    const results = {
      agentType,
      timestamp: Date.now(),
      tests: [],
      summary: {}
    };

    for (const test of testSuite.tests) {
      const startTime = Date.now();
      
      try {
        // Run test (simulated)
        const testResult = await this._runTest(agentType, test);
        
        results.tests.push({
          name: test.name,
          success: testResult.success,
          duration: Date.now() - startTime,
          metrics: testResult.metrics
        });
      } catch (error) {
        results.tests.push({
          name: test.name,
          success: false,
          error: error.message,
          duration: Date.now() - startTime
        });
      }
    }

    // Calculate summary
    results.summary = this._calculateBenchmarkSummary(results.tests);

    // Store benchmark
    this.benchmarks.set(agentType, results);

    return results;
  }

  /**
   * Run individual test (simulated)
   * @private
   */
  async _runTest(agentType, test) {
    // Simulate test execution
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: Math.random() > 0.1,
          metrics: {
            responseTime: Math.random() * 1000,
            memoryUsage: Math.random() * 100,
            cpuUsage: Math.random()
          }
        });
      }, 100);
    });
  }

  /**
   * Calculate benchmark summary
   * @private
   */
  _calculateBenchmarkSummary(tests) {
    const summary = {
      totalTests: tests.length,
      successfulTests: tests.filter(t => t.success).length,
      failedTests: tests.filter(t => !t.success).length,
      averageDuration: 0,
      successRate: 0
    };

    if (tests.length > 0) {
      summary.averageDuration = tests.reduce((sum, t) => sum + t.duration, 0) / tests.length;
      summary.successRate = summary.successfulTests / summary.totalTests;
    }

    return summary;
  }

  // Statistical helper methods

  /**
   * Calculate mean
   * @private
   */
  _calculateMean(values) {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Calculate median
   * @private
   */
  _calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Calculate standard deviation
   * @private
   */
  _calculateStdDev(values) {
    const mean = this._calculateMean(values);
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = this._calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  /**
   * Calculate percentiles
   * @private
   */
  _calculatePercentiles(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const percentile = (p) => {
      const index = Math.ceil(p * sorted.length / 100) - 1;
      return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
    };

    return {
      p25: percentile(25),
      p50: percentile(50),
      p75: percentile(75),
      p90: percentile(90),
      p95: percentile(95),
      p99: percentile(99)
    };
  }

  /**
   * Calculate trend (linear regression slope)
   * @private
   */
  _calculateTrend(values) {
    const n = values.length;
    if (n < 2) return 0;

    const indices = Array.from({ length: n }, (_, i) => i);
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * Calculate trend confidence
   * @private
   */
  _calculateTrendConfidence(values) {
    // Simple R-squared calculation
    const trend = this._calculateTrend(values);
    const mean = this._calculateMean(values);
    
    const predicted = values.map((_, i) => mean + trend * i);
    const ssRes = values.reduce((sum, v, i) => sum + Math.pow(v - predicted[i], 2), 0);
    const ssTot = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
    
    return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  }

  /**
   * Calculate correlations
   * @private
   */
  _calculateCorrelations(data) {
    const correlations = {};
    const metrics = ['successRate', 'responseTime', 'memoryUsage', 'cpuUsage'];

    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const x = data.map(d => d[metrics[i]]).filter(v => v !== undefined);
        const y = data.map(d => d[metrics[j]]).filter(v => v !== undefined);
        
        if (x.length >= 10 && y.length >= 10) {
          const key = `${metrics[i]}_${metrics[j]}`;
          correlations[key] = this._calculateCorrelation(x, y);
        }
      }
    }

    return correlations;
  }

  /**
   * Calculate Pearson correlation coefficient
   * @private
   */
  _calculateCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const meanX = this._calculateMean(x.slice(0, n));
    const meanY = this._calculateMean(y.slice(0, n));

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denominator = Math.sqrt(denomX * denomY);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Get optimization history
   * @param {Object} filters - Optional filters
   * @returns {Array<Object>} Optimization history
   */
  getOptimizationHistory(filters = {}) {
    let history = [...this.optimizationHistory];

    if (filters.agentId) {
      history = history.filter(h => h.agentId === filters.agentId);
    }

    if (filters.action) {
      history = history.filter(h => h.action === filters.action);
    }

    if (filters.status) {
      history = history.filter(h => h.status === filters.status);
    }

    if (filters.since) {
      const since = new Date(filters.since).getTime();
      history = history.filter(h => h.timestamp >= since);
    }

    return history;
  }
}

module.exports = PerformanceOptimizer;