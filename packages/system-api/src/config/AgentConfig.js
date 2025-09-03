/**
 * Agent Configuration
 * Centralized configuration for all agent-related settings
 * Removes hardcoded values and makes the system configurable
 */

const path = require('path');
const fs = require('fs');

class AgentConfig {
  constructor() {
    this.config = this._loadConfiguration();
    this._validateConfiguration();
  }

  /**
   * Load configuration from files and environment variables
   */
  _loadConfiguration() {
    const baseConfig = {
      // Category-based task time estimates (in seconds)
      categoryTimes: {
        'development': 120,
        'design': 90,
        'testing': 60,
        'security': 150,
        'devops': 180,
        'data': 140,
        'ai-ml': 200,
        'content': 45,
        'specialized': 160,
        'default': 100
      },

      // Complexity detection indicators
      complexityIndicators: {
        high: ['architect', 'design', 'advanced', 'enterprise', 'complex', 'comprehensive', 'sophisticated'],
        medium: ['develop', 'implement', 'create', 'build', 'optimize', 'analyze', 'refactor'],
        low: ['simple', 'basic', 'quick', 'straightforward', 'minimal', 'helper']
      },

      // Agent capability weight profiles for different strategies
      capabilityWeights: {
        balanced: {
          capabilityMatch: 0.2,
          specializationMatch: 0.35,
          successRate: 0.2,
          averageTime: 0.1,
          complexity: 0.1,
          workload: 0.05
        },
        performance: {
          capabilityMatch: 0.15,
          specializationMatch: 0.15,
          successRate: 0.35,
          averageTime: 0.1,
          complexity: 0.1,
          workload: 0.15
        },
        speed: {
          capabilityMatch: 0.2,
          specializationMatch: 0.1,
          successRate: 0.15,
          averageTime: 0.35,
          complexity: 0.1,
          workload: 0.1
        },
        accuracy: {
          capabilityMatch: 0.3,
          specializationMatch: 0.25,
          successRate: 0.25,
          averageTime: 0.1,
          complexity: 0.1,
          workload: 0.0
        }
      },

      // Success rate calculation parameters
      successRateMapping: {
        minRating: 1.0,
        maxRating: 5.0,
        minSuccessRate: 0.7,
        maxSuccessRate: 0.95,
        defaultRating: 4.0
      },

      // Domain identification patterns
      domainPatterns: {
        development: ['code', 'function', 'debug', 'programming', 'javascript', 'python', 'react', 'vue', 'angular', 'frontend', 'backend', 'api', 'component', 'typescript', 'node', 'npm', 'development', 'build', 'compile'],
        security: ['security', 'vulnerability', 'audit', 'penetration', 'authentication', 'authorization'],
        devops: ['deployment', 'docker', 'kubernetes', 'infrastructure', 'ci/cd', 'pipeline', 'server'],
        data: ['data', 'sql', 'database', 'analysis', 'query', 'analytics', 'reporting'],
        design: ['ui', 'ux', 'design', 'interface', 'layout', 'responsive', 'accessibility'],
        testing: ['test', 'testing', 'unit', 'integration', 'e2e', 'qa', 'quality']
      },

      // Urgency detection keywords
      urgencyKeywords: ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'priority', 'rush'],

      // Model configuration
      models: {
        default: 'claude-3-sonnet',
        fallback: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 4000
      },

      // Memory management settings
      memory: {
        maxCacheSize: 100,
        memoryCompressionThreshold: 200,
        autoCompressionInterval: 3600000, // 1 hour
        knowledgeShareThreshold: 0.8,
        maxMemoryAge: 365, // days
        interactionRetentionLimit: 100
      },

      // Performance thresholds
      performance: {
        slowResponseThreshold: 5000, // ms
        highErrorRateThreshold: 0.1, // 10%
        lowSuccessRateThreshold: 0.7, // 70%
        memoryUsageThreshold: 500, // MB
        cpuUsageThreshold: 80 // %
      },

      // Load balancing configuration
      loadBalancing: {
        maxWorkloadPercentage: 85,
        rebalanceThreshold: 20,
        taskQueueSizes: {
          critical: 5,
          high: 10,
          normal: 20,
          low: 50
        }
      }
    };

    // Load from config file if it exists
    const configPath = process.env.AGENT_CONFIG_PATH || path.join(__dirname, 'agent-config.json');
    let fileConfig = {};
    
    try {
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        fileConfig = JSON.parse(configData);
        console.log(`Loaded agent configuration from ${configPath}`);
      }
    } catch (error) {
      console.warn(`Failed to load config from ${configPath}:`, error.message);
    }

    // Override with environment variables
    const envConfig = this._loadEnvironmentConfig();

    // Merge configurations: base < file < environment
    return this._mergeConfigs(baseConfig, fileConfig, envConfig);
  }

  /**
   * Load configuration from environment variables
   */
  _loadEnvironmentConfig() {
    const envConfig = {};

    // Category times
    if (process.env.AGENT_CATEGORY_TIMES) {
      try {
        envConfig.categoryTimes = JSON.parse(process.env.AGENT_CATEGORY_TIMES);
      } catch (error) {
        console.warn('Invalid AGENT_CATEGORY_TIMES environment variable');
      }
    }

    // Memory settings
    if (process.env.AGENT_MAX_CACHE_SIZE) {
      envConfig.memory = envConfig.memory || {};
      envConfig.memory.maxCacheSize = parseInt(process.env.AGENT_MAX_CACHE_SIZE, 10);
    }

    if (process.env.AGENT_COMPRESSION_THRESHOLD) {
      envConfig.memory = envConfig.memory || {};
      envConfig.memory.memoryCompressionThreshold = parseInt(process.env.AGENT_COMPRESSION_THRESHOLD, 10);
    }

    // Model settings
    if (process.env.AGENT_DEFAULT_MODEL) {
      envConfig.models = envConfig.models || {};
      envConfig.models.default = process.env.AGENT_DEFAULT_MODEL;
    }

    if (process.env.AGENT_DEFAULT_TEMPERATURE) {
      envConfig.models = envConfig.models || {};
      envConfig.models.temperature = parseFloat(process.env.AGENT_DEFAULT_TEMPERATURE);
    }

    return envConfig;
  }

  /**
   * Merge multiple configuration objects
   */
  _mergeConfigs(...configs) {
    return configs.reduce((merged, config) => {
      return this._deepMerge(merged, config);
    }, {});
  }

  /**
   * Deep merge two objects
   */
  _deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Validate configuration values
   */
  _validateConfiguration() {
    const errors = [];

    // Validate category times
    if (!this.config.categoryTimes || typeof this.config.categoryTimes !== 'object') {
      errors.push('categoryTimes must be an object');
    } else {
      for (const [category, time] of Object.entries(this.config.categoryTimes)) {
        if (typeof time !== 'number' || time <= 0) {
          errors.push(`Invalid time for category ${category}: must be positive number`);
        }
      }
    }

    // Validate success rate mapping
    const srm = this.config.successRateMapping;
    if (srm.minSuccessRate >= srm.maxSuccessRate) {
      errors.push('minSuccessRate must be less than maxSuccessRate');
    }

    if (srm.minRating >= srm.maxRating) {
      errors.push('minRating must be less than maxRating');
    }

    // Validate memory settings
    const mem = this.config.memory;
    if (mem.maxCacheSize <= 0) {
      errors.push('memory.maxCacheSize must be positive');
    }

    if (mem.memoryCompressionThreshold <= mem.maxCacheSize) {
      errors.push('memoryCompressionThreshold should be greater than maxCacheSize');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Get category-based task time estimate
   */
  getCategoryTime(category) {
    return this.config.categoryTimes[category] || this.config.categoryTimes.default;
  }

  /**
   * Get complexity indicators for analysis
   */
  getComplexityIndicators() {
    return this.config.complexityIndicators;
  }

  /**
   * Get capability weight profile for matching strategy
   */
  getCapabilityWeights(strategy = 'balanced') {
    return this.config.capabilityWeights[strategy] || this.config.capabilityWeights.balanced;
  }

  /**
   * Calculate success rate from rating
   */
  calculateSuccessRate(rating) {
    const { minRating, maxRating, minSuccessRate, maxSuccessRate, defaultRating } = this.config.successRateMapping;
    
    const numRating = parseFloat(rating) || defaultRating;
    const clampedRating = Math.min(maxRating, Math.max(minRating, numRating));
    
    // Linear mapping from rating range to success rate range
    const ratingRatio = (clampedRating - minRating) / (maxRating - minRating);
    const successRate = minSuccessRate + (ratingRatio * (maxSuccessRate - minSuccessRate));
    
    return Math.round(successRate * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get domain patterns for classification
   */
  getDomainPatterns() {
    return this.config.domainPatterns;
  }

  /**
   * Get urgency detection keywords
   */
  getUrgencyKeywords() {
    return this.config.urgencyKeywords;
  }

  /**
   * Get model configuration
   */
  getModelConfig() {
    return this.config.models;
  }

  /**
   * Get memory management settings
   */
  getMemoryConfig() {
    return this.config.memory;
  }

  /**
   * Get performance thresholds
   */
  getPerformanceConfig() {
    return this.config.performance;
  }

  /**
   * Get load balancing configuration
   */
  getLoadBalancingConfig() {
    return this.config.loadBalancing;
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(path, value) {
    const keys = path.split('.');
    let target = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) {
        target[keys[i]] = {};
      }
      target = target[keys[i]];
    }
    
    target[keys[keys.length - 1]] = value;
    
    // Re-validate after update
    this._validateConfiguration();
  }

  /**
   * Get full configuration object
   */
  getConfig() {
    return { ...this.config }; // Return copy to prevent modification
  }

  /**
   * Save current configuration to file
   */
  saveConfig(filePath) {
    try {
      const configJson = JSON.stringify(this.config, null, 2);
      fs.writeFileSync(filePath, configJson, 'utf8');
      console.log(`Configuration saved to ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error.message}`);
    }
  }

  /**
   * Reload configuration from sources
   */
  reload() {
    this.config = this._loadConfiguration();
    this._validateConfiguration();
    console.log('Agent configuration reloaded');
  }
}

// Export singleton instance
module.exports = new AgentConfig();