/**
 * Load Balancer
 * Dynamic work distribution system with real-time monitoring and adaptive scheduling
 */
class LoadBalancer {
  constructor() {
    this.agentPools = new Map(); // agentType -> Array of agent instances
    this.taskQueues = new Map(); // priority -> Array of tasks
    this.activeAssignments = new Map(); // agentId -> current task
    this.metrics = this._initializeMetrics();
    this.strategies = this._initializeStrategies();
    this.circuitBreakers = new Map(); // agentId -> circuit breaker state
    this.backpressure = {
      enabled: false,
      threshold: 0.8,
      currentLoad: 0
    };
  }

  /**
   * Initialize metrics tracking
   * @private
   */
  _initializeMetrics() {
    return {
      totalTasksAssigned: 0,
      totalTasksCompleted: 0,
      totalTasksFailed: 0,
      averageWaitTime: 0,
      averageProcessingTime: 0,
      currentQueueDepth: 0,
      agentUtilization: new Map(),
      loadDistribution: new Map(),
      peakLoad: 0,
      lastMetricsUpdate: Date.now()
    };
  }

  /**
   * Initialize load balancing strategies
   * @private
   */
  _initializeStrategies() {
    return {
      roundRobin: this._roundRobinStrategy.bind(this),
      leastConnections: this._leastConnectionsStrategy.bind(this),
      weightedRoundRobin: this._weightedRoundRobinStrategy.bind(this),
      leastResponseTime: this._leastResponseTimeStrategy.bind(this),
      random: this._randomStrategy.bind(this),
      consistentHashing: this._consistentHashingStrategy.bind(this),
      adaptive: this._adaptiveStrategy.bind(this)
    };
  }

  /**
   * Register an agent with the load balancer
   * @param {Object} agent - Agent instance
   */
  registerAgent(agent) {
    const { agent_id, type } = agent;
    
    if (!this.agentPools.has(type)) {
      this.agentPools.set(type, []);
    }
    
    const pool = this.agentPools.get(type);
    const existingIndex = pool.findIndex(a => a.agent_id === agent_id);
    
    if (existingIndex === -1) {
      pool.push(agent);
    } else {
      pool[existingIndex] = agent;
    }

    // Initialize metrics for this agent
    this.metrics.agentUtilization.set(agent_id, {
      tasksAssigned: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      totalProcessingTime: 0,
      averageResponseTime: 0,
      currentLoad: 0,
      lastTaskTime: null
    });

    // Initialize circuit breaker
    this.circuitBreakers.set(agent_id, {
      state: 'closed', // closed, open, half-open
      failures: 0,
      successfulRequests: 0,
      lastFailureTime: null,
      nextRetryTime: null
    });
  }

  /**
   * Unregister an agent
   * @param {string} agentId - Agent ID
   */
  unregisterAgent(agentId) {
    // Find and remove agent from pool
    for (const [type, pool] of this.agentPools) {
      const index = pool.findIndex(a => a.agent_id === agentId);
      if (index !== -1) {
        pool.splice(index, 1);
        break;
      }
    }

    // Clean up metrics and circuit breaker
    this.metrics.agentUtilization.delete(agentId);
    this.circuitBreakers.delete(agentId);
    this.activeAssignments.delete(agentId);
  }

  /**
   * Assign a task to an agent
   * @param {Object} task - Task to assign
   * @param {Object} options - Assignment options
   * @returns {Object} Assignment result
   */
  async assignTask(task, options = {}) {
    const {
      agentType = null,
      strategy = 'adaptive',
      priority = 'normal',
      timeout = 60000,
      retryOnFailure = true
    } = options;

    // Check backpressure
    if (this._checkBackpressure()) {
      return {
        success: false,
        error: 'System under high load, task rejected',
        backpressure: true
      };
    }

    // Add to queue if needed
    if (!agentType || !this._hasAvailableAgent(agentType)) {
      return this._queueTask(task, priority);
    }

    // Select agent using strategy
    const agent = this._selectAgent(agentType, strategy, task);
    
    if (!agent) {
      return this._queueTask(task, priority);
    }

    // Check circuit breaker
    const breaker = this.circuitBreakers.get(agent.agent_id);
    if (breaker.state === 'open') {
      if (Date.now() < breaker.nextRetryTime) {
        // Try another agent
        return this._reassignTask(task, agent.agent_id, options);
      } else {
        // Move to half-open state
        breaker.state = 'half-open';
      }
    }

    // Assign task
    const assignment = {
      taskId: task.id,
      agentId: agent.agent_id,
      agentType: agent.type,
      assignedAt: Date.now(),
      priority,
      timeout
    };

    this.activeAssignments.set(agent.agent_id, assignment);
    
    // Update metrics
    const agentMetrics = this.metrics.agentUtilization.get(agent.agent_id);
    agentMetrics.tasksAssigned++;
    agentMetrics.currentLoad = agent.getWorkloadPercentage ? agent.getWorkloadPercentage() : 50;
    
    this.metrics.totalTasksAssigned++;
    this._updateLoadMetrics();

    // Start task on agent
    if (agent.startTask) {
      agent.startTask({
        task_id: task.id,
        issue_number: task.issueNumber,
        stream: task.stream,
        estimated_duration: task.estimatedDuration
      });
    }

    return {
      success: true,
      agentId: agent.agent_id,
      agentType: agent.type,
      assignment
    };
  }

  /**
   * Complete a task assignment
   * @param {string} agentId - Agent ID
   * @param {boolean} success - Whether task was successful
   * @param {Object} metrics - Task metrics
   */
  completeTask(agentId, success = true, metrics = {}) {
    const assignment = this.activeAssignments.get(agentId);
    if (!assignment) return;

    const processingTime = Date.now() - assignment.assignedAt;
    
    // Update agent metrics
    const agentMetrics = this.metrics.agentUtilization.get(agentId);
    if (agentMetrics) {
      agentMetrics.tasksCompleted += success ? 1 : 0;
      agentMetrics.tasksFailed += success ? 0 : 1;
      agentMetrics.totalProcessingTime += processingTime;
      agentMetrics.averageResponseTime = 
        agentMetrics.totalProcessingTime / (agentMetrics.tasksCompleted + agentMetrics.tasksFailed);
      agentMetrics.lastTaskTime = processingTime;
      agentMetrics.currentLoad = 0;
    }

    // Update circuit breaker
    this._updateCircuitBreaker(agentId, success);

    // Update global metrics
    this.metrics.totalTasksCompleted += success ? 1 : 0;
    this.metrics.totalTasksFailed += success ? 0 : 1;
    
    // Remove assignment
    this.activeAssignments.delete(agentId);
    
    // Process queued tasks
    this._processQueue();
    
    // Update load metrics
    this._updateLoadMetrics();
  }

  /**
   * Get current load statistics
   * @returns {Object} Load statistics
   */
  getLoadStatistics() {
    const stats = {
      activeAgents: 0,
      idleAgents: 0,
      busyAgents: 0,
      totalCapacity: 0,
      currentLoad: 0,
      queueDepth: 0,
      agentTypeDistribution: {},
      loadByPriority: {},
      averageUtilization: 0
    };

    // Calculate agent statistics
    for (const [type, pool] of this.agentPools) {
      stats.agentTypeDistribution[type] = {
        total: pool.length,
        active: 0,
        idle: 0,
        busy: 0
      };

      pool.forEach(agent => {
        const isActive = this.activeAssignments.has(agent.agent_id);
        stats.agentTypeDistribution[type].active += isActive ? 1 : 0;
        
        if (agent.status === 'idle') {
          stats.idleAgents++;
          stats.agentTypeDistribution[type].idle++;
        } else if (agent.status === 'busy') {
          stats.busyAgents++;
          stats.agentTypeDistribution[type].busy++;
        }
        
        if (agent.status === 'active' || agent.status === 'busy') {
          stats.activeAgents++;
        }
      });
    }

    // Calculate queue depth
    for (const queue of this.taskQueues.values()) {
      stats.queueDepth += queue.length;
    }

    // Calculate load by priority
    for (const [priority, queue] of this.taskQueues) {
      stats.loadByPriority[priority] = queue.length;
    }

    // Calculate average utilization
    let totalUtilization = 0;
    let agentCount = 0;
    
    for (const metrics of this.metrics.agentUtilization.values()) {
      totalUtilization += metrics.currentLoad;
      agentCount++;
    }
    
    stats.averageUtilization = agentCount > 0 ? totalUtilization / agentCount : 0;
    stats.totalCapacity = this._calculateTotalCapacity();
    stats.currentLoad = this.backpressure.currentLoad;

    return stats;
  }

  /**
   * Balance load across agents
   * @param {string} fromAgentId - Source agent ID
   * @param {string} toAgentId - Target agent ID
   * @param {number} taskCount - Number of tasks to move
   */
  rebalanceLoad(fromAgentId = null, toAgentId = null, taskCount = 1) {
    const moves = [];
    
    if (fromAgentId && toAgentId) {
      // Direct transfer
      const task = this.activeAssignments.get(fromAgentId);
      if (task) {
        this.activeAssignments.delete(fromAgentId);
        this.activeAssignments.set(toAgentId, task);
        moves.push({ from: fromAgentId, to: toAgentId, task: task.taskId });
      }
    } else {
      // Automatic rebalancing
      const imbalanced = this._findImbalancedAgents();
      
      for (const { overloaded, underutilized } of imbalanced) {
        if (moves.length >= taskCount) break;
        
        const task = this.activeAssignments.get(overloaded);
        if (task) {
          this.activeAssignments.delete(overloaded);
          this.activeAssignments.set(underutilized, task);
          moves.push({ from: overloaded, to: underutilized, task: task.taskId });
        }
      }
    }

    return {
      success: moves.length > 0,
      moves,
      newBalance: this._calculateLoadVariance()
    };
  }

  // Strategy implementations

  /**
   * Round-robin strategy
   * @private
   */
  _roundRobinStrategy(agentType, task) {
    const pool = this.agentPools.get(agentType) || [];
    if (pool.length === 0) return null;

    // Get or initialize round-robin index
    if (!this._roundRobinIndexes) {
      this._roundRobinIndexes = new Map();
    }
    
    let index = this._roundRobinIndexes.get(agentType) || 0;
    const agent = pool[index];
    
    // Update index for next selection
    this._roundRobinIndexes.set(agentType, (index + 1) % pool.length);
    
    return agent;
  }

  /**
   * Least connections strategy
   * @private
   */
  _leastConnectionsStrategy(agentType, task) {
    const pool = this.agentPools.get(agentType) || [];
    if (pool.length === 0) return null;

    let leastConnections = Infinity;
    let selectedAgent = null;

    pool.forEach(agent => {
      const connections = this.activeAssignments.has(agent.agent_id) ? 1 : 0;
      if (connections < leastConnections) {
        leastConnections = connections;
        selectedAgent = agent;
      }
    });

    return selectedAgent;
  }

  /**
   * Weighted round-robin strategy
   * @private
   */
  _weightedRoundRobinStrategy(agentType, task) {
    const pool = this.agentPools.get(agentType) || [];
    if (pool.length === 0) return null;

    // Calculate weights based on success rate
    const weightedPool = pool.map(agent => {
      const metrics = this.metrics.agentUtilization.get(agent.agent_id);
      const successRate = metrics.tasksCompleted / 
        (metrics.tasksCompleted + metrics.tasksFailed || 1);
      return { agent, weight: successRate };
    });

    // Select based on weights
    const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of weightedPool) {
      random -= item.weight;
      if (random <= 0) {
        return item.agent;
      }
    }

    return weightedPool[0].agent;
  }

  /**
   * Least response time strategy
   * @private
   */
  _leastResponseTimeStrategy(agentType, task) {
    const pool = this.agentPools.get(agentType) || [];
    if (pool.length === 0) return null;

    let minResponseTime = Infinity;
    let selectedAgent = null;

    pool.forEach(agent => {
      const metrics = this.metrics.agentUtilization.get(agent.agent_id);
      const responseTime = metrics.averageResponseTime || Infinity;
      
      if (responseTime < minResponseTime) {
        minResponseTime = responseTime;
        selectedAgent = agent;
      }
    });

    return selectedAgent;
  }

  /**
   * Random strategy
   * @private
   */
  _randomStrategy(agentType, task) {
    const pool = this.agentPools.get(agentType) || [];
    if (pool.length === 0) return null;
    
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }

  /**
   * Consistent hashing strategy
   * @private
   */
  _consistentHashingStrategy(agentType, task) {
    const pool = this.agentPools.get(agentType) || [];
    if (pool.length === 0) return null;

    // Simple hash based on task ID
    const hash = this._hashCode(task.id || JSON.stringify(task));
    const index = Math.abs(hash) % pool.length;
    
    return pool[index];
  }

  /**
   * Adaptive strategy (combines multiple strategies)
   * @private
   */
  _adaptiveStrategy(agentType, task) {
    const pool = this.agentPools.get(agentType) || [];
    if (pool.length === 0) return null;

    // Analyze current conditions
    const loadStats = this.getLoadStatistics();
    const variance = this._calculateLoadVariance();

    // High variance - use least connections
    if (variance > 0.3) {
      return this._leastConnectionsStrategy(agentType, task);
    }

    // High queue depth - use least response time
    if (loadStats.queueDepth > pool.length * 2) {
      return this._leastResponseTimeStrategy(agentType, task);
    }

    // Normal conditions - use weighted round-robin
    return this._weightedRoundRobinStrategy(agentType, task);
  }

  // Helper methods

  /**
   * Select agent using specified strategy
   * @private
   */
  _selectAgent(agentType, strategyName, task) {
    const strategy = this.strategies[strategyName] || this.strategies.adaptive;
    const agent = strategy(agentType, task);
    
    // Check if agent is available
    if (agent && agent.status !== 'error' && !this._isAgentOverloaded(agent.agent_id)) {
      return agent;
    }

    // Try fallback strategy
    return this._leastConnectionsStrategy(agentType, task);
  }

  /**
   * Check if agent is overloaded
   * @private
   */
  _isAgentOverloaded(agentId) {
    const metrics = this.metrics.agentUtilization.get(agentId);
    return metrics && metrics.currentLoad > 90;
  }

  /**
   * Check if there are available agents
   * @private
   */
  _hasAvailableAgent(agentType) {
    const pool = this.agentPools.get(agentType) || [];
    return pool.some(agent => 
      agent.status !== 'error' && 
      agent.status !== 'busy' &&
      !this._isAgentOverloaded(agent.agent_id)
    );
  }

  /**
   * Queue a task
   * @private
   */
  _queueTask(task, priority) {
    if (!this.taskQueues.has(priority)) {
      this.taskQueues.set(priority, []);
    }
    
    const queue = this.taskQueues.get(priority);
    queue.push({
      ...task,
      queuedAt: Date.now()
    });

    this.metrics.currentQueueDepth++;
    
    return {
      success: true,
      queued: true,
      queuePosition: queue.length,
      priority
    };
  }

  /**
   * Process queued tasks
   * @private
   */
  _processQueue() {
    const priorities = ['critical', 'high', 'normal', 'low'];
    
    for (const priority of priorities) {
      const queue = this.taskQueues.get(priority) || [];
      
      while (queue.length > 0) {
        const task = queue[0];
        
        // Try to assign task
        const result = this.assignTask(task, { priority });
        
        if (result.success && !result.queued) {
          // Task assigned, remove from queue
          queue.shift();
          this.metrics.currentQueueDepth--;
          
          // Update wait time metric
          const waitTime = Date.now() - task.queuedAt;
          this._updateAverageWaitTime(waitTime);
        } else {
          // No available agents, stop processing
          break;
        }
      }
    }
  }

  /**
   * Reassign task to different agent
   * @private
   */
  _reassignTask(task, excludeAgentId, options) {
    const pool = this.agentPools.get(options.agentType) || [];
    const availableAgents = pool.filter(a => a.agent_id !== excludeAgentId);
    
    if (availableAgents.length === 0) {
      return this._queueTask(task, options.priority);
    }

    // Try with different agent
    const newOptions = { ...options, agentType: availableAgents[0].type };
    return this.assignTask(task, newOptions);
  }

  /**
   * Update circuit breaker state
   * @private
   */
  _updateCircuitBreaker(agentId, success) {
    const breaker = this.circuitBreakers.get(agentId);
    if (!breaker) return;

    if (success) {
      breaker.failures = 0;
      breaker.successfulRequests++;
      
      if (breaker.state === 'half-open') {
        breaker.state = 'closed';
      }
    } else {
      breaker.failures++;
      breaker.lastFailureTime = Date.now();
      
      if (breaker.failures >= 3) {
        breaker.state = 'open';
        breaker.nextRetryTime = Date.now() + 60000; // 1 minute cooldown
      }
    }
  }

  /**
   * Check backpressure
   * @private
   */
  _checkBackpressure() {
    const load = this._calculateCurrentLoad();
    this.backpressure.currentLoad = load;
    
    if (load > this.backpressure.threshold) {
      this.backpressure.enabled = true;
      return true;
    }
    
    this.backpressure.enabled = false;
    return false;
  }

  /**
   * Calculate current system load
   * @private
   */
  _calculateCurrentLoad() {
    let totalAgents = 0;
    let busyAgents = 0;
    
    for (const pool of this.agentPools.values()) {
      totalAgents += pool.length;
      pool.forEach(agent => {
        if (this.activeAssignments.has(agent.agent_id)) {
          busyAgents++;
        }
      });
    }
    
    return totalAgents > 0 ? busyAgents / totalAgents : 0;
  }

  /**
   * Calculate total capacity
   * @private
   */
  _calculateTotalCapacity() {
    let capacity = 0;
    
    for (const pool of this.agentPools.values()) {
      capacity += pool.length;
    }
    
    return capacity;
  }

  /**
   * Calculate load variance
   * @private
   */
  _calculateLoadVariance() {
    const loads = [];
    
    for (const metrics of this.metrics.agentUtilization.values()) {
      loads.push(metrics.currentLoad);
    }
    
    if (loads.length === 0) return 0;
    
    const mean = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) / loads.length;
    
    return Math.sqrt(variance) / 100; // Normalized standard deviation
  }

  /**
   * Find imbalanced agents
   * @private
   */
  _findImbalancedAgents() {
    const imbalanced = [];
    const threshold = 30; // 30% difference threshold
    
    const utilization = Array.from(this.metrics.agentUtilization.entries())
      .map(([id, metrics]) => ({ id, load: metrics.currentLoad }))
      .sort((a, b) => b.load - a.load);
    
    const highLoad = utilization.filter(a => a.load > 70);
    const lowLoad = utilization.filter(a => a.load < 40);
    
    highLoad.forEach(high => {
      lowLoad.forEach(low => {
        if (high.load - low.load > threshold) {
          imbalanced.push({
            overloaded: high.id,
            underutilized: low.id,
            difference: high.load - low.load
          });
        }
      });
    });
    
    return imbalanced;
  }

  /**
   * Update average wait time
   * @private
   */
  _updateAverageWaitTime(waitTime) {
    const alpha = 0.1; // Exponential moving average factor
    this.metrics.averageWaitTime = 
      (1 - alpha) * this.metrics.averageWaitTime + alpha * waitTime;
  }

  /**
   * Update load metrics
   * @private
   */
  _updateLoadMetrics() {
    const currentLoad = this._calculateCurrentLoad();
    
    if (currentLoad > this.metrics.peakLoad) {
      this.metrics.peakLoad = currentLoad;
    }
    
    // Update load distribution
    for (const [type, pool] of this.agentPools) {
      let typeLoad = 0;
      pool.forEach(agent => {
        const metrics = this.metrics.agentUtilization.get(agent.agent_id);
        if (metrics) {
          typeLoad += metrics.currentLoad;
        }
      });
      
      this.metrics.loadDistribution.set(type, typeLoad / pool.length);
    }
    
    this.metrics.lastMetricsUpdate = Date.now();
  }

  /**
   * Simple hash code function
   * @private
   */
  _hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  /**
   * Select optimal agent from candidates
   * @param {Array} candidates - Array of candidate agents
   * @param {Object} options - Selection options
   * @returns {Object} Selected agent
   */
  selectAgent(candidates, options = {}) {
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidate agents provided');
    }

    const {
      considerWorkload = true,
      preferenceHistory = {},
      userPriority = 'normal',
      strategy = 'adaptive'
    } = options;

    // If only one candidate, return it
    if (candidates.length === 1) {
      return candidates[0];
    }

    // Filter out unavailable agents
    const availableAgents = candidates.filter(agent => {
      const circuitBreaker = this.circuitBreakers.get(agent.id || agent.agent_id);
      return !circuitBreaker || circuitBreaker.state !== 'open';
    });

    if (availableAgents.length === 0) {
      throw new Error('No available agents after filtering');
    }

    // Apply load balancing strategy
    let selectedAgent;
    
    if (considerWorkload) {
      // Find agent with least load
      selectedAgent = availableAgents.reduce((best, agent) => {
        const agentId = agent.id || agent.agent_id;
        const bestId = best.id || best.agent_id;
        
        const agentMetrics = this.metrics.agentUtilization.get(agentId) || { currentLoad: 0 };
        const bestMetrics = this.metrics.agentUtilization.get(bestId) || { currentLoad: 0 };
        
        return agentMetrics.currentLoad < bestMetrics.currentLoad ? agent : best;
      });
    } else {
      // Use specified strategy
      const agentType = availableAgents[0].type;
      const strategyFn = this.strategies[strategy] || this.strategies.adaptive;
      selectedAgent = strategyFn(agentType, { candidates: availableAgents });
      
      // Fallback if strategy returns null
      if (!selectedAgent) {
        selectedAgent = availableAgents[0];
      }
    }

    // Apply user preferences if available
    if (Object.keys(preferenceHistory).length > 0) {
      const preferredAgent = availableAgents.find(agent => {
        const agentId = agent.id || agent.agent_id;
        return preferenceHistory[agentId] && preferenceHistory[agentId].satisfaction > 0.7;
      });
      
      if (preferredAgent) {
        selectedAgent = preferredAgent;
      }
    }

    return selectedAgent;
  }

  /**
   * Get detailed metrics
   * @returns {Object} Detailed metrics
   */
  getDetailedMetrics() {
    return {
      ...this.metrics,
      agentUtilization: Array.from(this.metrics.agentUtilization.entries()).map(([id, metrics]) => ({
        agentId: id,
        ...metrics
      })),
      loadDistribution: Array.from(this.metrics.loadDistribution.entries()).map(([type, load]) => ({
        agentType: type,
        averageLoad: load
      })),
      backpressure: { ...this.backpressure },
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([id, breaker]) => ({
        agentId: id,
        ...breaker
      }))
    };
  }
}

module.exports = LoadBalancer;