/**
 * Agent Orchestrator
 * Bridges intelligent agent selection with AI provider execution
 * Manages context persistence and multi-agent coordination
 */
const AgentRegistry = require('../agents/AgentRegistry');
const CapabilityMatcher = require('../agents/CapabilityMatcher');
const LoadBalancer = require('../agents/LoadBalancer');
const Context = require('../models/Context');

class AgentOrchestrator {
  constructor(aiService) {
    this.aiService = aiService;
    this.registry = new AgentRegistry();
    this.matcher = new CapabilityMatcher(this.registry);
    this.loadBalancer = new LoadBalancer(this.registry);
    this.contextStore = new Map(); // In-memory context storage
    this.executionHistory = new Map(); // Track execution patterns
  }

  /**
   * Main orchestration method - routes request to optimal agent
   * @param {string} prompt - User request
   * @param {Object} options - Execution options
   * @param {string} userId - User identifier for context
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Object>} Agent execution result
   */
  async orchestrateRequest(prompt, options = {}, userId = null, sessionId = null) {
    const startTime = Date.now();
    
    try {
      // Step 1: Load or create context
      const context = await this.getOrCreateContext(userId, sessionId);
      
      // Step 2: Enhance prompt with context
      const contextualPrompt = this.enhancePromptWithContext(prompt, context);
      
      // Step 3: Select optimal agent using intelligent matching
      const selectedAgent = await this.selectOptimalAgent(contextualPrompt, options, context);
      
      // Step 4: Execute via AI provider with agent specialization
      const result = await this.executeAgentWithProvider(selectedAgent, contextualPrompt, options, context);
      
      // Step 5: Update context with new interaction
      await this.updateContext(context, prompt, result);
      
      // Step 6: Record performance metrics
      this.recordExecution(selectedAgent, result, Date.now() - startTime);
      
      return {
        ...result,
        selectedAgent: selectedAgent.id,
        agentName: selectedAgent.name,
        routingReason: selectedAgent.selectionReason,
        contextUsed: context.id,
        orchestrationTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Orchestration failed:', error);
      throw new Error(`Agent orchestration failed: ${error.message}`);
    }
  }

  /**
   * Select optimal agent using capability matching and load balancing
   */
  async selectOptimalAgent(prompt, options, context) {
    // Analyze prompt to understand requirements
    const taskAnalysis = this.analyzeTaskRequirements(prompt);
    console.log('Task analysis:', taskAnalysis);
    
    // Get candidate agents using capability matcher
    const availableAgentTypes = this.registry.getAllAgentTypes();
    console.log('Available agent types:', availableAgentTypes);
    
    const availableAgents = availableAgentTypes.map(type => this.registry.getAgent(type)).filter(agent => agent);
    console.log('Available agents:', availableAgents.length, 'agents loaded');
    
    const bestMatch = this.matcher.findBestMatch(taskAnalysis, availableAgents, options.routingStrategy || 'balanced');
    console.log('Best match:', bestMatch);
    
    const candidates = bestMatch ? [bestMatch] : [];
    
    if (candidates.length === 0) {
      throw new Error('No suitable agents found for this request');
    }
    
    // Apply load balancing if multiple good candidates
    const selectedAgent = await this.loadBalancer.selectAgent(candidates, {
      considerWorkload: true,
      preferenceHistory: context.agentPreferences || {},
      userPriority: options.priority || 'normal'
    });
    
    // Add selection reasoning
    selectedAgent.selectionReason = this.buildSelectionReason(selectedAgent, candidates, taskAnalysis);
    
    return selectedAgent;
  }

  /**
   * Execute agent with AI provider, applying agent specialization
   */
  async executeAgentWithProvider(agent, prompt, options, context) {
    // Build specialized system prompt for the selected agent
    const systemPrompt = this.buildAgentSystemPrompt(agent, context);
    
    // Determine optimal model based on agent requirements and task complexity
    const model = this.selectModelForAgent(agent, options);
    
    // Execute via AI provider service
    const response = await this.aiService.generateResponse({
      model,
      prompt,
      systemPrompt,
      temperature: (agent.config && agent.config.temperature) || options.temperature || 0.7,
      maxTokens: (agent.config && agent.config.maxTokens) || options.maxTokens || 4000,
      stream: options.stream || false
    });
    
    // Process response with agent-specific post-processing
    return this.processAgentResponse(agent, response, context);
  }

  /**
   * Build specialized system prompt for agent
   */
  buildAgentSystemPrompt(agent, context) {
    let systemPrompt = `You are ${agent.name || 'AI Assistant'}, ${agent.description || 'a helpful AI assistant'}\n\n`;
    
    // Add agent capabilities and expertise
    if (agent.capabilities && Array.isArray(agent.capabilities)) {
      systemPrompt += `Your expertise includes: ${agent.capabilities.join(', ')}\n`;
    }
    
    // Add relevant context if available
    if (context.previousInteractions && context.previousInteractions.length > 0) {
      const recentContext = context.previousInteractions.slice(-3)
        .map(i => `Previous: ${i.prompt.substring(0, 100)}...`)
        .join('\n');
      systemPrompt += `\nRecent context:\n${recentContext}\n`;
    }
    
    // Add agent-specific instructions
    if (agent.config && agent.config.instructions) {
      systemPrompt += `\nSpecific instructions:\n${agent.config.instructions}\n`;
    }
    
    systemPrompt += '\nProvide expert-level assistance in your domain.';
    
    return systemPrompt;
  }

  /**
   * Analyze task requirements from prompt
   */
  analyzeTaskRequirements(prompt) {
    const analysis = {
      keywords: this.extractKeywords(prompt),
      complexity: this.estimateComplexity(prompt),
      domain: this.identifyDomain(prompt),
      urgency: this.assessUrgency(prompt),
      outputType: this.determineOutputType(prompt)
    };
    
    return analysis;
  }

  /**
   * Get or create context for user session
   */
  async getOrCreateContext(userId, sessionId) {
    const contextKey = `${userId}:${sessionId}`;
    
    if (this.contextStore.has(contextKey)) {
      return this.contextStore.get(contextKey);
    }
    
    // Create new context
    const context = new Context({
      userId,
      sessionId,
      createdAt: new Date(),
      previousInteractions: [],
      agentPreferences: {},
      metadata: {}
    });
    
    this.contextStore.set(contextKey, context);
    return context;
  }

  /**
   * Update context with new interaction
   */
  async updateContext(context, prompt, result) {
    context.addInteraction({
      timestamp: new Date(),
      prompt,
      agentId: result.agentId || 'unknown',
      response: (result.output || '').substring(0, 500), // Store truncated response
      tokens: result.tokens || 0,
      duration: result.duration || 0
    });
    
    // Update agent preferences based on success
    const agentId = result.agentId || 'unknown';
    if (!context.agentPreferences[agentId]) {
      context.agentPreferences[agentId] = { uses: 0, satisfaction: 0 };
    }
    context.agentPreferences[agentId].uses++;
    
    // Trim old interactions to prevent memory bloat
    if (context.previousInteractions && context.previousInteractions.length > 10) {
      context.previousInteractions = context.previousInteractions.slice(-10);
    }
  }

  /**
   * Enhance prompt with relevant context
   */
  enhancePromptWithContext(prompt, context) {
    if (!context.previousInteractions || context.previousInteractions.length === 0) {
      return prompt;
    }
    
    // Find related previous interactions
    const related = context.previousInteractions
      .filter(i => this.calculateSimilarity(prompt, i.prompt) > 0.3)
      .slice(-2);
    
    if (related.length === 0) {
      return prompt;
    }
    
    let enhancedPrompt = prompt + '\n\nRelevant previous context:\n';
    related.forEach((interaction, index) => {
      enhancedPrompt += `${index + 1}. ${interaction.prompt.substring(0, 100)}...\n`;
    });
    
    return enhancedPrompt;
  }

  /**
   * Record execution for performance tracking
   */
  recordExecution(agent, result, orchestrationTime) {
    const key = `${agent.id}:${new Date().toISOString().split('T')[0]}`;
    
    if (!this.executionHistory.has(key)) {
      this.executionHistory.set(key, {
        executions: 0,
        totalTime: 0,
        errors: 0,
        totalTokens: 0,
        totalCost: 0
      });
    }
    
    const stats = this.executionHistory.get(key);
    stats.executions++;
    stats.totalTime += orchestrationTime;
    stats.totalTokens += result.tokens || 0;
    stats.totalCost += result.cost || 0;
    
    // Update agent performance in matcher
    this.matcher.recordAgentPerformance(agent.id, {
      success: !result.error,
      duration: orchestrationTime,
      tokens: result.tokens
    });
  }

  // Helper methods
  extractKeywords(prompt) {
    return prompt.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10);
  }

  estimateComplexity(prompt) {
    const indicators = {
      simple: ['help', 'what', 'how', 'show'],
      medium: ['analyze', 'review', 'optimize', 'debug'],
      complex: ['architect', 'design', 'refactor', 'implement']
    };
    
    const words = prompt.toLowerCase().split(/\s+/);
    
    if (words.some(w => indicators.complex.includes(w))) return 'complex';
    if (words.some(w => indicators.medium.includes(w))) return 'medium';
    return 'simple';
  }

  identifyDomain(prompt) {
    const domains = {
      development: ['code', 'function', 'debug', 'programming', 'javascript', 'python'],
      security: ['security', 'vulnerability', 'audit', 'penetration'],
      devops: ['deployment', 'docker', 'kubernetes', 'infrastructure'],
      data: ['data', 'sql', 'database', 'analysis', 'query']
    };
    
    const words = prompt.toLowerCase().split(/\s+/);
    
    for (const [domain, keywords] of Object.entries(domains)) {
      if (words.some(w => keywords.includes(w))) {
        return domain;
      }
    }
    
    return 'general';
  }

  assessUrgency(prompt) {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
    return urgentKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    ) ? 'high' : 'normal';
  }

  determineOutputType(prompt) {
    if (prompt.includes('code') || prompt.includes('function')) return 'code';
    if (prompt.includes('list') || prompt.includes('steps')) return 'list';
    if (prompt.includes('explain') || prompt.includes('describe')) return 'explanation';
    return 'general';
  }

  selectModelForAgent(agent, options) {
    const availableProviders = this.aiService.getAvailableProviders();
    
    if (options.model) return options.model;
    if (agent.config && agent.config.preferredModel) return agent.config.preferredModel;
    
    // Default to first available model
    return availableProviders[0]?.models[0] || 'gpt-3.5-turbo';
  }

  processAgentResponse(agent, response, context) {
    // Add agent-specific response processing here
    return {
      ...response,
      agentProcessed: true,
      agentId: agent.id,
      processingTime: Date.now()
    };
  }

  buildSelectionReason(selected, candidates, analysis) {
    return `Selected ${selected.name} based on ${analysis.domain} domain match (confidence: ${(selected.confidence * 100).toFixed(1)}%) from ${candidates.length} candidates`;
  }

  calculateSimilarity(str1, str2) {
    // Simple similarity calculation - could be enhanced with more sophisticated NLP
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    return intersection.size / Math.max(words1.size, words2.size);
  }

  /**
   * Get orchestration statistics
   */
  getStatistics() {
    const stats = {
      totalRequests: 0,
      totalExecutionTime: 0,
      agentUsage: {},
      contextSessions: this.contextStore.size,
      averageLatency: 0
    };
    
    for (const [key, data] of this.executionHistory.entries()) {
      stats.totalRequests += data.executions;
      stats.totalExecutionTime += data.totalTime;
      
      const agentId = key.split(':')[0];
      if (!stats.agentUsage[agentId]) {
        stats.agentUsage[agentId] = 0;
      }
      stats.agentUsage[agentId] += data.executions;
    }
    
    stats.averageLatency = stats.totalRequests > 0 
      ? stats.totalExecutionTime / stats.totalRequests 
      : 0;
    
    return stats;
  }
}

module.exports = AgentOrchestrator;