const AgentCapabilityManager = require('../../src/agents/AgentCapabilityManager');
const AgentState = require('../../src/models/AgentState');

describe('AgentCapabilityManager', () => {
  let manager;

  beforeEach(() => {
    manager = new AgentCapabilityManager({
      enableAutoOptimization: false, // Disable for tests
      enableLoadBalancing: true,
      enablePerformanceTracking: true
    });
  });

  afterEach(() => {
    if (manager) {
      manager.shutdown();
    }
  });

  describe('Agent Creation and Management', () => {
    test('should create agent with valid type', () => {
      const agent = manager.createAgent('backend-developer');
      
      expect(agent).toBeDefined();
      expect(agent.type).toBe('backend-developer');
      expect(agent.status).toBe('idle');
      expect(agent.capabilities).toContain('code-implementation');
      expect(agent.capabilities).toContain('unit-testing');
    });

    test('should throw error for invalid agent type', () => {
      expect(() => {
        manager.createAgent('invalid-type');
      }).toThrow('Unknown agent type: invalid-type');
    });

    test('should create agents with custom configuration', () => {
      const config = {
        status: AgentState.STATUS.ACTIVE,
        memory_usage: {
          memory_size: 512,
          contexts_active: 5
        }
      };
      
      const agent = manager.createAgent('frontend-developer', config);
      const agentState = manager.getAgent(agent.id);
      
      expect(agentState.status).toBe('active');
      expect(agentState.memory_usage.memory_size).toBe(512);
      expect(agentState.memory_usage.contexts_active).toBe(5);
    });

    test('should remove agent successfully', () => {
      const agent = manager.createAgent('backend-architect');
      const removed = manager.removeAgent(agent.id);
      
      expect(removed).toBe(true);
      expect(manager.getAgent(agent.id)).toBeNull();
    });

    test('should get all agents with filters', () => {
      // Create multiple agents
      manager.createAgent('python-pro');
      manager.createAgent('javascript-pro');
      manager.createAgent('python-pro');
      manager.createAgent('backend-developer');
      
      // Test type filter
      const pythonAgents = manager.getAllAgents({ type: 'python-pro' });
      expect(pythonAgents).toHaveLength(2);
      
      // Test status filter
      const idleAgents = manager.getAllAgents({ status: 'idle' });
      expect(idleAgents).toHaveLength(4);
    });
  });

  describe('Agent Selection and Matching', () => {
    beforeEach(() => {
      // Create a pool of agents
      manager.createAgent('backend-developer');
      manager.createAgent('frontend-developer');
      manager.createAgent('database-optimizer');
      manager.createAgent('api-developer');
    });

    test('should find best agent for task requirements', () => {
      const taskRequirements = {
        requiredCapabilities: ['api-design', 'rest-api'],
        preferredCapabilities: ['documentation'],
        complexity: 'medium',
        category: 'development'
      };
      
      const result = manager.findBestAgent(taskRequirements);
      
      expect(result.success).toBe(true);
      expect(result.bestMatch).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should use different matching strategies', () => {
      const taskRequirements = {
        requiredCapabilities: ['code-implementation'],
        complexity: 'medium'
      };
      
      // Test balanced strategy
      const balancedResult = manager.findBestAgent(taskRequirements, {
        strategy: 'balanced'
      });
      
      // Test performance strategy
      const performanceResult = manager.findBestAgent(taskRequirements, {
        strategy: 'performance'
      });
      
      expect(balancedResult.success).toBe(true);
      expect(performanceResult.success).toBe(true);
    });

    test('should exclude and prefer specific agents', () => {
      const agents = manager.getAllAgents();
      const excludeId = agents[0].agent_id;
      const preferId = agents[1].agent_id;
      
      const result = manager.findBestAgent(
        { requiredCapabilities: ['code-implementation'] },
        {
          excludeAgents: [excludeId],
          preferredAgents: [preferId]
        }
      );
      
      expect(result.success).toBe(true);
    });

    test('should handle no matching agents gracefully', () => {
      const result = manager.findBestAgent({
        requiredCapabilities: ['non-existent-capability']
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('No agents found');
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('Task Assignment and Completion', () => {
    let agentId;

    beforeEach(() => {
      const agent = manager.createAgent('test-runner');
      agentId = agent.id;
    });

    test('should assign task to specific agent', async () => {
      const task = {
        id: 'task-001',
        issueNumber: 42,
        stream: 'A',
        requirements: {
          requiredCapabilities: ['test-execution']
        },
        estimatedDuration: 30
      };
      
      const result = await manager.assignTask(task, { agentId });
      
      expect(result.success).toBe(true);
      expect(result.agentId).toBe(agentId);
      
      const agent = manager.getAgent(agentId);
      expect(agent.status).toBe('busy');
      expect(agent.current_task.task_id).toBe('task-001');
    });

    test('should auto-select agent for task', async () => {
      const task = {
        id: 'task-002',
        requirements: {
          requiredCapabilities: ['test-execution', 'coverage-reporting']
        }
      };
      
      const result = await manager.assignTask(task, { autoSelect: true });
      
      expect(result.success).toBe(true);
      expect(result.agentId).toBeDefined();
    });

    test('should complete task successfully', async () => {
      const task = {
        id: 'task-003',
        issueNumber: 43,
        requirements: {}
      };
      
      await manager.assignTask(task, { agentId });
      
      const completionResult = manager.completeTask('task-003', {
        success: true,
        memoryUsage: 50,
        cpuUsage: 0.6
      });
      
      expect(completionResult.success).toBe(true);
      expect(completionResult.executionTime).toBeGreaterThan(0);
      expect(completionResult.agentPerformance).toBeDefined();
      
      const agent = manager.getAgent(agentId);
      expect(agent.status).toBe('active');
      expect(agent.performance_metrics.total_tasks_completed).toBe(1);
    });

    test('should handle task failure', async () => {
      const task = {
        id: 'task-004',
        requirements: {}
      };
      
      await manager.assignTask(task, { agentId });
      
      const completionResult = manager.completeTask('task-004', {
        success: false,
        error: 'Test failure'
      });
      
      expect(completionResult.success).toBe(true);
      
      const agent = manager.getAgent(agentId);
      expect(agent.status).toBe('error');
      expect(agent.performance_metrics.total_tasks_failed).toBe(1);
    });
  });

  describe('Load Balancing', () => {
    let agents;

    beforeEach(() => {
      // Create multiple agents of same type
      agents = [
        manager.createAgent('backend-developer'),
        manager.createAgent('backend-developer'),
        manager.createAgent('backend-developer')
      ];
    });

    test('should get load statistics', () => {
      const stats = manager.getLoadStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.activeAgents).toBe(0);
      expect(stats.idleAgents).toBe(3);
      expect(stats.queueDepth).toBe(0);
    });

    test('should distribute tasks across agents', async () => {
      const tasks = [
        { id: 'lb-task-1', requirements: {} },
        { id: 'lb-task-2', requirements: {} },
        { id: 'lb-task-3', requirements: {} }
      ];
      
      for (const task of tasks) {
        await manager.assignTask(task, { autoSelect: true });
      }
      
      const stats = manager.getLoadStatistics();
      expect(stats.busyAgents).toBeGreaterThan(0);
    });

    test('should rebalance load', async () => {
      // Assign all tasks to first agent
      const tasks = [
        { id: 'rb-task-1', requirements: {} },
        { id: 'rb-task-2', requirements: {} }
      ];
      
      for (const task of tasks) {
        await manager.assignTask(task, { agentId: agents[0].id });
      }
      
      // Rebalance
      const result = manager.rebalanceLoad({ taskCount: 1 });
      
      expect(result.success).toBeDefined();
      if (result.success) {
        expect(result.moves.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance Optimization', () => {
    let agentId;

    beforeEach(() => {
      const agent = manager.createAgent('code-analyzer');
      agentId = agent.id;
    });

    test('should track agent performance', async () => {
      // Simulate task completion
      const task = { id: 'perf-task-1', requirements: {} };
      await manager.assignTask(task, { agentId });
      manager.completeTask('perf-task-1', { success: true });
      
      const report = manager.getPerformanceReport(agentId);
      
      expect(report).toBeDefined();
      expect(report.statistics).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    test('should get optimization recommendations', async () => {
      // Simulate poor performance
      const agent = manager.getAgent(agentId);
      manager.agentInstances.get(agentId).performance_metrics.success_rate = 0.5;
      
      // Track performance
      const task = { id: 'opt-task-1', requirements: {} };
      await manager.assignTask(task, { agentId });
      manager.completeTask('opt-task-1', { success: false });
      
      const recommendations = manager.getOptimizationRecommendations(agentId);
      
      expect(Array.isArray(recommendations)).toBe(true);
    });

    test('should apply optimization actions', () => {
      const result = manager.applyOptimization(agentId, 'increase-memory', {
        amount: 256
      });
      
      expect(result.success).toBe(true);
      
      const agent = manager.getAgent(agentId);
      expect(agent.memory_usage.memory_size).toBeGreaterThan(0);
    });
  });

  describe('System Statistics and Configuration', () => {
    test('should get system statistics', () => {
      // Create some agents and tasks
      manager.createAgent('frontend-developer');
      manager.createAgent('backend-developer');
      manager.createAgent('test-runner');
      
      const stats = manager.getSystemStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.uptime).toBeGreaterThan(0);
      expect(stats.agents.total).toBe(3);
      expect(stats.registry).toBeDefined();
      expect(stats.tasks).toBeDefined();
    });

    test('should export configuration', () => {
      manager.createAgent('ml-engineer');
      manager.createAgent('data-scientist');
      
      const config = manager.exportConfiguration();
      
      expect(config).toBeDefined();
      expect(config.options).toBeDefined();
      expect(config.agents).toHaveLength(2);
      expect(config.registry).toBeDefined();
      expect(config.statistics).toBeDefined();
    });

    test('should import configuration', () => {
      const config = {
        agents: [
          { type: 'frontend-developer', status: 'active' },
          { type: 'backend-developer', status: 'idle' }
        ],
        options: {
          performanceThreshold: 0.8
        }
      };
      
      const result = manager.importConfiguration(config);
      
      expect(result.agentsCreated).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(manager.options.performanceThreshold).toBe(0.8);
    });
  });

  describe('Benchmarking', () => {
    test('should run benchmark for agent type', async () => {
      const testSuite = {
        tests: [
          { name: 'test-1', type: 'performance' },
          { name: 'test-2', type: 'accuracy' },
          { name: 'test-3', type: 'efficiency' }
        ]
      };
      
      const results = await manager.runBenchmark('python-pro', testSuite);
      
      expect(results).toBeDefined();
      expect(results.agentType).toBe('python-pro');
      expect(results.tests).toHaveLength(3);
      expect(results.summary).toBeDefined();
    });

    test('should reject benchmark for invalid agent type', async () => {
      const testSuite = { tests: [] };
      
      const results = await manager.runBenchmark('invalid-type', testSuite);
      
      expect(results.success).toBe(false);
      expect(results.error).toContain('Unknown agent type');
    });
  });

  describe('Agent Registry Integration', () => {
    test('should access all 50+ agent types', () => {
      const registry = manager.registry;
      const allTypes = registry.getAllAgentTypes();
      
      expect(allTypes.length).toBeGreaterThanOrEqual(50);
      expect(allTypes).toContain('frontend-developer');
      expect(allTypes).toContain('backend-architect');
      expect(allTypes).toContain('ml-engineer');
      expect(allTypes).toContain('prompt-engineer');
    });

    test('should get agents by capability', () => {
      const registry = manager.registry;
      const apiAgents = registry.getAgentsByCapability('api-design');
      
      expect(apiAgents).toBeDefined();
      expect(apiAgents.length).toBeGreaterThan(0);
      expect(apiAgents).toContain('backend-architect');
    });

    test('should get agents by category', () => {
      const registry = manager.registry;
      const categories = registry.getCategories();
      
      expect(categories).toContain('development');
      expect(categories).toContain('testing');
      expect(categories).toContain('infrastructure');
      
      const testingAgents = registry.getAgentsByCategory('testing');
      expect(testingAgents.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle task not found on completion', () => {
      const result = manager.completeTask('non-existent-task');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Task not found');
    });

    test('should handle agent not found for task', async () => {
      const result = await manager.assignTask(
        { id: 'task-x', requirements: {} },
        { agentId: 'non-existent-agent' }
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Agent not found');
    });

    test('should handle no suitable agent for auto-select', async () => {
      const result = await manager.assignTask(
        {
          id: 'task-y',
          requirements: {
            requiredCapabilities: ['impossible-capability']
          }
        },
        { autoSelect: true }
      );
      
      expect(result.success).toBe(false);
    });

    test('should clean up properly on shutdown', () => {
      manager.createAgent('frontend-developer');
      manager.createAgent('backend-developer');
      
      manager.shutdown();
      
      expect(manager.getAllAgents()).toHaveLength(0);
      const stats = manager.getSystemStatistics();
      expect(stats.agents.total).toBe(0);
    });
  });
});