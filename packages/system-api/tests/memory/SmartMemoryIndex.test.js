/**
 * Smart Memory Index Tests
 * Comprehensive test suite for AI-powered memory management system
 */

// Set up test environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.AI_PROVIDER_ENABLED = 'true';
process.env.AI_PROVIDER_ENDPOINT = 'http://localhost:8080/v1';
process.env.AI_PROVIDER_API_KEY = 'test-api-key';

const SmartMemoryIndex = require('../../src/memory/SmartMemoryIndex');
const AgentMemory = require('../../src/models/AgentMemory');

// Enhanced Mock AI Provider Service with complete interface
const mockAIProvider = {
  getAvailableProviders: jest.fn().mockReturnValue([
    { name: 'test-provider', type: 'openai-compatible', enabled: true }
  ]),
  checkProviderHealth: jest.fn().mockResolvedValue({ 
    healthy: true, 
    latency: 0,
    error: undefined
  }),
  generateResponse: jest.fn().mockResolvedValue({
    response: 'knowledge',
    provider: 'test-provider',
    tokens: { total: 50 },
    duration: 100
  }),
  selectOptimalProvider: jest.fn().mockReturnValue('test-provider'),
  updateMetrics: jest.fn(),
  getMetrics: jest.fn().mockReturnValue([])
};

// Mock dotenv config loading
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Mock AI Provider Service with enhanced methods
jest.mock('../../ai-providers.js', () => ({
  AIProviderService: jest.fn(() => mockAIProvider)
}));

describe('SmartMemoryIndex', () => {
  let memoryIndex;
  let testMemoryData;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create fresh instance
    memoryIndex = new SmartMemoryIndex();
    
    // Test memory data
    testMemoryData = {
      agentId: 'test-agent-1',
      userId: 'test-user-1',
      sessionId: 'test-session-1',
      knowledge: {
        concepts: ['machine learning', 'neural networks'],
        expertise: 'AI development'
      },
      interactions: [
        {
          timestamp: new Date().toISOString(),
          content: 'User asked about machine learning algorithms',
          summary: 'ML algorithm discussion'
        }
      ],
      patterns: {
        userPreferences: ['detailed explanations', 'code examples'],
        responseStyle: 'technical'
      }
    };
    
    // Initialize the memory index
    await memoryIndex.initialize();
  });

  afterEach(() => {
    // Clean up any timers/intervals
    jest.clearAllTimers();
    if (memoryIndex && memoryIndex.cleanup) {
      memoryIndex.cleanup();
    }
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      const newIndex = new SmartMemoryIndex();
      await expect(newIndex.initialize()).resolves.not.toThrow();
      expect(newIndex.initialized).toBe(true);
    });

    test('should not initialize twice', async () => {
      expect(memoryIndex.initialized).toBe(true);
      
      // Reset call count to track just this test
      mockAIProvider.checkProviderHealth.mockClear();
      
      // Should not throw on second initialization
      await expect(memoryIndex.initialize()).resolves.not.toThrow();
      // Since it's already initialized, checkProviderHealth should not be called again
      expect(mockAIProvider.checkProviderHealth).toHaveBeenCalledTimes(0);
    });

    test('should handle AI provider initialization failure gracefully', async () => {
      const failingProvider = {
        getAvailableProviders: jest.fn().mockReturnValue([{ name: 'failing-provider' }]),
        checkProviderHealth: jest.fn().mockRejectedValue(new Error('Connection failed'))
      };
      
      // Create a new instance with the failing provider
      const newIndex = new SmartMemoryIndex();
      newIndex.aiProvider = failingProvider;
      
      // Should not throw due to graceful degradation - just mark as initialized with limited functionality
      await expect(newIndex.initialize()).resolves.not.toThrow();
      expect(newIndex.initialized).toBe(true);
    });
  });

  describe('Memory Management', () => {
    test('should add memory successfully', async () => {
      const memory = await memoryIndex.addMemory(testMemoryData);

      expect(memory).toBeDefined();
      expect(memory.id).toBeDefined();
      expect(memory.agentId).toBe(testMemoryData.agentId);
      expect(memory.knowledge).toEqual(testMemoryData.knowledge);
      
      // Should be stored in index
      expect(memoryIndex.memoryIndex.has(memory.id)).toBe(true);
      expect(memoryIndex.semanticVectors.has(memory.id)).toBe(true);
      expect(memoryIndex.categories.has(memory.id)).toBe(true);
    });

    test('should retrieve memory by ID', async () => {
      const addedMemory = await memoryIndex.addMemory(testMemoryData);
      const retrievedMemory = await memoryIndex.getMemory(addedMemory.id);

      expect(retrievedMemory).toEqual(addedMemory);
      expect(retrievedMemory.lastAccessed).toBeDefined();
    });

    test('should return null for non-existent memory', async () => {
      const memory = await memoryIndex.getMemory('non-existent-id');
      expect(memory).toBeNull();
    });

    test('should update memory and re-index', async () => {
      const addedMemory = await memoryIndex.addMemory(testMemoryData);
      
      // Wait a bit to ensure timestamp will be different
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updates = {
        knowledge: {
          concepts: ['deep learning', 'transformers'],
          expertise: 'Advanced AI'
        }
      };

      const updatedMemory = await memoryIndex.updateMemory(addedMemory.id, updates);

      expect(updatedMemory.knowledge).toEqual(updates.knowledge);
      expect(updatedMemory.updated).not.toBe(addedMemory.updated);
      
      // Should have re-indexed
      expect(memoryIndex.semanticVectors.has(addedMemory.id)).toBe(true);
      expect(memoryIndex.categories.has(addedMemory.id)).toBe(true);
    });

    test('should throw error when updating non-existent memory', async () => {
      await expect(
        memoryIndex.updateMemory('non-existent-id', { test: 'data' })
      ).rejects.toThrow('Memory non-existent-id not found');
    });

    test('should delete memory and clean up relationships', async () => {
      const addedMemory = await memoryIndex.addMemory(testMemoryData);
      const deleted = await memoryIndex.deleteMemory(addedMemory.id);

      expect(deleted).toBe(true);
      expect(memoryIndex.memoryIndex.has(addedMemory.id)).toBe(false);
      expect(memoryIndex.semanticVectors.has(addedMemory.id)).toBe(false);
      expect(memoryIndex.categories.has(addedMemory.id)).toBe(false);
      expect(memoryIndex.memoryRelationships.has(addedMemory.id)).toBe(false);
    });

    test('should throw error when deleting non-existent memory', async () => {
      await expect(
        memoryIndex.deleteMemory('non-existent-id')
      ).rejects.toThrow('Memory non-existent-id not found');
    });
  });

  describe('Semantic Search', () => {
    let memory1, memory2, memory3;

    beforeEach(async () => {
      // Add multiple memories for search testing
      memory1 = await memoryIndex.addMemory({
        ...testMemoryData,
        agentId: 'agent-1',
        knowledge: { topic: 'machine learning algorithms' }
      });

      memory2 = await memoryIndex.addMemory({
        ...testMemoryData,
        agentId: 'agent-2', 
        knowledge: { topic: 'natural language processing' }
      });

      memory3 = await memoryIndex.addMemory({
        ...testMemoryData,
        agentId: 'agent-1',
        knowledge: { topic: 'computer vision' }
      });
    });

    test('should search memories by semantic similarity', async () => {
      const results = await memoryIndex.searchMemories('machine learning', {
        limit: 10,
        threshold: 0.1
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Results should have required properties
      results.forEach(result => {
        expect(result.memory).toBeDefined();
        expect(result.similarity).toBeDefined();
        expect(result.category).toBeDefined();
        expect(typeof result.similarity).toBe('number');
        expect(result.similarity).toBeGreaterThanOrEqual(0);
        expect(result.similarity).toBeLessThanOrEqual(1);
      });

      // Should be sorted by similarity (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i-1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
      }
    });

    test('should filter search results by agent ID', async () => {
      const results = await memoryIndex.searchMemories('learning', {
        agentId: 'agent-1',
        threshold: 0.1
      });

      results.forEach(result => {
        expect(result.memory.agentId).toBe('agent-1');
      });
    });

    test('should filter search results by category', async () => {
      const results = await memoryIndex.searchMemories('learning', {
        category: 'knowledge',
        threshold: 0.1
      });

      results.forEach(result => {
        expect(result.category).toBe('knowledge');
      });
    });

    test('should respect similarity threshold', async () => {
      const highThresholdResults = await memoryIndex.searchMemories('learning', {
        threshold: 0.9
      });

      const lowThresholdResults = await memoryIndex.searchMemories('learning', {
        threshold: 0.1
      });

      expect(lowThresholdResults.length).toBeGreaterThanOrEqual(highThresholdResults.length);
      
      highThresholdResults.forEach(result => {
        expect(result.similarity).toBeGreaterThanOrEqual(0.9);
      });
    });

    test('should respect result limit', async () => {
      const results = await memoryIndex.searchMemories('learning', {
        limit: 2,
        threshold: 0.1
      });

      expect(results.length).toBeLessThanOrEqual(2);
    });

    test('should include related memories when requested', async () => {
      const results = await memoryIndex.searchMemories('learning', {
        includeRelated: true,
        limit: 10,
        threshold: 0.1
      });

      // Should potentially have more results due to related memories
      expect(results.length).toBeGreaterThanOrEqual(0);
      
      // Some results might be marked as related
      const relatedResults = results.filter(r => r.isRelated);
      relatedResults.forEach(result => {
        expect(result.relationshipType).toBeDefined();
      });
    });

    test('should handle empty search query', async () => {
      await expect(
        memoryIndex.searchMemories('', { threshold: 0.1 })
      ).resolves.not.toThrow();
    });
  });

  describe('Memory Analytics', () => {
    beforeEach(async () => {
      // Add sample memories for analytics
      await memoryIndex.addMemory({
        ...testMemoryData,
        agentId: 'agent-1'
      });

      await memoryIndex.addMemory({
        ...testMemoryData,
        agentId: 'agent-2'
      });

      await memoryIndex.addMemory({
        ...testMemoryData,
        agentId: 'agent-1'
      });
    });

    test('should provide comprehensive analytics', async () => {
      const analytics = await memoryIndex.getAnalytics();

      expect(analytics).toHaveProperty('totalMemories');
      expect(analytics).toHaveProperty('categoryDistribution');
      expect(analytics).toHaveProperty('topAccessedMemories');
      expect(analytics).toHaveProperty('averageRelationships');
      expect(analytics).toHaveProperty('memoryHealth');

      expect(typeof analytics.totalMemories).toBe('number');
      expect(analytics.totalMemories).toBe(3);
      expect(typeof analytics.categoryDistribution).toBe('object');
      expect(Array.isArray(analytics.topAccessedMemories)).toBe(true);
      expect(typeof analytics.averageRelationships).toBe('number');
    });

    test('should calculate category distribution correctly', async () => {
      const analytics = await memoryIndex.getAnalytics();
      
      expect(analytics.categoryDistribution).toBeDefined();
      
      // Should have at least one category
      const categories = Object.keys(analytics.categoryDistribution);
      expect(categories.length).toBeGreaterThan(0);
      
      // Total should equal number of memories
      const totalCategorized = Object.values(analytics.categoryDistribution)
        .reduce((sum, count) => sum + count, 0);
      expect(totalCategorized).toBe(analytics.totalMemories);
    });

    test('should assess memory health', async () => {
      const analytics = await memoryIndex.getAnalytics();
      
      expect(analytics.memoryHealth).toBeDefined();
      expect(analytics.memoryHealth).toHaveProperty('indexingHealth');
      expect(analytics.memoryHealth).toHaveProperty('categorizationHealth');
      expect(analytics.memoryHealth).toHaveProperty('relationshipHealth');
      expect(analytics.memoryHealth).toHaveProperty('overallHealth');

      // Health scores should be between 0 and 1
      Object.values(analytics.memoryHealth).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Performance', () => {
    test('should add memory within performance threshold', async () => {
      const { metrics } = await global.testUtils.measurePerformance(
        () => memoryIndex.addMemory(testMemoryData),
        'add memory'
      );

      expect(metrics.duration).toBeWithinPerformanceThreshold(1000); // 1 second
      expect(metrics.memoryDelta.heapUsed).toBeWithinMemoryLimit(10 * 1024 * 1024); // 10MB
    });

    test('should search memories efficiently', async () => {
      // Add multiple memories
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(memoryIndex.addMemory({
          ...testMemoryData,
          agentId: `agent-${i}`,
          knowledge: { topic: `topic-${i}` }
        }));
      }
      await Promise.all(promises);

      const { metrics } = await global.testUtils.measurePerformance(
        () => memoryIndex.searchMemories('topic', { threshold: 0.1 }),
        'search memories'
      );

      expect(metrics.duration).toBeWithinPerformanceThreshold(500); // 500ms
    });

    test('should handle concurrent operations', async () => {
      const concurrentOps = [];
      
      // Add multiple memories concurrently
      for (let i = 0; i < 5; i++) {
        concurrentOps.push(
          memoryIndex.addMemory({
            ...testMemoryData,
            agentId: `concurrent-agent-${i}`
          })
        );
      }

      const results = await Promise.all(concurrentOps);
      
      expect(results).toHaveLength(5);
      results.forEach((memory, index) => {
        expect(memory.agentId).toBe(`concurrent-agent-${index}`);
        expect(memoryIndex.memoryIndex.has(memory.id)).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle AI provider failures gracefully in categorization', async () => {
      mockAIProvider.generateResponse.mockRejectedValueOnce(new Error('AI provider error'));
      
      // Should still add memory using fallback categorization
      const memory = await memoryIndex.addMemory(testMemoryData);
      
      expect(memory).toBeDefined();
      expect(memoryIndex.categories.has(memory.id)).toBe(true);
    });

    test('should handle corrupted embedding data', async () => {
      const memory = await memoryIndex.addMemory(testMemoryData);
      
      // Corrupt the embedding data
      memoryIndex.semanticVectors.set(memory.id, null);
      
      // Search should still work (skip corrupted embeddings)
      const results = await memoryIndex.searchMemories('test', { threshold: 0.1 });
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    test('should validate memory data before adding', async () => {
      // Test with invalid data
      await expect(
        memoryIndex.addMemory(null)
      ).rejects.toThrow();

      await expect(
        memoryIndex.addMemory(undefined)
      ).rejects.toThrow();
    });
  });

  describe('Memory Relationships', () => {
    test('should establish relationships between related memories', async () => {
      const memory1 = await memoryIndex.addMemory({
        ...testMemoryData,
        agentId: 'agent-1',
        knowledge: { topic: 'machine learning' }
      });

      const memory2 = await memoryIndex.addMemory({
        ...testMemoryData,
        agentId: 'agent-1',
        knowledge: { topic: 'deep learning' }
      });

      // Check if relationships were established
      expect(memoryIndex.memoryRelationships.has(memory1.id)).toBe(true);
      expect(memoryIndex.memoryRelationships.has(memory2.id)).toBe(true);

      const relationships1 = memoryIndex.memoryRelationships.get(memory1.id);
      const relationships2 = memoryIndex.memoryRelationships.get(memory2.id);

      // Should have bidirectional relationships
      expect(relationships1.some(r => r.memoryId === memory2.id)).toBe(true);
      expect(relationships2.some(r => r.memoryId === memory1.id)).toBe(true);
    });

    test('should clean up relationships when memory is deleted', async () => {
      const memory1 = await memoryIndex.addMemory({
        ...testMemoryData,
        knowledge: { topic: 'test1' }
      });

      const memory2 = await memoryIndex.addMemory({
        ...testMemoryData,
        knowledge: { topic: 'test2' }
      });

      // Delete memory1
      await memoryIndex.deleteMemory(memory1.id);

      // memory2 should no longer have relationships to memory1
      const relationships2 = memoryIndex.memoryRelationships.get(memory2.id) || [];
      expect(relationships2.some(r => r.memoryId === memory1.id)).toBe(false);
    });
  });

  describe('Access Patterns', () => {
    test('should track access patterns', async () => {
      const memory = await memoryIndex.addMemory(testMemoryData);

      // Access the memory multiple times
      await memoryIndex.getMemory(memory.id);
      await memoryIndex.searchMemories('test', { threshold: 0.1 });
      await memoryIndex.updateMemory(memory.id, { test: 'update' });

      const patterns = memoryIndex.accessPatterns.get(memory.id);
      expect(patterns).toBeDefined();
      expect(patterns.reads).toBeGreaterThan(0);
      expect(patterns.writes).toBeGreaterThan(0);
      expect(patterns.searches).toBeGreaterThan(0);
      expect(patterns.created).toBeDefined();
      expect(patterns.lastAccess).toBeDefined();
    });
  });

  describe('Memory Content Extraction', () => {
    test('should extract content from different memory types', async () => {
      const complexMemory = {
        agentId: 'test-agent',
        knowledge: {
          concepts: ['AI', 'ML'],
          facts: 'Important information'
        },
        interactions: [
          { content: 'User interaction 1', summary: 'Summary 1' },
          { content: 'User interaction 2', summary: 'Summary 2' },
          { content: 'User interaction 3', summary: 'Summary 3' },
          { content: 'User interaction 4', summary: 'Summary 4' }
        ],
        patterns: {
          behavior: 'consistent',
          preferences: ['detailed', 'examples']
        }
      };

      const content = memoryIndex.extractMemoryContent(complexMemory);
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
      
      // Should include knowledge
      expect(content).toContain('AI');
      expect(content).toContain('ML');
      
      // Should include recent interactions (only last 3)
      expect(content).toContain('Summary 2');
      expect(content).toContain('Summary 3');
      expect(content).toContain('Summary 4');
      expect(content).not.toContain('Summary 1'); // Should be excluded (only last 3)
      
      // Should include patterns
      expect(content).toContain('consistent');
    });

    test('should handle empty memory content gracefully', async () => {
      const emptyMemory = {
        agentId: 'test-agent',
        knowledge: {},
        interactions: [],
        patterns: {}
      };

      const content = memoryIndex.extractMemoryContent(emptyMemory);
      expect(typeof content).toBe('string');
      // Should return empty string or minimal content
      expect(content.length).toBe(0);
    });
  });

  describe('Environment Edge Cases', () => {
    test('should handle missing environment variables', async () => {
      // Temporarily clear environment variables
      const originalEnv = { ...process.env };
      delete process.env.AI_PROVIDER_ENABLED;
      delete process.env.AI_PROVIDER_ENDPOINT;
      
      const newIndex = new SmartMemoryIndex();
      await expect(newIndex.initialize()).resolves.not.toThrow();
      
      // Restore environment
      process.env = originalEnv;
    });

    test('should handle AI provider unavailable conditions', async () => {
      const failingProvider = {
        getAvailableProviders: jest.fn().mockReturnValue([]),
        checkProviderHealth: jest.fn().mockResolvedValue({ healthy: false, error: 'Connection failed' })
      };
      
      const newIndex = new SmartMemoryIndex();
      newIndex.aiProvider = failingProvider;
      
      // Should still initialize with graceful degradation
      await expect(newIndex.initialize()).resolves.not.toThrow();
      expect(newIndex.initialized).toBe(true);
    });

    test('should handle network timeout scenarios', async () => {
      const timeoutProvider = {
        getAvailableProviders: jest.fn().mockReturnValue([{ name: 'timeout-provider' }]),
        checkProviderHealth: jest.fn().mockRejectedValue(new Error('Request timeout')),
        generateResponse: jest.fn().mockRejectedValue(new Error('Request timeout'))
      };
      
      const newIndex = new SmartMemoryIndex();
      newIndex.aiProvider = timeoutProvider;
      
      await newIndex.initialize();
      
      // Should use fallback methods when AI provider times out
      const memory = await newIndex.addMemory(testMemoryData);
      expect(memory).toBeDefined();
      expect(newIndex.categories.has(memory.id)).toBe(true);
    });
  });

  describe('Memory Edge Cases', () => {
    test('should handle extremely large memory objects', async () => {
      const largeMemory = {
        agentId: 'test-agent-large',
        userId: 'test-user-large',
        knowledge: {
          concepts: new Array(1000).fill().map((_, i) => `concept-${i}`),
          relationships: new Array(500).fill().map((_, i) => `relationship-${i}`)
        },
        interactions: new Array(100).fill().map((_, i) => ({
          timestamp: new Date().toISOString(),
          content: `Large interaction content ${i}`.repeat(100),
          summary: `Summary ${i}`
        })),
        patterns: {
          behavior: 'x'.repeat(10000),
          preferences: new Array(200).fill().map((_, i) => `preference-${i}`)
        }
      };

      const { result, metrics } = await global.testUtils.measurePerformance(
        async () => await memoryIndex.addMemory(largeMemory)
      );

      expect(result).toBeDefined();
      expect(metrics.duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(metrics.memoryDelta).toBeWithinMemoryLimit(50 * 1024 * 1024); // Within 50MB
    });

    test('should handle circular reference scenarios', async () => {
      const circularMemory = {
        agentId: 'test-agent-circular',
        userId: 'test-user-circular',
        knowledge: { concepts: ['test'] },
        interactions: [],
        patterns: {}
      };
      
      // Create circular reference
      circularMemory.self = circularMemory;
      
      // Should not crash but handle gracefully
      await expect(memoryIndex.addMemory(circularMemory)).resolves.not.toThrow();
    });

    test('should handle memory corruption scenarios', async () => {
      const memory = await memoryIndex.addMemory(testMemoryData);
      
      // Simulate corruption by modifying internal state
      memoryIndex.semanticVectors.set(memory.id, null);
      memoryIndex.categories.set(memory.id, undefined);
      
      // Should handle corrupted data gracefully
      const retrievedMemory = await memoryIndex.getMemory(memory.id);
      expect(retrievedMemory).toBeDefined();
      
      const searchResults = await memoryIndex.searchMemories('test query');
      expect(Array.isArray(searchResults)).toBe(true);
    });
  });

  describe('Concurrency and Performance', () => {
    test('should handle concurrent memory operations safely', async () => {
      const concurrentOperations = Array(10).fill().map(async (_, i) => {
        const memData = {
          ...testMemoryData,
          agentId: `concurrent-agent-${i}`,
          userId: `concurrent-user-${i}`
        };
        return memoryIndex.addMemory(memData);
      });

      const results = await Promise.all(concurrentOperations);
      
      expect(results.length).toBe(10);
      results.forEach(memory => expect(memory).toBeDefined());
      
      // Verify all memories are properly indexed
      const analytics = await memoryIndex.getAnalytics();
      expect(analytics.totalMemories).toBeGreaterThanOrEqual(10);
    });

    test('should detect race conditions in relationship updates', async () => {
      const memory1 = await memoryIndex.addMemory({
        ...testMemoryData,
        agentId: 'race-agent-1'
      });
      
      const memory2 = await memoryIndex.addMemory({
        ...testMemoryData,
        agentId: 'race-agent-2'
      });

      // Simulate concurrent relationship updates
      const updates = [
        memoryIndex.updateMemory(memory1.id, { patterns: { updated: 'version1' } }),
        memoryIndex.updateMemory(memory2.id, { patterns: { updated: 'version2' } })
      ];

      const updatedMemories = await Promise.all(updates);
      expect(updatedMemories[0].patterns.updated).toBe('version1');
      expect(updatedMemories[1].patterns.updated).toBe('version2');
    });

    test('should handle resource contention gracefully', async () => {
      const heavyOperations = Array(20).fill().map(async (_, i) => {
        const searchQuery = `search query ${i}`;
        return memoryIndex.searchMemories(searchQuery, { limit: 50 });
      });

      const { result: searchResults, metrics } = await global.testUtils.measurePerformance(
        async () => await Promise.all(heavyOperations)
      );

      expect(searchResults.length).toBe(20);
      expect(metrics.duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Resource Management and Cleanup', () => {
    test('should properly clean up resources during shutdown', async () => {
      const newIndex = new SmartMemoryIndex();
      await newIndex.initialize();
      
      // Add some data to create resources
      await newIndex.addMemory(testMemoryData);
      
      // Simulate cleanup
      newIndex.cleanup();
      
      // Verify cleanup
      expect(newIndex.maintenanceIntervals).toEqual([]);
    });

    test('should detect memory leaks during operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const memory = await memoryIndex.addMemory({
          ...testMemoryData,
          agentId: `leak-test-${i}`
        });
        await memoryIndex.searchMemories(`query ${i}`);
        await memoryIndex.deleteMemory(memory.id);
      }
      
      // Force garbage collection if available
      if (global.gc) global.gc();
      
      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory growth should be reasonable (less than 50MB for 100 operations)
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
    });

    test('should handle timer cleanup correctly', async () => {
      const newIndex = new SmartMemoryIndex();
      await newIndex.initialize();
      
      // Verify intervals are set up
      expect(newIndex.maintenanceIntervals).toBeDefined();
      
      // Clean up should clear intervals
      newIndex.cleanup();
      expect(newIndex.maintenanceIntervals).toEqual([]);
    });
  });

  describe('Integration Scenarios', () => {
    test('should integrate with real AgentMemory instances', async () => {
      const realAgentMemory = new AgentMemory(testMemoryData);
      const memory = await memoryIndex.addMemory(realAgentMemory);
      
      expect(memory.id).toBeDefined();
      expect(memory.agentId).toBe(testMemoryData.agentId);
      
      const retrieved = await memoryIndex.getMemory(memory.id);
      expect(retrieved).toEqual(memory);
    });

    test('should maintain consistency across complex operations', async () => {
      const memories = [];
      
      // Create multiple related memories
      for (let i = 0; i < 5; i++) {
        const memory = await memoryIndex.addMemory({
          ...testMemoryData,
          agentId: `integration-agent-${i}`,
          knowledge: {
            ...testMemoryData.knowledge,
            concepts: [`concept-${i}`, 'shared-concept']
          }
        });
        memories.push(memory);
      }
      
      // Search should find related memories
      const searchResults = await memoryIndex.searchMemories('shared-concept', {
        includeRelated: true
      });
      
      expect(searchResults.length).toBeGreaterThan(0);
      
      // Update one memory and verify relationships are maintained
      const updatedMemory = await memoryIndex.updateMemory(memories[0].id, {
        knowledge: {
          ...memories[0].knowledge,
          concepts: [...memories[0].knowledge.concepts, 'new-concept']
        }
      });
      
      expect(updatedMemory.updated).not.toBe(memories[0].updated);
      
      // Analytics should reflect all operations
      const analytics = await memoryIndex.getAnalytics();
      expect(analytics.totalMemories).toBeGreaterThanOrEqual(5);
    });

    test('should handle system stress scenarios', async () => {
      const stressTest = async () => {
        const operations = [];
        
        // Mix of different operations
        for (let i = 0; i < 50; i++) {
          operations.push(memoryIndex.addMemory({
            ...testMemoryData,
            agentId: `stress-agent-${i}`
          }));
          
          if (i % 5 === 0) {
            operations.push(memoryIndex.searchMemories(`stress query ${i}`));
          }
          
          if (i % 10 === 0) {
            operations.push(memoryIndex.getAnalytics());
          }
        }
        
        return Promise.all(operations);
      };
      
      const { result, metrics } = await global.testUtils.measurePerformance(stressTest);
      
      expect(result.length).toBeGreaterThan(0);
      expect(metrics.duration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(metrics.memoryDelta).toBeWithinMemoryLimit(100 * 1024 * 1024); // Within 100MB
    });
  });
});