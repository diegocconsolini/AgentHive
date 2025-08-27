import { default as ml } from 'ml-regression';
import { default as stats } from 'simple-statistics';

class IntelligenceEngine {
  constructor(contextStore) {
    this.contextStore = contextStore;
    this.historicalData = [];
    this.performanceMetrics = {};
  }

  /**
   * Analyze historical context and capture performance patterns
   * @param {Array} contextEntries - List of context entries to analyze
   * @returns {Object} Analysis results with trends and patterns
   */
  analyzeHistoricalPatterns(contextEntries) {
    // Track performance metrics for each context entry
    const metrics = contextEntries.map(entry => ({
      timestamp: entry.timestamp,
      agentType: entry.agentType,
      complexity: entry.complexity,
      executionTime: entry.executionTime
    }));

    // Compute statistical insights
    const insights = {
      avgExecutionTime: stats.mean(metrics.map(m => m.executionTime)),
      executionTimeVariance: stats.variance(metrics.map(m => m.executionTime)),
      agentTypePerformance: this._aggregateAgentPerformance(metrics)
    };

    this.historicalData.push(...metrics);
    return insights;
  }

  /**
   * Generate predictive insights for future project planning
   * @param {number} predictionWindow - Number of future entries to predict
   * @returns {Object} Predictive insights for project planning
   */
  generatePredictiveInsights(predictionWindow = 5) {
    // Use linear regression for time series prediction
    const executionTimes = this.historicalData.map(entry => entry.executionTime);
    const regressionModel = new ml.LinearRegression(
      executionTimes.map((time, index) => [index]),
      executionTimes
    );

    // Predict future execution times
    const predictions = Array.from(
      { length: predictionWindow },
      (_, i) => regressionModel.predict([executionTimes.length + i])
    );

    return {
      predictedExecutionTimes: predictions,
      confidenceInterval: this._computeConfidenceInterval(executionTimes)
    };
  }

  /**
   * Track performance analytics for agents and task types
   * @param {Object} performanceData - Performance metrics for an agent/task
   */
  trackPerformanceAnalytics(performanceData) {
    const { agentType, taskType, metrics } = performanceData;

    if (!this.performanceMetrics[agentType]) {
      this.performanceMetrics[agentType] = {};
    }

    this.performanceMetrics[agentType][taskType] = {
      averageComplexity: stats.mean(metrics.map(m => m.complexity)),
      totalExecutions: metrics.length,
      successRate: metrics.filter(m => m.success).length / metrics.length
    };
  }

  /**
   * Generate automated optimization recommendations
   * @returns {Array} List of optimization recommendations
   */
  generateOptimizationRecommendations() {
    const recommendations = [];

    // Analyze agent performance and suggest optimizations
    Object.entries(this.performanceMetrics).forEach(([agentType, taskMetrics]) => {
      Object.entries(taskMetrics).forEach(([taskType, performance]) => {
        if (performance.averageComplexity > 0.7) {
          recommendations.push({
            type: 'performance_optimization',
            target: agentType,
            taskType,
            suggestion: `High complexity detected. Consider refactoring or breaking down ${taskType} for ${agentType}`
          });
        }

        if (performance.successRate < 0.8) {
          recommendations.push({
            type: 'reliability_improvement',
            target: agentType,
            taskType,
            suggestion: `Low success rate for ${taskType} in ${agentType}. Investigate potential failure points.`
          });
        }
      });
    });

    return recommendations;
  }

  /**
   * Aggregate performance metrics by agent type
   * @private
   * @param {Array} metrics - Performance metrics
   * @returns {Object} Aggregated performance by agent type
   */
  _aggregateAgentPerformance(metrics) {
    const agentPerformance = {};
    metrics.forEach(metric => {
      if (!agentPerformance[metric.agentType]) {
        agentPerformance[metric.agentType] = {
          totalExecutions: 0,
          totalExecutionTime: 0
        };
      }
      const agentMetrics = agentPerformance[metric.agentType];
      agentMetrics.totalExecutions++;
      agentMetrics.totalExecutionTime += metric.executionTime;
    });

    return Object.entries(agentPerformance).reduce((acc, [type, metrics]) => {
      acc[type] = {
        avgExecutionTime: metrics.totalExecutionTime / metrics.totalExecutions
      };
      return acc;
    }, {});
  }

  /**
   * Compute confidence interval for predictions
   * @private
   * @param {Array} data - Historical data points
   * @returns {Object} Confidence interval details
   */
  _computeConfidenceInterval(data) {
    const stdDev = stats.standardDeviation(data);
    const mean = stats.mean(data);
    return {
      lowerBound: mean - (1.96 * stdDev),
      upperBound: mean + (1.96 * stdDev)
    };
  }
}

export default IntelligenceEngine;