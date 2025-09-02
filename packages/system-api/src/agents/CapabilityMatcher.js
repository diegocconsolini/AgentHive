/**
 * Capability Matcher
 * Intelligent agent selection based on task requirements and agent capabilities
 */
const agentConfig = require('../config/AgentConfig');

class CapabilityMatcher {
  constructor(registry) {
    this.registry = registry;
    this.matchCache = new Map(); // Cache for recent matches
    this.performanceHistory = new Map(); // Historical performance data
    this.weightProfiles = this._initializeWeightProfiles();
  }

  /**
   * Initialize weight profiles for different matching strategies
   * @private
   */
  _initializeWeightProfiles() {
    return {
      balanced: {
        capabilityMatch: 0.25,
        specializationMatch: 0.2,
        successRate: 0.2,
        averageTime: 0.15,
        complexity: 0.1,
        workload: 0.1
      },
      performance: {
        capabilityMatch: 0.15,
        specializationMatch: 0.15,
        successRate: 0.35,
        averageTime: 0.1,
        complexity: 0.1,
        workload: 0.15
      },
      speed: {
        capabilityMatch: 0.2,
        specializationMatch: 0.1,
        successRate: 0.15,
        averageTime: 0.35,
        complexity: 0.1,
        workload: 0.1
      },
      accuracy: {
        capabilityMatch: 0.3,
        specializationMatch: 0.25,
        successRate: 0.25,
        averageTime: 0.1,
        complexity: 0.1,
        workload: 0.0
      }
    };
  }

  /**
   * Find the best agent for a task
   * @param {Object} taskRequirements - Task requirements
   * @param {Array<Object>} availableAgents - Available agent states
   * @param {string} strategy - Matching strategy
   * @returns {Object} Best match result
   */
  findBestMatch(taskRequirements, availableAgents = [], strategy = 'balanced') {
    const {
      requiredCapabilities = [],
      preferredCapabilities = [],
      complexity = 'medium',
      estimatedDuration = 60,
      fileTypes = [],
      category = null,
      priority = 'normal'
    } = taskRequirements;

    // Check cache first
    const cacheKey = this._generateCacheKey(taskRequirements, strategy);
    if (this.matchCache.has(cacheKey)) {
      const cached = this.matchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.result;
      }
    }

    // Get candidate agents
    const candidates = this._getCandidateAgents(
      requiredCapabilities,
      preferredCapabilities,
      category
    );

    if (candidates.length === 0) {
      return {
        success: false,
        message: 'No agents found with required capabilities',
        suggestions: this._getSuggestions(requiredCapabilities)
      };
    }

    // Score each candidate
    const weights = this.weightProfiles[strategy] || this.weightProfiles.balanced;
    const scores = candidates.map(agentType => {
      const score = this._scoreAgent(
        agentType,
        taskRequirements,
        availableAgents,
        weights
      );
      return { agentType, ...score };
    });

    // Sort by total score
    scores.sort((a, b) => b.totalScore - a.totalScore);

    // Build result
    const result = {
      success: true,
      bestMatch: scores[0].agentType,
      score: scores[0].totalScore,
      breakdown: scores[0].breakdown,
      alternatives: scores.slice(1, 4).map(s => ({
        type: s.agentType,
        score: s.totalScore
      })),
      confidence: this._calculateConfidence(scores),
      reasoning: this._generateReasoning(scores[0], taskRequirements)
    };

    // Cache result
    this.matchCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.matchCache.size > 100) {
      const firstKey = this.matchCache.keys().next().value;
      this.matchCache.delete(firstKey);
    }

    return result;
  }

  /**
   * Get candidate agents based on capabilities
   * @private
   */
  _getCandidateAgents(requiredCaps, preferredCaps, category) {
    const candidates = new Set();

    // First, get agents with all required capabilities
    if (requiredCaps.length > 0) {
      const agentsByCapability = requiredCaps.map(cap => 
        new Set(this.registry.getAgentsByCapability(cap))
      );
      
      // Find intersection of all sets
      const intersection = agentsByCapability.reduce((a, b) => 
        new Set([...a].filter(x => b.has(x)))
      );
      
      intersection.forEach(agent => candidates.add(agent));
    }

    // If no required capabilities, consider all agents in category
    if (requiredCaps.length === 0 && category) {
      const categoryAgents = this.registry.getAgentsByCategory(category);
      categoryAgents.forEach(agent => candidates.add(agent.type));
    }

    // If still no candidates, expand search to preferred capabilities
    if (candidates.size === 0 && preferredCaps.length > 0) {
      preferredCaps.forEach(cap => {
        const agents = this.registry.getAgentsByCapability(cap);
        agents.forEach(agent => candidates.add(agent));
      });
    }

    // Final fallback: if still no candidates, get all agents from category
    if (candidates.size === 0 && category) {
      const categoryAgents = this.registry.getAgentsByCategory(category);
      categoryAgents.forEach(agent => candidates.add(agent.type));
    }

    // Ultimate fallback: if no category match, return some agents
    if (candidates.size === 0) {
      // Return first few agents as fallback
      const allTypes = this.registry.getAllAgentTypes();
      allTypes.slice(0, 5).forEach(type => candidates.add(type));
    }

    return Array.from(candidates);
  }

  /**
   * Score an agent for a task
   * @private
   */
  _scoreAgent(agentType, requirements, availableAgents, weights) {
    const agentData = this.registry.getAgent(agentType);
    if (!agentData) return { totalScore: 0, breakdown: {} };

    const breakdown = {};

    // Capability match score
    breakdown.capabilityMatch = this._scoreCapabilityMatch(
      agentData.capabilities,
      requirements.requiredCapabilities || [],
      requirements.preferredCapabilities || []
    );

    // Specialization match score (NEW - prevents SEO agents for dev tasks)
    breakdown.specializationMatch = this._scoreSpecializationMatch(
      agentData,
      requirements
    );

    // Success rate score
    breakdown.successRate = agentData.metadata.successRate;

    // Time efficiency score (inverse of average time)
    const targetTime = requirements.estimatedDuration || 60;
    const agentTime = agentData.metadata.averageTaskTime;
    breakdown.averageTime = Math.max(0, 1 - Math.abs(targetTime - agentTime) / targetTime);

    // Complexity match score
    breakdown.complexity = this._scoreComplexityMatch(
      agentData.metadata.complexity,
      requirements.complexity || 'medium'
    );

    // Workload score (based on available agents)
    breakdown.workload = this._scoreWorkload(agentType, availableAgents);

    // Calculate weighted total
    const totalScore = Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + (breakdown[key] || 0) * weight;
    }, 0);

    return { totalScore, breakdown };
  }

  /**
   * Score capability match
   * @private
   */
  _scoreCapabilityMatch(agentCaps, requiredCaps, preferredCaps) {
    let score = 0;
    const totalRequired = requiredCaps.length;
    const totalPreferred = preferredCaps.length;

    // Check required capabilities (weight: 0.7)
    if (totalRequired > 0) {
      const matchedRequired = requiredCaps.filter(cap => 
        agentCaps.includes(cap)
      ).length;
      score += (matchedRequired / totalRequired) * 0.7;
    } else {
      score += 0.7; // Full score if no required capabilities
    }

    // Check preferred capabilities (weight: 0.3)
    if (totalPreferred > 0) {
      const matchedPreferred = preferredCaps.filter(cap => 
        agentCaps.includes(cap)
      ).length;
      score += (matchedPreferred / totalPreferred) * 0.3;
    } else {
      score += 0.3; // Full score if no preferred capabilities
    }

    return score;
  }

  /**
   * Score specialization match based on agent name/type and task requirements
   * @private
   */
  _scoreSpecializationMatch(agentData, requirements) {
    const agentName = (agentData.name || '').toLowerCase();
    const agentType = (agentData.type || '').toLowerCase();
    const category = (requirements.category || '').toLowerCase();
    const keywords = requirements.keywords || [];
    
    let score = 0.5; // Base score
    
    // Keywords from the task that indicate technology/domain
    const taskKeywords = keywords.map(k => k.toLowerCase());
    
    // Define specialization patterns that should get priority
    const specializationPatterns = {
      // Development patterns
      frontend: ['frontend', 'react', 'vue', 'angular', 'ui', 'web', 'css', 'javascript', 'typescript'],
      backend: ['backend', 'api', 'server', 'node', 'express', 'fastify', 'database'],
      database: ['database', 'sql', 'mysql', 'postgres', 'mongodb', 'redis', 'query'],
      mobile: ['mobile', 'ios', 'android', 'react-native', 'flutter', 'swift', 'kotlin'],
      devops: ['devops', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ci-cd'],
      testing: ['test', 'testing', 'qa', 'unit', 'integration', 'e2e', 'selenium'],
      security: ['security', 'auth', 'oauth', 'jwt', 'encryption', 'vulnerability', 'audit'],
      
      // Language patterns
      python: ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
      javascript: ['javascript', 'js', 'node', 'npm', 'yarn', 'webpack'],
      typescript: ['typescript', 'ts', 'type', 'interface'],
      java: ['java', 'spring', 'maven', 'gradle', 'jvm'],
      rust: ['rust', 'cargo', 'wasm', 'memory'],
      golang: ['go', 'golang', 'goroutine', 'channel'],
      csharp: ['c#', 'csharp', 'dotnet', '.net', 'aspnet'],
      php: ['php', 'laravel', 'symfony', 'composer'],
      
      // Anti-patterns (should reduce score)
      seo: ['seo', 'search-engine', 'keyword', 'ranking', 'google', 'bing', 'meta', 'sitemap']
    };
    
    // Check for exact specialization matches
    for (const [domain, patterns] of Object.entries(specializationPatterns)) {
      const nameMatches = patterns.some(pattern => 
        agentName.includes(pattern) || agentType.includes(pattern)
      );
      const taskMatches = patterns.some(pattern => 
        taskKeywords.some(keyword => keyword.includes(pattern))
      );
      
      if (nameMatches && taskMatches) {
        // Perfect match - agent specializes in exactly what's needed
        if (domain === 'seo') {
          score = Math.max(0, score - 0.4); // Penalize SEO agents for non-SEO tasks
        } else {
          score += 0.4; // Bonus for specialization match
        }
      } else if (nameMatches && domain === 'seo' && !taskKeywords.some(k => k.includes('seo'))) {
        // SEO agent for non-SEO task - penalize heavily
        score = Math.max(0, score - 0.6);
      }
    }
    
    // Category matching bonus
    if (category && (agentName.includes(category) || agentType.includes(category))) {
      score += 0.2;
    }
    
    // Generic development terms preference over SEO
    const devTerms = ['developer', 'engineer', 'programmer', 'coder', 'architect', 'specialist'];
    const seoTerms = ['seo', 'content', 'marketing', 'optimization'];
    
    const hasDevTerms = devTerms.some(term => agentName.includes(term) || agentType.includes(term));
    const hasSeoTerms = seoTerms.some(term => agentName.includes(term) || agentType.includes(term));
    
    if (hasDevTerms && category === 'development') {
      score += 0.3;
    }
    
    if (hasSeoTerms && category !== 'marketing' && category !== 'content') {
      score = Math.max(0, score - 0.3);
    }
    
    return Math.min(1.0, score);
  }

  /**
   * Score complexity match
   * @private
   */
  _scoreComplexityMatch(agentComplexity, taskComplexity) {
    const complexityMap = { low: 1, medium: 2, high: 3 };
    const agentLevel = complexityMap[agentComplexity] || 2;
    const taskLevel = complexityMap[taskComplexity] || 2;
    
    // Perfect match gets full score
    if (agentLevel === taskLevel) return 1.0;
    
    // Agent can handle higher complexity
    if (agentLevel > taskLevel) return 0.8;
    
    // Agent might struggle with higher complexity
    if (agentLevel < taskLevel) return 0.5;
    
    return 0.7;
  }

  /**
   * Score workload based on available agents
   * @private
   */
  _scoreWorkload(agentType, availableAgents) {
    if (!availableAgents || availableAgents.length === 0) {
      return 1.0; // No workload information available
    }

    const agentsOfType = availableAgents.filter(a => a.type === agentType);
    if (agentsOfType.length === 0) {
      return 0.5; // No agents of this type available
    }

    // Calculate average workload for this agent type
    const avgWorkload = agentsOfType.reduce((sum, agent) => {
      return sum + (agent.getWorkloadPercentage ? agent.getWorkloadPercentage() : 50);
    }, 0) / agentsOfType.length;

    // Convert to score (lower workload = higher score)
    return Math.max(0, 1 - avgWorkload / 100);
  }

  /**
   * Calculate confidence in the match
   * @private
   */
  _calculateConfidence(scores) {
    if (scores.length === 0) return 0;
    if (scores.length === 1) return scores[0].totalScore;

    // Calculate based on score difference between top choices
    const topScore = scores[0].totalScore;
    const secondScore = scores[1] ? scores[1].totalScore : 0;
    
    const gap = topScore - secondScore;
    const confidence = Math.min(1, topScore * (1 + gap));
    
    return Math.round(confidence * 100) / 100;
  }

  /**
   * Generate reasoning for the match
   * @private
   */
  _generateReasoning(matchResult, requirements) {
    const reasons = [];
    const agentData = this.registry.getAgent(matchResult.agentType);

    if (matchResult.breakdown.capabilityMatch > 0.8) {
      reasons.push('Excellent capability match with requirements');
    }

    if (matchResult.breakdown.successRate > 0.9) {
      reasons.push(`High success rate of ${(agentData.metadata.successRate * 100).toFixed(0)}%`);
    }

    if (matchResult.breakdown.averageTime > 0.8) {
      reasons.push('Optimal time efficiency for task duration');
    }

    if (matchResult.breakdown.complexity > 0.9) {
      reasons.push('Perfect complexity level match');
    }

    if (matchResult.breakdown.workload > 0.7) {
      reasons.push('Good availability with low current workload');
    }

    return reasons.join('. ');
  }

  /**
   * Get suggestions for missing capabilities
   * @private
   */
  _getSuggestions(requiredCapabilities) {
    const suggestions = [];
    
    requiredCapabilities.forEach(cap => {
      const agents = this.registry.getAgentsByCapability(cap);
      if (agents.length === 0) {
        suggestions.push(`No agents found with capability '${cap}'`);
      } else {
        suggestions.push(`Agents with '${cap}': ${agents.slice(0, 3).join(', ')}`);
      }
    });

    return suggestions;
  }

  /**
   * Generate cache key
   * @private
   */
  _generateCacheKey(requirements, strategy) {
    const key = JSON.stringify({
      required: requirements.requiredCapabilities?.sort(),
      preferred: requirements.preferredCapabilities?.sort(),
      complexity: requirements.complexity,
      category: requirements.category,
      strategy
    });
    return key;
  }

  /**
   * Match multiple tasks to agents optimally
   * @param {Array<Object>} tasks - Array of task requirements
   * @param {Array<Object>} availableAgents - Available agent states
   * @param {Object} options - Matching options
   * @returns {Array<Object>} Match results for each task
   */
  matchMultipleTasks(tasks, availableAgents, options = {}) {
    const {
      strategy = 'balanced',
      allowDuplicates = true,
      maxAgentsPerType = 3
    } = options;

    const assignments = [];
    const agentUsage = new Map();

    // Sort tasks by priority
    const sortedTasks = [...tasks].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });

    for (const task of sortedTasks) {
      // Find best match considering current assignments
      const adjustedAgents = this._adjustAvailableAgents(
        availableAgents,
        agentUsage,
        allowDuplicates,
        maxAgentsPerType
      );

      const match = this.findBestMatch(task, adjustedAgents, strategy);
      
      if (match.success) {
        // Update agent usage
        const usage = agentUsage.get(match.bestMatch) || 0;
        agentUsage.set(match.bestMatch, usage + 1);
        
        assignments.push({
          task: task.id || task.name,
          agent: match.bestMatch,
          score: match.score,
          confidence: match.confidence
        });
      } else {
        assignments.push({
          task: task.id || task.name,
          agent: null,
          error: match.message
        });
      }
    }

    return {
      assignments,
      statistics: this._generateAssignmentStatistics(assignments, agentUsage),
      unassigned: assignments.filter(a => !a.agent).map(a => a.task)
    };
  }

  /**
   * Adjust available agents based on current usage
   * @private
   */
  _adjustAvailableAgents(agents, usage, allowDuplicates, maxPerType) {
    if (allowDuplicates) {
      return agents;
    }

    return agents.filter(agent => {
      const currentUsage = usage.get(agent.type) || 0;
      return currentUsage < maxPerType;
    });
  }

  /**
   * Generate assignment statistics
   * @private
   */
  _generateAssignmentStatistics(assignments, agentUsage) {
    const stats = {
      totalTasks: assignments.length,
      assignedTasks: assignments.filter(a => a.agent).length,
      unassignedTasks: assignments.filter(a => !a.agent).length,
      averageScore: 0,
      averageConfidence: 0,
      agentDistribution: {}
    };

    const validAssignments = assignments.filter(a => a.agent && a.score);
    if (validAssignments.length > 0) {
      stats.averageScore = validAssignments.reduce((sum, a) => sum + a.score, 0) / validAssignments.length;
      stats.averageConfidence = validAssignments.reduce((sum, a) => sum + a.confidence, 0) / validAssignments.length;
    }

    agentUsage.forEach((count, agent) => {
      stats.agentDistribution[agent] = count;
    });

    return stats;
  }

  /**
   * Update performance history for an agent
   * @param {string} agentType - Agent type
   * @param {Object} performance - Performance data
   */
  updatePerformanceHistory(agentType, performance) {
    if (!this.performanceHistory.has(agentType)) {
      this.performanceHistory.set(agentType, []);
    }

    const history = this.performanceHistory.get(agentType);
    history.push({
      ...performance,
      timestamp: Date.now()
    });

    // Keep only last 100 entries
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Get performance trends for an agent
   * @param {string} agentType - Agent type
   * @returns {Object} Performance trends
   */
  getPerformanceTrends(agentType) {
    const history = this.performanceHistory.get(agentType) || [];
    if (history.length === 0) {
      return null;
    }

    const recent = history.slice(-20);
    const older = history.slice(0, -20);

    const recentAvg = recent.reduce((sum, p) => sum + (p.successRate || 0), 0) / recent.length;
    const olderAvg = older.length > 0 ? 
      older.reduce((sum, p) => sum + (p.successRate || 0), 0) / older.length : recentAvg;

    return {
      trend: recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable',
      recentSuccessRate: recentAvg,
      historicalSuccessRate: olderAvg,
      dataPoints: history.length
    };
  }

  /**
   * Record agent performance for learning
   * @param {string} agentId - Agent identifier
   * @param {Object} performance - Performance data
   * @param {boolean} performance.success - Whether task was successful
   * @param {number} performance.duration - Task duration in ms
   * @param {number} performance.tokens - Tokens used
   */
  recordAgentPerformance(agentId, performance) {
    if (!this.performanceHistory.has(agentId)) {
      this.performanceHistory.set(agentId, []);
    }
    
    const history = this.performanceHistory.get(agentId);
    const record = {
      timestamp: Date.now(),
      success: performance.success || false,
      duration: performance.duration || 0,
      tokens: performance.tokens || 0,
      successRate: performance.success ? 1 : 0
    };
    
    history.push(record);
    
    // Keep only last 100 records per agent
    if (history.length > 100) {
      history.shift();
    }
    
    // Update success rate for the agent
    const recentHistory = history.slice(-10);
    const successCount = recentHistory.filter(r => r.success).length;
    const recentSuccessRate = successCount / recentHistory.length;
    
    // Store aggregated performance metric
    record.aggregatedSuccessRate = recentSuccessRate;
  }
}

module.exports = CapabilityMatcher;