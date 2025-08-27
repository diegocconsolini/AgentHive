/**
 * Test Data Factory
 * Provides consistent test data for all test suites
 */

export class TestDataFactory {
  static createContext(options = {}) {
    const defaults = {
      id: `context-${Date.now()}-${Math.random()}`,
      projectPath: '/test/project',
      conversationId: `conv-${Date.now()}`,
      agentId: `agent-${Math.random()}`,
      timestamp: new Date().toISOString(),
      content: 'Test context content',
      metadata: {
        source: 'test',
        priority: 'normal',
        tags: ['test', 'unit']
      },
      size: 1024,
      compressed: false
    };
    
    return { ...defaults, ...options };
  }
  
  static createAgentState(options = {}) {
    const defaults = {
      agentId: `agent-${Date.now()}-${Math.random()}`,
      capabilities: ['test-capability'],
      workload: {
        active: 0,
        pending: 0,
        completed: 0
      },
      performance: {
        avgResponseTime: 100,
        successRate: 1.0,
        memoryUsage: 50 * 1024 * 1024
      },
      status: 'active',
      lastActive: new Date().toISOString()
    };
    
    return { ...defaults, ...options };
  }
  
  static createLargeContext(sizeMB = 1) {
    const content = 'x'.repeat(sizeMB * 1024 * 1024);
    return this.createContext({
      content,
      size: content.length,
      metadata: {
        source: 'test-large',
        priority: 'low',
        tags: ['test', 'large', 'performance']
      }
    });
  }
  
  static createMultipleContexts(count = 10, options = {}) {
    return Array.from({ length: count }, (_, i) => 
      this.createContext({
        id: `context-batch-${i}-${Date.now()}`,
        content: `Test context content ${i}`,
        ...options
      })
    );
  }
  
  static createMultipleAgents(count = 5, options = {}) {
    return Array.from({ length: count }, (_, i) => 
      this.createAgentState({
        agentId: `agent-batch-${i}-${Date.now()}`,
        capabilities: [`capability-${i}`, 'shared-capability'],
        ...options
      })
    );
  }
  
  static createConflictScenario() {
    const contextId = `conflict-context-${Date.now()}`;
    return {
      contextId,
      agents: [
        this.createAgentState({ 
          agentId: 'agent-1',
          workload: { active: 1, pending: 0, completed: 5 }
        }),
        this.createAgentState({ 
          agentId: 'agent-2',
          workload: { active: 2, pending: 1, completed: 3 }
        })
      ],
      context: this.createContext({ 
        id: contextId,
        content: 'Conflicting context content'
      })
    };
  }
  
  static createPerformanceTestData(scale = 'medium') {
    const scales = {
      small: { contexts: 100, agents: 5, sizeMB: 10 },
      medium: { contexts: 1000, agents: 20, sizeMB: 50 },
      large: { contexts: 10000, agents: 100, sizeMB: 200 }
    };
    
    const config = scales[scale] || scales.medium;
    
    return {
      contexts: this.createMultipleContexts(config.contexts),
      agents: this.createMultipleAgents(config.agents),
      largeContexts: Array.from({ length: 5 }, () => 
        this.createLargeContext(config.sizeMB / 5)
      )
    };
  }
  
  static createCorruptedData() {
    return {
      invalidContext: {
        // Missing required fields
        content: 'Invalid context'
      },
      corruptedAgentState: {
        agentId: 'corrupt-agent',
        capabilities: null, // Invalid type
        workload: 'invalid' // Should be object
      },
      malformedJson: '{"invalid": json}',
      binaryData: Buffer.from('invalid binary context data')
    };
  }
  
  static createMigrationTestData() {
    return {
      legacyV1: {
        version: '1.0.0',
        context: 'Legacy context format',
        timestamp: Date.now()
      },
      legacyV2: {
        version: '2.0.0',
        contexts: [
          { id: 1, data: 'Legacy context 1' },
          { id: 2, data: 'Legacy context 2' }
        ]
      },
      currentV3: this.createContext({
        version: '3.0.0',
        content: 'Current format context'
      })
    };
  }
  
  static createConcurrencyTestData(concurrentOps = 10) {
    return {
      operations: Array.from({ length: concurrentOps }, (_, i) => ({
        type: i % 3 === 0 ? 'read' : i % 3 === 1 ? 'write' : 'delete',
        contextId: `concurrent-context-${i}`,
        agentId: `concurrent-agent-${i % 3}`,
        timestamp: Date.now() + i
      })),
      contexts: this.createMultipleContexts(concurrentOps),
      agents: this.createMultipleAgents(3)
    };
  }
}

// Export commonly used test data as constants
export const SAMPLE_CONTEXT = TestDataFactory.createContext();
export const SAMPLE_AGENT_STATE = TestDataFactory.createAgentState();
export const PERFORMANCE_TEST_DATA = TestDataFactory.createPerformanceTestData();
export const CONFLICT_SCENARIO = TestDataFactory.createConflictScenario();

export default TestDataFactory;