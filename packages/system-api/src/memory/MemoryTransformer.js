/**
 * MemoryTransformer
 * Transforms data between AgentMemoryManager and SmartMemoryIndex formats
 * Enables seamless data migration and synchronization
 */

class MemoryTransformer {
  /**
   * Transform AgentMemory to SmartMemoryIndex format
   * @param {Object} agentMemory - AgentMemory from AgentMemoryManager
   * @returns {Object} - SmartMemoryIndex compatible memory object
   */
  static agentMemoryToSmartMemoryIndex(agentMemory) {
    return {
      agentId: agentMemory.agentId,
      userId: agentMemory.userId || 'system',
      sessionId: agentMemory.sessionId,
      interactions: this.transformInteractions(agentMemory.interactions || []),
      knowledge: {
        concepts: this.extractConceptsFromInteractions(agentMemory.interactions || []),
        expertise: this.categorizeAgentExpertise(agentMemory.agentId, agentMemory),
        context: agentMemory.contextId || null
      },
      patterns: {
        userPreferences: this.extractPreferencesFromHistory(agentMemory.interactions || []),
        successFactors: this.identifySuccessPatterns(agentMemory.interactions || [])
      },
      performance: {
        responseTime: this.calculateAverageResponseTime(agentMemory.interactions || []),
        successRate: this.calculateSuccessRate(agentMemory.interactions || []),
        tokenUsage: this.calculateTotalTokens(agentMemory.interactions || [])
      }
    };
  }

  /**
   * Transform interactions to SmartMemoryIndex format
   */
  static transformInteractions(interactions) {
    return interactions.map(interaction => ({
      timestamp: interaction.timestamp,
      summary: this.createInteractionSummary(interaction),
      outcome: interaction.success ? 'success' : 'failure',
      duration: interaction.duration || 0
    }));
  }

  /**
   * Create concise interaction summary
   */
  static createInteractionSummary(interaction) {
    const prompt = interaction.prompt || interaction.query || '';
    if (prompt.length <= 200) return prompt;
    return prompt.substring(0, 197) + '...';
  }

  /**
   * Extract semantic concepts from interactions using keyword analysis
   */
  static extractConceptsFromInteractions(interactions) {
    const conceptMap = new Map();
    
    interactions.forEach(interaction => {
      const text = (interaction.prompt || '').toLowerCase();
      
      // Development concepts
      if (this.textContains(text, ['build', 'create', 'develop', 'implement', 'code'])) {
        this.incrementConcept(conceptMap, 'development');
      }
      
      // Testing concepts  
      if (this.textContains(text, ['test', 'debug', 'validate', 'verify'])) {
        this.incrementConcept(conceptMap, 'testing');
      }
      
      // Troubleshooting concepts
      if (this.textContains(text, ['fix', 'error', 'bug', 'issue', 'problem'])) {
        this.incrementConcept(conceptMap, 'troubleshooting');
      }
      
      // Design concepts
      if (this.textContains(text, ['design', 'architecture', 'pattern', 'structure'])) {
        this.incrementConcept(conceptMap, 'design');
      }
      
      // Data concepts
      if (this.textContains(text, ['database', 'query', 'data', 'sql', 'api'])) {
        this.incrementConcept(conceptMap, 'data');
      }
    });

    // Return top concepts by frequency
    return Array.from(conceptMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([concept]) => concept);
  }

  /**
   * Check if text contains any of the keywords
   */
  static textContains(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * Increment concept count in map
   */
  static incrementConcept(conceptMap, concept) {
    conceptMap.set(concept, (conceptMap.get(concept) || 0) + 1);
  }

  /**
   * Categorize agent expertise based on agent ID and interaction history
   */
  static categorizeAgentExpertise(agentId, agentMemory) {
    // Extract domain from agent ID patterns
    const domain = this.extractDomainFromAgentId(agentId);
    
    // Analyze interaction patterns for specialization
    const specialization = this.analyzeSpecialization(agentMemory.interactions || []);
    
    return {
      domain,
      specialization,
      taskTypes: this.identifyTaskTypes(agentMemory.interactions || [])
    };
  }

  /**
   * Extract domain from agent ID
   */
  static extractDomainFromAgentId(agentId) {
    if (agentId.includes('frontend') || agentId.includes('react') || agentId.includes('vue')) {
      return 'frontend';
    }
    if (agentId.includes('backend') || agentId.includes('api') || agentId.includes('server')) {
      return 'backend';
    }
    if (agentId.includes('test') || agentId.includes('qa')) {
      return 'testing';
    }
    if (agentId.includes('data') || agentId.includes('sql') || agentId.includes('database')) {
      return 'data';
    }
    if (agentId.includes('devops') || agentId.includes('deploy') || agentId.includes('infra')) {
      return 'devops';
    }
    return 'general';
  }

  /**
   * Analyze specialization from interactions
   */
  static analyzeSpecialization(interactions) {
    const specializations = [];
    
    interactions.forEach(interaction => {
      const prompt = (interaction.prompt || '').toLowerCase();
      
      if (prompt.includes('react') || prompt.includes('component')) {
        specializations.push('react-development');
      }
      if (prompt.includes('api') || prompt.includes('endpoint')) {
        specializations.push('api-development');
      }
      if (prompt.includes('database') || prompt.includes('sql')) {
        specializations.push('database-management');
      }
    });

    return [...new Set(specializations)]; // Remove duplicates
  }

  /**
   * Identify task types from interactions
   */
  static identifyTaskTypes(interactions) {
    const taskTypes = new Set();
    
    interactions.forEach(interaction => {
      if (interaction.success) {
        const concepts = this.extractConceptsFromInteractions([interaction]);
        concepts.forEach(concept => taskTypes.add(concept));
      }
    });

    return Array.from(taskTypes);
  }

  /**
   * Extract user preferences from interaction history
   */
  static extractPreferencesFromHistory(interactions) {
    if (interactions.length === 0) return {};

    const preferences = {};
    
    // Response length preference
    const responseLengths = interactions
      .filter(i => i.response)
      .map(i => i.response.length);
    
    if (responseLengths.length > 0) {
      const avgLength = responseLengths.reduce((sum, len) => sum + len, 0) / responseLengths.length;
      preferences.responseLength = avgLength > 1000 ? 'detailed' : 'concise';
    }

    // Interaction timing patterns
    const hours = interactions
      .filter(i => i.timestamp)
      .map(i => new Date(i.timestamp).getHours());
    
    if (hours.length > 0) {
      const avgHour = hours.reduce((sum, hour) => sum + hour, 0) / hours.length;
      preferences.preferredTime = avgHour < 12 ? 'morning' : avgHour < 18 ? 'afternoon' : 'evening';
    }

    return preferences;
  }

  /**
   * Identify success patterns from interaction history
   */
  static identifySuccessPatterns(interactions) {
    const successfulInteractions = interactions.filter(i => i.success);
    const patterns = [];

    if (successfulInteractions.length > 0) {
      // Fast response pattern
      const fastResponses = successfulInteractions.filter(i => i.duration && i.duration < 5000);
      if (fastResponses.length / successfulInteractions.length > 0.7) {
        patterns.push('fast_response');
      }

      // Detailed response pattern
      const detailedResponses = successfulInteractions.filter(i => i.response && i.response.length > 500);
      if (detailedResponses.length / successfulInteractions.length > 0.6) {
        patterns.push('detailed_response');
      }

      // Efficient token usage pattern
      const efficientInteractions = successfulInteractions.filter(i => i.tokens && i.tokens > 0 && i.tokens < 2000);
      if (efficientInteractions.length / successfulInteractions.length > 0.8) {
        patterns.push('efficient_tokens');
      }
    }

    return patterns;
  }

  /**
   * Calculate average response time
   */
  static calculateAverageResponseTime(interactions) {
    const durations = interactions
      .filter(i => i.duration && i.duration > 0)
      .map(i => i.duration);
    
    if (durations.length === 0) return 0;
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  /**
   * Calculate success rate
   */
  static calculateSuccessRate(interactions) {
    if (interactions.length === 0) return 0;
    const successCount = interactions.filter(i => i.success).length;
    return successCount / interactions.length;
  }

  /**
   * Calculate total token usage
   */
  static calculateTotalTokens(interactions) {
    return interactions
      .filter(i => i.tokens && i.tokens > 0)
      .reduce((total, interaction) => total + interaction.tokens, 0);
  }

  /**
   * Transform SmartMemoryIndex memory back to AgentMemory format
   * @param {Object} smartMemory - SmartMemoryIndex memory object
   * @returns {Object} - AgentMemory compatible object
   */
  static smartMemoryIndexToAgentMemory(smartMemory) {
    return {
      agentId: smartMemory.agentId,
      userId: smartMemory.userId,
      sessionId: smartMemory.sessionId,
      interactions: smartMemory.interactions.map(interaction => ({
        timestamp: interaction.timestamp,
        prompt: interaction.summary,
        response: '', // SmartMemoryIndex doesn't store full responses
        success: interaction.outcome === 'success',
        duration: interaction.duration || 0,
        tokens: 0, // Would need to be tracked separately
        contextId: smartMemory.knowledge?.context || null,
        feedback: null,
        tags: smartMemory.knowledge?.concepts || []
      })),
      contextId: smartMemory.knowledge?.context,
      metadata: {
        concepts: smartMemory.knowledge?.concepts || [],
        patterns: smartMemory.patterns,
        performance: smartMemory.performance
      }
    };
  }
}

module.exports = MemoryTransformer;