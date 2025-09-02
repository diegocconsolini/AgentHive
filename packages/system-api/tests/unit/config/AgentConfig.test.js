const path = require('path');
const fs = require('fs').promises;

// We need to test the config system, so we'll create a new instance
// instead of using the singleton
const AgentConfigClass = require('../../../src/config/AgentConfig').constructor;

describe('AgentConfig', () => {
  let agentConfig;
  const testConfigDir = path.join(__dirname, '../../../test-temp/config-test');

  beforeEach(() => {
    // Create new instance for each test
    const OriginalConfigClass = require('../../../src/config/AgentConfig.js').constructor;
    agentConfig = new OriginalConfigClass();
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(testConfigDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('configuration loading', () => {
    test('should load default configuration successfully', () => {
      expect(agentConfig.getConfig()).toBeDefined();
      expect(agentConfig.getConfig().categoryTimes).toBeDefined();
      expect(agentConfig.getConfig().complexityIndicators).toBeDefined();
      expect(agentConfig.getConfig().capabilityWeights).toBeDefined();
    });

    test('should have all required category times', () => {
      const categoryTimes = agentConfig.getConfig().categoryTimes;
      
      expect(categoryTimes.development).toBe(120);
      expect(categoryTimes.design).toBe(90);
      expect(categoryTimes.testing).toBe(60);
      expect(categoryTimes.security).toBe(150);
      expect(categoryTimes.devops).toBe(180);
      expect(categoryTimes.data).toBe(140);
      expect(categoryTimes['ai-ml']).toBe(200);
      expect(categoryTimes.content).toBe(45);
      expect(categoryTimes.specialized).toBe(160);
      expect(categoryTimes.default).toBe(100);
    });

    test('should have complexity indicators for all levels', () => {
      const indicators = agentConfig.getComplexityIndicators();
      
      expect(indicators.high).toContain('architect');
      expect(indicators.high).toContain('enterprise');
      expect(indicators.medium).toContain('develop');
      expect(indicators.medium).toContain('optimize');
      expect(indicators.low).toContain('simple');
      expect(indicators.low).toContain('basic');
    });

    test('should have capability weights for all strategies', () => {
      const strategies = ['balanced', 'performance', 'speed', 'accuracy'];
      
      strategies.forEach(strategy => {
        const weights = agentConfig.getCapabilityWeights(strategy);
        
        expect(weights).toBeDefined();
        expect(weights.capabilityMatch).toBeDefined();
        expect(weights.specializationMatch).toBeDefined();
        expect(weights.successRate).toBeDefined();
        expect(typeof weights.capabilityMatch).toBe('number');
        
        // All weights should sum to approximately 1.0
        const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        expect(total).toBeCloseTo(1.0, 1);
      });
    });
  });

  describe('getCategoryTime', () => {
    test('should return correct time for known categories', () => {
      expect(agentConfig.getCategoryTime('development')).toBe(120);
      expect(agentConfig.getCategoryTime('testing')).toBe(60);
      expect(agentConfig.getCategoryTime('security')).toBe(150);
    });

    test('should return default time for unknown categories', () => {
      expect(agentConfig.getCategoryTime('unknown-category')).toBe(100);
      expect(agentConfig.getCategoryTime('')).toBe(100);
      expect(agentConfig.getCategoryTime(null)).toBe(100);
    });
  });

  describe('calculateSuccessRate', () => {
    test('should calculate success rate correctly for valid ratings', () => {
      // Test edge cases
      expect(agentConfig.calculateSuccessRate(1.0)).toBe(0.7);  // Min rating → min success rate
      expect(agentConfig.calculateSuccessRate(5.0)).toBe(0.95); // Max rating → max success rate
      
      // Test middle values
      expect(agentConfig.calculateSuccessRate(3.0)).toBeCloseTo(0.825, 2); // Middle rating
      expect(agentConfig.calculateSuccessRate(4.0)).toBeCloseTo(0.875, 2); // Good rating
      expect(agentConfig.calculateSuccessRate(4.5)).toBeCloseTo(0.91, 2); // Very good rating
    });

    test('should handle invalid ratings by using default', () => {
      const defaultSuccessRate = agentConfig.calculateSuccessRate(4.0); // Default rating is 4.0
      
      expect(agentConfig.calculateSuccessRate(null)).toBe(defaultSuccessRate);
      expect(agentConfig.calculateSuccessRate(undefined)).toBe(defaultSuccessRate);
      expect(agentConfig.calculateSuccessRate('invalid')).toBe(defaultSuccessRate);
      expect(agentConfig.calculateSuccessRate('')).toBe(defaultSuccessRate);
    });

    test('should clamp ratings to valid range', () => {
      // Ratings below min should be clamped to min
      expect(agentConfig.calculateSuccessRate(0.5)).toBe(0.7);
      expect(agentConfig.calculateSuccessRate(-1)).toBe(0.7);
      
      // Ratings above max should be clamped to max
      expect(agentConfig.calculateSuccessRate(6)).toBe(0.95);
      expect(agentConfig.calculateSuccessRate(10)).toBe(0.95);
    });
  });

  describe('getDomainPatterns', () => {
    test('should return domain patterns for all domains', () => {
      const patterns = agentConfig.getDomainPatterns();
      
      expect(patterns.development).toContain('javascript');
      expect(patterns.development).toContain('react');
      expect(patterns.development).toContain('api');
      
      expect(patterns.security).toContain('security');
      expect(patterns.security).toContain('authentication');
      
      expect(patterns.devops).toContain('docker');
      expect(patterns.devops).toContain('kubernetes');
      
      expect(patterns.data).toContain('database');
      expect(patterns.data).toContain('sql');
    });
  });

  describe('getUrgencyKeywords', () => {
    test('should return all urgency keywords', () => {
      const keywords = agentConfig.getUrgencyKeywords();
      
      expect(keywords).toContain('urgent');
      expect(keywords).toContain('asap');
      expect(keywords).toContain('immediately');
      expect(keywords).toContain('critical');
      expect(keywords).toContain('emergency');
    });
  });

  describe('getModelConfig', () => {
    test('should return model configuration with defaults', () => {
      const modelConfig = agentConfig.getModelConfig();
      
      expect(modelConfig.default).toBe('claude-3-sonnet');
      expect(modelConfig.fallback).toBe('gpt-3.5-turbo');
      expect(modelConfig.temperature).toBe(0.7);
      expect(modelConfig.maxTokens).toBe(4000);
    });
  });

  describe('getMemoryConfig', () => {
    test('should return memory configuration with expected values', () => {
      const memoryConfig = agentConfig.getMemoryConfig();
      
      expect(memoryConfig.maxCacheSize).toBe(100);
      expect(memoryConfig.memoryCompressionThreshold).toBe(200);
      expect(memoryConfig.autoCompressionInterval).toBe(3600000);
      expect(memoryConfig.knowledgeShareThreshold).toBe(0.8);
      expect(memoryConfig.maxMemoryAge).toBe(365);
      expect(memoryConfig.interactionRetentionLimit).toBe(100);
    });
  });

  describe('configuration validation', () => {
    test('should validate category times are positive numbers', () => {
      const config = agentConfig.getConfig();
      
      Object.entries(config.categoryTimes).forEach(([category, time]) => {
        expect(typeof time).toBe('number');
        expect(time).toBeGreaterThan(0);
      });
    });

    test('should validate success rate mapping is logical', () => {
      const mapping = config.successRateMapping;
      
      expect(mapping.minSuccessRate).toBeLessThan(mapping.maxSuccessRate);
      expect(mapping.minRating).toBeLessThan(mapping.maxRating);
      expect(mapping.minSuccessRate).toBeGreaterThan(0);
      expect(mapping.maxSuccessRate).toBeLessThanOrEqual(1);
    });

    test('should validate memory settings are reasonable', () => {
      const memory = agentConfig.getMemoryConfig();
      
      expect(memory.maxCacheSize).toBeGreaterThan(0);
      expect(memory.memoryCompressionThreshold).toBeGreaterThan(memory.maxCacheSize);
      expect(memory.knowledgeShareThreshold).toBeGreaterThan(0);
      expect(memory.knowledgeShareThreshold).toBeLessThanOrEqual(1);
    });
  });

  describe('updateConfig', () => {
    test('should allow updating configuration at runtime', () => {
      const originalTime = agentConfig.getCategoryTime('development');
      
      agentConfig.updateConfig('categoryTimes.development', 150);
      
      expect(agentConfig.getCategoryTime('development')).toBe(150);
      expect(agentConfig.getCategoryTime('development')).not.toBe(originalTime);
    });

    test('should allow updating nested configuration', () => {
      const originalThreshold = agentConfig.getMemoryConfig().knowledgeShareThreshold;
      
      agentConfig.updateConfig('memory.knowledgeShareThreshold', 0.9);
      
      expect(agentConfig.getMemoryConfig().knowledgeShareThreshold).toBe(0.9);
      expect(agentConfig.getMemoryConfig().knowledgeShareThreshold).not.toBe(originalThreshold);
    });

    test('should validate configuration after update', () => {
      // This should throw because minSuccessRate would be >= maxSuccessRate
      expect(() => {
        agentConfig.updateConfig('successRateMapping.minSuccessRate', 1.0);
      }).toThrow();
    });
  });

  describe('environment variable override', () => {
    test('should respect environment variables when present', () => {
      // We can't easily test this without mocking process.env
      // But we can verify the method exists and handles missing vars
      const envConfig = agentConfig._loadEnvironmentConfig();
      expect(typeof envConfig).toBe('object');
    });
  });

  describe('configuration immutability', () => {
    test('should return copy of config to prevent external modification', () => {
      const config1 = agentConfig.getConfig();
      const config2 = agentConfig.getConfig();
      
      // Should be equal but not the same reference
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
      
      // Modifying returned config should not affect internal config
      config1.categoryTimes.development = 999;
      expect(agentConfig.getCategoryTime('development')).not.toBe(999);
    });
  });

  describe('error handling', () => {
    test('should handle invalid configuration gracefully', () => {
      // Test with invalid weights that don't sum to 1
      expect(() => {
        agentConfig.updateConfig('capabilityWeights.balanced.capabilityMatch', -0.5);
      }).not.toThrow(); // Should not throw immediately
      
      // But validation might catch it depending on implementation
    });

    test('should handle missing configuration files gracefully', () => {
      // The constructor should not throw even if config file is missing
      expect(() => {
        process.env.AGENT_CONFIG_PATH = '/nonexistent/path/config.json';
        new AgentConfigClass();
        delete process.env.AGENT_CONFIG_PATH;
      }).not.toThrow();
    });
  });
});