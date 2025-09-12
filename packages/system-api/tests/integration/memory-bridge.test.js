/**
 * Integration Tests - SmartMemoryIndex Bridge
 * Tests the integration between AgentOrchestrator and SmartMemoryIndex
 */

const { beforeAll, afterAll, beforeEach, describe, it, expect } = require('@jest/globals');
const AgentOrchestrator = require('../../src/orchestration/AgentOrchestrator');
const SmartMemoryIndex = require('../../src/memory/SmartMemoryIndex');
const AgentMemoryManager = require('../../src/agents/AgentMemoryManager');
const MemoryTransformer = require('../../src/memory/MemoryTransformer');
const { AIProviderService } = require('../../ai-providers');

describe('SmartMemoryIndex Integration Bridge', () => {
  let orchestrator;
  let mockAIService;
  let smartMemoryIndex;
  let memoryManager;
  
  beforeAll(async () => {
    // Create mock AI service
    mockAIService = {
      executeRequest: jest.fn().mockResolvedValue({
        output: 'Mock agent response for testing',
        success: true,
        duration: 1500,
        tokens: 150
      }),
      isAvailable: jest.fn().mockReturnValue(true)
    };
  });

  beforeEach(async () => {
    // Initialize fresh instances for each test
    orchestrator = new AgentOrchestrator(mockAIService);
    smartMemoryIndex = orchestrator.smartMemoryIndex;
    memoryManager = orchestrator.memoryManager;
    
    // Initialize orchestrator (which initializes both memory systems)
    await orchestrator._ensureMemoryManagerInitialized();
    
    // Verify both memory systems are initialized
    expect(memoryManager.initialized).toBe(true);
    expect(smartMemoryIndex.initialized).toBe(true);
  });

  afterEach(async () => {
    // Cleanup after each test
    if (orchestrator) {
      if (memoryManager && memoryManager.close) {
        await memoryManager.close();
      }
      if (smartMemoryIndex && smartMemoryIndex.cleanup) {
        await smartMemoryIndex.cleanup();
      }
    }
  });

  describe('Bridge Integration', () => {
    it('should create SmartMemoryIndex memory when agent executes', async () => {
      // Get initial memory count
      const initialAnalytics = await smartMemoryIndex.getAnalytics();
      const initialCount = initialAnalytics.totalMemories;
      
      // Create mock selected agent
      const selectedAgent = {
        id: 'test-agent-bridge',
        type: 'general-purpose',
        category: 'testing',
        specialization: ['integration-testing']
      };
      
      // Create mock interaction
      const prompt = 'Test integration bridge between AgentOrchestrator and SmartMemoryIndex';
      const result = {
        output: 'Successfully tested the integration bridge functionality',
        success: true,
        duration: 1234,
        tokens: 200,
        contextUsed: 'test-context-id'
      };
      
      // Execute recordAgentInteraction (this should trigger the bridge)
      await orchestrator.recordAgentInteraction(selectedAgent, prompt, result, 'test-user-123', 'test-session-456');
      
      // Verify memory was created in SmartMemoryIndex
      const finalAnalytics = await smartMemoryIndex.getAnalytics();
      const finalCount = finalAnalytics.totalMemories;
      
      expect(finalCount).toBe(initialCount + 1);
      
      // Search for the created memory
      const searchResults = await smartMemoryIndex.searchMemories('integration bridge', {
        limit: 5,
        minSimilarity: 0.3
      });
      
      expect(searchResults.results.length).toBeGreaterThan(0);
      
      // Verify memory content
      const bridgedMemory = searchResults.results[0].memory;
      expect(bridgedMemory.agentId).toBe('test-agent-bridge');
      expect(bridgedMemory.userId).toBe('test-user-123');
      expect(bridgedMemory.sessionId).toBe('test-session-456');
      expect(bridgedMemory.interactions).toHaveLength(1);
      expect(bridgedMemory.interactions[0].outcome).toBe('success');
      expect(bridgedMemory.interactions[0].duration).toBe(1234);
    });

    it('should handle SmartMemoryIndex failures gracefully', async () => {
      // Mock SmartMemoryIndex to throw error
      const originalAddMemory = smartMemoryIndex.addMemory;
      smartMemoryIndex.addMemory = jest.fn().mockRejectedValue(new Error('SmartMemoryIndex test failure'));
      
      const selectedAgent = {
        id: 'test-agent-graceful',
        type: 'general-purpose'
      };
      
      const prompt = 'Test graceful failure handling';
      const result = {
        output: 'This should still work even if SmartMemoryIndex fails',
        success: true,
        duration: 1000,
        tokens: 100
      };
      
      // This should not throw an error despite SmartMemoryIndex failure
      await expect(
        orchestrator.recordAgentInteraction(selectedAgent, prompt, result, 'test-user', 'test-session')
      ).resolves.not.toThrow();
      
      // Verify SmartMemoryIndex.addMemory was called and failed
      expect(smartMemoryIndex.addMemory).toHaveBeenCalled();
      
      // Restore original method
      smartMemoryIndex.addMemory = originalAddMemory;
    });

    it('should bridge memory with correct data transformation', async () => {
      const selectedAgent = {
        id: 'python-pro',
        type: 'python-specialist',
        category: 'development',
        specialization: ['python', 'backend', 'api-development']
      };
      
      const prompt = 'Create a Python API endpoint for user authentication';
      const result = {
        output: 'Created FastAPI endpoint with JWT authentication and password hashing',
        success: true,
        duration: 3500,
        tokens: 450,
        contextUsed: 'python-api-context'
      };
      
      await orchestrator.recordAgentInteraction(selectedAgent, prompt, result, 'developer-user', 'api-session');
      
      // Search for the created memory
      const searchResults = await smartMemoryIndex.searchMemories('python API authentication', {
        limit: 1,
        minSimilarity: 0.1
      });
      
      expect(searchResults.results).toHaveLength(1);
      
      const memory = searchResults.results[0].memory;
      
      // Verify knowledge extraction
      expect(memory.knowledge).toBeDefined();
      expect(memory.knowledge.concepts).toContain('development');
      expect(memory.knowledge.expertise.domain).toBe('development');
      expect(memory.knowledge.expertise.taskType).toBeDefined();
      
      // Verify pattern analysis
      expect(memory.patterns).toBeDefined();
      expect(memory.patterns.userPreferences).toBeDefined();
      expect(memory.patterns.successFactors).toContain('detailed_response');
      
      // Verify performance metrics
      expect(memory.performance).toBeDefined();
      expect(memory.performance.responseTime).toBe(3500);
      expect(memory.performance.successRate).toBe(1.0);
      expect(memory.performance.tokenUsage).toBe(450);
    });

    it('should enhance prompt retrieval with SmartMemoryIndex', async () => {
      // First, create some memory data
      const selectedAgent = {
        id: 'frontend-developer',
        type: 'react-specialist',
        category: 'frontend'
      };
      
      // Create initial interaction
      await orchestrator.recordAgentInteraction(
        selectedAgent,
        'Build a React component with TypeScript',
        {
          output: 'Created TypeScript React component with proper types',
          success: true,
          duration: 2000,
          tokens: 300
        },
        'frontend-dev',
        'react-session'
      );
      
      // Test memory retrieval
      const memoryContext = {
        keywords: ['React', 'TypeScript', 'component'],
        domain: 'interaction',
        context: 'React development'
      };
      
      const relevantMemories = await orchestrator._getRelevantSystemMemories(memoryContext, 3);
      
      expect(relevantMemories).toBeDefined();
      expect(Array.isArray(relevantMemories)).toBe(true);
      
      if (relevantMemories.length > 0) {
        const memory = relevantMemories[0];
        expect(memory).toHaveProperty('content');
        expect(memory).toHaveProperty('relevance');
        expect(memory).toHaveProperty('agentId');
        expect(memory).toHaveProperty('timestamp');
        expect(memory.relevance).toBeGreaterThan(0);
      }
    });
  });

  describe('Memory Transformation', () => {
    it('should correctly transform AgentMemory to SmartMemoryIndex format', () => {
      const agentMemoryData = {
        agentId: 'test-transformer',
        userId: 'transform-user',
        sessionId: 'transform-session',
        interactions: [
          {
            timestamp: new Date().toISOString(),
            prompt: 'Test memory transformation',
            response: 'This is a test response for transformation',
            success: true,
            duration: 1500,
            tokens: 100,
            contextId: 'transform-context',
            feedback: null,
            tags: ['transformation', 'test']
          }
        ]
      };
      
      const transformed = MemoryTransformer.agentMemoryToSmartMemoryIndex(agentMemoryData);
      
      expect(transformed).toHaveProperty('agentId', 'test-transformer');
      expect(transformed).toHaveProperty('userId', 'transform-user');
      expect(transformed).toHaveProperty('sessionId', 'transform-session');
      
      expect(transformed.interactions).toHaveLength(1);
      expect(transformed.interactions[0]).toHaveProperty('timestamp');
      expect(transformed.interactions[0]).toHaveProperty('summary');
      expect(transformed.interactions[0]).toHaveProperty('outcome', 'success');
      expect(transformed.interactions[0]).toHaveProperty('duration', 1500);
      
      expect(transformed).toHaveProperty('knowledge');
      expect(transformed.knowledge).toHaveProperty('concepts');
      expect(transformed.knowledge).toHaveProperty('expertise');
      
      expect(transformed).toHaveProperty('patterns');
      expect(transformed.patterns).toHaveProperty('userPreferences');
      expect(transformed.patterns).toHaveProperty('successFactors');
      
      expect(transformed).toHaveProperty('performance');
      expect(transformed.performance).toHaveProperty('responseTime');
      expect(transformed.performance).toHaveProperty('successRate');
      expect(transformed.performance).toHaveProperty('tokenUsage');
    });

    it('should extract concepts correctly from interactions', () => {
      const interactions = [
        {
          prompt: 'Build a React component with testing',
          response: 'Created component with Jest tests'
        },
        {
          prompt: 'Debug the API connection error',
          response: 'Fixed the authentication issue'
        },
        {
          prompt: 'Design the database schema',
          response: 'Created normalized schema with relationships'
        }
      ];
      
      const concepts = MemoryTransformer.extractConceptsFromInteractions(interactions);
      
      expect(concepts).toContain('development'); // from "build"
      expect(concepts).toContain('testing'); // from "testing"
      expect(concepts).toContain('troubleshooting'); // from "debug", "error"
      expect(concepts).toContain('design'); // from "design"
    });

    it('should calculate performance metrics correctly', () => {
      const interactions = [
        { duration: 1000, success: true, tokens: 100 },
        { duration: 2000, success: true, tokens: 200 },
        { duration: 1500, success: false, tokens: 150 },
        { duration: 3000, success: true, tokens: 300 }
      ];
      
      const avgResponseTime = MemoryTransformer.calculateAverageResponseTime(interactions);
      const successRate = MemoryTransformer.calculateSuccessRate(interactions);
      const totalTokens = MemoryTransformer.calculateTotalTokens(interactions);
      
      expect(avgResponseTime).toBe(1875); // (1000+2000+1500+3000)/4
      expect(successRate).toBe(0.75); // 3 success out of 4
      expect(totalTokens).toBe(750); // 100+200+150+300
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle agent interaction with minimal data', async () => {
      const selectedAgent = { id: 'minimal-agent' };
      const prompt = 'Minimal test';
      const result = { output: 'OK', success: true };
      
      await expect(
        orchestrator.recordAgentInteraction(selectedAgent, prompt, result)
      ).resolves.not.toThrow();
    });

    it('should handle failed interactions correctly', async () => {
      const selectedAgent = {
        id: 'failure-test-agent',
        type: 'test-agent'
      };
      
      const prompt = 'This interaction will fail';
      const result = {
        output: null,
        error: 'Test failure',
        success: false,
        duration: 500
      };
      
      await orchestrator.recordAgentInteraction(selectedAgent, prompt, result, 'test-user', 'fail-session');
      
      // Search for the failed interaction
      const searchResults = await smartMemoryIndex.searchMemories('interaction will fail', {
        limit: 1,
        minSimilarity: 0.1
      });
      
      if (searchResults.results.length > 0) {
        const memory = searchResults.results[0].memory;
        expect(memory.interactions[0].outcome).toBe('failure');
        expect(memory.performance.successRate).toBe(0.0);
        expect(memory.patterns.successFactors).toHaveLength(0);
      }
    });

    it('should handle SmartMemoryIndex not initialized', async () => {
      // Create new orchestrator without initializing SmartMemoryIndex
      const uninitializedOrchestrator = new AgentOrchestrator(mockAIService);
      uninitializedOrchestrator.smartMemoryIndex.initialized = false;
      
      const selectedAgent = { id: 'uninitialized-test' };
      const prompt = 'Test uninitialized SmartMemoryIndex';
      const result = { output: 'Should still work', success: true };
      
      await expect(
        uninitializedOrchestrator.recordAgentInteraction(selectedAgent, prompt, result)
      ).resolves.not.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent memory operations', async () => {
      const concurrentOperations = [];
      
      for (let i = 0; i < 5; i++) {
        const selectedAgent = {
          id: `concurrent-agent-${i}`,
          type: 'test-agent',
          category: 'testing'
        };
        
        const operation = orchestrator.recordAgentInteraction(
          selectedAgent,
          `Concurrent test operation ${i}`,
          {
            output: `Result for operation ${i}`,
            success: true,
            duration: Math.random() * 2000 + 500,
            tokens: Math.floor(Math.random() * 200) + 50
          },
          'concurrent-user',
          'concurrent-session'
        );
        
        concurrentOperations.push(operation);
      }
      
      await expect(Promise.all(concurrentOperations)).resolves.not.toThrow();
      
      // Verify all memories were created
      const analytics = await smartMemoryIndex.getAnalytics();
      expect(analytics.totalMemories).toBeGreaterThanOrEqual(5);
    });
  });
});