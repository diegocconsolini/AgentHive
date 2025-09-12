/**
 * Agent Orchestrator
 * Bridges intelligent agent selection with AI provider execution
 * Manages context persistence and multi-agent coordination
 */
const AgentRegistry = require('../agents/AgentRegistry');
const CapabilityMatcher = require('../agents/CapabilityMatcher');
const LoadBalancer = require('../agents/LoadBalancer');
const AgentMemoryManager = require('../agents/AgentMemoryManager');
const SmartMemoryIndex = require('../memory/SmartMemoryIndex');
const Context = require('../models/Context');
const agentConfig = require('../config/AgentConfig');
const SSPService = require('../services/SSPService');

class AgentOrchestrator {
  constructor(aiService) {
    this.aiService = aiService;
    this.registry = new AgentRegistry();
    this.matcher = new CapabilityMatcher(this.registry);
    this.loadBalancer = new LoadBalancer(this.registry);
    this.memoryManager = new AgentMemoryManager(); // Agent memory system
    this.smartMemoryIndex = new SmartMemoryIndex(); // AI-powered memory system
    this.contextStore = new Map(); // In-memory context storage
    this.executionHistory = new Map(); // Track execution patterns
    
    // SSP Extension - Initialize after memoryManager is ready
    this.sspService = null; // Will be initialized after memoryManager
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
      // Step 0: Initialize memory manager if not already initialized
      await this._ensureMemoryManagerInitialized();
      
      // Step 1: Load or create context
      const context = await this.getOrCreateContext(userId, sessionId);
      
      // Step 2: Enhance prompt with context and agent memories
      const contextualPrompt = await this.enhancePromptWithMemories(prompt, context, userId, sessionId);
      
      // Step 3: Select optimal agent using intelligent matching
      const selectedAgent = await this.selectOptimalAgent(contextualPrompt, options, context);
      
      // Step 4: Execute via AI provider with agent specialization
      console.log(`🚀 ORCHESTRATE: About to call executeAgentWithProvider`);
      const result = await this.executeAgentWithProvider(selectedAgent, contextualPrompt, options, context);
      console.log(`✅ ORCHESTRATE: executeAgentWithProvider completed`, result.success);
      
      // Step 5: Update context with new interaction
      await this.updateContext(context, prompt, result);
      
      // Step 6: Record performance metrics and agent memory
      this.recordExecution(selectedAgent, result, Date.now() - startTime);
      await this.recordAgentInteraction(selectedAgent, prompt, result, userId, sessionId);
      
      return {
        ...result,
        selectedAgent: selectedAgent.id || selectedAgent.type,
        agentName: selectedAgent.name || selectedAgent.type,
        routingReason: selectedAgent.selectionReason,
        contextUsed: context.id,
        orchestrationTime: Date.now() - startTime,
        memoryEnhanced: true
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
    
    // Convert task analysis to capability requirements
    const taskRequirements = this.convertAnalysisToRequirements(taskAnalysis);
    console.log('Task requirements:', taskRequirements);
    
    const bestMatch = this.matcher.findBestMatch(taskRequirements, availableAgents, options.routingStrategy || 'balanced');
    console.log('Best match:', bestMatch);
    
    // Convert best match type to full agent object
    let candidates = [];
    if (bestMatch && bestMatch.success && bestMatch.bestMatch) {
      const agentType = bestMatch.bestMatch;
      const fullAgent = this.registry.getAgent(agentType);
      if (fullAgent) {
        // Add the match info to the agent object
        fullAgent.matchScore = bestMatch.score;
        fullAgent.confidence = bestMatch.confidence;
        fullAgent.matchReasoning = bestMatch.reasoning;
        candidates = [fullAgent];
      }
    }
    
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
    const startTime = Date.now();
    console.log(`🎯 EXECUTING AGENT: ${agent.id || agent.type} - CONTEXT TYPE: ${context.type}`);
    
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
    
    console.log('AI Service response:', response);
    
    // SSP Extension - Track procedure execution
    const executionTime = Date.now() - startTime;
    const success = !response.error && response.response && response.response.length > 0;
    
    console.log(`🔍 SSP Check: context.type="${context.type}", sspService=${!!this.sspService}, success=${success}, executionTime=${executionTime}ms`);
    
    if (context.type === 'task' && this.sspService) {
      try {
        console.log(`📝 SSP Recording execution for context ${context.id}, agent ${agent.id || agent.type}`);
        
        // Record execution in context
        context.recordProcedureExecution(success, executionTime);
        
        // Record in SSP database
        await this.sspService.recordProcedureExecution(
          context.id,
          agent.id || agent.type,
          options.sessionId,
          success,
          executionTime
        );
        
        console.log(`✅ SSP Execution recorded successfully`);
        
        // Detect patterns periodically
        if (Math.random() < 0.1) { // 10% chance to detect patterns
          console.log(`🔍 SSP Pattern detection triggered`);
          await this.sspService.detectPatterns(options.userId, options.sessionId, agent.id || agent.type);
        }
      } catch (sspError) {
        console.error('SSP tracking error:', sspError);
        // Don't fail the main execution due to SSP errors
      }
    } else {
      console.log(`❌ SSP Not recording: type=${context.type}, sspService=${!!this.sspService}`);
    }
    
    // Process response with agent-specific post-processing
    return this.processAgentResponse(agent, response, context);
  }

  /**
   * Build specialized system prompt for agent
   */
  buildAgentSystemPrompt(agent, context) {
    // Use the agent's actual systemPrompt from JSON if available
    if (agent.systemPrompt) {
      let systemPrompt = agent.systemPrompt;
      
      // Add relevant context if available
      if (context.previousInteractions && context.previousInteractions.length > 0) {
        const recentContext = context.previousInteractions.slice(-3)
          .map(i => `Previous: ${i.prompt.substring(0, 100)}...`)
          .join('\n');
        systemPrompt += `\n\nRecent context:\n${recentContext}`;
      }
      
      return systemPrompt;
    }
    
    // Fallback to generic prompt if no systemPrompt available
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
   * Convert task analysis to capability requirements
   */
  convertAnalysisToRequirements(taskAnalysis) {
    // Map domains to actual JSON capabilities
    const domainCapabilities = {
      development: ['code-generation', 'architecture-design'],
      security: ['code-analysis', 'testing-debugging'],
      devops: ['deployment', 'integration'],
      data: ['code-analysis', 'optimization'],
      design: ['architecture-design', 'code-generation'],
      testing: ['testing-debugging', 'code-analysis'],
      'ai-ml': ['code-generation', 'integration'],
      business: ['general-purpose'],
      content: ['code-generation'],
      specialized: ['architecture-design', 'integration']
    };

    const requirements = {
      requiredCapabilities: [],
      preferredCapabilities: [],
      complexity: taskAnalysis.complexity || 'medium',
      category: taskAnalysis.domain,
      priority: taskAnalysis.urgency || 'normal',
      keywords: taskAnalysis.keywords || []
    };

    // Map domain to actual capabilities
    if (taskAnalysis.domain && domainCapabilities[taskAnalysis.domain]) {
      requirements.requiredCapabilities = domainCapabilities[taskAnalysis.domain];
    }

    // Extract capabilities from keywords using actual JSON capabilities
    taskAnalysis.keywords?.forEach(keyword => {
      const keywordCapabilities = {
        'react': ['code-generation', 'architecture-design'],
        'vue': ['code-generation', 'architecture-design'],
        'angular': ['code-generation', 'architecture-design'],
        'api': ['integration', 'architecture-design'],
        'database': ['optimization', 'architecture-design'],
        'security': ['code-analysis', 'testing-debugging'],
        'test': ['testing-debugging', 'code-analysis'],
        'deploy': ['deployment'],
        'optimize': ['optimization', 'performance-monitoring'],
        'debug': ['testing-debugging', 'code-analysis']
      };
      
      if (keywordCapabilities[keyword]) {
        requirements.preferredCapabilities.push(...keywordCapabilities[keyword]);
      }
    });

    return requirements;
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
    
    // Set context type for SSP tracking
    context.type = 'task';
    
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
   * Enhance prompt with context and agent memories
   */
  async enhancePromptWithMemories(prompt, context, userId, sessionId) {
    // Start with basic context enhancement
    let enhancedPrompt = this.enhancePromptWithContext(prompt, context);
    
    try {
      // Extract keywords for memory retrieval
      const keywords = this.extractKeywords(prompt);
      const domain = this.identifyDomain(prompt);
      
      // Try to find relevant memories from previous interactions
      // We'll use a general agent memory first, then specific agent memories during execution
      const memoryContext = {
        keywords,
        domain,
        similarity_threshold: 0.3
      };
      
      // Get relevant memories from global context (we'll implement agent-specific later in execution)
      const relevantMemories = await this._getRelevantSystemMemories(memoryContext, 3);
      
      if (relevantMemories.length > 0) {
        enhancedPrompt += '\n\nRelevant previous knowledge:\n';
        relevantMemories.forEach((memory, index) => {
          enhancedPrompt += `${index + 1}. ${memory.prompt ? memory.prompt.substring(0, 100) : 'Previous interaction'}...\n`;
        });
      }
      
    } catch (error) {
      console.warn('Memory enhancement failed, using basic context:', error.message);
    }
    
    return enhancedPrompt;
  }

  /**
   * Enhance prompt with relevant context (original method)
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
    const domains = agentConfig.getDomainPatterns();
    const words = prompt.toLowerCase().split(/\s+/);
    
    for (const [domain, keywords] of Object.entries(domains)) {
      if (words.some(w => keywords.includes(w))) {
        return domain;
      }
    }
    
    return 'general';
  }

  assessUrgency(prompt) {
    const urgentKeywords = agentConfig.getUrgencyKeywords();
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
      output: response.response, // Map AI service response to expected output field
      agentProcessed: true,
      agentId: agent.id || agent.type,
      processingTime: Date.now()
    };
  }

  buildSelectionReason(selected, candidates, analysis) {
    const agentName = selected.name || selected.type || 'Unknown Agent';
    const confidence = selected.confidence || selected.matchScore || 0;
    return `Selected ${agentName} based on ${analysis.domain} domain match (confidence: ${(confidence * 100).toFixed(1)}%) from ${candidates.length} candidates`;
  }

  calculateSimilarity(str1, str2) {
    // Simple similarity calculation - could be enhanced with more sophisticated NLP
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    return intersection.size / Math.max(words1.size, words2.size);
  }

  /**
   * Record agent interaction in memory system
   */
  async recordAgentInteraction(selectedAgent, prompt, result, userId, sessionId) {
    try {
      const agentId = selectedAgent.id || selectedAgent.type;
      const interaction = {
        timestamp: new Date().toISOString(),
        prompt: prompt,
        response: result.output || result.response || '',
        success: !result.error && result.output,
        duration: result.duration || 0,
        tokens: result.tokens || 0,
        contextId: result.contextUsed || null,
        feedback: null,
        tags: [this.identifyDomain(prompt), selectedAgent.category || 'general']
      };
      
      await this.memoryManager.recordInteraction(agentId, interaction, userId, sessionId);
      
      // Bridge to SmartMemoryIndex for AI-powered memory features
      if (this.smartMemoryIndex && this.smartMemoryIndex.initialized) {
        await this._bridgeToSmartMemoryIndex(agentId, interaction, selectedAgent, userId, sessionId);
      }
      
      // Extract and record knowledge if interaction was successful
      if (interaction.success) {
        await this._extractAndRecordKnowledge(agentId, prompt, result.output, userId, sessionId);
      }
      
    } catch (error) {
      console.error('Failed to record agent interaction in memory:', error.message);
    }
  }

  /**
   * Extract and record knowledge from successful interactions
   */
  async _extractAndRecordKnowledge(agentId, prompt, response, userId, sessionId) {
    try {
      const domain = this.identifyDomain(prompt);
      const keywords = this.extractKeywords(prompt);
      
      // Simple knowledge extraction - could be enhanced with NLP
      if (domain && keywords.length > 0) {
        const knowledge = {
          domain: domain,
          concept: keywords[0], // Use first keyword as concept
          value: response.substring(0, 200), // Store truncated response
          confidence: 0.7, // Base confidence
          source: 'interaction',
          tags: [domain, ...keywords.slice(0, 3)]
        };
        
        await this.memoryManager.addKnowledge(agentId, knowledge, userId, sessionId);
      }
      
    } catch (error) {
      console.error('Failed to extract knowledge:', error.message);
    }
  }

  /**
   * Bridge agent interaction to SmartMemoryIndex for AI-powered memory features
   */
  async _bridgeToSmartMemoryIndex(agentId, interaction, selectedAgent, userId, sessionId) {
    try {
      const agentMemoryData = {
        agentId,
        userId: userId || 'system',
        sessionId,
        interactions: [{
          timestamp: interaction.timestamp,
          summary: interaction.prompt.substring(0, 200) + (interaction.prompt.length > 200 ? '...' : ''),
          outcome: interaction.success ? 'success' : 'failure',
          duration: interaction.duration
        }],
        knowledge: {
          concepts: this._extractConcepts(interaction),
          expertise: this._categorizeExpertise(selectedAgent, interaction),
          context: interaction.contextId
        },
        patterns: {
          userPreferences: this._extractUserPreferences(interaction, userId),
          successFactors: interaction.success ? this._identifySuccessFactors(interaction) : []
        },
        performance: {
          responseTime: interaction.duration,
          successRate: interaction.success ? 1.0 : 0.0,
          tokenUsage: interaction.tokens
        }
      };
      
      await this.smartMemoryIndex.addMemory(agentMemoryData);
      console.log(`✅ Memory bridged to SmartMemoryIndex: ${agentId}`);
      
    } catch (error) {
      console.error('SmartMemoryIndex bridge error:', error);
      // Don't fail the entire agent execution for memory issues
    }
  }

  /**
   * Extract semantic concepts from interaction
   */
  _extractConcepts(interaction) {
    const concepts = [];
    const prompt = interaction.prompt.toLowerCase();
    
    // Basic concept extraction - could be enhanced with NLP
    if (prompt.includes('build') || prompt.includes('create') || prompt.includes('develop')) {
      concepts.push('development');
    }
    if (prompt.includes('test') || prompt.includes('debug')) {
      concepts.push('testing');
    }
    if (prompt.includes('fix') || prompt.includes('error') || prompt.includes('bug')) {
      concepts.push('troubleshooting');
    }
    if (prompt.includes('design') || prompt.includes('architecture')) {
      concepts.push('design');
    }
    
    return concepts;
  }

  /**
   * Categorize agent expertise based on interaction
   */
  _categorizeExpertise(selectedAgent, interaction) {
    return {
      domain: selectedAgent.category || 'general',
      specialization: selectedAgent.specialization || [],
      taskType: this.identifyDomain(interaction.prompt)
    };
  }

  /**
   * Extract user preferences from interaction patterns
   */
  _extractUserPreferences(interaction, userId) {
    if (!userId) return {};
    
    return {
      responseLength: interaction.response ? 
        (interaction.response.length > 1000 ? 'detailed' : 'concise') : 'unknown',
      interactionTime: new Date(interaction.timestamp).getHours() < 12 ? 'morning' : 'evening'
    };
  }

  /**
   * Identify factors that contributed to successful interactions
   */
  _identifySuccessFactors(interaction) {
    const factors = [];
    
    if (interaction.duration < 5000) factors.push('fast_response');
    if (interaction.tokens > 0 && interaction.tokens < 1000) factors.push('efficient_tokens');
    if (interaction.response && interaction.response.length > 100) factors.push('detailed_response');
    
    return factors;
  }

  /**
   * Get relevant memories from system for prompt enhancement
   */
  async _getRelevantSystemMemories(memoryContext, limit = 3) {
    try {
      // Use SmartMemoryIndex for intelligent memory retrieval if available
      if (this.smartMemoryIndex && this.smartMemoryIndex.initialized) {
        const query = memoryContext.keywords ? memoryContext.keywords.join(' ') : memoryContext.context;
        const searchOptions = {
          limit,
          category: memoryContext.domain || 'interaction',
          minSimilarity: 0.6
        };
        
        const results = await this.smartMemoryIndex.searchMemories(query, searchOptions);
        return results.results.map(result => ({
          content: result.memory.interactions[0]?.summary || '',
          relevance: result.similarity,
          agentId: result.memory.agentId,
          timestamp: result.memory.interactions[0]?.timestamp
        }));
      }
      
      // Fallback to traditional memory system
      return [];
    } catch (error) {
      console.error('Failed to get relevant system memories:', error.message);
      return [];
    }
  }

  /**
   * Ensure memory manager is initialized
   */
  async _ensureMemoryManagerInitialized() {
    try {
      await this.memoryManager.initialize();
      
      // Initialize SmartMemoryIndex for AI-powered memory
      if (!this.smartMemoryIndex.initialized) {
        await this.smartMemoryIndex.initialize();
        console.log('SmartMemoryIndex initialized successfully');
      }
      
      // SSP Extension - Initialize SSP service after memoryManager is ready
      if (!this.sspService) {
        this.sspService = new SSPService(this.memoryManager.storageManager, this.memoryManager);
        console.log('SSP Service initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize memory manager:', error.message);
    }
  }

  /**
   * Record user feedback for agent learning
   */
  async recordUserFeedback(agentId, feedback, userId = null, sessionId = null) {
    try {
      await this.memoryManager.recordFeedback(agentId, feedback, userId, sessionId);
    } catch (error) {
      console.error('Failed to record user feedback:', error.message);
      throw error;
    }
  }

  /**
   * Get agent memory analytics
   */
  async getAgentAnalytics(agentId, options = {}) {
    try {
      return await this.memoryManager.getAgentAnalytics(agentId, options);
    } catch (error) {
      console.error('Failed to get agent analytics:', error.message);
      throw error;
    }
  }

  /**
   * Get knowledge graph for an agent
   */
  async getAgentKnowledgeGraph(agentId, options = {}) {
    try {
      return await this.memoryManager.getKnowledgeGraph(agentId, options);
    } catch (error) {
      console.error('Failed to get agent knowledge graph:', error.message);
      throw error;
    }
  }

  /**
   * Get system-wide memory statistics
   */
  async getMemorySystemStats() {
    try {
      return await this.memoryManager.getSystemStats();
    } catch (error) {
      console.error('Failed to get memory system stats:', error.message);
      throw error;
    }
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