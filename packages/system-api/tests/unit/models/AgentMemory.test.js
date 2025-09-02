const AgentMemory = require('../../../src/models/AgentMemory');

describe('AgentMemory', () => {
  let agentMemory;

  beforeEach(() => {
    agentMemory = new AgentMemory({
      agentId: 'test-agent-1',
      userId: 'user-123',
      sessionId: 'session-456'
    });
  });

  describe('constructor', () => {
    test('should create new agent memory with required fields', () => {
      expect(agentMemory.agentId).toBe('test-agent-1');
      expect(agentMemory.userId).toBe('user-123');
      expect(agentMemory.sessionId).toBe('session-456');
      expect(agentMemory.id).toBeDefined();
      expect(agentMemory.created).toBeDefined();
      expect(agentMemory.interactions).toEqual([]);
      expect(agentMemory.knowledge).toEqual({});
      expect(agentMemory.performance).toEqual({
        successRate: 0,
        averageResponseTime: 0,
        totalInteractions: 0,
        errorCount: 0,
        improvementTrend: 'stable'
      });
    });

    test('should generate unique IDs for different instances', () => {
      const memory1 = new AgentMemory({ agentId: 'agent1' });
      const memory2 = new AgentMemory({ agentId: 'agent2' });
      
      expect(memory1.id).not.toBe(memory2.id);
    });
  });

  describe('addInteraction', () => {
    test('should add interaction successfully', () => {
      const interaction = {
        prompt: 'Test prompt',
        response: 'Test response',
        success: true,
        duration: 1500,
        tokens: 100
      };

      agentMemory.addInteraction(interaction);

      expect(agentMemory.interactions).toHaveLength(1);
      expect(agentMemory.interactions[0]).toMatchObject({
        prompt: 'Test prompt',
        response: 'Test response',
        success: true,
        duration: 1500,
        tokens: 100
      });
      expect(agentMemory.interactions[0].id).toBeDefined();
      expect(agentMemory.interactions[0].timestamp).toBeDefined();
    });

    test('should update performance metrics after adding interaction', () => {
      const interaction = {
        prompt: 'Test prompt',
        response: 'Test response',
        success: true,
        duration: 1000,
        tokens: 50
      };

      agentMemory.addInteraction(interaction);

      expect(agentMemory.performance.successRate).toBe(1);
      expect(agentMemory.performance.averageResponseTime).toBe(1000);
      expect(agentMemory.performance.totalInteractions).toBe(1);
      expect(agentMemory.performance.errorCount).toBe(0);
    });

    test('should limit interactions to 100 to prevent memory bloat', () => {
      // Add 150 interactions
      for (let i = 0; i < 150; i++) {
        agentMemory.addInteraction({
          prompt: `Test prompt ${i}`,
          response: `Test response ${i}`,
          success: true,
          duration: 1000
        });
      }

      expect(agentMemory.interactions).toHaveLength(100);
      // Should keep the last 100 interactions
      expect(agentMemory.interactions[0].prompt).toBe('Test prompt 50');
      expect(agentMemory.interactions[99].prompt).toBe('Test prompt 149');
    });

    test('should sanitize prompt and response to prevent sensitive data', () => {
      const longPrompt = 'x'.repeat(1000);
      const longResponse = 'y'.repeat(2000);

      agentMemory.addInteraction({
        prompt: longPrompt,
        response: longResponse,
        success: true
      });

      expect(agentMemory.interactions[0].prompt).toHaveLength(500);
      expect(agentMemory.interactions[0].response).toHaveLength(1000);
    });
  });

  describe('addKnowledge', () => {
    test('should add knowledge successfully', () => {
      const knowledge = {
        domain: 'javascript',
        concept: 'async-await',
        value: 'Async/await is a way to handle asynchronous operations',
        confidence: 0.8,
        tags: ['javascript', 'async', 'programming']
      };

      agentMemory.addKnowledge(knowledge);

      expect(agentMemory.knowledge.javascript).toBeDefined();
      expect(agentMemory.knowledge.javascript['async-await']).toMatchObject({
        value: 'Async/await is a way to handle asynchronous operations',
        confidence: 0.8,
        source: 'interaction',
        tags: ['javascript', 'async', 'programming']
      });
      expect(agentMemory.knowledge.javascript['async-await'].timestamp).toBeDefined();
    });

    test('should update knowledge graph when adding knowledge', () => {
      const knowledge = {
        domain: 'react',
        concept: 'hooks',
        value: 'React hooks allow functional components to use state',
        confidence: 0.9
      };

      agentMemory.addKnowledge(knowledge);

      expect(agentMemory.knowledgeGraph.concepts.react).toBeDefined();
      expect(agentMemory.knowledgeGraph.concepts.react).toHaveLength(1);
      expect(agentMemory.knowledgeGraph.concepts.react[0]).toMatchObject({
        concept: 'hooks',
        value: 'React hooks allow functional components to use state',
        confidence: 0.9,
        reinforcements: 1
      });
    });

    test('should reinforce existing knowledge when added again', () => {
      const knowledge = {
        domain: 'python',
        concept: 'list-comprehension',
        value: 'List comprehensions provide a concise way to create lists',
        confidence: 0.7
      };

      // Add same knowledge twice
      agentMemory.addKnowledge(knowledge);
      agentMemory.addKnowledge({...knowledge, confidence: 0.8});

      expect(agentMemory.knowledge.python['list-comprehension'].reinforcements).toBe(0);
      expect(agentMemory.knowledgeGraph.concepts.python[0].reinforcements).toBe(2);
      expect(agentMemory.knowledgeGraph.concepts.python[0].confidence).toBeGreaterThan(0.7);
    });
  });

  describe('recordFeedback', () => {
    beforeEach(() => {
      // Add an interaction first
      agentMemory.addInteraction({
        prompt: 'Test prompt',
        response: 'Test response',
        success: true,
        duration: 1000
      });
    });

    test('should record feedback for existing interaction', () => {
      const interactionId = agentMemory.interactions[0].id;
      const feedback = {
        interactionId,
        rating: 8,
        category: 'helpful',
        comments: 'Very useful response',
        helpful: true
      };

      agentMemory.recordFeedback(feedback);

      expect(agentMemory.interactions[0].feedback).toMatchObject({
        rating: 8,
        category: 'helpful',
        comments: 'Very useful response',
        helpful: true
      });
      expect(agentMemory.interactions[0].feedback.timestamp).toBeDefined();
    });

    test('should update learning adaptation score based on feedback', () => {
      const initialScore = agentMemory.learning.adaptationScore;
      const interactionId = agentMemory.interactions[0].id;

      agentMemory.recordFeedback({
        interactionId,
        rating: 9,
        helpful: true
      });

      expect(agentMemory.learning.adaptationScore).toBeGreaterThan(initialScore);
    });

    test('should decrease adaptation score for negative feedback', () => {
      const initialScore = agentMemory.learning.adaptationScore;
      const interactionId = agentMemory.interactions[0].id;

      agentMemory.recordFeedback({
        interactionId,
        rating: 2,
        helpful: false
      });

      expect(agentMemory.learning.adaptationScore).toBeLessThan(initialScore);
    });
  });

  describe('getRelevantMemories', () => {
    beforeEach(() => {
      // Add some interactions
      agentMemory.addInteraction({
        prompt: 'How to use React hooks?',
        response: 'React hooks allow you to use state in functional components',
        success: true,
        duration: 1000,
        tags: ['react', 'hooks']
      });

      agentMemory.addInteraction({
        prompt: 'What is async/await in JavaScript?',
        response: 'Async/await is syntactic sugar for promises',
        success: true,
        duration: 1200,
        tags: ['javascript', 'async']
      });

      agentMemory.addInteraction({
        prompt: 'How to center a div in CSS?',
        response: 'Use flexbox with justify-content and align-items center',
        success: false, // This should be filtered out
        duration: 800,
        tags: ['css', 'layout']
      });
    });

    test('should return relevant memories based on keywords', () => {
      const context = {
        keywords: ['react', 'components'],
        domain: 'development'
      };

      const relevantMemories = agentMemory.getRelevantMemories(context, 5);

      expect(relevantMemories.length).toBeGreaterThan(0);
      expect(relevantMemories[0].success).toBe(true); // Only successful interactions
      expect(relevantMemories[0].relevanceScore).toBeDefined();
      expect(relevantMemories[0].relevanceScore).toBeGreaterThan(0);
    });

    test('should limit results to specified limit', () => {
      const context = {
        keywords: ['javascript', 'react', 'css'],
        domain: 'development'
      };

      const relevantMemories = agentMemory.getRelevantMemories(context, 1);

      expect(relevantMemories).toHaveLength(1);
    });

    test('should filter out unsuccessful interactions', () => {
      const context = {
        keywords: ['css', 'center'],
        domain: 'development'
      };

      const relevantMemories = agentMemory.getRelevantMemories(context, 5);

      relevantMemories.forEach(memory => {
        expect(memory.success).toBe(true);
      });
    });
  });

  describe('getDomainExpertise', () => {
    beforeEach(() => {
      // Add interactions for JavaScript domain
      for (let i = 0; i < 15; i++) {
        agentMemory.addInteraction({
          prompt: `JavaScript question ${i}`,
          response: `JavaScript answer ${i}`,
          success: i < 12, // 12 out of 15 successful = 0.8 success rate
          duration: 1000,
          tags: ['javascript']
        });
      }
    });

    test('should calculate domain expertise correctly', () => {
      const expertise = agentMemory.getDomainExpertise('javascript');

      expect(expertise.level).toBe('intermediate'); // 15 interactions, 0.8 success rate
      expect(expertise.experience).toBe(15);
      expect(expertise.successRate).toBe(0.8);
      expect(expertise.avgResponseTime).toBe(1000);
      expect(expertise.confidence).toBeCloseTo(0.8, 1);
    });

    test('should return expert level for high performance agents', () => {
      // Add more successful interactions to reach expert level
      for (let i = 0; i < 40; i++) {
        agentMemory.addInteraction({
          prompt: `Expert JavaScript question ${i}`,
          response: `Expert JavaScript answer ${i}`,
          success: true,
          duration: 800,
          tags: ['javascript']
        });
      }

      const expertise = agentMemory.getDomainExpertise('javascript');

      expect(expertise.level).toBe('expert'); // >50 interactions, >0.9 success rate
      expect(expertise.confidence).toBeGreaterThan(0.9);
    });

    test('should return novice for unknown domain', () => {
      const expertise = agentMemory.getDomainExpertise('unknown-domain');

      expect(expertise.level).toBe('novice');
      expect(expertise.confidence).toBe(0);
      expect(expertise.experience).toBe(0);
    });
  });

  describe('getPerformanceTrends', () => {
    test('should return insufficient data for small datasets', () => {
      // Add only a few interactions
      for (let i = 0; i < 5; i++) {
        agentMemory.addInteraction({
          prompt: `Test ${i}`,
          response: `Response ${i}`,
          success: true,
          duration: 1000
        });
      }

      const trends = agentMemory.getPerformanceTrends();

      expect(trends.trend).toBe('insufficient_data');
      expect(trends.confidence).toBe(0);
    });

    test('should detect improving trend', () => {
      // Add older interactions with lower success rate
      for (let i = 0; i < 20; i++) {
        agentMemory.addInteraction({
          prompt: `Old test ${i}`,
          response: `Old response ${i}`,
          success: i > 10, // 50% success rate for older
          duration: 2000
        });
      }

      // Add recent interactions with higher success rate
      for (let i = 0; i < 20; i++) {
        agentMemory.addInteraction({
          prompt: `Recent test ${i}`,
          response: `Recent response ${i}`,
          success: i > 2, // 90% success rate for recent
          duration: 1000 // Also faster
        });
      }

      const trends = agentMemory.getPerformanceTrends();

      expect(trends.trend).toBe('improving');
      expect(trends.confidence).toBeGreaterThan(0.5);
      expect(trends.recentSuccessRate).toBeGreaterThan(trends.comparison.successChange);
    });
  });

  describe('compressMemories', () => {
    beforeEach(() => {
      // Add many interactions to trigger compression
      for (let i = 0; i < 150; i++) {
        agentMemory.addInteraction({
          prompt: `Test prompt ${i}`,
          response: `Test response ${i}`,
          success: i % 3 !== 0, // 67% success rate
          duration: 1000 + i * 10,
          tags: i < 50 ? ['old'] : ['recent']
        });
      }
    });

    test('should compress memories while preserving important ones', () => {
      const initialCount = agentMemory.interactions.length;
      
      agentMemory.compressMemories({
        keepRecentCount: 30,
        compressionThreshold: 100
      });

      expect(agentMemory.interactions.length).toBeLessThan(initialCount);
      expect(agentMemory.interactions.length).toBeGreaterThan(30);
      
      // Should keep the most recent ones
      const recentInteractions = agentMemory.interactions.slice(-30);
      recentInteractions.forEach(interaction => {
        expect(parseInt(interaction.prompt.split(' ')[2])).toBeGreaterThan(119);
      });
    });

    test('should not compress if under threshold', () => {
      const smallMemory = new AgentMemory({ agentId: 'small-test' });
      
      for (let i = 0; i < 50; i++) {
        smallMemory.addInteraction({
          prompt: `Small test ${i}`,
          response: `Small response ${i}`,
          success: true,
          duration: 1000
        });
      }

      const initialCount = smallMemory.interactions.length;
      smallMemory.compressMemories({ compressionThreshold: 100 });

      expect(smallMemory.interactions.length).toBe(initialCount);
    });
  });

  describe('export and serialization', () => {
    beforeEach(() => {
      agentMemory.addInteraction({
        prompt: 'Test export',
        response: 'Test response',
        success: true,
        duration: 1000
      });

      agentMemory.addKnowledge({
        domain: 'testing',
        concept: 'export',
        value: 'Export functionality works',
        confidence: 0.9
      });
    });

    test('should export complete memory data', () => {
      const exported = agentMemory.export();

      expect(exported).toHaveProperty('id');
      expect(exported).toHaveProperty('agentId', 'test-agent-1');
      expect(exported).toHaveProperty('userId', 'user-123');
      expect(exported).toHaveProperty('sessionId', 'session-456');
      expect(exported).toHaveProperty('interactions');
      expect(exported).toHaveProperty('knowledge');
      expect(exported).toHaveProperty('performance');
      expect(exported).toHaveProperty('knowledgeGraph');
      expect(exported).toHaveProperty('learning');

      expect(exported.interactions).toHaveLength(1);
      expect(exported.knowledge.testing).toBeDefined();
    });

    test('should create new memory from exported data', () => {
      const exported = agentMemory.export();
      const importedMemory = new AgentMemory(exported);

      expect(importedMemory.agentId).toBe(agentMemory.agentId);
      expect(importedMemory.interactions).toHaveLength(agentMemory.interactions.length);
      expect(importedMemory.knowledge).toEqual(agentMemory.knowledge);
      expect(importedMemory.performance).toEqual(agentMemory.performance);
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      // Add various interactions and knowledge
      for (let i = 0; i < 10; i++) {
        agentMemory.addInteraction({
          prompt: `Test ${i}`,
          response: `Response ${i}`,
          success: i > 2, // 7 out of 10 successful
          duration: 1000 + i * 100
        });
      }

      agentMemory.addKnowledge({
        domain: 'javascript',
        concept: 'arrays',
        value: 'Arrays are ordered collections',
        confidence: 0.8
      });

      agentMemory.addKnowledge({
        domain: 'react',
        concept: 'components',
        value: 'Components are reusable UI elements',
        confidence: 0.9
      });
    });

    test('should return comprehensive memory statistics', () => {
      const stats = agentMemory.getStats();

      expect(stats).toHaveProperty('totalInteractions', 10);
      expect(stats).toHaveProperty('successfulInteractions', 7);
      expect(stats).toHaveProperty('successRate', 0.7);
      expect(stats).toHaveProperty('knowledgeDomains', 2);
      expect(stats).toHaveProperty('knowledgeConcepts', 2);
      expect(stats).toHaveProperty('memoryAge');
      expect(stats).toHaveProperty('lastAccessed');
      expect(stats).toHaveProperty('patterns');
      expect(stats).toHaveProperty('adaptationScore');

      expect(stats.memoryAge).toBeGreaterThanOrEqual(0);
      expect(stats.adaptationScore).toBe(0.5); // Default value
    });
  });
});