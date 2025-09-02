const { randomUUID } = require('crypto');

/**
 * Agent Memory Model
 * Represents persistent memory for individual agents including:
 * - Interaction history with specific users/sessions
 * - Performance patterns and learned behaviors
 * - Knowledge gained from successful interactions
 * - Context associations and patterns
 */
class AgentMemory {
  /**
   * Create new agent memory instance
   * @param {Object} data - Memory data
   * @param {string} data.agentId - Agent identifier
   * @param {string} data.userId - User identifier (optional)
   * @param {string} data.sessionId - Session identifier (optional)
   */
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.agentId = data.agentId || null;
    this.userId = data.userId || null;
    this.sessionId = data.sessionId || null;
    
    // Timestamps
    const now = new Date().toISOString();
    this.created = data.created || now;
    this.updated = data.updated || now;
    this.lastAccessed = data.lastAccessed || now;
    
    // Memory categories
    this.interactions = data.interactions || [];
    this.patterns = data.patterns || {};
    this.knowledge = data.knowledge || {};
    this.preferences = data.preferences || {};
    this.performance = data.performance || {
      successRate: 0,
      averageResponseTime: 0,
      totalInteractions: 0,
      errorCount: 0,
      improvementTrend: 'stable'
    };
    
    // Context associations
    this.contextAssociations = data.contextAssociations || [];
    this.knowledgeGraph = data.knowledgeGraph || {
      concepts: {},
      relationships: [],
      confidence: {}
    };
    
    // Learning metadata
    this.learning = data.learning || {
      adaptationScore: 0.5,
      domainExpertise: {},
      weaknesses: [],
      strengths: []
    };
  }

  _generateId() {
    return randomUUID();
  }

  /**
   * Record a new interaction
   * @param {Object} interaction - Interaction data
   */
  addInteraction(interaction) {
    const interactionRecord = {
      id: this._generateId(),
      timestamp: interaction.timestamp || new Date().toISOString(),
      prompt: this._sanitizePrompt(interaction.prompt),
      response: this._sanitizeResponse(interaction.response),
      success: interaction.success || false,
      duration: interaction.duration || 0,
      tokens: interaction.tokens || 0,
      contextId: interaction.contextId || null,
      feedback: interaction.feedback || null,
      tags: interaction.tags || []
    };
    
    this.interactions.push(interactionRecord);
    
    // Keep only last 100 interactions to prevent memory bloat
    if (this.interactions.length > 100) {
      this.interactions = this.interactions.slice(-100);
    }
    
    this._updatePerformanceMetrics();
    this._extractPatterns();
    this.lastAccessed = new Date().toISOString();
    this.updated = new Date().toISOString();
    
    return this;
  }

  /**
   * Add knowledge gained from successful interactions
   * @param {Object} knowledge - Knowledge data
   */
  addKnowledge(knowledge) {
    const {
      domain,
      concept,
      value,
      confidence = 0.7,
      source = 'interaction',
      tags = []
    } = knowledge;
    
    if (!this.knowledge[domain]) {
      this.knowledge[domain] = {};
    }
    
    this.knowledge[domain][concept] = {
      value,
      confidence,
      source,
      timestamp: new Date().toISOString(),
      reinforcements: this.knowledge[domain][concept]?.reinforcements || 0,
      tags
    };
    
    // Update knowledge graph
    this._updateKnowledgeGraph(domain, concept, value, confidence);
    
    this.updated = new Date().toISOString();
    return this;
  }

  /**
   * Record user feedback for learning
   * @param {Object} feedback - Feedback data
   */
  recordFeedback(feedback) {
    const {
      interactionId,
      rating,
      category = 'general',
      comments = '',
      helpful = null
    } = feedback;
    
    // Find and update the interaction
    const interaction = this.interactions.find(i => i.id === interactionId);
    if (interaction) {
      interaction.feedback = {
        rating,
        category,
        comments,
        helpful,
        timestamp: new Date().toISOString()
      };
    }
    
    // Update learning patterns
    this._processUserFeedback(feedback);
    
    this.updated = new Date().toISOString();
    return this;
  }

  /**
   * Get relevant memories for a context
   * @param {Object} context - Current context
   * @param {number} limit - Maximum memories to return
   * @returns {Array} Relevant memories
   */
  getRelevantMemories(context, limit = 5) {
    const {
      keywords = [],
      domain = null,
      similarity_threshold = 0.3
    } = context;
    
    const scoredInteractions = this.interactions
      .filter(i => i.success) // Only successful interactions
      .map(interaction => ({
        ...interaction,
        relevanceScore: this._calculateRelevance(interaction, context)
      }))
      .filter(i => i.relevanceScore >= similarity_threshold)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
    
    this.lastAccessed = new Date().toISOString();
    return scoredInteractions;
  }

  /**
   * Get domain expertise level
   * @param {string} domain - Domain to check
   * @returns {Object} Expertise information
   */
  getDomainExpertise(domain) {
    const domainInteractions = this.interactions.filter(i => 
      i.tags.includes(domain) || 
      (i.prompt && i.prompt.toLowerCase().includes(domain.toLowerCase()))
    );
    
    if (domainInteractions.length === 0) {
      return { level: 'novice', confidence: 0, experience: 0 };
    }
    
    const successRate = domainInteractions.filter(i => i.success).length / domainInteractions.length;
    const avgDuration = domainInteractions.reduce((sum, i) => sum + i.duration, 0) / domainInteractions.length;
    const experience = domainInteractions.length;
    
    let level = 'novice';
    let confidence = successRate;
    
    if (experience >= 50 && successRate >= 0.9) {
      level = 'expert';
      confidence = Math.min(0.95, successRate + 0.05);
    } else if (experience >= 20 && successRate >= 0.8) {
      level = 'advanced';
      confidence = successRate + 0.02;
    } else if (experience >= 10 && successRate >= 0.7) {
      level = 'intermediate';
    }
    
    return {
      level,
      confidence: Math.round(confidence * 100) / 100,
      experience,
      avgResponseTime: Math.round(avgDuration),
      successRate: Math.round(successRate * 100) / 100
    };
  }

  /**
   * Get performance trends
   * @param {number} windowSize - Number of recent interactions to analyze
   * @returns {Object} Trend analysis
   */
  getPerformanceTrends(windowSize = 20) {
    if (this.interactions.length < windowSize) {
      return { trend: 'insufficient_data', confidence: 0 };
    }
    
    const recent = this.interactions.slice(-windowSize);
    const older = this.interactions.slice(-windowSize * 2, -windowSize);
    
    const recentSuccess = recent.filter(i => i.success).length / recent.length;
    const olderSuccess = older.length > 0 ? 
      older.filter(i => i.success).length / older.length : recentSuccess;
    
    const recentTime = recent.reduce((sum, i) => sum + i.duration, 0) / recent.length;
    const olderTime = older.length > 0 ? 
      older.reduce((sum, i) => sum + i.duration, 0) / older.length : recentTime;
    
    let trend = 'stable';
    let confidence = 0.5;
    
    const successDiff = recentSuccess - olderSuccess;
    const timeDiff = (olderTime - recentTime) / olderTime; // Positive means getting faster
    
    if (successDiff > 0.1 || timeDiff > 0.1) {
      trend = 'improving';
      confidence = Math.min(0.9, 0.5 + Math.abs(successDiff) + Math.abs(timeDiff));
    } else if (successDiff < -0.1 || timeDiff < -0.1) {
      trend = 'declining';
      confidence = Math.min(0.9, 0.5 + Math.abs(successDiff) + Math.abs(timeDiff));
    }
    
    return {
      trend,
      confidence: Math.round(confidence * 100) / 100,
      recentSuccessRate: Math.round(recentSuccess * 100) / 100,
      recentAvgTime: Math.round(recentTime),
      comparison: {
        successChange: Math.round(successDiff * 100) / 100,
        timeChange: Math.round(timeDiff * 100) / 100
      }
    };
  }

  /**
   * Compress old memories to save space
   * @param {Object} options - Compression options
   */
  compressMemories(options = {}) {
    const {
      keepRecentCount = 50,
      compressionThreshold = 100,
      preserveSuccessful = true
    } = options;
    
    if (this.interactions.length <= compressionThreshold) {
      return this; // No compression needed
    }
    
    // Sort by importance score (success rate, recency, uniqueness)
    const scoredInteractions = this.interactions.map(interaction => ({
      ...interaction,
      importance: this._calculateImportanceScore(interaction)
    }));
    
    // Keep recent interactions
    const recent = scoredInteractions.slice(-keepRecentCount);
    const older = scoredInteractions.slice(0, -keepRecentCount);
    
    // From older interactions, keep only the most important
    const importantOlder = older
      .sort((a, b) => b.importance - a.importance)
      .slice(0, Math.floor(compressionThreshold * 0.3));
    
    // Combine and remove importance scores
    this.interactions = [...importantOlder, ...recent].map(({importance, ...interaction}) => interaction);
    
    this.updated = new Date().toISOString();
    return this;
  }

  /**
   * Export memory for backup/transfer
   * @returns {Object} Serializable memory data
   */
  export() {
    return {
      id: this.id,
      agentId: this.agentId,
      userId: this.userId,
      sessionId: this.sessionId,
      created: this.created,
      updated: this.updated,
      lastAccessed: this.lastAccessed,
      interactions: this.interactions,
      patterns: this.patterns,
      knowledge: this.knowledge,
      preferences: this.preferences,
      performance: this.performance,
      contextAssociations: this.contextAssociations,
      knowledgeGraph: this.knowledgeGraph,
      learning: this.learning
    };
  }

  /**
   * Get memory statistics
   * @returns {Object} Memory statistics
   */
  getStats() {
    const totalInteractions = this.interactions.length;
    const successfulInteractions = this.interactions.filter(i => i.success).length;
    const domains = Object.keys(this.knowledge);
    const concepts = domains.reduce((sum, domain) => sum + Object.keys(this.knowledge[domain]).length, 0);
    
    return {
      totalInteractions,
      successfulInteractions,
      successRate: totalInteractions > 0 ? Math.round((successfulInteractions / totalInteractions) * 100) / 100 : 0,
      knowledgeDomains: domains.length,
      knowledgeConcepts: concepts,
      memoryAge: Math.floor((new Date() - new Date(this.created)) / (1000 * 60 * 60 * 24)),
      lastAccessed: this.lastAccessed,
      patterns: Object.keys(this.patterns).length,
      adaptationScore: this.learning.adaptationScore
    };
  }

  // Private methods

  _sanitizePrompt(prompt) {
    if (!prompt) return '';
    // Remove sensitive information and truncate
    return prompt.substring(0, 500);
  }

  _sanitizeResponse(response) {
    if (!response) return '';
    // Remove sensitive information and truncate
    return response.substring(0, 1000);
  }

  _updatePerformanceMetrics() {
    const total = this.interactions.length;
    const successful = this.interactions.filter(i => i.success).length;
    const totalTime = this.interactions.reduce((sum, i) => sum + i.duration, 0);
    const errors = this.interactions.filter(i => !i.success).length;
    
    this.performance = {
      successRate: total > 0 ? successful / total : 0,
      averageResponseTime: total > 0 ? totalTime / total : 0,
      totalInteractions: total,
      errorCount: errors,
      improvementTrend: this.getPerformanceTrends().trend
    };
  }

  _extractPatterns() {
    // Extract common patterns from interactions
    const recentInteractions = this.interactions.slice(-20);
    
    // Common keywords
    const keywords = {};
    recentInteractions.forEach(i => {
      const words = (i.prompt || '').toLowerCase().split(/\s+/)
        .filter(word => word.length > 3);
      words.forEach(word => {
        keywords[word] = (keywords[word] || 0) + 1;
      });
    });
    
    // Timing patterns
    const hours = recentInteractions.map(i => new Date(i.timestamp).getHours());
    const commonHours = {};
    hours.forEach(hour => {
      commonHours[hour] = (commonHours[hour] || 0) + 1;
    });
    
    this.patterns = {
      keywords: Object.entries(keywords)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((acc, [word, count]) => ({ ...acc, [word]: count }), {}),
      commonHours: Object.entries(commonHours)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .reduce((acc, [hour, count]) => ({ ...acc, [hour]: count }), {}),
      lastUpdated: new Date().toISOString()
    };
  }

  _updateKnowledgeGraph(domain, concept, value, confidence) {
    if (!this.knowledgeGraph.concepts[domain]) {
      this.knowledgeGraph.concepts[domain] = [];
    }
    
    const existing = this.knowledgeGraph.concepts[domain].find(c => c.concept === concept);
    if (existing) {
      existing.reinforcements = (existing.reinforcements || 0) + 1;
      existing.confidence = Math.min(0.95, existing.confidence + 0.05);
    } else {
      this.knowledgeGraph.concepts[domain].push({
        concept,
        value,
        confidence,
        reinforcements: 1,
        timestamp: new Date().toISOString()
      });
    }
  }

  _processUserFeedback(feedback) {
    const { rating, category, helpful } = feedback;
    
    // Update learning patterns based on feedback
    if (helpful !== null) {
      if (helpful) {
        this.learning.adaptationScore = Math.min(0.95, this.learning.adaptationScore + 0.02);
      } else {
        this.learning.adaptationScore = Math.max(0.1, this.learning.adaptationScore - 0.05);
      }
    }
    
    // Track category-specific performance
    if (category && rating !== null) {
      if (!this.learning.domainExpertise[category]) {
        this.learning.domainExpertise[category] = { rating: 0, count: 0 };
      }
      
      const domain = this.learning.domainExpertise[category];
      domain.rating = ((domain.rating * domain.count) + rating) / (domain.count + 1);
      domain.count += 1;
    }
  }

  _calculateRelevance(interaction, context) {
    let score = 0;
    const { keywords = [], domain = null } = context;
    
    // Keyword similarity
    if (keywords.length > 0) {
      const interactionText = `${interaction.prompt} ${interaction.response}`.toLowerCase();
      const matches = keywords.filter(keyword => 
        interactionText.includes(keyword.toLowerCase())
      ).length;
      score += (matches / keywords.length) * 0.4;
    }
    
    // Domain similarity
    if (domain && interaction.tags.includes(domain)) {
      score += 0.3;
    }
    
    // Recency bonus (more recent interactions are more relevant)
    const ageInDays = (new Date() - new Date(interaction.timestamp)) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (ageInDays / 30)); // Decay over 30 days
    score += recencyScore * 0.2;
    
    // Success bonus
    if (interaction.success) {
      score += 0.1;
    }
    
    return Math.min(1.0, score);
  }

  _calculateImportanceScore(interaction) {
    let score = 0;
    
    // Success adds importance
    if (interaction.success) score += 0.4;
    
    // Uniqueness (fewer similar interactions = more important)
    const similar = this.interactions.filter(i => 
      i !== interaction && this._calculateRelevance(i, { keywords: interaction.prompt.split(/\s+/) }) > 0.7
    ).length;
    score += Math.max(0, 0.3 - (similar * 0.05));
    
    // Recency
    const ageInDays = (new Date() - new Date(interaction.timestamp)) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 0.2 - (ageInDays * 0.01));
    
    // Feedback quality
    if (interaction.feedback && interaction.feedback.rating) {
      score += interaction.feedback.rating / 10; // Assuming 1-10 scale
    }
    
    return Math.min(1.0, score);
  }
}

module.exports = AgentMemory;