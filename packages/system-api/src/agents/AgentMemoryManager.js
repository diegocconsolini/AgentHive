const AgentMemory = require('../models/AgentMemory');
const StorageManager = require('../storage/StorageManager');
const agentConfig = require('../config/AgentConfig');

/**
 * Agent Memory Manager
 * Manages persistent memory storage and retrieval for all agents
 * Handles knowledge graphs, learning patterns, and cross-agent memory sharing
 */
class AgentMemoryManager {
  constructor(options = {}) {
    this.storageManager = new StorageManager({
      baseDir: options.baseDir || '.agent-memory',
      dbPath: options.dbPath || '.agent-memory/memories.db'
    });
    
    this.memoryCache = new Map(); // In-memory cache for active agent memories
    this.knowledgeGraph = new Map(); // Global knowledge graph across all agents
    this.initialized = false;
    
    // Configuration - merge with global config
    const memoryConfig = agentConfig.getMemoryConfig();
    this.config = {
      maxCacheSize: options.maxCacheSize || memoryConfig.maxCacheSize,
      memoryCompressionThreshold: options.memoryCompressionThreshold || memoryConfig.memoryCompressionThreshold,
      autoCompressionInterval: options.autoCompressionInterval || memoryConfig.autoCompressionInterval,
      knowledgeShareThreshold: options.knowledgeShareThreshold || memoryConfig.knowledgeShareThreshold,
      ...options
    };
    
    // Start auto-compression if enabled
    if (this.config.autoCompressionInterval > 0) {
      this._startAutoCompression();
    }
  }

  /**
   * Initialize the memory manager
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.storageManager.initialize();
      
      // Load global knowledge graph
      await this._loadGlobalKnowledgeGraph();
      
      this.initialized = true;
      console.log('Agent Memory Manager initialized successfully');
      
    } catch (error) {
      throw new Error(`Failed to initialize AgentMemoryManager: ${error.message}`);
    }
  }

  /**
   * Get or create agent memory
   * @param {string} agentId - Agent identifier
   * @param {string} userId - User identifier (optional)
   * @param {string} sessionId - Session identifier (optional)
   * @returns {Promise<AgentMemory>} Agent memory instance
   */
  async getAgentMemory(agentId, userId = null, sessionId = null) {
    await this._ensureInitialized();
    
    const memoryKey = this._generateMemoryKey(agentId, userId, sessionId);
    
    // Check cache first
    if (this.memoryCache.has(memoryKey)) {
      const memory = this.memoryCache.get(memoryKey);
      memory.lastAccessed = new Date().toISOString();
      return memory;
    }
    
    try {
      // Try to load from storage
      const storedMemory = await this.storageManager.read(memoryKey);
      
      let memory;
      if (storedMemory) {
        memory = new AgentMemory(storedMemory.content ? JSON.parse(storedMemory.content) : storedMemory);
      } else {
        // Create new memory
        memory = new AgentMemory({
          agentId,
          userId,
          sessionId
        });
      }
      
      // Cache the memory
      this._cacheMemory(memoryKey, memory);
      
      return memory;
      
    } catch (error) {
      console.error(`Error loading agent memory for ${memoryKey}:`, error.message);
      
      // Return new memory as fallback
      const memory = new AgentMemory({ agentId, userId, sessionId });
      this._cacheMemory(memoryKey, memory);
      return memory;
    }
  }

  /**
   * Save agent memory to persistent storage
   * @param {AgentMemory} memory - Memory instance to save
   * @returns {Promise<void>}
   */
  async saveAgentMemory(memory) {
    await this._ensureInitialized();
    
    const memoryKey = this._generateMemoryKey(memory.agentId, memory.userId, memory.sessionId);
    
    // Create context object for storage
    const contextData = {
      id: memoryKey,
      type: 'agent',
      hierarchy: ['agents', memory.agentId, memory.userId || 'global', memory.sessionId || 'general'],
      importance: this._calculateMemoryImportance(memory),
      content: JSON.stringify(memory.export()),
      metadata: {
        agent_id: memory.agentId,
        user_id: memory.userId,
        session_id: memory.sessionId,
        interaction_count: memory.interactions.length,
        success_rate: memory.performance.successRate,
        knowledge_domains: Object.keys(memory.knowledge).length,
        retention_policy: 'long-term',
        tags: ['agent-memory', memory.agentId, ...(memory.userId ? [memory.userId] : [])]
      }
    };
    
    try {
      // Save to storage
      await this.storageManager.create(contextData);
      
      // Update cache
      this._cacheMemory(memoryKey, memory);
      
      // Update global knowledge graph
      await this._updateGlobalKnowledgeGraph(memory);
      
    } catch (error) {
      // If create fails, try update
      try {
        await this.storageManager.update(memoryKey, {
          content: JSON.stringify(memory.export()),
          updated: new Date().toISOString(),
          metadata: {
            ...contextData.metadata,
            interaction_count: memory.interactions.length,
            success_rate: memory.performance.successRate,
            knowledge_domains: Object.keys(memory.knowledge).length
          }
        });
        
        this._cacheMemory(memoryKey, memory);
        await this._updateGlobalKnowledgeGraph(memory);
        
      } catch (updateError) {
        console.error(`Failed to save agent memory for ${memoryKey}:`, updateError.message);
        throw new Error(`Memory save failed: ${updateError.message}`);
      }
    }
  }

  /**
   * Record an interaction for an agent
   * @param {string} agentId - Agent identifier
   * @param {Object} interaction - Interaction data
   * @param {string} userId - User identifier (optional)
   * @param {string} sessionId - Session identifier (optional)
   */
  async recordInteraction(agentId, interaction, userId = null, sessionId = null) {
    const memory = await this.getAgentMemory(agentId, userId, sessionId);
    
    memory.addInteraction(interaction);
    
    // Auto-save after significant interactions
    if (memory.interactions.length % 10 === 0) {
      await this.saveAgentMemory(memory);
    }
    
    // Trigger compression if needed
    if (memory.interactions.length > this.config.memoryCompressionThreshold) {
      memory.compressMemories();
      await this.saveAgentMemory(memory);
    }
  }

  /**
   * Add knowledge to an agent's memory
   * @param {string} agentId - Agent identifier
   * @param {Object} knowledge - Knowledge data
   * @param {string} userId - User identifier (optional)
   * @param {string} sessionId - Session identifier (optional)
   */
  async addKnowledge(agentId, knowledge, userId = null, sessionId = null) {
    const memory = await this.getAgentMemory(agentId, userId, sessionId);
    
    memory.addKnowledge(knowledge);
    
    // Check if knowledge should be shared globally
    if (knowledge.confidence >= this.config.knowledgeShareThreshold) {
      await this._shareKnowledgeGlobally(knowledge, agentId);
    }
    
    await this.saveAgentMemory(memory);
  }

  /**
   * Record user feedback for learning
   * @param {string} agentId - Agent identifier
   * @param {Object} feedback - Feedback data
   * @param {string} userId - User identifier (optional)
   * @param {string} sessionId - Session identifier (optional)
   */
  async recordFeedback(agentId, feedback, userId = null, sessionId = null) {
    const memory = await this.getAgentMemory(agentId, userId, sessionId);
    
    memory.recordFeedback(feedback);
    await this.saveAgentMemory(memory);
    
    // Update global learning patterns
    await this._updateGlobalLearningPatterns(agentId, feedback);
  }

  /**
   * Get relevant memories for context
   * @param {string} agentId - Agent identifier
   * @param {Object} context - Context data
   * @param {Object} options - Options
   * @returns {Promise<Array>} Relevant memories
   */
  async getRelevantMemories(agentId, context, options = {}) {
    const {
      userId = null,
      sessionId = null,
      includeGlobal = true,
      includeCrossAgent = false,
      limit = 5
    } = options;
    
    const memory = await this.getAgentMemory(agentId, userId, sessionId);
    const relevantMemories = memory.getRelevantMemories(context, limit);
    
    // Include global knowledge if requested
    if (includeGlobal) {
      const globalMemories = await this._getGlobalRelevantMemories(context, Math.floor(limit / 2));
      relevantMemories.push(...globalMemories);
    }
    
    // Include cross-agent memories if requested
    if (includeCrossAgent) {
      const crossAgentMemories = await this._getCrossAgentMemories(agentId, context, Math.floor(limit / 3));
      relevantMemories.push(...crossAgentMemories);
    }
    
    // Sort by relevance and return top results
    return relevantMemories
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, limit);
  }

  /**
   * Get agent performance analytics
   * @param {string} agentId - Agent identifier
   * @param {Object} options - Options
   * @returns {Promise<Object>} Performance analytics
   */
  async getAgentAnalytics(agentId, options = {}) {
    const { timeframe = 30, includeComparison = true } = options;
    
    try {
      // Get agent memories
      const memories = await this._getAgentMemories(agentId);
      
      if (memories.length === 0) {
        return { message: 'No memory data available for this agent' };
      }
      
      const analytics = {
        agent: agentId,
        timeframe: `${timeframe} days`,
        totalMemories: memories.length,
        totalInteractions: 0,
        averageSuccessRate: 0,
        domainExpertise: {},
        performanceTrends: {},
        knowledgeGrowth: {},
        userSatisfaction: {}
      };
      
      // Aggregate data from all memories
      memories.forEach(memory => {
        analytics.totalInteractions += memory.performance.totalInteractions;
        
        // Domain expertise
        Object.keys(memory.knowledge).forEach(domain => {
          if (!analytics.domainExpertise[domain]) {
            analytics.domainExpertise[domain] = memory.getDomainExpertise(domain);
          }
        });
        
        // Performance trends
        const trends = memory.getPerformanceTrends();
        if (!analytics.performanceTrends.overall) {
          analytics.performanceTrends = trends;
        }
      });
      
      // Calculate averages
      analytics.averageSuccessRate = memories.reduce((sum, m) => sum + m.performance.successRate, 0) / memories.length;
      
      // Include comparison with other agents if requested
      if (includeComparison) {
        analytics.comparison = await this._getAgentComparison(agentId);
      }
      
      return analytics;
      
    } catch (error) {
      console.error(`Error getting agent analytics for ${agentId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get knowledge graph for an agent
   * @param {string} agentId - Agent identifier
   * @param {Object} options - Options
   * @returns {Promise<Object>} Knowledge graph
   */
  async getKnowledgeGraph(agentId, options = {}) {
    const { includeGlobal = false, minConfidence = 0.5 } = options;
    
    const memories = await this._getAgentMemories(agentId);
    const graph = {
      agent: agentId,
      nodes: [],
      edges: [],
      domains: new Set(),
      concepts: new Map()
    };
    
    // Build graph from agent memories
    memories.forEach(memory => {
      Object.entries(memory.knowledgeGraph.concepts).forEach(([domain, concepts]) => {
        graph.domains.add(domain);
        
        concepts.forEach(concept => {
          if (concept.confidence >= minConfidence) {
            const nodeId = `${domain}:${concept.concept}`;
            
            if (!graph.concepts.has(nodeId)) {
              graph.concepts.set(nodeId, {
                id: nodeId,
                domain,
                concept: concept.concept,
                value: concept.value,
                confidence: concept.confidence,
                reinforcements: concept.reinforcements
              });
            }
          }
        });
      });
    });
    
    graph.nodes = Array.from(graph.concepts.values());
    graph.domains = Array.from(graph.domains);
    
    // Include global knowledge if requested
    if (includeGlobal) {
      const globalNodes = this._getGlobalKnowledgeNodes(minConfidence);
      graph.nodes.push(...globalNodes);
    }
    
    return graph;
  }

  /**
   * Clean up old memories and compress data
   * @param {Object} options - Cleanup options
   */
  async cleanupMemories(options = {}) {
    const {
      maxAgeInDays = 365,
      compressionThreshold = 200,
      preserveImportant = true
    } = options;
    
    console.log('Starting memory cleanup...');
    let cleanedCount = 0;
    let compressedCount = 0;
    let errors = 0;
    
    try {
      // Get all agent memories
      const allMemories = await this.storageManager.search({ type: 'agent-memory' });
      
      for (const memoryData of allMemories) {
        try {
          const memory = new AgentMemory(JSON.parse(memoryData.content || '{}'));
          
          // Check age
          const ageInDays = (new Date() - new Date(memory.created)) / (1000 * 60 * 60 * 24);
          
          if (ageInDays > maxAgeInDays && (!preserveImportant || memory.performance.successRate < 0.5)) {
            await this.storageManager.delete(memoryData.id);
            this.memoryCache.delete(memoryData.id);
            cleanedCount++;
          } else if (memory.interactions.length > compressionThreshold) {
            memory.compressMemories({ compressionThreshold });
            await this.saveAgentMemory(memory);
            compressedCount++;
          }
          
        } catch (error) {
          console.error(`Error processing memory ${memoryData.id}:`, error.message);
          errors++;
        }
      }
      
      console.log(`Memory cleanup completed: ${cleanedCount} cleaned, ${compressedCount} compressed, ${errors} errors`);
      
      return {
        cleaned: cleanedCount,
        compressed: compressedCount,
        errors
      };
      
    } catch (error) {
      console.error('Memory cleanup failed:', error.message);
      throw error;
    }
  }

  /**
   * Get system-wide memory statistics
   * @returns {Promise<Object>} Memory statistics
   */
  async getSystemStats() {
    try {
      const stats = {
        totalAgentMemories: 0,
        totalInteractions: 0,
        averageSuccessRate: 0,
        knowledgeDomains: new Set(),
        topPerformingAgents: [],
        memoryDistribution: {},
        cacheStats: {
          size: this.memoryCache.size,
          maxSize: this.config.maxCacheSize,
          hitRate: 0 // Would need to implement cache hit tracking
        }
      };
      
      // Get all agent memories
      const allMemories = await this.storageManager.search({ type: 'agent-memory' });
      stats.totalAgentMemories = allMemories.length;
      
      // Aggregate statistics
      const agentStats = new Map();
      
      for (const memoryData of allMemories) {
        try {
          const memory = new AgentMemory(JSON.parse(memoryData.content || '{}'));
          const memoryStats = memory.getStats();
          
          stats.totalInteractions += memoryStats.totalInteractions;
          
          // Track domains
          Object.keys(memory.knowledge).forEach(domain => stats.knowledgeDomains.add(domain));
          
          // Agent performance tracking
          if (!agentStats.has(memory.agentId)) {
            agentStats.set(memory.agentId, {
              agentId: memory.agentId,
              interactions: 0,
              successRate: 0,
              memories: 0
            });
          }
          
          const agentStat = agentStats.get(memory.agentId);
          agentStat.interactions += memoryStats.totalInteractions;
          agentStat.successRate = (agentStat.successRate * agentStat.memories + memoryStats.successRate) / (agentStat.memories + 1);
          agentStat.memories += 1;
          
          // Memory distribution
          if (!stats.memoryDistribution[memory.agentId]) {
            stats.memoryDistribution[memory.agentId] = 0;
          }
          stats.memoryDistribution[memory.agentId] += memoryStats.totalInteractions;
          
        } catch (error) {
          console.warn(`Error processing memory statistics:`, error.message);
        }
      }
      
      // Calculate averages and top performers
      if (agentStats.size > 0) {
        const totalSuccessRates = Array.from(agentStats.values()).reduce((sum, a) => sum + a.successRate, 0);
        stats.averageSuccessRate = totalSuccessRates / agentStats.size;
        
        stats.topPerformingAgents = Array.from(agentStats.values())
          .sort((a, b) => b.successRate - a.successRate)
          .slice(0, 10);
      }
      
      stats.knowledgeDomains = Array.from(stats.knowledgeDomains);
      
      return stats;
      
    } catch (error) {
      console.error('Error getting system stats:', error.message);
      throw error;
    }
  }

  /**
   * Close the memory manager
   */
  async close() {
    // Save all cached memories
    const savePromises = Array.from(this.memoryCache.values()).map(memory => 
      this.saveAgentMemory(memory).catch(error => 
        console.error(`Error saving cached memory on close:`, error.message)
      )
    );
    
    await Promise.all(savePromises);
    
    // Close storage
    await this.storageManager.close();
    
    // Clear cache
    this.memoryCache.clear();
    this.knowledgeGraph.clear();
    
    // Stop auto-compression
    if (this._compressionTimer) {
      clearInterval(this._compressionTimer);
    }
    
    this.initialized = false;
  }

  // Private methods

  async _ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  _generateMemoryKey(agentId, userId, sessionId) {
    const parts = [agentId];
    if (userId) parts.push(userId);
    if (sessionId) parts.push(sessionId);
    return parts.join(':');
  }

  _cacheMemory(key, memory) {
    // Implement LRU cache
    if (this.memoryCache.size >= this.config.maxCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, memory);
  }

  _calculateMemoryImportance(memory) {
    let importance = 50; // Base importance
    
    // Success rate impact
    importance += memory.performance.successRate * 30;
    
    // Interaction count impact
    importance += Math.min(20, memory.interactions.length * 0.5);
    
    // Knowledge domains impact
    importance += Math.min(10, Object.keys(memory.knowledge).length * 2);
    
    // Recent activity boost
    const daysSinceLastAccess = (new Date() - new Date(memory.lastAccessed)) / (1000 * 60 * 60 * 24);
    importance += Math.max(0, 10 - daysSinceLastAccess);
    
    return Math.min(100, Math.max(0, importance));
  }

  async _loadGlobalKnowledgeGraph() {
    // Implementation would load shared knowledge across agents
    // For now, initialize empty
    this.knowledgeGraph.clear();
  }

  async _updateGlobalKnowledgeGraph(memory) {
    // Update global knowledge graph with learnings from agent memory
    // This would be implemented based on knowledge sharing requirements
  }

  async _shareKnowledgeGlobally(knowledge, sourceAgentId) {
    // Implementation for sharing high-confidence knowledge across agents
  }

  async _updateGlobalLearningPatterns(agentId, feedback) {
    // Implementation for updating global learning patterns
  }

  async _getGlobalRelevantMemories(context, limit) {
    // Implementation for getting relevant memories from global knowledge
    return [];
  }

  async _getCrossAgentMemories(agentId, context, limit) {
    // Implementation for getting relevant memories from other agents
    return [];
  }

  async _getAgentMemories(agentId) {
    try {
      const results = await this.storageManager.search({
        type: 'agent-memory',
        metadata: { agent_id: agentId }
      });
      
      return results.map(result => {
        try {
          return new AgentMemory(JSON.parse(result.content || '{}'));
        } catch (error) {
          console.error(`Error parsing memory for agent ${agentId}:`, error.message);
          return null;
        }
      }).filter(Boolean);
      
    } catch (error) {
      console.error(`Error getting memories for agent ${agentId}:`, error.message);
      return [];
    }
  }

  async _getAgentComparison(agentId) {
    // Implementation for comparing agent performance with others
    return { message: 'Comparison not implemented yet' };
  }

  _getGlobalKnowledgeNodes(minConfidence) {
    // Implementation for getting global knowledge nodes
    return [];
  }

  _startAutoCompression() {
    this._compressionTimer = setInterval(async () => {
      try {
        console.log('Running auto-compression...');
        
        // Compress cached memories
        for (const [key, memory] of this.memoryCache.entries()) {
          if (memory.interactions.length > this.config.memoryCompressionThreshold) {
            memory.compressMemories();
            await this.saveAgentMemory(memory);
          }
        }
        
      } catch (error) {
        console.error('Auto-compression error:', error.message);
      }
    }, this.config.autoCompressionInterval);
  }
}

module.exports = AgentMemoryManager;