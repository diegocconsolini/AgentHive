/**
 * Integration Tests for Agent Coordination
 * Tests multi-agent scenarios, conflict resolution, and coordination protocols
 */

import { AgentRegistry } from '../../src/agents/AgentRegistry.js';
import { AgentCapabilityManager } from '../../src/agents/AgentCapabilityManager.js';
import { LoadBalancer } from '../../src/agents/LoadBalancer.js';
import { StorageManager } from '../../src/storage/StorageManager.js';
import { TestDataFactory, CONFLICT_SCENARIO } from '../fixtures/testData.js';
import { MockStorageManager, MockAgentRegistry, waitForEvent } from '../utils/testHelpers.js';

describe('Agent Coordination Integration Tests', () => {
  let agentRegistry;
  let capabilityManager;
  let loadBalancer;
  let storageManager;
  
  beforeEach(async () => {
    storageManager = new StorageManager({
      storage: { type: 'memory' },
      cache: { maxSize: 50 }
    });
    
    agentRegistry = new AgentRegistry();
    capabilityManager = new AgentCapabilityManager(agentRegistry);
    loadBalancer = new LoadBalancer(agentRegistry, capabilityManager);
    
    await agentRegistry.initialize();
    await capabilityManager.initialize();
    await loadBalancer.initialize();
  });
  
  afterEach(async () => {
    await agentRegistry.shutdown();
    await capabilityManager.shutdown();
    await loadBalancer.shutdown();
    await storageManager.close();
  });

  describe('Multi-Agent Registration and Discovery', () => {
    test('should register multiple agents with different capabilities', async () => {
      const agents = TestDataFactory.createMultipleAgents(5, {
        capabilities: ['code-analysis', 'testing']
      });
      
      const registrationPromises = agents.map(agent => 
        agentRegistry.registerAgent(agent)
      );
      
      const registeredIds = await Promise.all(registrationPromises);
      
      expect(registeredIds).toHaveLength(5);
      registeredIds.forEach(id => expect(typeof id).toBe('string'));
      
      const allAgents = await agentRegistry.getAllAgents();
      expect(allAgents).toHaveLength(5);
    });
    
    test('should discover agents by capabilities', async () => {
      const codeAnalysisAgent = TestDataFactory.createAgentState({
        capabilities: ['code-analysis', 'debugging']
      });
      const testingAgent = TestDataFactory.createAgentState({
        capabilities: ['testing', 'performance-analysis']
      });
      const fullStackAgent = TestDataFactory.createAgentState({
        capabilities: ['code-analysis', 'testing', 'debugging']
      });
      
      await agentRegistry.registerAgent(codeAnalysisAgent);
      await agentRegistry.registerAgent(testingAgent);
      await agentRegistry.registerAgent(fullStackAgent);
      
      const codeAgents = await capabilityManager.findAgentsByCapability('code-analysis');
      const testAgents = await capabilityManager.findAgentsByCapability('testing');
      
      expect(codeAgents).toHaveLength(2);
      expect(testAgents).toHaveLength(2);
      
      const codeAgentIds = codeAgents.map(a => a.agentId);
      expect(codeAgentIds).toContain(codeAnalysisAgent.agentId);
      expect(codeAgentIds).toContain(fullStackAgent.agentId);
    });
    
    test('should handle agent deregistration correctly', async () => {
      const agents = TestDataFactory.createMultipleAgents(3);
      
      for (const agent of agents) {
        await agentRegistry.registerAgent(agent);
      }
      
      await agentRegistry.unregisterAgent(agents[1].agentId);
      
      const remainingAgents = await agentRegistry.getAllAgents();
      expect(remainingAgents).toHaveLength(2);
      
      const remainingIds = remainingAgents.map(a => a.agentId);
      expect(remainingIds).not.toContain(agents[1].agentId);
    });
  });

  describe('Work Distribution and Load Balancing', () => {
    test('should distribute work evenly across agents', async () => {
      const agents = TestDataFactory.createMultipleAgents(3, {
        capabilities: ['task-processing']
      });
      
      for (const agent of agents) {
        await agentRegistry.registerAgent(agent);
      }
      
      const workItems = Array.from({ length: 9 }, (_, i) => ({
        id: `work-${i}`,
        type: 'task-processing',
        priority: 'normal'
      }));
      
      const assignments = [];
      for (const workItem of workItems) {
        const assignment = await loadBalancer.assignWork(workItem);
        assignments.push(assignment);
      }
      
      // Check that work is distributed evenly
      const workDistribution = assignments.reduce((dist, assignment) => {
        dist[assignment.agentId] = (dist[assignment.agentId] || 0) + 1;
        return dist;
      }, {});
      
      const workCounts = Object.values(workDistribution);
      expect(Math.max(...workCounts) - Math.min(...workCounts)).toBeLessThanOrEqual(1);
    });
    
    test('should consider agent performance in load balancing', async () => {
      const fastAgent = TestDataFactory.createAgentState({
        capabilities: ['processing'],
        performance: {
          avgResponseTime: 50,
          successRate: 0.98,
          memoryUsage: 30 * 1024 * 1024
        }
      });
      
      const slowAgent = TestDataFactory.createAgentState({
        capabilities: ['processing'],
        performance: {
          avgResponseTime: 300,
          successRate: 0.85,
          memoryUsage: 100 * 1024 * 1024
        }
      });
      
      await agentRegistry.registerAgent(fastAgent);
      await agentRegistry.registerAgent(slowAgent);
      
      const workItems = Array.from({ length: 10 }, (_, i) => ({
        id: `work-${i}`,
        type: 'processing',
        priority: 'high'
      }));
      
      const assignments = await Promise.all(
        workItems.map(work => loadBalancer.assignWork(work))
      );
      
      const fastAgentWork = assignments.filter(a => a.agentId === fastAgent.agentId).length;
      const slowAgentWork = assignments.filter(a => a.agentId === slowAgent.agentId).length;
      
      // Fast agent should get more work
      expect(fastAgentWork).toBeGreaterThan(slowAgentWork);
    });
    
    test('should handle agent overload gracefully', async () => {
      const normalAgent = TestDataFactory.createAgentState({
        capabilities: ['processing'],
        workload: { active: 2, pending: 1, completed: 10 }
      });
      
      const overloadedAgent = TestDataFactory.createAgentState({
        capabilities: ['processing'],
        workload: { active: 10, pending: 5, completed: 3 }
      });
      
      await agentRegistry.registerAgent(normalAgent);
      await agentRegistry.registerAgent(overloadedAgent);
      
      const workItem = {
        id: 'urgent-work',
        type: 'processing',
        priority: 'high'
      };
      
      const assignment = await loadBalancer.assignWork(workItem);
      
      // Should assign to the normal agent, not overloaded one
      expect(assignment.agentId).toBe(normalAgent.agentId);
    });
  });

  describe('Conflict Detection and Resolution', () => {
    test('should detect resource conflicts between agents', async () => {
      const { agents, context } = CONFLICT_SCENARIO;
      
      for (const agent of agents) {
        await agentRegistry.registerAgent(agent);
      }
      
      await storageManager.save(context);
      
      // Both agents try to access the same context
      const conflicts = await Promise.all([
        capabilityManager.requestResource(agents[0].agentId, {
          type: 'context',
          id: context.id,
          access: 'write'
        }),
        capabilityManager.requestResource(agents[1].agentId, {
          type: 'context',
          id: context.id,
          access: 'write'
        })
      ]);
      
      const conflictDetected = conflicts.some(result => result.conflict === true);
      expect(conflictDetected).toBe(true);
    });
    
    test('should resolve conflicts using priority-based resolution', async () => {
      const highPriorityAgent = TestDataFactory.createAgentState({
        agentId: 'high-priority-agent',
        capabilities: ['critical-processing'],
        priority: 10
      });
      
      const lowPriorityAgent = TestDataFactory.createAgentState({
        agentId: 'low-priority-agent',
        capabilities: ['standard-processing'],
        priority: 5
      });
      
      await agentRegistry.registerAgent(highPriorityAgent);
      await agentRegistry.registerAgent(lowPriorityAgent);
      
      const sharedResource = {
        id: 'shared-resource',
        type: 'computation',
        maxConcurrent: 1
      };
      
      const [highPriorityResult, lowPriorityResult] = await Promise.all([
        capabilityManager.requestResource(highPriorityAgent.agentId, sharedResource),
        capabilityManager.requestResource(lowPriorityAgent.agentId, sharedResource)
      ]);
      
      expect(highPriorityResult.granted).toBe(true);
      expect(lowPriorityResult.granted).toBe(false);
      expect(lowPriorityResult.queued).toBe(true);
    });
    
    test('should handle deadlock detection and resolution', async () => {
      const agent1 = TestDataFactory.createAgentState({ agentId: 'agent-1' });
      const agent2 = TestDataFactory.createAgentState({ agentId: 'agent-2' });
      
      await agentRegistry.registerAgent(agent1);
      await agentRegistry.registerAgent(agent2);
      
      const resource1 = { id: 'resource-1', type: 'data' };
      const resource2 = { id: 'resource-2', type: 'data' };
      
      // Agent 1 requests resource 1, agent 2 requests resource 2
      await capabilityManager.requestResource('agent-1', resource1);
      await capabilityManager.requestResource('agent-2', resource2);
      
      // Now create potential deadlock: agent 1 wants resource 2, agent 2 wants resource 1
      const deadlockPromises = Promise.all([
        capabilityManager.requestResource('agent-1', resource2),
        capabilityManager.requestResource('agent-2', resource1)
      ]);
      
      // Should resolve within reasonable time (not hang)
      await expect(deadlockPromises).resolves.toBeDefined();
      
      // Should detect and log deadlock
      const deadlockEvents = await capabilityManager.getDeadlockEvents();
      expect(deadlockEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Sharing and Synchronization', () => {
    test('should share context data between agents', async () => {
      const producer = TestDataFactory.createAgentState({
        agentId: 'producer-agent',
        capabilities: ['data-generation']
      });
      
      const consumer = TestDataFactory.createAgentState({
        agentId: 'consumer-agent',
        capabilities: ['data-processing']
      });
      
      await agentRegistry.registerAgent(producer);
      await agentRegistry.registerAgent(consumer);
      
      // Producer creates context
      const context = TestDataFactory.createContext({
        agentId: producer.agentId,
        content: 'Shared data for processing'
      });
      
      await storageManager.save(context);
      
      // Consumer accesses shared context
      const sharedContext = await storageManager.load(context.id);
      
      expect(sharedContext).not.toBeNull();
      expect(sharedContext.content).toBe(context.content);
      
      // Both agents should be able to access it
      const producerAccess = await capabilityManager.verifyAccess(producer.agentId, context.id);
      const consumerAccess = await capabilityManager.verifyAccess(consumer.agentId, context.id);
      
      expect(producerAccess).toBe(true);
      expect(consumerAccess).toBe(true);
    });
    
    test('should synchronize context updates across agents', async () => {
      const agents = TestDataFactory.createMultipleAgents(3);
      
      for (const agent of agents) {
        await agentRegistry.registerAgent(agent);
      }
      
      const sharedContext = TestDataFactory.createContext({
        content: 'Initial shared content'
      });
      
      await storageManager.save(sharedContext);
      
      // Simulate concurrent updates
      const updatePromises = agents.map(async (agent, index) => {
        const updatedContent = `Updated by ${agent.agentId} - version ${index}`;
        const updatedContext = { ...sharedContext, content: updatedContent };
        
        return storageManager.save(updatedContext);
      });
      
      await Promise.all(updatePromises);
      
      // Final context should have one of the updates
      const finalContext = await storageManager.load(sharedContext.id);
      expect(finalContext.content).not.toBe('Initial shared content');
      expect(finalContext.content).toMatch(/Updated by agent-batch-\d+-\d+ - version \d/);
    });
    
    test('should handle concurrent memory access safely', async () => {
      const agents = TestDataFactory.createMultipleAgents(5);
      
      for (const agent of agents) {
        await agentRegistry.registerAgent(agent);
      }
      
      const contexts = TestDataFactory.createMultipleContexts(20);
      
      // Concurrent save operations
      const savePromises = contexts.map((context, index) => 
        storageManager.save({ ...context, agentId: agents[index % agents.length].agentId })
      );
      
      await Promise.all(savePromises);
      
      // Concurrent read operations
      const readPromises = contexts.map(context => 
        storageManager.load(context.id)
      );
      
      const readResults = await Promise.all(readPromises);
      
      // All contexts should be retrievable
      expect(readResults.every(result => result !== null)).toBe(true);
      expect(readResults).toHaveLength(20);
    });
  });

  describe('Agent Communication Protocols', () => {
    test('should enable direct agent-to-agent communication', async () => {
      const sender = TestDataFactory.createAgentState({
        agentId: 'sender-agent',
        capabilities: ['messaging']
      });
      
      const receiver = TestDataFactory.createAgentState({
        agentId: 'receiver-agent',
        capabilities: ['message-processing']
      });
      
      await agentRegistry.registerAgent(sender);
      await agentRegistry.registerAgent(receiver);
      
      const message = {
        id: 'test-message',
        from: sender.agentId,
        to: receiver.agentId,
        type: 'task-request',
        payload: { task: 'process-data', data: 'test-data' }
      };
      
      // Send message
      const messagePromise = waitForEvent(agentRegistry, 'messageReceived');
      await agentRegistry.sendMessage(message);
      
      const receivedMessage = await messagePromise;
      
      expect(receivedMessage.id).toBe(message.id);
      expect(receivedMessage.from).toBe(sender.agentId);
      expect(receivedMessage.to).toBe(receiver.agentId);
    });
    
    test('should support broadcast messaging', async () => {
      const agents = TestDataFactory.createMultipleAgents(4, {
        capabilities: ['broadcast-listener']
      });
      
      for (const agent of agents) {
        await agentRegistry.registerAgent(agent);
      }
      
      const broadcastMessage = {
        id: 'broadcast-test',
        type: 'system-announcement',
        payload: { announcement: 'System maintenance in 5 minutes' }
      };
      
      const messagePromises = agents.map(agent => 
        waitForEvent(agentRegistry, `messageReceived:${agent.agentId}`)
      );
      
      await agentRegistry.broadcast(broadcastMessage);
      
      const receivedMessages = await Promise.all(messagePromises);
      
      expect(receivedMessages).toHaveLength(4);
      receivedMessages.forEach(msg => {
        expect(msg.id).toBe(broadcastMessage.id);
        expect(msg.type).toBe(broadcastMessage.type);
      });
    });
    
    test('should handle message queuing for offline agents', async () => {
      const onlineAgent = TestDataFactory.createAgentState({
        agentId: 'online-agent',
        status: 'active'
      });
      
      const offlineAgent = TestDataFactory.createAgentState({
        agentId: 'offline-agent',
        status: 'offline'
      });
      
      await agentRegistry.registerAgent(onlineAgent);
      await agentRegistry.registerAgent(offlineAgent);
      
      const message = {
        id: 'queued-message',
        from: onlineAgent.agentId,
        to: offlineAgent.agentId,
        type: 'delayed-task',
        payload: { task: 'background-processing' }
      };
      
      // Send message to offline agent
      await agentRegistry.sendMessage(message);
      
      // Bring agent online
      await agentRegistry.setAgentStatus(offlineAgent.agentId, 'active');
      
      // Agent should receive queued message
      const queuedMessages = await agentRegistry.getQueuedMessages(offlineAgent.agentId);
      
      expect(queuedMessages).toHaveLength(1);
      expect(queuedMessages[0].id).toBe(message.id);
    });
  });

  describe('Performance Under Load', () => {
    test('should maintain coordination performance with many agents', async () => {
      const agents = TestDataFactory.createMultipleAgents(50);
      
      const { result, metrics } = await global.testUtils.measurePerformance(
        async () => {
          const registrationPromises = agents.map(agent => 
            agentRegistry.registerAgent(agent)
          );
          return Promise.all(registrationPromises);
        },
        'registering 50 agents'
      );
      
      expect(result).toHaveLength(50);
      expect(metrics.duration).toBeLessThan(5000); // Less than 5 seconds
      
      // Verify all agents are discoverable
      const allAgents = await agentRegistry.getAllAgents();
      expect(allAgents).toHaveLength(50);
    });
    
    test('should handle high message throughput', async () => {
      const agents = TestDataFactory.createMultipleAgents(10);
      
      for (const agent of agents) {
        await agentRegistry.registerAgent(agent);
      }
      
      const messages = Array.from({ length: 1000 }, (_, i) => ({
        id: `message-${i}`,
        from: agents[i % agents.length].agentId,
        to: agents[(i + 1) % agents.length].agentId,
        type: 'high-throughput-test',
        payload: { index: i }
      }));
      
      const { metrics } = await global.testUtils.measurePerformance(
        async () => {
          const sendPromises = messages.map(message => 
            agentRegistry.sendMessage(message)
          );
          return Promise.all(sendPromises);
        },
        'sending 1000 messages'
      );
      
      expect(metrics.duration).toBeLessThan(10000); // Less than 10 seconds
      
      // Verify message delivery
      const messageStats = await agentRegistry.getMessageStats();
      expect(messageStats.sent).toBe(1000);
      expect(messageStats.delivered).toBe(1000);
    });
  });

  describe('Fault Tolerance and Recovery', () => {
    test('should handle agent failures gracefully', async () => {
      const reliableAgent = TestDataFactory.createAgentState({
        agentId: 'reliable-agent',
        capabilities: ['fault-tolerance']
      });
      
      const flakyAgent = TestDataFactory.createAgentState({
        agentId: 'flaky-agent',
        capabilities: ['fault-tolerance']
      });
      
      await agentRegistry.registerAgent(reliableAgent);
      await agentRegistry.registerAgent(flakyAgent);
      
      // Simulate agent failure
      await agentRegistry.setAgentStatus(flakyAgent.agentId, 'error');
      
      const workItem = {
        id: 'critical-work',
        type: 'fault-tolerance',
        priority: 'high'
      };
      
      // Should still assign work to available agent
      const assignment = await loadBalancer.assignWork(workItem);
      
      expect(assignment.agentId).toBe(reliableAgent.agentId);
      expect(assignment.success).toBe(true);
    });
    
    test('should implement circuit breaker for failing agents', async () => {
      const unstableAgent = TestDataFactory.createAgentState({
        agentId: 'unstable-agent',
        capabilities: ['processing'],
        performance: {
          successRate: 0.3, // Very low success rate
          avgResponseTime: 500
        }
      });
      
      await agentRegistry.registerAgent(unstableAgent);
      
      const workItems = Array.from({ length: 10 }, (_, i) => ({
        id: `work-${i}`,
        type: 'processing'
      }));
      
      // Attempt to assign work multiple times
      const assignments = [];
      for (const workItem of workItems) {
        try {
          const assignment = await loadBalancer.assignWork(workItem);
          assignments.push(assignment);
        } catch (error) {
          // Circuit breaker should eventually prevent assignments
        }
      }
      
      // Should have triggered circuit breaker after failures
      const circuitState = await loadBalancer.getCircuitState(unstableAgent.agentId);
      expect(['half-open', 'open']).toContain(circuitState);
    });
    
    test('should recover and rebalance after agent restoration', async () => {
      const agents = TestDataFactory.createMultipleAgents(3, {
        capabilities: ['recovery-test']
      });
      
      for (const agent of agents) {
        await agentRegistry.registerAgent(agent);
      }
      
      // Simulate one agent going down
      await agentRegistry.setAgentStatus(agents[1].agentId, 'offline');
      
      // Assign work with reduced capacity
      const workItems = Array.from({ length: 6 }, (_, i) => ({
        id: `recovery-work-${i}`,
        type: 'recovery-test'
      }));
      
      const assignments1 = await Promise.all(
        workItems.map(work => loadBalancer.assignWork(work))
      );
      
      // Work should be distributed among 2 agents
      const activeAgents1 = new Set(assignments1.map(a => a.agentId));
      expect(activeAgents1.size).toBe(2);
      
      // Restore the agent
      await agentRegistry.setAgentStatus(agents[1].agentId, 'active');
      
      // Assign more work
      const moreWorkItems = Array.from({ length: 6 }, (_, i) => ({
        id: `post-recovery-work-${i}`,
        type: 'recovery-test'
      }));
      
      const assignments2 = await Promise.all(
        moreWorkItems.map(work => loadBalancer.assignWork(work))
      );
      
      // Work should now be distributed among all 3 agents
      const activeAgents2 = new Set(assignments2.map(a => a.agentId));
      expect(activeAgents2.size).toBe(3);
    });
  });
});