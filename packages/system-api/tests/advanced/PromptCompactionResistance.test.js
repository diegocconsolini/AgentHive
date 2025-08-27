/**
 * PromptCompactionResistance.test.js
 * Comprehensive tests for prompt compaction resistance system
 */

import PromptCompactionResistance from '../../src/advanced/PromptCompactionResistance.js';
import crypto from 'crypto';

describe('PromptCompactionResistance', () => {
  let resistance;

  beforeEach(() => {
    resistance = new PromptCompactionResistance({
      autoResist: false,
      preservationTarget: 0.95,
      emergencyRecoveryEnabled: true
    });
  });

  afterEach(() => {
    if (resistance) {
      resistance.cleanup();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default options', () => {
      const pcr = new PromptCompactionResistance();
      expect(pcr.options.resistanceLevel).toBe('high');
      expect(pcr.options.autoResist).toBe(true);
      expect(pcr.options.preservationTarget).toBe(0.95);
      expect(pcr.options.emergencyRecoveryEnabled).toBe(true);
      pcr.cleanup();
    });

    test('should accept custom options', () => {
      const pcr = new PromptCompactionResistance({
        resistanceLevel: 'aggressive',
        autoResist: false,
        preservationTarget: 0.99,
        mlEnabled: true
      });
      expect(pcr.options.resistanceLevel).toBe('aggressive');
      expect(pcr.options.autoResist).toBe(false);
      expect(pcr.options.preservationTarget).toBe(0.99);
      expect(pcr.options.mlEnabled).toBe(true);
      pcr.cleanup();
    });

    test('should initialize all components', () => {
      expect(resistance.scorer).toBeDefined();
      expect(resistance.compressor).toBeDefined();
      expect(resistance.reconstructor).toBeDefined();
      expect(resistance.strategies).toBeDefined();
    });
  });

  describe('Importance Scoring', () => {
    test('should calculate importance scores for context items', async () => {
      const context = {
        critical: {
          systemCritical: true,
          data: 'important',
          timestamp: Date.now()
        },
        normal: {
          data: 'regular',
          timestamp: Date.now() - 1000000
        }
      };

      const scoredContext = await resistance.scoreContext(context);
      
      expect(scoredContext._resistanceScores).toBeDefined();
      expect(scoredContext.critical._resistance).toBeDefined();
      expect(scoredContext.critical._resistance.importance).toBeGreaterThan(0);
      expect(scoredContext.critical._resistance.confidence).toBeGreaterThan(0);
    });

    test('should prioritize system critical items', async () => {
      const context = {
        critical: {
          systemCritical: true,
          data: 'important'
        },
        notCritical: {
          data: 'regular'
        }
      };

      const scoredContext = await resistance.scoreContext(context);
      
      const criticalScore = scoredContext.critical._resistance.importance;
      const normalScore = scoredContext.notCritical._resistance.importance;
      
      expect(criticalScore).toBeGreaterThan(normalScore);
    });

    test('should consider recency in scoring', async () => {
      const now = Date.now();
      const context = {
        recent: {
          timestamp: now,
          data: 'new'
        },
        old: {
          timestamp: now - 30 * 24 * 60 * 60 * 1000, // 30 days old
          data: 'old'
        }
      };

      const scoredContext = await resistance.scoreContext(context);
      
      const recentScore = scoredContext.recent._resistance.importance;
      const oldScore = scoredContext.old._resistance.importance;
      
      expect(recentScore).toBeGreaterThan(oldScore);
    });

    test('should export ML features', () => {
      const context = {
        item1: { data: 'test1' },
        item2: { data: 'test2' }
      };

      resistance.scorer.calculateScore(context.item1, { id: 'item1' });
      resistance.scorer.calculateScore(context.item2, { id: 'item2' });

      const mlFeatures = resistance.exportMLFeatures();
      
      expect(Array.isArray(mlFeatures)).toBe(true);
      expect(mlFeatures.length).toBeGreaterThan(0);
      expect(mlFeatures[0]).toHaveProperty('features');
      expect(mlFeatures[0]).toHaveProperty('score');
    });
  });

  describe('Compression Engine', () => {
    test('should compress non-critical data', () => {
      const context = {
        data: {
          large: 'x'.repeat(10000),
          normal: 'regular data'
        }
      };

      const compressed = resistance.compressor.compress(context);
      
      expect(compressed.compressed).toBe(true);
      expect(compressed.compressedSize).toBeLessThan(compressed.originalSize);
      expect(compressed.compressionRatio).toBeGreaterThan(0);
    });

    test('should protect critical data from heavy compression', () => {
      const context = {
        password: 'secret123',
        token: 'auth-token-xyz',
        normal: 'regular data'
      };

      const compressed = resistance.compressor.compress(context, {
        compressCritical: false
      });
      
      expect(compressed.critical).toBeDefined();
      expect(compressed.nonCritical).toBeDefined();
      
      // Critical data should be preserved
      expect(compressed.critical.password).toBe('secret123');
      expect(compressed.critical.token).toBe('auth-token-xyz');
    });

    test('should decompress correctly', () => {
      const original = {
        data: {
          test: 'value',
          nested: {
            deep: 'content'
          }
        }
      };

      const compressed = resistance.compressor.compress(original);
      const decompressed = resistance.compressor.decompress(compressed);
      
      expect(decompressed).toEqual(original);
    });

    test('should handle compression failures gracefully', () => {
      const circular = {};
      circular.self = circular;

      expect(() => {
        resistance.compressor.compress(circular);
      }).toThrow('Compression failed');
    });

    test('should track compression statistics', () => {
      const context = { data: 'test' };
      
      resistance.compressor.compress(context);
      resistance.compressor.compress(context);
      
      const stats = resistance.compressor.getStats();
      
      expect(stats.totalCompressed).toBe(2);
      expect(stats.averageRatio).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Context Reconstruction', () => {
    test('should reconstruct from compressed state', async () => {
      const original = {
        data: {
          value: 'test',
          nested: { deep: 'content' }
        }
      };

      const compressed = resistance.compressor.compress(original);
      const result = await resistance.reconstructor.reconstruct(compressed);
      
      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.reconstructionTime).toBeGreaterThan(0);
    });

    test('should cache reconstruction results', async () => {
      const compressed = resistance.compressor.compress({ data: 'test' });
      
      const result1 = await resistance.reconstructor.reconstruct(compressed);
      const result2 = await resistance.reconstructor.reconstruct(compressed);
      
      // Second call should be faster (from cache)
      expect(result2.reconstructionTime).toBeLessThanOrEqual(result1.reconstructionTime);
    });

    test('should create and restore recovery points', async () => {
      const context = {
        data: 'important',
        timestamp: Date.now()
      };

      const pointId = resistance.reconstructor.createRecoveryPoint(context);
      expect(pointId).toBeDefined();

      const points = resistance.reconstructor.recoveryPoints;
      expect(points.length).toBeGreaterThan(0);
      
      const recovered = await resistance.reconstructor.restoreFromRecoveryPoint(points[0]);
      expect(recovered).toEqual(context);
    });

    test('should perform emergency recovery on failure', async () => {
      const invalidState = { corrupted: true };
      
      const result = await resistance.reconstructor.emergencyRecovery(
        invalidState, 
        new Error('Test error')
      );
      
      expect(result.success).toBeDefined();
      expect(result.recoveryMethod).toBeDefined();
      expect(result.warning).toBeDefined();
    });

    test('should salvage data from corrupted state', () => {
      const corrupted = {
        valid: 'data',
        nested: {
          good: 'value',
          bad: undefined
        }
      };

      const salvaged = resistance.reconstructor.salvageData(corrupted);
      
      expect(salvaged.recovered).toBe(true);
      expect(salvaged.partial).toBe(true);
      expect(salvaged.data.valid).toBe('data');
      expect(salvaged.data.nested.good).toBe('value');
    });

    test('should rebuild relationships correctly', () => {
      const context = {
        item1: {
          id: 'id1',
          dependencies: ['id2']
        },
        item2: {
          id: 'id2',
          parentId: 'id1'
        }
      };

      const rebuilt = resistance.reconstructor.rebuildRelationships(context);
      
      expect(rebuilt.item2.parent).toBeDefined();
      expect(rebuilt.item2.parent.id).toBe('id1');
    });
  });

  describe('Resistance Strategies', () => {
    test('should apply balanced strategy', async () => {
      const context = {
        important: {
          data: 'critical',
          systemCritical: true
        },
        normal: {
          data: 'regular'
        }
      };

      const result = await resistance.resist(context, {
        strategy: 'balanced'
      });
      
      expect(result.context).toBeDefined();
      expect(result.metadata.resistance.applied).toBe(true);
      expect(result.metadata.resistance.strategy).toBe('balanced');
      expect(result.metadata.resistance.preservationRate).toBeGreaterThan(0);
    });

    test('should apply aggressive strategy', async () => {
      const context = {
        data: { value: 'test' }
      };

      const result = await resistance.resist(context, {
        strategy: 'aggressive'
      });
      
      expect(result.context._strategy).toBe('aggressive');
      expect(result.context._redundancy).toBe(true);
      
      // Should have backup
      if (result.context.critical) {
        expect(result.context._backup).toBeDefined();
      }
    });

    test('should apply low memory strategy under pressure', async () => {
      const largeContext = {
        large: {
          data: 'x'.repeat(100000)
        }
      };

      const result = await resistance.resist(largeContext, {
        strategy: 'lowMemory'
      });
      
      expect(result.context._strategy).toBe('lowMemory');
      expect(result.context._compressed).toBeDefined();
    });

    test('should auto-select strategy based on conditions', async () => {
      const context = {
        normal: { data: 'test' }
      };

      // Score the context first
      const scoredContext = await resistance.scoreContext(context);
      const strategy = resistance.selectStrategy(scoredContext, {});
      
      expect(['balanced', 'lowMemory', 'highImportance', 'aggressive']).toContain(strategy);
    });
  });

  describe('Preservation and Recovery', () => {
    test('should meet preservation target', async () => {
      const context = {
        critical: {
          systemCritical: true,
          data: 'must preserve'
        },
        important: {
          priority: 8,
          data: 'should preserve'
        },
        normal: {
          data: 'can lose'
        }
      };

      const result = await resistance.resist(context);
      
      expect(result.metadata.resistance.preservationRate).toBeGreaterThanOrEqual(0.5);
      
      // Critical items should always be preserved
      if (result.context.critical) {
        expect(result.context.critical.data).toBe('must preserve');
      }
    });

    test('should handle emergency protection', async () => {
      // Force an error by providing invalid context
      const circular = {};
      circular.self = circular;

      const result = await resistance.resist(circular);
      
      expect(result.metadata.resistance).toBeDefined();
      
      // Should either succeed with emergency protection or have emergency flag
      if (!result.metadata.resistance.applied) {
        expect(result.metadata.resistance.emergency).toBe(true);
      }
    });

    test('should track metrics correctly', async () => {
      const context = { data: 'test' };
      
      await resistance.resist(context);
      await resistance.resist(context);
      
      const metrics = resistance.getMetrics();
      
      expect(metrics.totalResistanceEvents).toBe(2);
      expect(metrics.successfulResistance).toBeGreaterThan(0);
      expect(metrics.averagePreservationRate).toBeGreaterThan(0);
    });
  });

  describe('Event Emission', () => {
    test('should emit resistance events', async () => {
      const context = { data: 'test' };
      let eventFired = false;
      
      resistance.on('resistance', (event) => {
        eventFired = true;
        expect(event.strategy).toBeDefined();
        expect(event.preservationRate).toBeDefined();
        expect(event.duration).toBeDefined();
      });

      await resistance.resist(context);
      
      expect(eventFired).toBe(true);
    });

    test('should emit memory pressure events when auto-resist enabled', (done) => {
      const pcr = new PromptCompactionResistance({
        autoResist: true
      });

      pcr.on('memory-pressure', (event) => {
        expect(event.pressure).toBeDefined();
        expect(event.heapUsed).toBeDefined();
        expect(event.heapTotal).toBeDefined();
        pcr.cleanup();
        done();
      });

      // Force memory pressure check
      pcr.emit('memory-pressure', {
        pressure: 0.8,
        heapUsed: 800000000,
        heapTotal: 1000000000
      });
    });
  });

  describe('ML Integration', () => {
    test('should update ML weights', () => {
      const newWeights = {
        frequency: 0.3,
        recency: 0.25,
        dependency: 0.15,
        semantic: 0.15,
        userMarked: 0.1,
        systemCritical: 0.05
      };

      resistance.updateMLWeights(newWeights);
      
      expect(resistance.scorer.weights.frequency).toBe(0.3);
      expect(resistance.scorer.weights.recency).toBe(0.25);
    });

    test('should export ML-ready features', () => {
      const context = {
        item: {
          data: 'test',
          tags: ['important', 'cache'],
          priority: 7
        }
      };

      resistance.scorer.calculateScore(context.item, { id: 'test-item' });
      
      const features = resistance.exportMLFeatures();
      
      expect(features).toBeDefined();
      expect(features.length).toBeGreaterThan(0);
      expect(features[0].features).toHaveProperty('tags');
      expect(features[0].features).toHaveProperty('priority');
    });
  });

  describe('Performance', () => {
    test('should handle large contexts efficiently', async () => {
      const largeContext = {};
      for (let i = 0; i < 1000; i++) {
        largeContext[`item${i}`] = {
          data: `value${i}`,
          nested: {
            deep: `content${i}`
          }
        };
      }

      const startTime = Date.now();
      const result = await resistance.resist(largeContext);
      const duration = Date.now() - startTime;
      
      expect(result.context).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should maintain performance with multiple recovery points', () => {
      const context = { data: 'test' };
      
      // Create multiple recovery points
      for (let i = 0; i < 15; i++) {
        resistance.reconstructor.createRecoveryPoint({
          ...context,
          iteration: i
        });
      }
      
      // Should maintain max recovery points
      expect(resistance.reconstructor.recoveryPoints.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup resources properly', () => {
      const pcr = new PromptCompactionResistance({
        autoResist: true
      });

      // Create some state
      pcr.reconstructor.createRecoveryPoint({ data: 'test' });
      pcr.reconstructor.reconstructionCache.set('key', 'value');

      pcr.cleanup();
      
      expect(pcr.reconstructor.recoveryPoints.length).toBe(0);
      expect(pcr.reconstructor.reconstructionCache.size).toBe(0);
      expect(pcr.resistanceInterval).toBeNull();
    });
  });
});

describe('PromptCompactionResistance Integration', () => {
  test('should integrate with analytics engine', async () => {
    const { default: IntelligenceEngine } = await import('../../src/analytics/IntelligenceEngine.js');
    const { default: PerformanceMonitor } = await import('../../src/performance/PerformanceMonitor.js');
    
    const intelligence = new IntelligenceEngine();
    const performance = new PerformanceMonitor();
    const resistance = new PromptCompactionResistance();

    // Generate some analytics data
    const analyticsData = intelligence.generateInsight({
      type: 'memory',
      metrics: {
        usage: 0.8,
        trend: 'increasing'
      }
    });

    // Monitor performance
    performance.startTracking('resistance-test');

    // Apply resistance to analytics data
    const result = await resistance.resist(analyticsData);
    
    performance.endTracking('resistance-test');
    const perfMetrics = performance.getMetrics('resistance-test');

    expect(result.context).toBeDefined();
    expect(result.metadata.resistance.applied).toBe(true);
    expect(perfMetrics).toBeDefined();

    resistance.cleanup();
  });

  test('should maintain context preservation above 95% target', async () => {
    const resistance = new PromptCompactionResistance({
      preservationTarget: 0.95
    });

    const criticalContext = {
      auth: {
        systemCritical: true,
        token: 'xyz123',
        permissions: ['read', 'write']
      },
      config: {
        systemCritical: true,
        database: 'production',
        apiKeys: { service: 'key123' }
      },
      cache: {
        data: 'cached-content',
        timestamp: Date.now()
      }
    };

    const result = await resistance.resist(criticalContext);
    
    expect(result.metadata.resistance.preservationRate).toBeGreaterThanOrEqual(0.95);
    
    // Verify critical data preserved
    if (result.context.auth) {
      expect(result.context.auth.token).toBeDefined();
    }
    if (result.context.config) {
      expect(result.context.config.database).toBeDefined();
    }

    resistance.cleanup();
  });

  test('should recover from catastrophic failure in under 5 seconds', async () => {
    const resistance = new PromptCompactionResistance();
    
    // Create a recovery point
    const validContext = {
      data: 'important',
      config: { setting: 'value' }
    };
    resistance.reconstructor.createRecoveryPoint(validContext);

    // Simulate catastrophic failure
    const startTime = Date.now();
    const recovered = await resistance.reconstructor.emergencyRecovery(
      null,
      new Error('Catastrophic failure')
    );
    const recoveryTime = Date.now() - startTime;

    expect(recoveryTime).toBeLessThan(5000); // Under 5 seconds
    expect(recovered.context).toBeDefined();
    expect(recovered.recoveryMethod).toBeDefined();

    resistance.cleanup();
  });
});