const fs = require('fs');
const path = require('path');

/**
 * Agent Registry
 * Centralized catalog of agent types with capabilities, metadata, and specializations
 * Loads agents from agents-data.json with minimal fallback
 */
class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this.capabilityIndex = new Map(); // capability -> Set of agent types
    this.specializationTree = new Map(); // parent type -> Set of child types
    this.versionHistory = new Map(); // agent type -> version history
    this.compatibilityMatrix = new Map(); // agent type -> compatible types
    this._initializeRegistry();
  }

  /**
   * Initialize the registry by loading agents from agents-data.json
   * @private
   */
  _initializeRegistry() {
    try {
      // Load the comprehensive agent dataset
      const agentsDataPath = path.join(__dirname, '../../../../agents-data.json');
      const agentsData = JSON.parse(fs.readFileSync(agentsDataPath, 'utf8'));
      
      console.log(`Loading ${agentsData.length} agents from agents-data.json...`);
      
      // Convert each agent from the JSON format to registry format
      agentsData.forEach(agent => {
        const agentType = this._convertNameToType(agent.name);
        
        this._registerAgent({
          type: agentType,
          name: agent.name,
          category: agent.category,
          capabilities: agent.capabilities || [],
          description: agent.description,
          systemPrompt: agent.systemPrompt,
          metadata: {
            complexity: this._inferComplexity(agent.description),
            averageTaskTime: this._inferTaskTime(agent.category),
            successRate: this._inferSuccessRate(agent.rating),
            model: agent.model,
            temperature: agent.config?.temperature || 0.7,
            maxTokens: agent.config?.maxTokens || 4000,
            version: agent.version,
            popularity: agent.popularity,
            rating: parseFloat(agent.rating) || 0
          }
        });
      });
      
      console.log(`✅ Successfully loaded ${this.agents.size} agents into registry`);
      
      // Build indexes after loading all agents
      this._buildIndexes();
    } catch (error) {
      console.error('❌ Failed to load agents from agents-data.json:', error.message);
      console.log('Falling back to minimal agent set...');
      this._initializeFallbackAgents();
    }
  }

  /**
   * Convert agent name to registry type format (kebab-case)
   * @private
   */
  _convertNameToType(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Infer complexity from agent description
   * @private
   */
  _inferComplexity(description) {
    const complexityIndicators = {
      high: ['architect', 'design', 'advanced', 'enterprise', 'complex', 'comprehensive'],
      medium: ['develop', 'implement', 'create', 'build', 'optimize', 'analyze'],
      low: ['simple', 'basic', 'quick', 'straightforward']
    };

    const desc = description.toLowerCase();
    
    if (complexityIndicators.high.some(indicator => desc.includes(indicator))) {
      return 'high';
    }
    if (complexityIndicators.low.some(indicator => desc.includes(indicator))) {
      return 'low';
    }
    return 'medium';
  }

  /**
   * Infer average task time based on category
   * @private
   */
  _inferTaskTime(category) {
    const categoryTimes = {
      'development': 120,
      'design': 90,
      'testing': 60,
      'security': 150,
      'devops': 180,
      'data': 140,
      'ai-ml': 200,
      'content': 45,
      'specialized': 160
    };
    
    return categoryTimes[category] || 100;
  }

  /**
   * Infer success rate from rating
   * @private
   */
  _inferSuccessRate(rating) {
    const numRating = parseFloat(rating) || 4.0;
    return Math.min(0.95, Math.max(0.7, numRating / 5.0));
  }

  /**
   * Initialize fallback agents if JSON loading fails
   * Only includes essential agents for basic functionality
   * @private
   */
  _initializeFallbackAgents() {
    console.log('Loading minimal fallback agent set...');
    
    // Only essential agents needed for basic operation
    this._registerAgent({
      type: 'code-analyzer',
      name: 'Code Analyzer',
      category: 'analysis',
      capabilities: ['code-analysis', 'bug-detection', 'security-analysis'],
      description: 'Analyze code for bugs, security issues, and quality',
      metadata: {
        complexity: 'medium',
        averageTaskTime: 60,
        successRate: 0.95,
        model: 'claude-3-sonnet',
        temperature: 0.1,
        maxTokens: 4000,
        version: '1.0.0'
      }
    });

    this._registerAgent({
      type: 'file-analyzer', 
      name: 'File Analyzer',
      category: 'analysis',
      capabilities: ['file-analysis', 'log-analysis', 'content-extraction'],
      description: 'Analyze and summarize file contents',
      metadata: {
        complexity: 'low',
        averageTaskTime: 30,
        successRate: 0.98,
        model: 'claude-3-haiku',
        temperature: 0.1,
        maxTokens: 4000,
        version: '1.0.0'
      }
    });

    this._registerAgent({
      type: 'general-developer',
      name: 'General Developer', 
      category: 'development',
      capabilities: ['code-generation', 'debugging', 'refactoring'],
      description: 'General purpose development assistance',
      metadata: {
        complexity: 'medium',
        averageTaskTime: 90,
        successRate: 0.90,
        model: 'claude-3-sonnet',
        temperature: 0.3,
        maxTokens: 4000,
        version: '1.0.0'
      }
    });

    // Build indexes after registering fallback agents
    this._buildIndexes();
  }

  /**
   * Register an agent type
   * @private
   */
  _registerAgent(agentData) {
    const { type, category, capabilities, specializations = [], metadata } = agentData;
    
    // Store agent data
    this.agents.set(type, {
      type,
      category,
      capabilities: new Set(capabilities),
      specializations: new Set(specializations),
      metadata,
      version: metadata?.version || '1.0.0',
      createdAt: new Date().toISOString()
    });

    // Update capability index
    capabilities.forEach(capability => {
      if (!this.capabilityIndex.has(capability)) {
        this.capabilityIndex.set(capability, new Set());
      }
      this.capabilityIndex.get(capability).add(type);
    });

    // Update specialization tree
    specializations.forEach(spec => {
      if (!this.specializationTree.has(type)) {
        this.specializationTree.set(type, new Set());
      }
      this.specializationTree.get(type).add(spec);
    });
  }

  /**
   * Build additional indexes after all agents are registered
   * @private
   */
  _buildIndexes() {
    // Build compatibility matrix
    this.agents.forEach((agentData, agentType) => {
      const compatibleTypes = new Set();
      
      // Agents in same category are generally compatible
      this.agents.forEach((otherData, otherType) => {
        if (agentType !== otherType) {
          if (agentData.category === otherData.category) {
            compatibleTypes.add(otherType);
          }
          // Check for capability overlap
          const overlap = this._calculateCapabilityOverlap(
            agentData.capabilities, 
            otherData.capabilities
          );
          if (overlap > 0.3) {
            compatibleTypes.add(otherType);
          }
        }
      });
      
      this.compatibilityMatrix.set(agentType, compatibleTypes);
    });
  }

  /**
   * Calculate capability overlap between two sets
   * @private
   */
  _calculateCapabilityOverlap(caps1, caps2) {
    const intersection = new Set([...caps1].filter(x => caps2.has(x)));
    const union = new Set([...caps1, ...caps2]);
    return intersection.size / union.size;
  }

  /**
   * Get agent by type
   * @param {string} type - Agent type
   * @returns {Object|null} Agent data or null
   */
  getAgent(type) {
    const agent = this.agents.get(type);
    return agent ? { ...agent, capabilities: Array.from(agent.capabilities) } : null;
  }

  /**
   * Get all agents with a specific capability
   * @param {string} capability - Capability to search for
   * @returns {Array<string>} List of agent types
   */
  getAgentsByCapability(capability) {
    return Array.from(this.capabilityIndex.get(capability) || []);
  }

  /**
   * Get all agents in a category
   * @param {string} category - Category name
   * @returns {Array<Object>} List of agents
   */
  getAgentsByCategory(category) {
    const results = [];
    this.agents.forEach((agent, type) => {
      if (agent.category === category) {
        results.push({ 
          type, 
          ...agent, 
          capabilities: Array.from(agent.capabilities) 
        });
      }
    });
    return results;
  }

  /**
   * Get all capabilities
   * @returns {Array<string>} List of all capabilities
   */
  getAllCapabilities() {
    return Array.from(this.capabilityIndex.keys()).sort();
  }

  /**
   * Get all agent types
   * @returns {Array<string>} List of all agent types
   */
  getAllAgentTypes() {
    return Array.from(this.agents.keys()).sort();
  }

  /**
   * Get agent categories
   * @returns {Array<string>} List of unique categories
   */
  getCategories() {
    const categories = new Set();
    this.agents.forEach(agent => categories.add(agent.category));
    return Array.from(categories).sort();
  }

  /**
   * Check if agent type exists
   * @param {string} type - Agent type
   * @returns {boolean} True if exists
   */
  hasAgent(type) {
    return this.agents.has(type);
  }

  /**
   * Get compatible agents for a given type
   * @param {string} type - Agent type
   * @returns {Array<string>} List of compatible agent types
   */
  getCompatibleAgents(type) {
    return Array.from(this.compatibilityMatrix.get(type) || []);
  }

  /**
   * Get specializations of an agent type
   * @param {string} type - Agent type
   * @returns {Array<string>} List of specializations
   */
  getSpecializations(type) {
    const agent = this.agents.get(type);
    return agent ? Array.from(agent.specializations) : [];
  }

  /**
   * Search agents by metadata criteria
   * @param {Object} criteria - Search criteria
   * @returns {Array<Object>} Matching agents
   */
  searchByMetadata(criteria = {}) {
    const results = [];
    
    this.agents.forEach((agent, type) => {
      let matches = true;
      
      Object.entries(criteria).forEach(([key, value]) => {
        if (agent.metadata[key] !== undefined) {
          if (typeof value === 'object' && value.min !== undefined) {
            matches = matches && agent.metadata[key] >= value.min;
          }
          if (typeof value === 'object' && value.max !== undefined) {
            matches = matches && agent.metadata[key] <= value.max;
          }
          if (typeof value !== 'object') {
            matches = matches && agent.metadata[key] === value;
          }
        }
      });
      
      if (matches) {
        results.push({ 
          type, 
          ...agent, 
          capabilities: Array.from(agent.capabilities) 
        });
      }
    });
    
    return results;
  }

  /**
   * Get registry statistics
   * @returns {Object} Registry statistics
   */
  getStatistics() {
    const stats = {
      totalAgents: this.agents.size,
      totalCapabilities: this.capabilityIndex.size,
      categories: {},
      averageCapabilitiesPerAgent: 0,
      averageSuccessRate: 0,
      averageTaskTime: 0
    };

    let totalCaps = 0;
    let totalSuccess = 0;
    let totalTime = 0;

    this.agents.forEach(agent => {
      // Category counts
      stats.categories[agent.category] = (stats.categories[agent.category] || 0) + 1;
      
      // Averages
      totalCaps += agent.capabilities.size;
      totalSuccess += agent.metadata.successRate;
      totalTime += agent.metadata.averageTaskTime;
    });

    stats.averageCapabilitiesPerAgent = totalCaps / this.agents.size;
    stats.averageSuccessRate = totalSuccess / this.agents.size;
    stats.averageTaskTime = totalTime / this.agents.size;

    return stats;
  }
}

module.exports = AgentRegistry;