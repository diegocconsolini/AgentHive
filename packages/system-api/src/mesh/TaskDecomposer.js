/**
 * TaskDecomposer - Intelligent Task Decomposition Engine
 * 
 * Decomposes complex tasks into Directed Acyclic Graphs (DAGs) and maps them
 * to optimal agents from the 88-agent pool for parallel execution.
 */

const AgentRegistry = require('../agents/AgentRegistry');
const CapabilityMatcher = require('../agents/CapabilityMatcher');
const agentConfig = require('../config/AgentConfig');

class TaskDecomposer {
  constructor() {
    this.agentRegistry = new AgentRegistry();
    this.capabilityMatcher = new CapabilityMatcher(this.agentRegistry);
    
    // Task complexity patterns
    this.complexityPatterns = {
      simple: [
        'help', 'what', 'how', 'show', 'list', 'get', 'find',
        'explain', 'define', 'tell me about'
      ],
      medium: [
        'analyze', 'review', 'optimize', 'debug', 'test', 'check',
        'create', 'build', 'implement', 'generate', 'write'
      ],
      complex: [
        'architect', 'design system', 'full stack', 'complete project',
        'e-commerce', 'platform', 'application', 'microservice',
        'infrastructure', 'enterprise', 'scalable', 'production'
      ]
    };

    // Domain-specific decomposition patterns
    this.decompositionPatterns = {
      'full-stack-web': {
        subtasks: [
          { id: 'architecture', type: 'design', dependencies: [] },
          { id: 'database-design', type: 'database', dependencies: ['architecture'] },
          { id: 'backend-api', type: 'backend', dependencies: ['database-design'] },
          { id: 'frontend-ui', type: 'frontend', dependencies: ['architecture'] },
          { id: 'integration', type: 'integration', dependencies: ['backend-api', 'frontend-ui'] },
          { id: 'testing', type: 'testing', dependencies: ['integration'] },
          { id: 'security', type: 'security', dependencies: ['backend-api', 'frontend-ui'] },
          { id: 'deployment', type: 'devops', dependencies: ['testing', 'security'] }
        ]
      },
      'api-development': {
        subtasks: [
          { id: 'api-design', type: 'architecture', dependencies: [] },
          { id: 'data-model', type: 'database', dependencies: ['api-design'] },
          { id: 'endpoints', type: 'backend', dependencies: ['data-model'] },
          { id: 'validation', type: 'backend', dependencies: ['endpoints'] },
          { id: 'testing', type: 'testing', dependencies: ['validation'] },
          { id: 'documentation', type: 'documentation', dependencies: ['endpoints'] }
        ]
      },
      'data-analysis': {
        subtasks: [
          { id: 'data-collection', type: 'data', dependencies: [] },
          { id: 'data-cleaning', type: 'data', dependencies: ['data-collection'] },
          { id: 'analysis', type: 'analysis', dependencies: ['data-cleaning'] },
          { id: 'visualization', type: 'visualization', dependencies: ['analysis'] },
          { id: 'reporting', type: 'documentation', dependencies: ['visualization'] }
        ]
      },
      'security-audit': {
        subtasks: [
          { id: 'vulnerability-scan', type: 'security', dependencies: [] },
          { id: 'code-analysis', type: 'security', dependencies: [] },
          { id: 'penetration-test', type: 'security', dependencies: ['vulnerability-scan'] },
          { id: 'report-generation', type: 'documentation', dependencies: ['code-analysis', 'penetration-test'] },
          { id: 'recommendations', type: 'security', dependencies: ['report-generation'] }
        ]
      }
    };

    // Agent capability to category mapping
    this.capabilityToCategory = {
      'code-generation': ['development', 'backend', 'frontend'],
      'architecture-design': ['architecture', 'design'],
      'code-analysis': ['security', 'testing', 'review'],
      'testing-debugging': ['testing', 'debug'],
      'deployment': ['devops', 'infrastructure'],
      'integration': ['integration', 'api'],
      'optimization': ['performance', 'database'],
      'performance-monitoring': ['monitoring', 'performance'],
      'documentation': ['documentation', 'technical-writing'],
      'data-processing': ['data', 'analysis']
    };
  }

  /**
   * Main decomposition method - analyzes task and creates execution plan
   * @param {string} task - The task to decompose
   * @param {Object} context - Additional context information
   * @returns {Object} Complete execution plan with DAG and agent mapping
   */
  async decomposeTask(task, context = {}) {
    console.log(`🔍 TaskDecomposer: Analyzing task: "${task.substring(0, 100)}..."`);
    
    try {
      // Step 1: Analyze task complexity and domain
      const analysis = await this.analyzeTask(task);
      console.log(`📊 Task analysis:`, analysis);
      
      // Step 2: Generate DAG based on pattern matching
      const dag = await this.generateDAG(task, analysis);
      console.log(`🌐 Generated DAG with ${dag.nodes.length} nodes`);
      
      // Step 3: Map tasks to specific agents
      const agentMapping = await this.mapTasksToAgents(dag.nodes, analysis);
      console.log(`🤖 Mapped tasks to ${Object.keys(agentMapping).length} agents`);
      
      // Step 4: Identify parallel execution opportunities
      const parallelTasks = this.identifyParallelTasks(dag);
      console.log(`⚡ Found ${parallelTasks.length} parallel tasks`);
      
      // Step 5: Calculate critical path
      const criticalPath = this.calculateCriticalPath(dag);
      console.log(`🎯 Critical path: ${criticalPath.map(n => n.id).join(' → ')}`);
      
      // Step 6: Estimate resources
      const estimates = await this.calculateEstimates(dag, agentMapping);
      console.log(`💰 Estimates:`, estimates);
      
      const executionPlan = {
        analysis,
        dag,
        agentMapping,
        parallelTasks,
        criticalPath,
        estimates,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ TaskDecomposer: Plan created successfully`);
      return executionPlan;
      
    } catch (error) {
      console.error(`❌ TaskDecomposer error:`, error);
      throw new Error(`Task decomposition failed: ${error.message}`);
    }
  }

  /**
   * Analyze task complexity, domain, and requirements
   * @param {string} task - Task description
   * @returns {Object} Task analysis results
   */
  async analyzeTask(task) {
    const taskLower = task.toLowerCase();
    
    // Estimate complexity
    const complexity = this.estimateComplexity(taskLower);
    
    // Identify domain
    const domain = this.identifyDomain(taskLower);
    
    // Extract keywords
    const keywords = this.extractKeywords(taskLower);
    
    // Identify required capabilities
    const requiredCapabilities = this.identifyRequiredCapabilities(taskLower, domain);
    
    // Estimate scope
    const scope = this.estimateScope(taskLower, complexity);
    
    return {
      complexity,
      domain,
      keywords,
      requiredCapabilities,
      scope,
      originalTask: task
    };
  }

  /**
   * Estimate task complexity based on patterns
   * @param {string} taskLower - Lowercase task description
   * @returns {string} Complexity level
   */
  estimateComplexity(taskLower) {
    // Check for complex patterns first
    if (this.complexityPatterns.complex.some(pattern => taskLower.includes(pattern))) {
      return 'complex';
    }
    
    // Check for medium patterns
    if (this.complexityPatterns.medium.some(pattern => taskLower.includes(pattern))) {
      return 'medium';
    }
    
    // Check word count and sentence structure
    const wordCount = taskLower.split(/\s+/).length;
    const hasMultipleRequirements = taskLower.includes(' and ') || taskLower.includes(' with ') || taskLower.includes(' including ');
    
    if (wordCount > 20 || hasMultipleRequirements) {
      return 'medium';
    }
    
    return 'simple';
  }

  /**
   * Identify the primary domain of the task
   * @param {string} taskLower - Lowercase task description
   * @returns {string} Domain identifier
   */
  identifyDomain(taskLower) {
    const domainPatterns = {
      'full-stack-web': ['full stack', 'web application', 'website', 'e-commerce', 'web app'],
      'api-development': ['api', 'rest', 'graphql', 'endpoint', 'microservice'],
      'frontend': ['react', 'vue', 'angular', 'ui', 'user interface', 'frontend'],
      'backend': ['server', 'backend', 'database', 'node.js', 'express'],
      'mobile': ['mobile', 'ios', 'android', 'app', 'react native', 'flutter'],
      'data-analysis': ['data', 'analysis', 'analytics', 'machine learning', 'ml'],
      'security-audit': ['security', 'audit', 'vulnerability', 'penetration test'],
      'devops': ['deploy', 'ci/cd', 'docker', 'kubernetes', 'infrastructure'],
      'testing': ['test', 'testing', 'automation', 'qa', 'quality assurance']
    };
    
    for (const [domain, patterns] of Object.entries(domainPatterns)) {
      if (patterns.some(pattern => taskLower.includes(pattern))) {
        return domain;
      }
    }
    
    return 'general';
  }

  /**
   * Extract relevant keywords from task
   * @param {string} taskLower - Lowercase task description
   * @returns {Array} Array of keywords
   */
  extractKeywords(taskLower) {
    // Remove stop words and extract meaningful keywords
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    return taskLower
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 10); // Limit to top 10 keywords
  }

  /**
   * Identify required capabilities based on task content
   * @param {string} taskLower - Lowercase task description
   * @param {string} domain - Identified domain
   * @returns {Array} Required capabilities
   */
  identifyRequiredCapabilities(taskLower, domain) {
    const capabilities = new Set();
    
    // Domain-based capabilities
    const domainCapabilities = {
      'full-stack-web': ['code-generation', 'architecture-design', 'integration', 'testing-debugging'],
      'api-development': ['code-generation', 'architecture-design', 'integration'],
      'frontend': ['code-generation', 'architecture-design'],
      'backend': ['code-generation', 'architecture-design', 'optimization'],
      'security-audit': ['code-analysis', 'testing-debugging'],
      'data-analysis': ['data-processing', 'code-generation'],
      'devops': ['deployment', 'integration', 'performance-monitoring']
    };
    
    if (domainCapabilities[domain]) {
      domainCapabilities[domain].forEach(cap => capabilities.add(cap));
    }
    
    // Keyword-based capabilities
    const keywordCapabilities = {
      'security': ['code-analysis', 'testing-debugging'],
      'performance': ['optimization', 'performance-monitoring'],
      'test': ['testing-debugging'],
      'deploy': ['deployment'],
      'analyze': ['code-analysis', 'data-processing'],
      'design': ['architecture-design'],
      'build': ['code-generation'],
      'integrate': ['integration'],
      'document': ['documentation']
    };
    
    for (const [keyword, caps] of Object.entries(keywordCapabilities)) {
      if (taskLower.includes(keyword)) {
        caps.forEach(cap => capabilities.add(cap));
      }
    }
    
    return Array.from(capabilities);
  }

  /**
   * Estimate task scope
   * @param {string} taskLower - Lowercase task description
   * @param {string} complexity - Task complexity
   * @returns {Object} Scope estimation
   */
  estimateScope(taskLower, complexity) {
    const scopeFactors = {
      simple: { minTasks: 1, maxTasks: 3, avgDuration: 300 }, // 5 minutes
      medium: { minTasks: 3, maxTasks: 8, avgDuration: 1800 }, // 30 minutes
      complex: { minTasks: 8, maxTasks: 20, avgDuration: 7200 } // 2 hours
    };
    
    const baseScope = scopeFactors[complexity];
    
    // Adjust based on keywords
    let multiplier = 1;
    if (taskLower.includes('complete') || taskLower.includes('full')) multiplier *= 1.5;
    if (taskLower.includes('production') || taskLower.includes('enterprise')) multiplier *= 1.3;
    if (taskLower.includes('simple') || taskLower.includes('basic')) multiplier *= 0.7;
    
    return {
      estimatedTasks: Math.round(baseScope.minTasks * multiplier),
      maxTasks: Math.round(baseScope.maxTasks * multiplier),
      estimatedDuration: Math.round(baseScope.avgDuration * multiplier)
    };
  }

  /**
   * Generate DAG based on task analysis and patterns
   * @param {string} task - Original task
   * @param {Object} analysis - Task analysis
   * @returns {Object} DAG structure
   */
  async generateDAG(task, analysis) {
    const { domain, complexity, scope } = analysis;
    
    // Use predefined pattern if available
    if (this.decompositionPatterns[domain]) {
      const pattern = this.decompositionPatterns[domain];
      return this.createDAGFromPattern(pattern, analysis);
    }
    
    // Generate dynamic DAG based on complexity and scope
    return this.generateDynamicDAG(task, analysis);
  }

  /**
   * Create DAG from predefined pattern
   * @param {Object} pattern - Decomposition pattern
   * @param {Object} analysis - Task analysis
   * @returns {Object} DAG structure
   */
  createDAGFromPattern(pattern, analysis) {
    const nodes = pattern.subtasks.map(subtask => ({
      id: subtask.id,
      type: subtask.type,
      description: this.generateSubtaskDescription(subtask, analysis),
      dependencies: subtask.dependencies,
      estimated_duration: this.estimateSubtaskDuration(subtask.type),
      complexity: this.estimateSubtaskComplexity(subtask.type)
    }));
    
    const edges = this.buildEdges(nodes);
    
    return {
      nodes,
      edges,
      entryPoints: nodes.filter(n => n.dependencies.length === 0),
      exitPoints: nodes.filter(n => !nodes.some(other => other.dependencies.includes(n.id)))
    };
  }

  /**
   * Generate dynamic DAG for unknown patterns
   * @param {string} task - Original task
   * @param {Object} analysis - Task analysis
   * @returns {Object} DAG structure
   */
  generateDynamicDAG(task, analysis) {
    const { complexity, requiredCapabilities } = analysis;
    
    const nodes = [];
    
    // Always start with planning/analysis
    nodes.push({
      id: 'analysis',
      type: 'planning',
      description: `Analyze requirements for: ${task}`,
      dependencies: [],
      estimated_duration: 300,
      complexity: 'simple'
    });
    
    // Add capability-based subtasks
    requiredCapabilities.forEach((capability, index) => {
      const taskId = `task_${index + 1}`;
      nodes.push({
        id: taskId,
        type: capability,
        description: this.generateCapabilityDescription(capability, task),
        dependencies: index === 0 ? ['analysis'] : [`task_${index}`],
        estimated_duration: this.estimateSubtaskDuration(capability),
        complexity: this.estimateSubtaskComplexity(capability)
      });
    });
    
    // Add final integration/testing if complex
    if (complexity === 'complex' && nodes.length > 2) {
      nodes.push({
        id: 'integration',
        type: 'integration',
        description: `Integrate and test complete solution`,
        dependencies: nodes.slice(-2).map(n => n.id),
        estimated_duration: 600,
        complexity: 'medium'
      });
    }
    
    const edges = this.buildEdges(nodes);
    
    return {
      nodes,
      edges,
      entryPoints: nodes.filter(n => n.dependencies.length === 0),
      exitPoints: nodes.filter(n => !nodes.some(other => other.dependencies.includes(n.id)))
    };
  }

  /**
   * Build edges from node dependencies
   * @param {Array} nodes - DAG nodes
   * @returns {Array} DAG edges
   */
  buildEdges(nodes) {
    const edges = [];
    
    nodes.forEach(node => {
      node.dependencies.forEach(depId => {
        edges.push({
          from: depId,
          to: node.id,
          type: 'dependency'
        });
      });
    });
    
    return edges;
  }

  /**
   * Generate subtask description
   * @param {Object} subtask - Subtask definition
   * @param {Object} analysis - Task analysis
   * @returns {string} Description
   */
  generateSubtaskDescription(subtask, analysis) {
    const descriptions = {
      architecture: `Design system architecture for ${analysis.domain} solution`,
      'database-design': `Design database schema and data models`,
      'backend-api': `Implement backend API endpoints and business logic`,
      'frontend-ui': `Create user interface and frontend components`,
      integration: `Integrate components and test system functionality`,
      testing: `Implement comprehensive testing suite`,
      security: `Implement security measures and audit`,
      deployment: `Deploy system to production environment`
    };
    
    return descriptions[subtask.id] || `Execute ${subtask.type} tasks`;
  }

  /**
   * Generate description for capability-based tasks
   * @param {string} capability - Capability type
   * @param {string} task - Original task
   * @returns {string} Description
   */
  generateCapabilityDescription(capability, task) {
    const descriptions = {
      'code-generation': `Generate code implementation`,
      'architecture-design': `Design system architecture`,
      'code-analysis': `Analyze and review code quality`,
      'testing-debugging': `Test functionality and debug issues`,
      'deployment': `Deploy and configure system`,
      'integration': `Integrate system components`,
      'optimization': `Optimize performance and efficiency`,
      'documentation': `Create documentation and guides`
    };
    
    return descriptions[capability] || `Execute ${capability} tasks`;
  }

  /**
   * Estimate subtask duration
   * @param {string} type - Subtask type
   * @returns {number} Duration in seconds
   */
  estimateSubtaskDuration(type) {
    const durations = {
      planning: 300,    // 5 minutes
      architecture: 600, // 10 minutes
      'code-generation': 900, // 15 minutes
      testing: 600,     // 10 minutes
      security: 450,    // 7.5 minutes
      integration: 600, // 10 minutes
      deployment: 300,  // 5 minutes
      documentation: 300 // 5 minutes
    };
    
    return durations[type] || 600; // Default 10 minutes
  }

  /**
   * Estimate subtask complexity
   * @param {string} type - Subtask type
   * @returns {string} Complexity level
   */
  estimateSubtaskComplexity(type) {
    const complexities = {
      planning: 'simple',
      architecture: 'complex',
      'code-generation': 'medium',
      testing: 'medium',
      security: 'complex',
      integration: 'complex',
      deployment: 'medium',
      documentation: 'simple'
    };
    
    return complexities[type] || 'medium';
  }

  /**
   * Map DAG nodes to specific agents
   * @param {Array} nodes - DAG nodes
   * @param {Object} analysis - Task analysis
   * @returns {Object} Agent mapping
   */
  async mapTasksToAgents(nodes, analysis) {
    const agentMapping = {};
    
    for (const node of nodes) {
      try {
        const agent = await this.selectAgentForTask(node, analysis);
        agentMapping[node.id] = agent;
      } catch (error) {
        console.warn(`Warning: Could not map agent for task ${node.id}:`, error.message);
        // Fallback to a general agent
        agentMapping[node.id] = {
          id: 'general-purpose',
          name: 'General Purpose Agent',
          confidence: 0.5
        };
      }
    }
    
    return agentMapping;
  }

  /**
   * Select optimal agent for a specific task
   * @param {Object} node - DAG node/task
   * @param {Object} analysis - Task analysis
   * @returns {Object} Selected agent
   */
  async selectAgentForTask(node, analysis) {
    // Convert task type to required capabilities
    const taskRequirements = {
      requiredCapabilities: this.getCapabilitiesForType(node.type),
      preferredCapabilities: [],
      complexity: node.complexity || 'medium',
      category: this.getCategoryForType(node.type),
      keywords: [node.type, ...analysis.keywords]
    };
    
    // Use existing capability matcher
    const availableAgents = this.agentRegistry.getAllAgents();
    const bestMatch = this.capabilityMatcher.findBestMatch(
      taskRequirements,
      availableAgents,
      'balanced'
    );
    
    if (!bestMatch.success) {
      throw new Error(`No suitable agent found for task type: ${node.type}`);
    }
    
    return {
      id: bestMatch.bestMatch,
      name: bestMatch.bestMatch,
      confidence: bestMatch.confidence,
      score: bestMatch.score,
      reasoning: bestMatch.reasoning
    };
  }

  /**
   * Get capabilities required for task type
   * @param {string} type - Task type
   * @returns {Array} Required capabilities
   */
  getCapabilitiesForType(type) {
    const typeCapabilities = {
      architecture: ['architecture-design'],
      'database-design': ['architecture-design', 'optimization'],
      'backend-api': ['code-generation', 'integration'],
      'frontend-ui': ['code-generation', 'architecture-design'],
      integration: ['integration', 'testing-debugging'],
      testing: ['testing-debugging'],
      security: ['code-analysis', 'testing-debugging'],
      deployment: ['deployment'],
      documentation: ['documentation'],
      planning: ['general-purpose'],
      'code-generation': ['code-generation'],
      'code-analysis': ['code-analysis'],
      optimization: ['optimization', 'performance-monitoring']
    };
    
    return typeCapabilities[type] || ['general-purpose'];
  }

  /**
   * Get category for task type
   * @param {string} type - Task type
   * @returns {string} Category
   */
  getCategoryForType(type) {
    const typeCategories = {
      architecture: 'architecture',
      'database-design': 'database',
      'backend-api': 'development',
      'frontend-ui': 'development',
      integration: 'development',
      testing: 'testing',
      security: 'security',
      deployment: 'devops',
      documentation: 'content',
      planning: 'general'
    };
    
    return typeCategories[type] || 'general';
  }

  /**
   * Identify tasks that can run in parallel
   * @param {Object} dag - DAG structure
   * @returns {Array} Groups of parallel tasks
   */
  identifyParallelTasks(dag) {
    const parallelGroups = [];
    const processed = new Set();
    
    // Find nodes that have the same dependencies
    dag.nodes.forEach(node => {
      if (processed.has(node.id)) return;
      
      const group = [node];
      const depSet = new Set(node.dependencies);
      
      // Find other nodes with same dependencies
      dag.nodes.forEach(other => {
        if (other.id !== node.id && !processed.has(other.id)) {
          const otherDepSet = new Set(other.dependencies);
          if (this.setsEqual(depSet, otherDepSet)) {
            group.push(other);
          }
        }
      });
      
      if (group.length > 1) {
        parallelGroups.push(group);
        group.forEach(n => processed.add(n.id));
      }
    });
    
    return parallelGroups;
  }

  /**
   * Calculate critical path through DAG
   * @param {Object} dag - DAG structure
   * @returns {Array} Critical path nodes
   */
  calculateCriticalPath(dag) {
    // Simple critical path calculation
    // Find path with longest total duration
    
    const pathDurations = new Map();
    const calculatePathDuration = (nodeId, visited = new Set()) => {
      if (visited.has(nodeId)) return 0; // Avoid cycles
      if (pathDurations.has(nodeId)) return pathDurations.get(nodeId);
      
      visited.add(nodeId);
      const node = dag.nodes.find(n => n.id === nodeId);
      if (!node) return 0;
      
      let maxDep = 0;
      node.dependencies.forEach(depId => {
        maxDep = Math.max(maxDep, calculatePathDuration(depId, new Set(visited)));
      });
      
      const duration = maxDep + (node.estimated_duration || 600);
      pathDurations.set(nodeId, duration);
      return duration;
    };
    
    // Calculate durations for all nodes
    dag.nodes.forEach(node => calculatePathDuration(node.id));
    
    // Find path with maximum duration
    const sortedNodes = dag.nodes.sort((a, b) => 
      pathDurations.get(b.id) - pathDurations.get(a.id)
    );
    
    // Build critical path by following dependencies
    const criticalPath = [];
    let current = sortedNodes[0];
    
    while (current) {
      criticalPath.push(current);
      
      // Find next node in critical path
      const nextNode = current.dependencies
        .map(depId => dag.nodes.find(n => n.id === depId))
        .filter(n => n)
        .sort((a, b) => pathDurations.get(b.id) - pathDurations.get(a.id))[0];
        
      current = nextNode;
    }
    
    return criticalPath.reverse();
  }

  /**
   * Calculate cost, time, and token estimates
   * @param {Object} dag - DAG structure
   * @param {Object} agentMapping - Agent assignments
   * @returns {Object} Estimates
   */
  async calculateEstimates(dag, agentMapping) {
    let totalDuration = 0;
    let totalCost = 0;
    let totalTokens = 0;
    
    // Calculate for critical path (sequential execution time)
    const criticalPath = this.calculateCriticalPath(dag);
    totalDuration = criticalPath.reduce((sum, node) => sum + (node.estimated_duration || 600), 0);
    
    // Calculate total cost and tokens for all tasks
    for (const node of dag.nodes) {
      const agent = agentMapping[node.id];
      if (agent) {
        // Base estimates - these would be refined with actual agent costs
        const nodeTokens = this.estimateTokensForTask(node);
        const nodeCost = this.estimateCostForTask(node, nodeTokens);
        
        totalTokens += nodeTokens;
        totalCost += nodeCost;
      }
    }
    
    // Parallel execution could reduce total time
    const parallelTasks = this.identifyParallelTasks(dag);
    const parallelTimeReduction = parallelTasks.reduce((reduction, group) => {
      if (group.length > 1) {
        const groupDuration = Math.max(...group.map(n => n.estimated_duration || 600));
        const sequentialDuration = group.reduce((sum, n) => sum + (n.estimated_duration || 600), 0);
        return reduction + (sequentialDuration - groupDuration);
      }
      return reduction;
    }, 0);
    
    const optimizedDuration = Math.max(300, totalDuration - parallelTimeReduction); // Minimum 5 minutes
    
    return {
      estimatedDuration: optimizedDuration,
      originalDuration: totalDuration,
      timeReduction: parallelTimeReduction,
      estimatedCost: Math.round(totalCost * 100) / 100, // Round to cents
      estimatedTokens: totalTokens,
      parallelizationBenefit: parallelTimeReduction > 0 ? (parallelTimeReduction / totalDuration) * 100 : 0
    };
  }

  /**
   * Estimate tokens needed for a task
   * @param {Object} node - Task node
   * @returns {number} Estimated tokens
   */
  estimateTokensForTask(node) {
    const baseTokens = {
      simple: 1000,
      medium: 2500,
      complex: 5000
    };
    
    const complexity = node.complexity || 'medium';
    return baseTokens[complexity];
  }

  /**
   * Estimate cost for a task
   * @param {Object} node - Task node
   * @param {number} tokens - Token count
   * @returns {number} Estimated cost in USD
   */
  estimateCostForTask(node, tokens) {
    // Average cost per 1000 tokens across providers
    const costPer1kTokens = 0.02; // $0.02 per 1000 tokens
    return (tokens / 1000) * costPer1kTokens;
  }

  /**
   * Check if two sets are equal
   * @param {Set} set1 - First set
   * @param {Set} set2 - Second set
   * @returns {boolean} Are sets equal
   */
  setsEqual(set1, set2) {
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
      if (!set2.has(item)) return false;
    }
    return true;
  }

  /**
   * Get decomposer statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      supportedDomains: Object.keys(this.decompositionPatterns).length,
      complexityLevels: Object.keys(this.complexityPatterns).length,
      capabilityMappings: Object.keys(this.capabilityToCategory).length,
      version: '1.0.0'
    };
  }
}

module.exports = TaskDecomposer;