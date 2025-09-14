/**
 * Unit Tests for AgentState Model
 * Tests agent state management, capability tracking, and performance metrics
 */

const AgentState = require('../../../src/models/AgentState.js');
const { TestDataFactory } = require('../../fixtures/testData.js');

describe('AgentState Model', () => {
  describe('Creation and Validation', () => {
    test('should create valid agent state from data', () => {
      const stateData = TestDataFactory.createAgentState();
      const agentState = new AgentState(stateData);
      
      expect(agentState.agentId).toBe(stateData.agentId);
      expect(agentState.capabilities).toEqual(stateData.capabilities);
      expect(agentState.workload).toEqual(stateData.workload);
      expect(agentState.performance).toEqual(stateData.performance);
      expect(agentState.status).toBe(stateData.status);
    });
    
    test('should generate agent ID if not provided', () => {
      const stateData = { ...TestDataFactory.createAgentState() };
      delete stateData.agentId;
      
      const agentState = new AgentState(stateData);
      
      expect(agentState.agentId).toBeDefined();
      expect(typeof agentState.agentId).toBe('string');
      expect(agentState.agentId).toMatch(/^agent-/);
    });
    
    test('should initialize empty capabilities if not provided', () => {
      const stateData = { agentId: 'test-agent' };
      const agentState = new AgentState(stateData);
      
      expect(agentState.capabilities).toEqual([]);
    });
    
    test('should initialize default workload if not provided', () => {
      const stateData = { agentId: 'test-agent' };
      const agentState = new AgentState(stateData);
      
      expect(agentState.workload).toEqual({
        active: 0,
        pending: 0,
        completed: 0
      });
    });
    
    test('should validate required fields', () => {
      expect(() => new AgentState({})).not.toThrow(); // Should auto-generate ID
      
      const invalidCapabilities = {
        agentId: 'test-agent',
        capabilities: 'invalid' // Should be array
      };
      expect(() => new AgentState(invalidCapabilities)).toThrow('Capabilities must be an array');
    });
  });

  describe('Capability Management', () => {
    test('should add capabilities', () => {
      const agentState = new AgentState({ agentId: 'test-agent' });
      
      agentState.addCapability('new-capability');
      
      expect(agentState.capabilities).toContain('new-capability');
    });
    
    test('should not add duplicate capabilities', () => {
      const agentState = new AgentState({
        agentId: 'test-agent',
        capabilities: ['existing-capability']
      });
      
      agentState.addCapability('existing-capability');
      
      const capabilityCount = agentState.capabilities.filter(c => c === 'existing-capability').length;
      expect(capabilityCount).toBe(1);
    });
    
    test('should remove capabilities', () => {
      const agentState = new AgentState({
        agentId: 'test-agent',
        capabilities: ['cap1', 'cap2', 'cap3']
      });
      
      agentState.removeCapability('cap2');
      
      expect(agentState.capabilities).not.toContain('cap2');
      expect(agentState.capabilities).toContain('cap1');
      expect(agentState.capabilities).toContain('cap3');
    });
    
    test('should check if agent has capability', () => {
      const agentState = new AgentState({
        agentId: 'test-agent',
        capabilities: ['code-analysis', 'testing']
      });
      
      expect(agentState.hasCapability('code-analysis')).toBe(true);
      expect(agentState.hasCapability('testing')).toBe(true);
      expect(agentState.hasCapability('non-existent')).toBe(false);
    });
    
    test('should check multiple capabilities', () => {
      const agentState = new AgentState({
        agentId: 'test-agent',
        capabilities: ['code-analysis', 'testing', 'debugging']
      });
      
      expect(agentState.hasCapabilities(['code-analysis', 'testing'])).toBe(true);
      expect(agentState.hasCapabilities(['code-analysis', 'non-existent'])).toBe(false);
      expect(agentState.hasCapabilities([])).toBe(true); // Empty array should return true
    });
    
    test('should get capability score for workload assessment', () => {
      const agentState = new AgentState({
        agentId: 'test-agent',
        capabilities: ['code-analysis', 'testing'],
        workload: { active: 2, pending: 1, completed: 10 }
      });
      
      const score = agentState.getCapabilityScore('code-analysis');
      
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('Workload Management', () => {
    test('should update workload correctly', () => {
      const agentState = new AgentState({ agentId: 'test-agent' });
      
      agentState.incrementActive();
      agentState.incrementPending();
      
      expect(agentState.workload.active).toBe(1);
      expect(agentState.workload.pending).toBe(1);
      expect(agentState.workload.completed).toBe(0);
    });
    
    test('should move work from pending to active', () => {
      const agentState = new AgentState({
        agentId: 'test-agent',
        workload: { active: 1, pending: 2, completed: 5 }
      });
      
      agentState.startPendingWork();
      
      expect(agentState.workload.active).toBe(2);
      expect(agentState.workload.pending).toBe(1);
      expect(agentState.workload.completed).toBe(5);
    });
    
    test('should complete active work', () => {
      const agentState = new AgentState({
        agentId: 'test-agent',
        workload: { active: 2, pending: 1, completed: 5 }
      });
      
      agentState.completeWork();
      
      expect(agentState.workload.active).toBe(1);
      expect(agentState.workload.pending).toBe(1);
      expect(agentState.workload.completed).toBe(6);
    });
    
    test('should calculate workload utilization', () => {
      const agentState = new AgentState({
        agentId: 'test-agent',
        workload: { active: 3, pending: 2, completed: 10 }
      });
      
      const utilization = agentState.getWorkloadUtilization();
      
      expect(typeof utilization).toBe('number');
      expect(utilization).toBeGreaterThan(0);
      expect(utilization).toBeLessThanOrEqual(1);
    });
    
    test('should determine if agent is overloaded', () => {
      const lightAgent = new AgentState({
        agentId: 'light-agent',
        workload: { active: 1, pending: 0, completed: 5 }
      });
      
      const heavyAgent = new AgentState({
        agentId: 'heavy-agent',
        workload: { active: 10, pending: 5, completed: 2 }
      });
      
      expect(lightAgent.isOverloaded()).toBe(false);
      expect(heavyAgent.isOverloaded()).toBe(true);
    });
  });

  describe('Performance Tracking', () => {
    test('should update performance metrics', () => {
      const agentState = new AgentState({ agentId: 'test-agent' });
      
      agentState.updatePerformance({
        responseTime: 150,
        success: true,
        memoryUsage: 75 * 1024 * 1024 // 75MB
      });
      
      expect(agentState.performance.avgResponseTime).toBeDefined();
      expect(agentState.performance.successRate).toBeDefined();
      expect(agentState.performance.memoryUsage).toBe(75 * 1024 * 1024);
    });
    
    test('should calculate rolling averages for response time', () => {
      const agentState = new AgentState({ agentId: 'test-agent' });
      
      // Add multiple performance samples
      agentState.updatePerformance({ responseTime: 100, success: true });
      agentState.updatePerformance({ responseTime: 200, success: true });
      agentState.updatePerformance({ responseTime: 150, success: true });
      
      const avgResponseTime = agentState.performance.avgResponseTime;
      expect(avgResponseTime).toBeCloseTo(150, 0);
    });
    
    test('should track success rate correctly', () => {
      const agentState = new AgentState({ agentId: 'test-agent' });
      
      agentState.updatePerformance({ responseTime: 100, success: true });
      agentState.updatePerformance({ responseTime: 200, success: false });
      agentState.updatePerformance({ responseTime: 150, success: true });
      agentState.updatePerformance({ responseTime: 120, success: true });
      
      expect(agentState.performance.successRate).toBe(0.75); // 3/4 successful
    });
    
    test('should identify performance degradation', () => {
      const agentState = new AgentState({
        agentId: 'test-agent',
        performance: {
          avgResponseTime: 100,
          successRate: 0.95,
          memoryUsage: 50 * 1024 * 1024
        }
      });
      
      // Simulate performance degradation
      agentState.updatePerformance({ 
        responseTime: 500, 
        success: false,
        memoryUsage: 150 * 1024 * 1024 
      });
      
      expect(agentState.hasPerformanceDegraded()).toBe(true);
    });
    
    test('should calculate performance score', () => {
      const goodAgent = new AgentState({
        agentId: 'good-agent',
        performance: {
          avgResponseTime: 80,
          successRate: 0.98,
          memoryUsage: 30 * 1024 * 1024
        }
      });
      
      const poorAgent = new AgentState({
        agentId: 'poor-agent',
        performance: {
          avgResponseTime: 300,
          successRate: 0.75,
          memoryUsage: 200 * 1024 * 1024
        }
      });
      
      const goodScore = goodAgent.getPerformanceScore();
      const poorScore = poorAgent.getPerformanceScore();
      
      expect(goodScore).toBeGreaterThan(poorScore);
      expect(goodScore).toBeGreaterThan(0.8);
      expect(poorScore).toBeLessThan(0.6);
    });
  });

  describe('Status Management', () => {
    test('should update agent status', () => {
      const agentState = new AgentState({ agentId: 'test-agent' });
      
      agentState.setStatus('busy');
      expect(agentState.status).toBe('busy');
      
      agentState.setStatus('idle');
      expect(agentState.status).toBe('idle');
    });
    
    test('should track status history', () => {
      const agentState = new AgentState({ agentId: 'test-agent' });
      
      agentState.setStatus('busy');
      agentState.setStatus('idle');
      agentState.setStatus('error');
      
      const history = agentState.getStatusHistory();
      
      expect(history).toHaveLength(4); // Including initial status
      expect(history[1].status).toBe('busy');
      expect(history[2].status).toBe('idle');
      expect(history[3].status).toBe('error');
    });
    
    test('should validate status transitions', () => {
      const agentState = new AgentState({ agentId: 'test-agent' });
      
      expect(() => agentState.setStatus('invalid-status')).toThrow('Invalid status');
    });
    
    test('should determine if agent is available for work', () => {
      const availableAgent = new AgentState({
        agentId: 'available-agent',
        status: 'idle',
        workload: { active: 0, pending: 1, completed: 5 }
      });
      
      const busyAgent = new AgentState({
        agentId: 'busy-agent',
        status: 'busy',
        workload: { active: 5, pending: 3, completed: 10 }
      });
      
      expect(availableAgent.isAvailableForWork()).toBe(true);
      expect(busyAgent.isAvailableForWork()).toBe(false);
    });
  });

  describe('Health Monitoring', () => {
    test('should calculate overall health score', () => {
      const healthyAgent = new AgentState({
        agentId: 'healthy-agent',
        status: 'active',
        workload: { active: 2, pending: 1, completed: 20 },
        performance: {
          avgResponseTime: 90,
          successRate: 0.96,
          memoryUsage: 40 * 1024 * 1024
        }
      });
      
      const unhealthyAgent = new AgentState({
        agentId: 'unhealthy-agent',
        status: 'error',
        workload: { active: 10, pending: 8, completed: 5 },
        performance: {
          avgResponseTime: 400,
          successRate: 0.60,
          memoryUsage: 180 * 1024 * 1024
        }
      });
      
      const healthyScore = healthyAgent.getHealthScore();
      const unhealthyScore = unhealthyAgent.getHealthScore();
      
      expect(healthyScore).toBeGreaterThan(unhealthyScore);
      expect(healthyScore).toBeGreaterThan(0.7);
      expect(unhealthyScore).toBeLessThan(0.5);
    });
    
    test('should identify critical issues', () => {
      const agentState = new AgentState({
        agentId: 'problematic-agent',
        status: 'error',
        performance: {
          avgResponseTime: 1000,
          successRate: 0.3,
          memoryUsage: 500 * 1024 * 1024 // 500MB - very high
        }
      });
      
      const issues = agentState.getCriticalIssues();
      
      expect(issues).toContain('High response time');
      expect(issues).toContain('Low success rate');
      expect(issues).toContain('High memory usage');
    });
    
    test('should recommend actions for improvement', () => {
      const agentState = new AgentState({
        agentId: 'needs-improvement-agent',
        workload: { active: 8, pending: 5, completed: 2 },
        performance: {
          avgResponseTime: 250,
          successRate: 0.8,
          memoryUsage: 120 * 1024 * 1024
        }
      });
      
      const recommendations = agentState.getImprovementRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.includes('workload'))).toBe(true);
    });
  });

  describe('Serialization and Persistence', () => {
    test('should serialize to JSON correctly', () => {
      const agentState = new AgentState(TestDataFactory.createAgentState());
      
      const json = agentState.toJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.agentId).toBe(agentState.agentId);
      expect(parsed.capabilities).toEqual(agentState.capabilities);
      expect(parsed.workload).toEqual(agentState.workload);
      expect(parsed.performance).toEqual(agentState.performance);
    });
    
    test('should deserialize from JSON correctly', () => {
      const originalState = new AgentState(TestDataFactory.createAgentState());
      const json = originalState.toJSON();
      
      const deserializedState = AgentState.fromJSON(json);
      
      expect(deserializedState.agentId).toBe(originalState.agentId);
      expect(deserializedState.capabilities).toEqual(originalState.capabilities);
      expect(deserializedState.workload).toEqual(originalState.workload);
    });
    
    test('should create snapshot for backup', () => {
      const agentState = new AgentState(TestDataFactory.createAgentState());
      
      const snapshot = agentState.createSnapshot();
      
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.agentId).toBe(agentState.agentId);
      expect(snapshot.data).toBeDefined();
    });
    
    test('should restore from snapshot', () => {
      const originalState = new AgentState(TestDataFactory.createAgentState());
      const snapshot = originalState.createSnapshot();
      
      // Modify the state
      originalState.incrementActive();
      originalState.setStatus('busy');
      
      // Restore from snapshot
      originalState.restoreFromSnapshot(snapshot);
      
      expect(originalState.workload.active).toBe(snapshot.data.workload.active);
      expect(originalState.status).toBe(snapshot.data.status);
    });
  });

  describe('Performance Requirements', () => {
    test('should handle frequent updates efficiently', async () => {
      const agentState = new AgentState({ agentId: 'test-agent' });
      
      const { metrics } = await global.testUtils.measurePerformance(
        async () => {
          for (let i = 0; i < 1000; i++) {
            agentState.updatePerformance({
              responseTime: 100 + Math.random() * 100,
              success: Math.random() > 0.1,
              memoryUsage: 50 * 1024 * 1024 + Math.random() * 20 * 1024 * 1024
            });
          }
        },
        '1000 performance updates'
      );
      
      expect(metrics.duration).toBeLessThan(1000); // Less than 1 second
    });
    
    test('should maintain memory efficiency with large history', async () => {
      const agentState = new AgentState({ agentId: 'test-agent' });
      
      // Generate large amount of historical data
      for (let i = 0; i < 10000; i++) {
        agentState.setStatus(i % 2 === 0 ? 'active' : 'idle');
        agentState.updatePerformance({
          responseTime: Math.random() * 200,
          success: Math.random() > 0.1
        });
      }
      
      const memoryUsage = process.memoryUsage();
      expect(memoryUsage.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      
      // Should still perform efficiently
      const score = agentState.getHealthScore();
      expect(typeof score).toBe('number');
    });
  });
});