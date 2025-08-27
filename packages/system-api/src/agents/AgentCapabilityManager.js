const AgentRegistry = require('./AgentRegistry');
const CapabilityMatcher = require('./CapabilityMatcher');
const LoadBalancer = require('./LoadBalancer');
const PerformanceOptimizer = require('./PerformanceOptimizer');
const AgentState = require('../models/AgentState');

/**
 * Agent Capability Manager
 * Main orchestrator for agent capability management, selection, and optimization
 */
class AgentCapabilityManager {
  constructor(options = {}) {
    this.options = {
      enableAutoOptimization: true,
      optimizationInterval: 300000, // 5 minutes
      performanceThreshold: 0.7,
      maxAgentsPerType: 10,
      enableLoadBalancing: true,
      enablePerformanceTracking: true,
      ...options
    };

    // Initialize components
    this.registry = new AgentRegistry();
    this.matcher = new CapabilityMatcher(this.registry);
    this.loadBalancer = new LoadBalancer();
    this.optimizer = new PerformanceOptimizer();

    // Agent pools and state management
    this.agentInstances = new Map(); // agentId -> AgentState instance
    this.agentMetadata = new Map(); // agentId -> additional metadata
    this.taskHistory = new Map(); // taskId -> task details
    
    // Statistics and monitoring
    this.statistics = this._initializeStatistics();
    
    // Start optimization loop if enabled
    if (this.options.enableAutoOptimization) {
      this._startOptimizationLoop();
    }
  }

  /**
   * Initialize statistics tracking
   * @private
   */
  _initializeStatistics() {
    return {
      totalAgentsCreated: 0,
      totalTasksAssigned: 0,
      totalTasksCompleted: 0,
      totalOptimizations: 0,
      startTime: Date.now(),
      lastUpdate: Date.now()
    };
  }

  /**
   * Create and register a new agent
   * @param {string} type - Agent type
   * @param {Object} config - Agent configuration
   * @returns {Object} Created agent
   */
  createAgent(type, config = {}) {
    // Validate agent type
    if (!this.registry.hasAgent(type)) {
      throw new Error(`Unknown agent type: ${type}`);
    }

    // Get agent definition from registry
    const agentDef = this.registry.getAgent(type);

    // Create AgentState instance
    const agentState = new AgentState({
      type,
      capabilities: agentDef.capabilities,
      status: AgentState.STATUS.IDLE,
      ...config
    });

    // Register with components
    this.agentInstances.set(agentState.agent_id, agentState);
    this.loadBalancer.registerAgent(agentState);

    // Store metadata
    this.agentMetadata.set(agentState.agent_id, {
      createdAt: Date.now(),
      config,
      category: agentDef.category,
      metadata: agentDef.metadata
    });

    // Update statistics
    this.statistics.totalAgentsCreated++;

    return {
      id: agentState.agent_id,
      type: agentState.type,
      status: agentState.status,
      capabilities: agentState.capabilities
    };
  }

  /**
   * Remove an agent
   * @param {string} agentId - Agent ID
   * @returns {boolean} Success status
   */
  removeAgent(agentId) {
    if (!this.agentInstances.has(agentId)) {
      return false;
    }

    // Unregister from components
    this.loadBalancer.unregisterAgent(agentId);
    
    // Remove instances and metadata
    this.agentInstances.delete(agentId);
    this.agentMetadata.delete(agentId);

    return true;
  }

  /**
   * Get agent by ID
   * @param {string} agentId - Agent ID
   * @returns {Object|null} Agent state
   */
  getAgent(agentId) {
    const agent = this.agentInstances.get(agentId);
    return agent ? agent.toObject() : null;
  }

  /**
   * Get all agents
   * @param {Object} filters - Optional filters
   * @returns {Array<Object>} List of agents
   */
  getAllAgents(filters = {}) {
    let agents = Array.from(this.agentInstances.values());

    // Apply filters
    if (filters.type) {
      agents = agents.filter(a => a.type === filters.type);
    }

    if (filters.status) {
      agents = agents.filter(a => a.status === filters.status);
    }

    if (filters.category) {
      agents = agents.filter(a => {
        const metadata = this.agentMetadata.get(a.agent_id);
        return metadata && metadata.category === filters.category;
      });
    }

    return agents.map(a => a.toObject());
  }

  /**
   * Find best agent for a task
   * @param {Object} taskRequirements - Task requirements
   * @param {Object} options - Selection options
   * @returns {Object} Match result
   */
  findBestAgent(taskRequirements, options = {}) {
    const {
      strategy = 'balanced',
      excludeAgents = [],
      preferredAgents = []
    } = options;

    // Get available agents
    const availableAgents = Array.from(this.agentInstances.values())
      .filter(a => !excludeAgents.includes(a.agent_id))
      .filter(a => a.status !== AgentState.STATUS.ERROR);

    // Apply preference boost
    if (preferredAgents.length > 0) {
      availableAgents.forEach(agent => {
        if (preferredAgents.includes(agent.agent_id)) {
          // Boost performance metrics for preferred agents
          agent.performance_metrics.success_rate *= 1.1;
        }
      });
    }

    // Use matcher to find best agent
    const matchResult = this.matcher.findBestMatch(
      taskRequirements,
      availableAgents,
      strategy
    );

    // Update matcher performance history if enabled
    if (this.options.enablePerformanceTracking && matchResult.success) {
      this.matcher.updatePerformanceHistory(matchResult.bestMatch, {
        taskRequirements,
        matchScore: matchResult.score,
        timestamp: Date.now()
      });
    }

    return matchResult;
  }

  /**
   * Assign task to agent
   * @param {Object} task - Task details
   * @param {Object} options - Assignment options
   * @returns {Object} Assignment result
   */
  async assignTask(task, options = {}) {
    const {
      agentId = null,
      autoSelect = true,
      strategy = 'adaptive'
    } = options;

    let targetAgent = null;

    // Use specific agent if provided
    if (agentId) {
      targetAgent = this.agentInstances.get(agentId);
      if (!targetAgent) {
        return { success: false, error: 'Agent not found' };
      }
    }

    // Auto-select agent if needed
    if (!targetAgent && autoSelect) {
      const matchResult = this.findBestAgent(task.requirements || {}, { strategy });
      if (!matchResult.success) {
        return { success: false, error: matchResult.message };
      }

      // Find agent instance by type
      for (const agent of this.agentInstances.values()) {
        if (agent.type === matchResult.bestMatch) {
          targetAgent = agent;
          break;
        }
      }
    }

    if (!targetAgent) {
      return { success: false, error: 'No suitable agent found' };
    }

    // Use load balancer if enabled
    if (this.options.enableLoadBalancing) {
      const result = await this.loadBalancer.assignTask(task, {
        agentType: targetAgent.type,
        strategy,
        priority: task.priority || 'normal'
      });

      if (result.success) {
        // Track task
        this.taskHistory.set(task.id, {
          ...task,
          agentId: result.agentId,
          assignedAt: Date.now()
        });

        // Update statistics
        this.statistics.totalTasksAssigned++;
      }

      return result;
    }

    // Direct assignment without load balancing
    targetAgent.startTask({
      task_id: task.id,
      issue_number: task.issueNumber,
      stream: task.stream,
      estimated_duration: task.estimatedDuration || 60
    });

    // Track task
    this.taskHistory.set(task.id, {
      ...task,
      agentId: targetAgent.agent_id,
      assignedAt: Date.now()
    });

    // Update statistics
    this.statistics.totalTasksAssigned++;

    return {
      success: true,
      agentId: targetAgent.agent_id,
      agentType: targetAgent.type
    };
  }

  /**
   * Complete task
   * @param {string} taskId - Task ID
   * @param {Object} result - Task result
   * @returns {Object} Completion result
   */
  completeTask(taskId, result = {}) {
    const task = this.taskHistory.get(taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    const agent = this.agentInstances.get(task.agentId);
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    // Update agent state
    agent.completeTask(result.success !== false, {
      execution_time: Date.now() - task.assignedAt,
      memory_peak: result.memoryPeak
    });

    // Update load balancer
    if (this.options.enableLoadBalancing) {
      this.loadBalancer.completeTask(task.agentId, result.success !== false, {
        executionTime: Date.now() - task.assignedAt
      });
    }

    // Track performance
    if (this.options.enablePerformanceTracking) {
      this.optimizer.trackPerformance(task.agentId, {
        successRate: agent.performance_metrics.success_rate,
        responseTime: Date.now() - task.assignedAt,
        memoryUsage: result.memoryUsage || agent.memory_usage.memory_size,
        cpuUsage: result.cpuUsage || 0.5,
        totalTasks: agent.performance_metrics.total_tasks_completed + agent.performance_metrics.total_tasks_failed,
        failures: agent.performance_metrics.total_tasks_failed
      });
    }

    // Update task history
    task.completedAt = Date.now();
    task.result = result;

    // Update statistics
    this.statistics.totalTasksCompleted++;

    return {
      success: true,
      executionTime: task.completedAt - task.assignedAt,
      agentPerformance: agent.getPerformanceSummary()
    };
  }

  /**
   * Get agent recommendations for optimization
   * @param {string} agentId - Agent ID
   * @returns {Array<Object>} Recommendations
   */
  getOptimizationRecommendations(agentId) {
    if (!this.options.enablePerformanceTracking) {
      return [];
    }

    return this.optimizer.getRecommendations(agentId);
  }

  /**
   * Apply optimization to agent
   * @param {string} agentId - Agent ID
   * @param {string} action - Optimization action
   * @param {Object} parameters - Action parameters
   * @returns {Object} Optimization result
   */
  applyOptimization(agentId, action, parameters = {}) {
    const agent = this.agentInstances.get(agentId);
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    // Apply optimization through optimizer
    const result = this.optimizer.applyOptimization(agentId, action, parameters);

    // Apply changes to agent state based on action
    if (result.success) {
      switch (action) {
        case 'increase-memory':
          agent.memory_usage.memory_size += parameters.amount || 256;
          break;
        case 'cleanup':
          agent.performCleanup({
            contexts_freed: parameters.contexts || 10,
            memory_freed: parameters.memory || 100
          });
          break;
        case 'reset':
          agent.status = AgentState.STATUS.IDLE;
          agent.current_task = {
            task_id: null,
            issue_number: null,
            stream: null,
            started_at: null,
            estimated_completion: null
          };
          break;
      }
    }

    // Update statistics
    this.statistics.totalOptimizations++;

    return result;
  }

  /**
   * Get load statistics
   * @returns {Object} Load statistics
   */
  getLoadStatistics() {
    if (!this.options.enableLoadBalancing) {
      return { loadBalancingDisabled: true };
    }

    return this.loadBalancer.getLoadStatistics();
  }

  /**
   * Rebalance load across agents
   * @param {Object} options - Rebalance options
   * @returns {Object} Rebalance result
   */
  rebalanceLoad(options = {}) {
    if (!this.options.enableLoadBalancing) {
      return { success: false, error: 'Load balancing disabled' };
    }

    return this.loadBalancer.rebalanceLoad(
      options.fromAgentId,
      options.toAgentId,
      options.taskCount || 1
    );
  }

  /**
   * Get performance report for agent
   * @param {string} agentId - Agent ID
   * @param {Object} options - Report options
   * @returns {Object} Performance report
   */
  getPerformanceReport(agentId, options = {}) {
    if (!this.options.enablePerformanceTracking) {
      return { performanceTrackingDisabled: true };
    }

    return this.optimizer.getPerformanceReport(agentId, options);
  }

  /**
   * Run benchmark for agent type
   * @param {string} agentType - Agent type
   * @param {Object} testSuite - Test suite
   * @returns {Object} Benchmark results
   */
  async runBenchmark(agentType, testSuite) {
    if (!this.registry.hasAgent(agentType)) {
      return { success: false, error: 'Unknown agent type' };
    }

    return await this.optimizer.runBenchmark(agentType, testSuite);
  }

  /**
   * Get system statistics
   * @returns {Object} System statistics
   */
  getSystemStatistics() {
    const uptime = Date.now() - this.statistics.startTime;
    const agentStats = this.registry.getStatistics();
    const loadStats = this.getLoadStatistics();

    return {
      uptime,
      statistics: this.statistics,
      registry: agentStats,
      load: loadStats,
      agents: {
        total: this.agentInstances.size,
        byStatus: this._countAgentsByStatus(),
        byType: this._countAgentsByType()
      },
      tasks: {
        total: this.taskHistory.size,
        completed: this.statistics.totalTasksCompleted,
        pending: this.statistics.totalTasksAssigned - this.statistics.totalTasksCompleted,
        successRate: this.statistics.totalTasksCompleted / (this.statistics.totalTasksAssigned || 1)
      }
    };
  }

  /**
   * Start optimization loop
   * @private
   */
  _startOptimizationLoop() {
    this.optimizationTimer = setInterval(() => {
      this._runOptimizationCycle();
    }, this.options.optimizationInterval);
  }

  /**
   * Run optimization cycle
   * @private
   */
  _runOptimizationCycle() {
    // Check each agent for optimization needs
    for (const [agentId, agent] of this.agentInstances) {
      // Get recommendations
      const recommendations = this.getOptimizationRecommendations(agentId);
      
      // Apply high-severity optimizations automatically
      const highSeverity = recommendations.filter(r => r.severity === 'high');
      
      for (const rec of highSeverity) {
        if (rec.actions && rec.actions.length > 0) {
          const action = rec.actions[0];
          this.applyOptimization(agentId, action, {
            automatic: true,
            reason: rec.recommendation
          });
        }
      }

      // Check if agent needs cleanup
      if (agent.needsCleanup()) {
        agent.performCleanup();
      }

      // Check performance threshold
      if (agent.performance_metrics.success_rate < this.options.performanceThreshold) {
        // Consider removing or retraining underperforming agents
        console.warn(`Agent ${agentId} performing below threshold: ${agent.performance_metrics.success_rate}`);
      }
    }

    // Rebalance load if needed
    if (this.options.enableLoadBalancing) {
      const loadStats = this.getLoadStatistics();
      if (loadStats.averageUtilization > 0.8) {
        this.rebalanceLoad({ taskCount: 5 });
      }
    }

    // Update statistics
    this.statistics.lastUpdate = Date.now();
  }

  /**
   * Stop optimization loop
   */
  stopOptimization() {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = null;
    }
  }

  /**
   * Count agents by status
   * @private
   */
  _countAgentsByStatus() {
    const counts = {};
    
    for (const agent of this.agentInstances.values()) {
      counts[agent.status] = (counts[agent.status] || 0) + 1;
    }
    
    return counts;
  }

  /**
   * Count agents by type
   * @private
   */
  _countAgentsByType() {
    const counts = {};
    
    for (const agent of this.agentInstances.values()) {
      counts[agent.type] = (counts[agent.type] || 0) + 1;
    }
    
    return counts;
  }

  /**
   * Export configuration
   * @returns {Object} Configuration export
   */
  exportConfiguration() {
    return {
      options: this.options,
      agents: this.getAllAgents(),
      registry: {
        types: this.registry.getAllAgentTypes(),
        capabilities: this.registry.getAllCapabilities(),
        categories: this.registry.getCategories()
      },
      statistics: this.getSystemStatistics()
    };
  }

  /**
   * Import configuration
   * @param {Object} config - Configuration to import
   * @returns {Object} Import result
   */
  importConfiguration(config) {
    const results = {
      agentsCreated: 0,
      errors: []
    };

    // Import agents
    if (config.agents && Array.isArray(config.agents)) {
      for (const agentConfig of config.agents) {
        try {
          this.createAgent(agentConfig.type, agentConfig);
          results.agentsCreated++;
        } catch (error) {
          results.errors.push({
            agent: agentConfig.type,
            error: error.message
          });
        }
      }
    }

    // Update options if provided
    if (config.options) {
      Object.assign(this.options, config.options);
    }

    return results;
  }

  /**
   * Cleanup and shutdown
   */
  shutdown() {
    // Stop optimization
    this.stopOptimization();

    // Clear all agents
    for (const agentId of this.agentInstances.keys()) {
      this.removeAgent(agentId);
    }

    // Clear histories
    this.taskHistory.clear();
    
    // Reset statistics
    this.statistics = this._initializeStatistics();
  }
}

module.exports = AgentCapabilityManager;