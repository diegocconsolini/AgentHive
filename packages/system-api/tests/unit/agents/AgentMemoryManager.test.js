const AgentMemoryManager = require('../../../src/agents/AgentMemoryManager');
const AgentMemory = require('../../../src/models/AgentMemory');
const fs = require('fs').promises;
const path = require('path');

describe('AgentMemoryManager', () => {
  let memoryManager;
  const testBaseDir = path.join(__dirname, '../../../test-temp/agent-memory-test');

  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testBaseDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }

    memoryManager = new AgentMemoryManager({
      baseDir: testBaseDir,
      maxCacheSize: 10,
      autoCompressionInterval: 0 // Disable auto-compression for tests
    });

    await memoryManager.initialize();
  });

  afterEach(async () => {
    if (memoryManager && memoryManager.initialized) {
      await memoryManager.close();
    }

    // Clean up test directory
    try {
      await fs.rm(testBaseDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('initialization', () => {
    test('should initialize successfully', async () => {
      expect(memoryManager.initialized).toBe(true);
      expect(memoryManager.memoryCache).toBeDefined();
      expect(memoryManager.knowledgeGraph).toBeDefined();
    });

    test('should not reinitialize if already initialized', async () => {
      const initializedTimestamp = memoryManager.initialized;
      await memoryManager.initialize();
      
      expect(memoryManager.initialized).toBe(initializedTimestamp);
    });

    test('should handle initialization errors gracefully', async () => {
      const badManager = new AgentMemoryManager({
        baseDir: '/invalid/path/that/cannot/be/created',
        dbPath: '/invalid/path/db.sqlite'
      });

      await expect(badManager.initialize()).rejects.toThrow();
    });
  });

  describe('getAgentMemory', () => {
    test('should create new agent memory if none exists', async () => {
      const memory = await memoryManager.getAgentMemory('test-agent', 'user1', 'session1');

      expect(memory).toBeInstanceOf(AgentMemory);
      expect(memory.agentId).toBe('test-agent');
      expect(memory.userId).toBe('user1');
      expect(memory.sessionId).toBe('session1');
      expect(memory.interactions).toHaveLength(0);
    });

    test('should retrieve existing memory from cache', async () => {
      const memory1 = await memoryManager.getAgentMemory('test-agent', 'user1', 'session1');
      memory1.addInteraction({
        prompt: 'Test prompt',
        response: 'Test response',
        success: true
      });

      const memory2 = await memoryManager.getAgentMemory('test-agent', 'user1', 'session1');

      expect(memory2).toBe(memory1); // Should be same instance from cache
      expect(memory2.interactions).toHaveLength(1);
    });

    test('should load memory from storage if not in cache', async () => {
      // Create and save a memory
      const memory = await memoryManager.getAgentMemory('test-agent', 'user1', 'session1');
      memory.addInteraction({
        prompt: 'Stored test',
        response: 'Stored response',
        success: true
      });
      await memoryManager.saveAgentMemory(memory);

      // Clear cache
      memoryManager.memoryCache.clear();

      // Retrieve memory - should load from storage
      const loadedMemory = await memoryManager.getAgentMemory('test-agent', 'user1', 'session1');

      expect(loadedMemory).toBeInstanceOf(AgentMemory);
      expect(loadedMemory.interactions).toHaveLength(1);
      expect(loadedMemory.interactions[0].prompt).toBe('Stored test');
    });

    test('should handle storage load errors gracefully', async () => {
      // Mock storage error
      const originalRead = memoryManager.storageManager.read;
      memoryManager.storageManager.read = jest.fn().mockRejectedValue(new Error('Storage error'));

      const memory = await memoryManager.getAgentMemory('test-agent', 'user1', 'session1');

      expect(memory).toBeInstanceOf(AgentMemory);
      expect(memory.agentId).toBe('test-agent');

      // Restore original method
      memoryManager.storageManager.read = originalRead;
    });
  });

  describe('saveAgentMemory', () => {
    test('should save agent memory to storage', async () => {
      const memory = await memoryManager.getAgentMemory('test-agent', 'user1', 'session1');
      memory.addInteraction({
        prompt: 'Save test',
        response: 'Save response',
        success: true,
        duration: 1500
      });

      await memoryManager.saveAgentMemory(memory);

      // Verify it was saved by clearing cache and reloading
      memoryManager.memoryCache.clear();
      const reloadedMemory = await memoryManager.getAgentMemory('test-agent', 'user1', 'session1');

      expect(reloadedMemory.interactions).toHaveLength(1);
      expect(reloadedMemory.interactions[0].prompt).toBe('Save test');
    });

    test('should update cache when saving', async () => {
      const memory = await memoryManager.getAgentMemory('test-agent', 'user1', 'session1');
      const memoryKey = 'test-agent:user1:session1';

      await memoryManager.saveAgentMemory(memory);

      expect(memoryManager.memoryCache.has(memoryKey)).toBe(true);
      expect(memoryManager.memoryCache.get(memoryKey)).toBe(memory);
    });

    test('should handle save errors by attempting update', async () => {
      const memory = await memoryManager.getAgentMemory('test-agent', 'user1', 'session1');
      
      // Mock create to fail, update to succeed
      const originalCreate = memoryManager.storageManager.create;
      const originalUpdate = memoryManager.storageManager.update;
      
      memoryManager.storageManager.create = jest.fn().mockRejectedValue(new Error('Create failed'));
      memoryManager.storageManager.update = jest.fn().mockResolvedValue(true);

      await expect(memoryManager.saveAgentMemory(memory)).resolves.not.toThrow();
      expect(memoryManager.storageManager.update).toHaveBeenCalled();

      // Restore
      memoryManager.storageManager.create = originalCreate;
      memoryManager.storageManager.update = originalUpdate;
    });
  });

  describe('recordInteraction', () => {
    test('should record interaction in agent memory', async () => {
      const interaction = {
        prompt: 'Test interaction',
        response: 'Test response',
        success: true,
        duration: 1000,
        tokens: 50
      };

      await memoryManager.recordInteraction('test-agent', interaction, 'user1', 'session1');

      const memory = await memoryManager.getAgentMemory('test-agent', 'user1', 'session1');
      expect(memory.interactions).toHaveLength(1);
      expect(memory.interactions[0]).toMatchObject({
        prompt: 'Test interaction',
        response: 'Test response',
        success: true,
        duration: 1000,
        tokens: 50
      });
    });

    test('should auto-save after every 10 interactions', async () => {
      const saveSpy = jest.spyOn(memoryManager, 'saveAgentMemory').mockResolvedValue();

      // Record 15 interactions
      for (let i = 0; i < 15; i++) {
        await memoryManager.recordInteraction('test-agent', {
          prompt: `Test ${i}`,
          response: `Response ${i}`,
          success: true
        }, 'user1', 'session1');
      }

      // Should have auto-saved at 10 interactions
      expect(saveSpy).toHaveBeenCalledTimes(1);

      saveSpy.mockRestore();
    });

    test('should trigger compression for large memories', async () => {
      const memory = await memoryManager.getAgentMemory('test-agent', 'user1', 'session1');
      const compressSpy = jest.spyOn(memory, 'compressMemories');
      const saveSpy = jest.spyOn(memoryManager, 'saveAgentMemory').mockResolvedValue();

      // Set low compression threshold for test
      memoryManager.config.memoryCompressionThreshold = 5;

      // Record enough interactions to trigger compression
      for (let i = 0; i < 10; i++) {
        await memoryManager.recordInteraction('test-agent', {
          prompt: `Test ${i}`,
          response: `Response ${i}`,
          success: true
        }, 'user1', 'session1');
      }

      expect(compressSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();

      compressSpy.mockRestore();
      saveSpy.mockRestore();
    });
  });

  describe('addKnowledge', () => {
    test('should add knowledge to agent memory', async () => {
      const knowledge = {
        domain: 'javascript',
        concept: 'promises',
        value: 'Promises handle asynchronous operations',
        confidence: 0.8,
        tags: ['async', 'javascript']
      };

      await memoryManager.addKnowledge('test-agent', knowledge, 'user1', 'session1');

      const memory = await memoryManager.getAgentMemory('test-agent', 'user1', 'session1');
      expect(memory.knowledge.javascript).toBeDefined();
      expect(memory.knowledge.javascript.promises).toMatchObject({
        value: 'Promises handle asynchronous operations',
        confidence: 0.8,
        tags: ['async', 'javascript']
      });
    });

    test('should save memory after adding knowledge', async () => {
      const saveSpy = jest.spyOn(memoryManager, 'saveAgentMemory').mockResolvedValue();

      await memoryManager.addKnowledge('test-agent', {
        domain: 'testing',
        concept: 'unit-tests',
        value: 'Unit tests verify individual components',
        confidence: 0.9
      });

      expect(saveSpy).toHaveBeenCalled();
      saveSpy.mockRestore();
    });

    test('should share high-confidence knowledge globally', async () => {
      const shareGlobalSpy = jest.spyOn(memoryManager, '_shareKnowledgeGlobally').mockResolvedValue();

      await memoryManager.addKnowledge('test-agent', {
        domain: 'best-practices',
        concept: 'code-review',
        value: 'Code reviews improve code quality',
        confidence: 0.9 // Above default threshold
      });

      expect(shareGlobalSpy).toHaveBeenCalled();
      shareGlobalSpy.mockRestore();
    });
  });

  describe('recordFeedback', () => {
    beforeEach(async () => {
      // Add an interaction first
      await memoryManager.recordInteraction('test-agent', {
        prompt: 'Test prompt',
        response: 'Test response',
        success: true
      }, 'user1', 'session1');
    });

    test('should record user feedback in agent memory', async () => {
      const memory = await memoryManager.getAgentMemory('test-agent', 'user1', 'session1');
      const interactionId = memory.interactions[0].id;

      const feedback = {
        interactionId,
        rating: 8,
        category: 'helpful',
        comments: 'Very useful response',
        helpful: true
      };

      await memoryManager.recordFeedback('test-agent', feedback, 'user1', 'session1');

      expect(memory.interactions[0].feedback).toMatchObject({
        rating: 8,
        category: 'helpful',
        comments: 'Very useful response',
        helpful: true
      });
    });

    test('should save memory after recording feedback', async () => {
      const memory = await memoryManager.getAgentMemory('test-agent', 'user1', 'session1');
      const saveSpy = jest.spyOn(memoryManager, 'saveAgentMemory').mockResolvedValue();

      await memoryManager.recordFeedback('test-agent', {
        interactionId: memory.interactions[0].id,
        rating: 7,
        helpful: true
      }, 'user1', 'session1');

      expect(saveSpy).toHaveBeenCalled();
      saveSpy.mockRestore();
    });
  });

  describe('getRelevantMemories', () => {
    beforeEach(async () => {
      // Add some test interactions
      await memoryManager.recordInteraction('test-agent', {
        prompt: 'How to use React hooks?',
        response: 'React hooks allow functional components to use state',
        success: true,
        tags: ['react', 'hooks']
      }, 'user1', 'session1');

      await memoryManager.recordInteraction('test-agent', {
        prompt: 'What is async/await?',
        response: 'Async/await handles asynchronous operations',
        success: true,
        tags: ['javascript', 'async']
      }, 'user1', 'session1');
    });

    test('should return relevant memories for given context', async () => {
      const context = {
        keywords: ['react', 'components'],
        domain: 'development'
      };

      const memories = await memoryManager.getRelevantMemories('test-agent', context, {
        userId: 'user1',
        sessionId: 'session1'
      });

      expect(memories).toBeInstanceOf(Array);
      expect(memories.length).toBeGreaterThan(0);
      expect(memories[0]).toHaveProperty('relevanceScore');
    });

    test('should limit results to specified limit', async () => {
      const context = {
        keywords: ['javascript', 'react'],
        domain: 'development'
      };

      const memories = await memoryManager.getRelevantMemories('test-agent', context, {
        userId: 'user1',
        sessionId: 'session1',
        limit: 1
      });

      expect(memories).toHaveLength(1);
    });
  });

  describe('getAgentAnalytics', () => {
    beforeEach(async () => {
      // Create some test data
      for (let i = 0; i < 10; i++) {
        await memoryManager.recordInteraction('analytics-agent', {
          prompt: `Test prompt ${i}`,
          response: `Test response ${i}`,
          success: i > 3, // 6 out of 10 successful
          duration: 1000 + i * 100,
          tokens: 50 + i * 5
        }, 'user1', 'session1');
      }

      await memoryManager.addKnowledge('analytics-agent', {
        domain: 'javascript',
        concept: 'functions',
        value: 'Functions are reusable blocks of code',
        confidence: 0.8
      });
    });

    test('should return comprehensive analytics for an agent', async () => {
      const analytics = await memoryManager.getAgentAnalytics('analytics-agent');

      expect(analytics).toHaveProperty('agent', 'analytics-agent');
      expect(analytics).toHaveProperty('totalMemories');
      expect(analytics).toHaveProperty('totalInteractions');
      expect(analytics).toHaveProperty('averageSuccessRate');
      expect(analytics).toHaveProperty('domainExpertise');
      expect(analytics).toHaveProperty('performanceTrends');

      expect(analytics.totalInteractions).toBeGreaterThan(0);
      expect(analytics.averageSuccessRate).toBeGreaterThan(0);
    });

    test('should return message for agent with no data', async () => {
      const analytics = await memoryManager.getAgentAnalytics('nonexistent-agent');

      expect(analytics).toHaveProperty('message');
      expect(analytics.message).toContain('No memory data available');
    });
  });

  describe('cleanupMemories', () => {
    beforeEach(async () => {
      // Create test memories with different ages
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2); // 2 years old

      const oldMemory = new AgentMemory({
        agentId: 'old-agent',
        userId: 'user1',
        created: oldDate.toISOString(),
        interactions: Array.from({ length: 5 }, (_, i) => ({
          prompt: `Old prompt ${i}`,
          response: `Old response ${i}`,
          success: false, // Poor performance
          duration: 2000
        }))
      });

      oldMemory.performance.successRate = 0.2; // Low success rate

      await memoryManager.saveAgentMemory(oldMemory);

      // Create recent memory with good performance
      const recentMemory = new AgentMemory({
        agentId: 'recent-agent',
        userId: 'user1',
        interactions: Array.from({ length: 300 }, (_, i) => ({ // Large memory for compression
          prompt: `Recent prompt ${i}`,
          response: `Recent response ${i}`,
          success: true,
          duration: 1000
        }))
      });

      recentMemory.performance.successRate = 0.9; // High success rate

      await memoryManager.saveAgentMemory(recentMemory);
    });

    test('should clean up old, poorly performing memories', async () => {
      const result = await memoryManager.cleanupMemories({
        maxAgeInDays: 365,
        preserveImportant: true
      });

      expect(result).toHaveProperty('cleaned');
      expect(result).toHaveProperty('compressed');
      expect(result).toHaveProperty('errors');

      expect(result.cleaned).toBeGreaterThan(0);
    });

    test('should compress large memories', async () => {
      const result = await memoryManager.cleanupMemories({
        compressionThreshold: 100
      });

      expect(result.compressed).toBeGreaterThan(0);
    });
  });

  describe('getSystemStats', () => {
    beforeEach(async () => {
      // Create multiple agent memories
      const agents = ['agent1', 'agent2', 'agent3'];

      for (const agentId of agents) {
        for (let i = 0; i < 5; i++) {
          await memoryManager.recordInteraction(agentId, {
            prompt: `Test for ${agentId} - ${i}`,
            response: `Response from ${agentId} - ${i}`,
            success: Math.random() > 0.3, // 70% success rate
            duration: 1000 + Math.random() * 500
          }, 'user1', 'session1');
        }

        await memoryManager.addKnowledge(agentId, {
          domain: `domain-${agentId}`,
          concept: 'test-concept',
          value: 'Test knowledge value',
          confidence: 0.8
        });
      }
    });

    test('should return comprehensive system statistics', async () => {
      const stats = await memoryManager.getSystemStats();

      expect(stats).toHaveProperty('totalAgentMemories');
      expect(stats).toHaveProperty('totalInteractions');
      expect(stats).toHaveProperty('averageSuccessRate');
      expect(stats).toHaveProperty('knowledgeDomains');
      expect(stats).toHaveProperty('topPerformingAgents');
      expect(stats).toHaveProperty('memoryDistribution');
      expect(stats).toHaveProperty('cacheStats');

      expect(stats.totalAgentMemories).toBeGreaterThan(0);
      expect(stats.totalInteractions).toBeGreaterThan(0);
      expect(stats.knowledgeDomains).toBeInstanceOf(Array);
      expect(stats.topPerformingAgents).toBeInstanceOf(Array);
      expect(stats.cacheStats.size).toBeLessThanOrEqual(stats.cacheStats.maxSize);
    });
  });

  describe('cache management', () => {
    test('should implement LRU cache behavior', async () => {
      // Fill cache beyond capacity
      const cacheSize = memoryManager.config.maxCacheSize;
      
      for (let i = 0; i < cacheSize + 2; i++) {
        await memoryManager.getAgentMemory(`agent-${i}`, 'user1', 'session1');
      }

      expect(memoryManager.memoryCache.size).toBeLessThanOrEqual(cacheSize);
      
      // First agent should have been evicted
      expect(memoryManager.memoryCache.has('agent-0:user1:session1')).toBe(false);
      
      // Last agents should still be in cache
      expect(memoryManager.memoryCache.has(`agent-${cacheSize + 1}:user1:session1`)).toBe(true);
    });
  });

  describe('error handling', () => {
    test('should handle memory operation errors gracefully', async () => {
      // Mock storage error
      const errorMessage = 'Storage operation failed';
      memoryManager.storageManager.create = jest.fn().mockRejectedValue(new Error(errorMessage));
      memoryManager.storageManager.update = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Operations should not throw but should log errors
      await expect(memoryManager.recordInteraction('error-agent', {
        prompt: 'Test',
        response: 'Test',
        success: true
      })).resolves.not.toThrow();

      await expect(memoryManager.addKnowledge('error-agent', {
        domain: 'test',
        concept: 'error',
        value: 'Error handling',
        confidence: 0.5
      })).rejects.toThrow(errorMessage);
    });
  });

  describe('close', () => {
    test('should save cached memories and close storage', async () => {
      // Create some cached memories
      await memoryManager.getAgentMemory('test-agent-1', 'user1', 'session1');
      await memoryManager.getAgentMemory('test-agent-2', 'user1', 'session1');

      const saveSpy = jest.spyOn(memoryManager, 'saveAgentMemory').mockResolvedValue();
      const storageSpy = jest.spyOn(memoryManager.storageManager, 'close').mockResolvedValue();

      await memoryManager.close();

      expect(saveSpy).toHaveBeenCalledTimes(2); // Should save all cached memories
      expect(storageSpy).toHaveBeenCalled();
      expect(memoryManager.memoryCache.size).toBe(0);
      expect(memoryManager.knowledgeGraph.size).toBe(0);
      expect(memoryManager.initialized).toBe(false);

      saveSpy.mockRestore();
      storageSpy.mockRestore();
    });
  });
});