/**
 * AgentMeshCoordinator - Multi-Agent Parallel Execution Coordinator
 * 
 * Extends the existing AgentOrchestrator to support mesh-style execution
 * where multiple agents from the 88-agent pool work together on complex tasks
 * through intelligent decomposition and parallel execution.
 */

const AgentOrchestrator = require('../orchestration/AgentOrchestrator');
const TaskDecomposer = require('./TaskDecomposer');
const AgentMessageBus = require('./AgentMessageBus');
const TurnController = require('./TurnController');
const ResultAggregator = require('./ResultAggregator');
const MeshSessionManager = require('./MeshSessionManager');

class AgentMeshCoordinator extends AgentOrchestrator {
  constructor(aiService) {
    super(aiService);
    
    // Initialize mesh-specific components
    this.taskDecomposer = new TaskDecomposer();
    this.messageBus = new AgentMessageBus();
    this.turnController = new TurnController({
      maxTurnsPerAgent: 5,
      maxTotalTurns: 20,
      tokenBudget: 100000,
      timeLimit: 300000, // 5 minutes
      costLimit: 10.00    // $10
    });
    this.resultAggregator = new ResultAggregator();
    this.sessionManager = null; // Will be initialized on first use
    
    // Mesh execution metrics
    this.meshMetrics = {
      sessionsCreated: 0,
      tasksDecomposed: 0,
      parallelExecutions: 0,
      totalTimeReduction: 0,
      averageAgentsPerTask: 0
    };
    
    console.log('🕸️ AgentMeshCoordinator initialized with mesh capabilities');
  }

  /**
   * Initialize session manager (lazy loading to avoid circular dependencies)
   */
  async _initializeSessionManager() {
    if (!this.sessionManager) {
      this.sessionManager = new MeshSessionManager(this.memoryManager.storageManager);
      await this.sessionManager.initialize();
    }
  }

  /**
   * Main mesh orchestration method - handles complex multi-agent tasks
   * @param {string} prompt - User request
   * @param {Object} options - Execution options
   * @param {string} userId - User identifier
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Object>} Mesh execution result
   */
  async orchestrateMeshRequest(prompt, options = {}, userId = null, sessionId = null) {
    const startTime = Date.now();
    console.log(`🕸️ MESH: Starting mesh orchestration for: "${prompt.substring(0, 100)}..."`);
    
    try {
      // Initialize dependencies
      await this._ensureMemoryManagerInitialized();
      await this._initializeSessionManager();
      
      // Create mesh session
      console.log(`📝 MESH: Creating mesh session`);
      const meshSession = await this.sessionManager.createSession({
        task: prompt,
        userId,
        originalSessionId: sessionId,
        maxTurns: options.maxTurns || 20,
        tokenBudget: options.tokenBudget || 100000,
        timeLimit: options.timeLimit || 300000
      });
      
      // Get base context
      const context = await this.getOrCreateContext(userId, sessionId);
      meshSession.context = context;
      
      // Decompose task into execution plan
      console.log(`🧩 MESH: Decomposing task`);
      const executionPlan = await this.taskDecomposer.decomposeTask(prompt, context);
      meshSession.executionPlan = executionPlan;
      
      // Update metrics
      this.meshMetrics.sessionsCreated++;
      this.meshMetrics.tasksDecomposed++;
      
      // Determine execution strategy
      const strategy = this.determineExecutionStrategy(executionPlan);
      console.log(`⚡ MESH: Using strategy: ${strategy}`);
      
      let finalResult;
      
      if (strategy === 'parallel' && executionPlan.parallelTasks.length > 0) {
        // Execute with parallel mesh approach
        finalResult = await this.executeWithParallelMesh(executionPlan, meshSession);
        this.meshMetrics.parallelExecutions++;
        
      } else if (strategy === 'hybrid') {
        // Execute with hybrid approach (parallel + sequential)
        finalResult = await this.executeWithHybridMesh(executionPlan, meshSession);
        this.meshMetrics.parallelExecutions++;
        
      } else {
        // Fallback to enhanced sequential execution
        finalResult = await this.executeWithEnhancedSequential(executionPlan, meshSession);
      }
      
      // Update session with final result
      await this.sessionManager.completeSession(meshSession.id, finalResult);
      
      // Record SSP pattern for learning
      await this.recordMeshPattern(meshSession, finalResult);
      
      const totalTime = Date.now() - startTime;
      const timeReduction = executionPlan.estimates.timeReduction || 0;
      this.meshMetrics.totalTimeReduction += timeReduction;
      
      console.log(`✅ MESH: Completed in ${totalTime}ms (saved ${timeReduction}ms through parallelization)`);
      
      return {
        success: true,
        result: finalResult.aggregatedResult,
        mesh: {
          sessionId: meshSession.id,
          strategy,
          executionTime: totalTime,
          timeReduction,
          agentsUsed: Array.from(meshSession.activeAgents),
          tasksExecuted: meshSession.completedTasks.length,
          tokensUsed: meshSession.totalTokens,
          cost: meshSession.totalCost,
          parallelizationBenefit: executionPlan.estimates.parallelizationBenefit
        },
        orchestrationDetails: {
          selectedAgent: 'mesh-coordinator',
          agentName: 'Mesh Coordinator',
          routingReason: `Mesh execution with ${meshSession.activeAgents.size} agents`,
          contextUsed: context.id,
          orchestrationTime: totalTime,
          memoryEnhanced: true
        }
      };
      
    } catch (error) {
      console.error(`❌ MESH: Error in mesh orchestration:`, error);
      
      // Fallback to single-agent execution using parent orchestrator
      console.log(`🔄 MESH: Falling back to single-agent execution`);
      return await super.orchestrateRequest(prompt, options, userId, sessionId);
    }
  }

  /**
   * Determine optimal execution strategy based on task decomposition
   * @param {Object} executionPlan - Task execution plan
   * @returns {string} Execution strategy
   */
  determineExecutionStrategy(executionPlan) {
    const { dag, parallelTasks, estimates } = executionPlan;
    
    // If task is very simple, use single agent
    if (dag.nodes.length <= 2) {
      return 'single';
    }
    
    // If significant parallel opportunities exist, use parallel mesh
    if (parallelTasks.length > 0 && estimates.parallelizationBenefit > 30) {
      return 'parallel';
    }
    
    // If mixed dependencies, use hybrid approach
    if (parallelTasks.length > 0 && dag.nodes.length > parallelTasks.flat().length) {
      return 'hybrid';
    }
    
    // Default to enhanced sequential
    return 'sequential';
  }

  /**
   * Execute with parallel mesh approach
   * @param {Object} executionPlan - Execution plan
   * @param {Object} meshSession - Mesh session
   * @returns {Promise<Object>} Execution result
   */
  async executeWithParallelMesh(executionPlan, meshSession) {
    console.log(`⚡ MESH: Executing parallel mesh with ${executionPlan.parallelTasks.length} parallel groups`);
    
    const results = new Map();
    
    // Execute parallel task groups
    for (const parallelGroup of executionPlan.parallelTasks) {
      console.log(`🔄 MESH: Executing parallel group with ${parallelGroup.length} tasks`);
      
      const groupPromises = parallelGroup.map(async (task) => {
        const agent = executionPlan.agentMapping[task.id];
        return await this.executeSingleMeshTask(task, agent, meshSession);
      });
      
      const groupResults = await Promise.all(groupPromises);
      
      // Store results
      groupResults.forEach((result, index) => {
        results.set(parallelGroup[index].id, result);
      });
    }
    
    // Execute any remaining sequential tasks
    const sequentialTasks = executionPlan.dag.nodes.filter(
      node => !executionPlan.parallelTasks.some(group => 
        group.some(task => task.id === node.id)
      )
    );
    
    for (const task of sequentialTasks) {
      // Check if dependencies are satisfied
      const dependenciesSatisfied = task.dependencies.every(depId => 
        results.has(depId) && results.get(depId).success
      );
      
      if (dependenciesSatisfied) {
        const agent = executionPlan.agentMapping[task.id];
        const taskContext = this.buildTaskContext(task, results);
        const result = await this.executeSingleMeshTask(task, agent, meshSession, taskContext);
        results.set(task.id, result);
      }
    }
    
    // Aggregate all results
    return await this.resultAggregator.aggregateResults(
      Array.from(results.values()),
      executionPlan,
      meshSession
    );
  }

  /**
   * Execute with hybrid mesh approach (parallel + sequential)
   * @param {Object} executionPlan - Execution plan
   * @param {Object} meshSession - Mesh session
   * @returns {Promise<Object>} Execution result
   */
  async executeWithHybridMesh(executionPlan, meshSession) {
    console.log(`🔀 MESH: Executing hybrid mesh`);
    
    const results = new Map();
    const { dag, parallelTasks } = executionPlan;
    
    // Execute tasks in dependency order, parallelizing where possible
    const processed = new Set();
    const queue = dag.entryPoints.slice();
    
    while (queue.length > 0) {
      // Find tasks ready to execute (dependencies satisfied)
      const readyTasks = queue.filter(task => 
        task.dependencies.every(depId => processed.has(depId))
      );
      
      if (readyTasks.length === 0) {
        // No ready tasks - might be circular dependency or error
        break;
      }
      
      // Group ready tasks by parallel opportunity
      const currentParallelGroup = [];
      const currentSequentialTasks = [];
      
      readyTasks.forEach(task => {
        const isInParallelGroup = parallelTasks.some(group => 
          group.some(pTask => pTask.id === task.id)
        );
        
        if (isInParallelGroup) {
          // Find the complete parallel group
          const parallelGroup = parallelTasks.find(group => 
            group.some(pTask => pTask.id === task.id)
          );
          
          if (parallelGroup.every(pTask => readyTasks.includes(pTask))) {
            currentParallelGroup.push(...parallelGroup);
          } else {
            currentSequentialTasks.push(task);
          }
        } else {
          currentSequentialTasks.push(task);
        }
      });
      
      // Execute parallel group
      if (currentParallelGroup.length > 0) {
        console.log(`⚡ MESH: Executing ${currentParallelGroup.length} tasks in parallel`);
        
        const parallelPromises = currentParallelGroup.map(async (task) => {
          const agent = executionPlan.agentMapping[task.id];
          const taskContext = this.buildTaskContext(task, results);
          return await this.executeSingleMeshTask(task, agent, meshSession, taskContext);
        });
        
        const parallelResults = await Promise.all(parallelPromises);
        
        parallelResults.forEach((result, index) => {
          results.set(currentParallelGroup[index].id, result);
          processed.add(currentParallelGroup[index].id);
        });
        
        // Remove from queue
        currentParallelGroup.forEach(task => {
          const index = queue.indexOf(task);
          if (index > -1) queue.splice(index, 1);
        });
      }
      
      // Execute sequential tasks
      for (const task of currentSequentialTasks) {
        const agent = executionPlan.agentMapping[task.id];
        const taskContext = this.buildTaskContext(task, results);
        const result = await this.executeSingleMeshTask(task, agent, meshSession, taskContext);
        
        results.set(task.id, result);
        processed.add(task.id);
        
        // Remove from queue
        const index = queue.indexOf(task);
        if (index > -1) queue.splice(index, 1);
      }
      
      // Add newly ready tasks to queue
      dag.nodes.forEach(node => {
        if (!processed.has(node.id) && !queue.includes(node) &&
            node.dependencies.every(depId => processed.has(depId))) {
          queue.push(node);
        }
      });
    }
    
    // Aggregate results
    return await this.resultAggregator.aggregateResults(
      Array.from(results.values()),
      executionPlan,
      meshSession
    );
  }

  /**
   * Execute with enhanced sequential approach
   * @param {Object} executionPlan - Execution plan
   * @param {Object} meshSession - Mesh session
   * @returns {Promise<Object>} Execution result
   */
  async executeWithEnhancedSequential(executionPlan, meshSession) {
    console.log(`📝 MESH: Executing enhanced sequential`);
    
    const results = new Map();
    const { criticalPath } = executionPlan;
    
    // Execute tasks along critical path
    for (const task of criticalPath) {
      const agent = executionPlan.agentMapping[task.id];
      const taskContext = this.buildTaskContext(task, results);
      const result = await this.executeSingleMeshTask(task, agent, meshSession, taskContext);
      
      results.set(task.id, result);
      
      // Early termination if critical task fails
      if (!result.success) {
        console.warn(`⚠️ MESH: Critical task ${task.id} failed, terminating`);
        break;
      }
    }
    
    // Aggregate results
    return await this.resultAggregator.aggregateResults(
      Array.from(results.values()),
      executionPlan,
      meshSession
    );
  }

  /**
   * Execute a single task within the mesh
   * @param {Object} task - Task to execute
   * @param {Object} agent - Assigned agent
   * @param {Object} meshSession - Mesh session
   * @param {Object} taskContext - Task-specific context
   * @returns {Promise<Object>} Task result
   */
  async executeSingleMeshTask(task, agent, meshSession, taskContext = null) {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 MESH: Executing task ${task.id} with agent ${agent.id}`);
      
      // Add agent to active set
      meshSession.activeAgents.add(agent.id);
      
      // Build enhanced prompt with task context
      let enhancedPrompt = task.description;
      if (taskContext) {
        enhancedPrompt += `\n\nContext from previous tasks:\n${taskContext}`;
      }
      
      // Apply turn-based execution controls
      const result = await this.turnController.executeWithLimits(
        {
          execute: async (taskPrompt) => {
            return await this.executeAgentWithProvider(
              agent,
              taskPrompt,
              {},
              meshSession.context
            );
          }
        },
        { description: enhancedPrompt },
        meshSession
      );
      
      // Update session metrics
      meshSession.totalTokens += result.tokens || 0;
      meshSession.totalCost += result.cost || 0;
      
      const executionTime = Date.now() - startTime;
      
      // Record task completion
      meshSession.completedTasks.push({
        taskId: task.id,
        agentId: agent.id,
        success: result.success !== false,
        duration: executionTime,
        tokens: result.tokens || 0,
        cost: result.cost || 0
      });
      
      // Send message to mesh network
      await this.messageBus.publish(
        'task-completed',
        {
          taskId: task.id,
          agentId: agent.id,
          success: result.success !== false,
          duration: executionTime
        },
        agent.id,
        meshSession.id
      );
      
      console.log(`✅ MESH: Task ${task.id} completed in ${executionTime}ms`);
      
      return {
        taskId: task.id,
        agentId: agent.id,
        success: result.success !== false,
        result: result.output || result.response || '',
        duration: executionTime,
        tokens: result.tokens || 0,
        cost: result.cost || 0,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ MESH: Task ${task.id} failed:`, error);
      
      const executionTime = Date.now() - startTime;
      
      return {
        taskId: task.id,
        agentId: agent.id,
        success: false,
        result: '',
        error: error.message,
        duration: executionTime,
        tokens: 0,
        cost: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Build context for task execution from previous results
   * @param {Object} task - Current task
   * @param {Map} results - Previous task results
   * @returns {string} Task context
   */
  buildTaskContext(task, results) {
    if (!task.dependencies || task.dependencies.length === 0) {
      return null;
    }
    
    const contextParts = [];
    
    task.dependencies.forEach(depId => {
      const depResult = results.get(depId);
      if (depResult && depResult.success) {
        contextParts.push(`${depId}: ${depResult.result.substring(0, 200)}...`);
      }
    });
    
    return contextParts.length > 0 ? contextParts.join('\n\n') : null;
  }

  /**
   * Record mesh execution pattern for SSP learning
   * @param {Object} meshSession - Completed mesh session
   * @param {Object} finalResult - Final execution result
   */
  async recordMeshPattern(meshSession, finalResult) {
    try {
      if (!this.sspService) return;
      
      const pattern = {
        type: 'mesh-execution',
        taskComplexity: meshSession.executionPlan.analysis.complexity,
        agentsUsed: Array.from(meshSession.activeAgents),
        executionStrategy: this.determineExecutionStrategy(meshSession.executionPlan),
        success: finalResult.success,
        duration: Date.now() - new Date(meshSession.startTime).getTime(),
        costEfficiency: meshSession.totalCost,
        parallelizationBenefit: meshSession.executionPlan.estimates.parallelizationBenefit
      };
      
      await this.sspService.recordPattern(
        'mesh-coordinator',
        pattern,
        meshSession.userId,
        meshSession.id
      );
      
      console.log(`📊 MESH: Recorded mesh pattern for future optimization`);
      
    } catch (error) {
      console.error('Failed to record mesh pattern:', error.message);
    }
  }

  /**
   * Get mesh coordinator statistics
   * @returns {Object} Mesh statistics
   */
  getMeshStatistics() {
    const baseStats = this.getStatistics();
    
    return {
      ...baseStats,
      mesh: {
        ...this.meshMetrics,
        averageAgentsPerTask: this.meshMetrics.sessionsCreated > 0 
          ? this.meshMetrics.averageAgentsPerTask / this.meshMetrics.sessionsCreated 
          : 0,
        averageTimeReduction: this.meshMetrics.parallelExecutions > 0
          ? this.meshMetrics.totalTimeReduction / this.meshMetrics.parallelExecutions
          : 0
      }
    };
  }

  /**
   * Check if request should use mesh execution
   * @param {string} prompt - User request
   * @param {Object} options - Execution options
   * @returns {boolean} Should use mesh
   */
  shouldUseMesh(prompt, options = {}) {
    // Force mesh if explicitly requested
    if (options.forceMesh) return true;
    
    // Disable mesh if explicitly disabled
    if (options.disableMesh) return false;
    
    // Use mesh for complex tasks
    const taskLower = prompt.toLowerCase();
    const complexPatterns = [
      'build', 'create', 'develop', 'implement', 'design',
      'full', 'complete', 'comprehensive', 'entire',
      'system', 'application', 'platform', 'solution',
      'architecture', 'infrastructure', 'production'
    ];
    
    const hasComplexPattern = complexPatterns.some(pattern => 
      taskLower.includes(pattern)
    );
    
    const wordCount = prompt.split(/\s+/).length;
    const hasMultipleRequirements = taskLower.includes(' and ') || 
                                   taskLower.includes(' with ') || 
                                   taskLower.includes(' including ');
    
    return hasComplexPattern || wordCount > 20 || hasMultipleRequirements;
  }

  /**
   * Enhanced orchestration that chooses between mesh and single-agent
   * @param {string} prompt - User request
   * @param {Object} options - Execution options
   * @param {string} userId - User identifier
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Object>} Orchestration result
   */
  async orchestrateRequest(prompt, options = {}, userId = null, sessionId = null) {
    // Determine if we should use mesh execution
    if (this.shouldUseMesh(prompt, options)) {
      console.log(`🕸️ MESH: Using mesh execution for complex task`);
      return await this.orchestrateMeshRequest(prompt, options, userId, sessionId);
    } else {
      console.log(`🤖 SINGLE: Using single-agent execution for simple task`);
      return await super.orchestrateRequest(prompt, options, userId, sessionId);
    }
  }
}

module.exports = AgentMeshCoordinator;