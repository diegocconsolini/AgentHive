const { randomUUID } = require('crypto');

/**
 * Agent State Model
 * Represents an agent's current state, performance metrics, and capabilities
 */
class AgentState {
  /**
   * Agent status constants
   */
  static STATUS = {
    ACTIVE: 'active',
    IDLE: 'idle', 
    BUSY: 'busy',
    ERROR: 'error'
  };

  /**
   * Agent type constants
   */
  static TYPE = {
    BACKEND_ARCHITECT: 'backend-architect',
    BACKEND_DEVELOPER: 'backend-developer',
    DATABASE_OPTIMIZER: 'database-optimizer',
    FILE_ANALYZER: 'file-analyzer',
    CODE_ANALYZER: 'code-analyzer',
    TEST_RUNNER: 'test-runner',
    PARALLEL_WORKER: 'parallel-worker'
  };

  /**
   * Create a new AgentState instance
   * @param {Object} data - Initial agent state data
   * @param {string} data.agent_id - Unique agent identifier (UUID)
   * @param {string} data.type - Agent type from AgentState.TYPE constants
   * @param {string} data.status - Current status from AgentState.STATUS constants
   * @param {Object} data.current_task - Current task information
   * @param {Array<string>} data.capabilities - Array of agent capabilities
   * @param {Object} data.performance_metrics - Performance tracking metrics
   * @param {Object} data.memory_usage - Memory usage statistics
   * @param {string} data.created - Creation timestamp (ISO string)
   * @param {string} data.updated - Last update timestamp (ISO string)
   */
  constructor(data = {}) {
    // Core required fields
    this.agent_id = data.agent_id || this._generateId();
    this.type = data.type || AgentState.TYPE.BACKEND_DEVELOPER;
    this.status = data.status || AgentState.STATUS.IDLE;
    
    // Timestamps
    const now = new Date().toISOString();
    this.created = data.created || now;
    this.updated = data.updated || now;
    
    // Current task information
    this.current_task = {
      task_id: null,
      issue_number: null,
      stream: null,
      started_at: null,
      estimated_completion: null,
      ...data.current_task
    };
    
    // Agent capabilities - defaults based on type
    this.capabilities = data.capabilities || this._getDefaultCapabilities();
    
    // Performance metrics tracking
    this.performance_metrics = {
      success_rate: 0.0,
      avg_completion_time: 0.0,
      context_efficiency: 0.0,
      total_tasks_completed: 0,
      total_tasks_failed: 0,
      total_execution_time: 0.0,
      last_performance_update: now,
      ...data.performance_metrics
    };
    
    // Memory usage tracking
    this.memory_usage = {
      contexts_active: 0,
      memory_size: 0.0,
      peak_memory_size: 0.0,
      last_cleanup: now,
      cleanup_frequency: 3600000, // 1 hour in ms
      retention_policy: 'default',
      ...data.memory_usage
    };
  }

  /**
   * Generate a UUID for new agent states
   * @returns {string} UUID string
   * @private
   */
  _generateId() {
    return randomUUID();
  }

  /**
   * Get default capabilities based on agent type
   * @returns {Array<string>} Array of capability strings
   * @private
   */
  _getDefaultCapabilities() {
    const capabilityMap = {
      [AgentState.TYPE.BACKEND_ARCHITECT]: [
        'api-design',
        'service-architecture',
        'database-design',
        'caching-strategies',
        'security-patterns',
        'scalability-planning'
      ],
      [AgentState.TYPE.BACKEND_DEVELOPER]: [
        'code-implementation',
        'unit-testing',
        'debugging',
        'refactoring',
        'performance-optimization',
        'documentation'
      ],
      [AgentState.TYPE.DATABASE_OPTIMIZER]: [
        'schema-design',
        'index-optimization',
        'query-tuning',
        'migration-scripts',
        'constraint-management',
        'performance-analysis'
      ],
      [AgentState.TYPE.FILE_ANALYZER]: [
        'file-summarization',
        'log-analysis',
        'content-extraction',
        'size-reduction',
        'pattern-detection'
      ],
      [AgentState.TYPE.CODE_ANALYZER]: [
        'bug-detection',
        'code-review',
        'security-analysis',
        'complexity-analysis',
        'dependency-tracking'
      ],
      [AgentState.TYPE.TEST_RUNNER]: [
        'test-execution',
        'result-analysis',
        'coverage-reporting',
        'performance-testing',
        'integration-testing'
      ],
      [AgentState.TYPE.PARALLEL_WORKER]: [
        'workflow-coordination',
        'task-distribution',
        'progress-tracking',
        'conflict-resolution',
        'synchronization'
      ]
    };
    
    return capabilityMap[this.type] || ['generic-processing'];
  }

  /**
   * Convert agent state to plain object
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      agent_id: this.agent_id,
      type: this.type,
      status: this.status,
      created: this.created,
      updated: this.updated,
      current_task: this.current_task,
      capabilities: this.capabilities,
      performance_metrics: this.performance_metrics,
      memory_usage: this.memory_usage
    };
  }

  /**
   * Serialize agent state to JSON string
   * @returns {string} JSON representation
   */
  serialize() {
    return JSON.stringify(this.toObject());
  }

  /**
   * Create AgentState instance from JSON string
   * @param {string} jsonString - JSON string representation
   * @returns {AgentState} New AgentState instance
   * @static
   */
  static deserialize(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return new AgentState(data);
    } catch (error) {
      throw new Error(`Failed to deserialize agent state: ${error.message}`);
    }
  }

  /**
   * Create AgentState instance from plain object with validation
   * @param {Object} data - Agent state data
   * @returns {AgentState} New AgentState instance
   * @throws {Error} If validation fails
   * @static
   */
  static fromObject(data) {
    const agentState = new AgentState(data);
    const validation = agentState.validate();
    
    if (!validation.isValid) {
      throw new Error(`Invalid agent state data: ${validation.errors.join(', ')}`);
    }
    
    return agentState;
  }

  /**
   * Validate the agent state
   * @param {boolean} isUpdate - Whether this is an update validation
   * @returns {Object} Validation result with isValid and errors
   */
  validate(isUpdate = false) {
    const errors = [];
    
    // Required field validation
    if (!isUpdate && !this.agent_id) {
      errors.push('agent_id is required');
    }
    
    if (!Object.values(AgentState.TYPE).includes(this.type)) {
      errors.push(`Invalid agent type: ${this.type}`);
    }
    
    if (!Object.values(AgentState.STATUS).includes(this.status)) {
      errors.push(`Invalid agent status: ${this.status}`);
    }
    
    // Capabilities validation
    if (!Array.isArray(this.capabilities)) {
      errors.push('capabilities must be an array');
    }
    
    // Performance metrics validation
    if (typeof this.performance_metrics.success_rate !== 'number' || 
        this.performance_metrics.success_rate < 0 || 
        this.performance_metrics.success_rate > 1) {
      errors.push('success_rate must be a number between 0 and 1');
    }
    
    if (typeof this.performance_metrics.avg_completion_time !== 'number' || 
        this.performance_metrics.avg_completion_time < 0) {
      errors.push('avg_completion_time must be a non-negative number');
    }
    
    // Memory usage validation
    if (typeof this.memory_usage.memory_size !== 'number' || 
        this.memory_usage.memory_size < 0) {
      errors.push('memory_size must be a non-negative number');
    }
    
    if (typeof this.memory_usage.contexts_active !== 'number' || 
        this.memory_usage.contexts_active < 0) {
      errors.push('contexts_active must be a non-negative number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Update agent state properties and refresh timestamp
   * @param {Object} updates - Properties to update
   * @returns {AgentState} Returns this for chaining
   */
  update(updates) {
    // Update specific properties
    Object.keys(updates).forEach(key => {
      if (key !== 'agent_id' && key !== 'created' && this.hasOwnProperty(key)) {
        if (key === 'current_task' || key === 'performance_metrics' || key === 'memory_usage') {
          // Merge objects rather than replace
          this[key] = { ...this[key], ...updates[key] };
        } else {
          this[key] = updates[key];
        }
      }
    });
    
    // Always update the timestamp
    this.updated = new Date().toISOString();
    
    return this;
  }

  /**
   * Start a new task
   * @param {Object} taskInfo - Task information
   * @param {string} taskInfo.task_id - Task identifier
   * @param {number} taskInfo.issue_number - GitHub issue number
   * @param {string} taskInfo.stream - Stream identifier
   * @param {number} taskInfo.estimated_duration - Estimated duration in minutes
   * @returns {AgentState} Returns this for chaining
   */
  startTask(taskInfo) {
    const now = new Date().toISOString();
    const estimatedMs = (taskInfo.estimated_duration || 60) * 60 * 1000; // Convert to ms
    
    this.status = AgentState.STATUS.BUSY;
    this.current_task = {
      task_id: taskInfo.task_id,
      issue_number: taskInfo.issue_number,
      stream: taskInfo.stream,
      started_at: now,
      estimated_completion: new Date(Date.now() + estimatedMs).toISOString()
    };
    this.updated = now;
    
    return this;
  }

  /**
   * Complete the current task and update performance metrics
   * @param {boolean} success - Whether the task was successful
   * @param {Object} metrics - Additional metrics to record
   * @param {number} metrics.execution_time - Actual execution time in ms
   * @param {number} metrics.memory_peak - Peak memory usage during task
   * @returns {AgentState} Returns this for chaining
   */
  completeTask(success = true, metrics = {}) {
    const now = new Date().toISOString();
    const startTime = this.current_task.started_at ? new Date(this.current_task.started_at) : new Date();
    const actualExecutionTime = metrics.execution_time || (Date.now() - startTime.getTime());
    
    // Update performance metrics
    this.performance_metrics.total_tasks_completed += success ? 1 : 0;
    this.performance_metrics.total_tasks_failed += success ? 0 : 1;
    this.performance_metrics.total_execution_time += actualExecutionTime;
    
    const totalTasks = this.performance_metrics.total_tasks_completed + this.performance_metrics.total_tasks_failed;
    this.performance_metrics.success_rate = totalTasks > 0 ? 
      this.performance_metrics.total_tasks_completed / totalTasks : 0;
    
    this.performance_metrics.avg_completion_time = this.performance_metrics.total_tasks_completed > 0 ?
      this.performance_metrics.total_execution_time / this.performance_metrics.total_tasks_completed : 0;
    
    this.performance_metrics.last_performance_update = now;
    
    // Update memory usage if provided
    if (metrics.memory_peak) {
      this.memory_usage.peak_memory_size = Math.max(
        this.memory_usage.peak_memory_size, 
        metrics.memory_peak
      );
    }
    
    // Calculate context efficiency (contexts per MB of memory)
    this.performance_metrics.context_efficiency = this.memory_usage.memory_size > 0 ?
      this.memory_usage.contexts_active / this.memory_usage.memory_size : 0;
    
    // Clear current task and set status
    this.current_task = {
      task_id: null,
      issue_number: null,
      stream: null,
      started_at: null,
      estimated_completion: null
    };
    
    this.status = success ? AgentState.STATUS.ACTIVE : AgentState.STATUS.ERROR;
    this.updated = now;
    
    return this;
  }

  /**
   * Update memory usage statistics
   * @param {Object} usage - Memory usage information
   * @param {number} usage.contexts_active - Number of active contexts
   * @param {number} usage.memory_size - Current memory size in MB
   * @returns {AgentState} Returns this for chaining
   */
  updateMemoryUsage(usage) {
    this.memory_usage.contexts_active = usage.contexts_active || this.memory_usage.contexts_active;
    this.memory_usage.memory_size = usage.memory_size || this.memory_usage.memory_size;
    
    // Update peak if current is higher
    if (usage.memory_size && usage.memory_size > this.memory_usage.peak_memory_size) {
      this.memory_usage.peak_memory_size = usage.memory_size;
    }
    
    // Recalculate context efficiency
    this.performance_metrics.context_efficiency = this.memory_usage.memory_size > 0 ?
      this.memory_usage.contexts_active / this.memory_usage.memory_size : 0;
    
    this.updated = new Date().toISOString();
    return this;
  }

  /**
   * Perform memory cleanup and update statistics
   * @param {Object} cleanupResults - Results of cleanup operation
   * @param {number} cleanupResults.contexts_freed - Number of contexts freed
   * @param {number} cleanupResults.memory_freed - Memory freed in MB
   * @returns {AgentState} Returns this for chaining
   */
  performCleanup(cleanupResults = {}) {
    const now = new Date().toISOString();
    
    // Update memory usage after cleanup
    this.memory_usage.contexts_active -= cleanupResults.contexts_freed || 0;
    this.memory_usage.memory_size -= cleanupResults.memory_freed || 0;
    this.memory_usage.last_cleanup = now;
    
    // Ensure non-negative values
    this.memory_usage.contexts_active = Math.max(0, this.memory_usage.contexts_active);
    this.memory_usage.memory_size = Math.max(0, this.memory_usage.memory_size);
    
    // Recalculate context efficiency
    this.performance_metrics.context_efficiency = this.memory_usage.memory_size > 0 ?
      this.memory_usage.contexts_active / this.memory_usage.memory_size : 0;
    
    this.updated = now;
    return this;
  }

  /**
   * Check if memory cleanup is needed
   * @returns {boolean} True if cleanup is needed
   */
  needsCleanup() {
    const now = Date.now();
    const lastCleanup = new Date(this.memory_usage.last_cleanup).getTime();
    return (now - lastCleanup) > this.memory_usage.cleanup_frequency;
  }

  /**
   * Add a capability to the agent
   * @param {string} capability - Capability to add
   * @returns {AgentState} Returns this for chaining
   */
  addCapability(capability) {
    if (!this.capabilities.includes(capability)) {
      this.capabilities.push(capability);
      this.updated = new Date().toISOString();
    }
    return this;
  }

  /**
   * Remove a capability from the agent
   * @param {string} capability - Capability to remove
   * @returns {AgentState} Returns this for chaining
   */
  removeCapability(capability) {
    const index = this.capabilities.indexOf(capability);
    if (index !== -1) {
      this.capabilities.splice(index, 1);
      this.updated = new Date().toISOString();
    }
    return this;
  }

  /**
   * Check if agent has a specific capability
   * @param {string} capability - Capability to check
   * @returns {boolean} True if agent has capability
   */
  hasCapability(capability) {
    return this.capabilities.includes(capability);
  }

  /**
   * Get agent's current workload as a percentage
   * @returns {number} Workload percentage (0-100)
   */
  getWorkloadPercentage() {
    if (this.status === AgentState.STATUS.IDLE) return 0;
    if (this.status === AgentState.STATUS.ERROR) return 100;
    if (this.status === AgentState.STATUS.BUSY) {
      // Calculate based on estimated completion time
      if (this.current_task.estimated_completion) {
        const now = Date.now();
        const started = new Date(this.current_task.started_at).getTime();
        const estimated = new Date(this.current_task.estimated_completion).getTime();
        const elapsed = now - started;
        const total = estimated - started;
        return Math.min(100, Math.max(0, (elapsed / total) * 100));
      }
      return 75; // Default busy percentage
    }
    return 50; // Default active percentage
  }

  /**
   * Get performance summary
   * @returns {Object} Performance summary
   */
  getPerformanceSummary() {
    return {
      success_rate: `${(this.performance_metrics.success_rate * 100).toFixed(1)}%`,
      avg_completion_time: `${(this.performance_metrics.avg_completion_time / 1000 / 60).toFixed(1)}m`,
      context_efficiency: this.performance_metrics.context_efficiency.toFixed(2),
      total_tasks: this.performance_metrics.total_tasks_completed + this.performance_metrics.total_tasks_failed,
      memory_usage: `${this.memory_usage.memory_size.toFixed(1)}MB (${this.memory_usage.contexts_active} contexts)`
    };
  }

  /**
   * Clone this agent state with new ID
   * @param {Object} overrides - Properties to override in the clone
   * @returns {AgentState} New AgentState instance
   */
  clone(overrides = {}) {
    const data = {
      ...this.toObject(),
      agent_id: this._generateId(),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      ...overrides
    };
    return new AgentState(data);
  }

  /**
   * Get a summary of the agent state for debugging/logging
   * @returns {string} Summary string
   */
  getSummary() {
    const workload = this.getWorkloadPercentage();
    const performance = this.getPerformanceSummary();
    
    return `AgentState[${this.agent_id.substring(0, 8)}...] ${this.type} (${this.status}) - ` +
           `Workload: ${workload}%, Success: ${performance.success_rate}, ` +
           `Memory: ${performance.memory_usage}, Tasks: ${performance.total_tasks}`;
  }
}

module.exports = AgentState;