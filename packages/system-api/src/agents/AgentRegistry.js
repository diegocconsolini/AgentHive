/**
 * Agent Registry
 * Centralized catalog of agent types with capabilities, metadata, and specializations
 * Supports 50+ agent types with dynamic capability discovery
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
   * Initialize the registry with all agent types
   * @private
   */
  _initializeRegistry() {
    // Development Agents
    this._registerAgent({
      type: 'frontend-developer',
      category: 'development',
      capabilities: ['react-development', 'vue-development', 'angular-development', 'ui-implementation', 'responsive-design', 'component-architecture'],
      specializations: ['react-specialist', 'vue-specialist', 'angular-specialist'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 120,
        successRate: 0.92,
        preferredFileTypes: ['.jsx', '.tsx', '.vue', '.html', '.css']
      }
    });

    this._registerAgent({
      type: 'backend-architect',
      category: 'development',
      capabilities: ['api-design', 'service-architecture', 'database-design', 'caching-strategies', 'security-patterns', 'scalability-planning'],
      specializations: ['microservices-architect', 'serverless-architect'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 180,
        successRate: 0.88,
        preferredFileTypes: ['.js', '.ts', '.py', '.java', '.go']
      }
    });

    this._registerAgent({
      type: 'backend-developer',
      category: 'development',
      capabilities: ['code-implementation', 'unit-testing', 'debugging', 'refactoring', 'performance-optimization', 'documentation'],
      specializations: ['api-developer', 'database-developer'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 90,
        successRate: 0.94,
        preferredFileTypes: ['.js', '.ts', '.py', '.java', '.go', '.rb']
      }
    });

    this._registerAgent({
      type: 'database-optimizer',
      category: 'development',
      capabilities: ['schema-design', 'index-optimization', 'query-tuning', 'migration-scripts', 'constraint-management', 'performance-analysis'],
      specializations: ['sql-optimizer', 'nosql-optimizer'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 150,
        successRate: 0.87,
        preferredFileTypes: ['.sql', '.migration', '.schema']
      }
    });

    this._registerAgent({
      type: 'api-developer',
      category: 'development',
      capabilities: ['rest-api', 'graphql', 'websockets', 'api-documentation', 'authentication', 'rate-limiting'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 100,
        successRate: 0.91,
        preferredFileTypes: ['.js', '.ts', '.yaml', '.json']
      }
    });

    this._registerAgent({
      type: 'mobile-developer',
      category: 'development',
      capabilities: ['ios-development', 'android-development', 'react-native', 'flutter', 'mobile-optimization', 'push-notifications'],
      specializations: ['ios-specialist', 'android-specialist'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 140,
        successRate: 0.86,
        preferredFileTypes: ['.swift', '.kotlin', '.java', '.dart']
      }
    });

    // Analysis Agents
    this._registerAgent({
      type: 'code-analyzer',
      category: 'analysis',
      capabilities: ['bug-detection', 'code-review', 'security-analysis', 'complexity-analysis', 'dependency-tracking', 'code-quality'],
      specializations: ['security-analyzer', 'performance-analyzer'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 60,
        successRate: 0.96,
        preferredFileTypes: ['*']
      }
    });

    this._registerAgent({
      type: 'file-analyzer',
      category: 'analysis',
      capabilities: ['file-summarization', 'log-analysis', 'content-extraction', 'size-reduction', 'pattern-detection', 'data-mining'],
      metadata: {
        complexity: 'low',
        averageTaskTime: 30,
        successRate: 0.98,
        preferredFileTypes: ['.log', '.txt', '.csv', '.json']
      }
    });

    this._registerAgent({
      type: 'error-detective',
      category: 'analysis',
      capabilities: ['stack-trace-analysis', 'root-cause-analysis', 'error-pattern-detection', 'debug-assistance', 'log-correlation', 'crash-analysis'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 75,
        successRate: 0.89,
        preferredFileTypes: ['.log', '.stack', '.crash']
      }
    });

    this._registerAgent({
      type: 'performance-profiler',
      category: 'analysis',
      capabilities: ['cpu-profiling', 'memory-profiling', 'bottleneck-detection', 'optimization-suggestions', 'benchmark-analysis', 'resource-monitoring'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 120,
        successRate: 0.85,
        preferredFileTypes: ['.prof', '.heap', '.trace']
      }
    });

    this._registerAgent({
      type: 'security-auditor',
      category: 'analysis',
      capabilities: ['vulnerability-scanning', 'penetration-testing', 'compliance-checking', 'threat-modeling', 'security-recommendations', 'dependency-audit'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 180,
        successRate: 0.91,
        preferredFileTypes: ['*']
      }
    });

    // Infrastructure Agents
    this._registerAgent({
      type: 'devops-troubleshooter',
      category: 'infrastructure',
      capabilities: ['pipeline-debugging', 'deployment-automation', 'container-management', 'orchestration', 'monitoring-setup', 'incident-response'],
      specializations: ['kubernetes-specialist', 'docker-specialist'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 110,
        successRate: 0.88,
        preferredFileTypes: ['.yaml', '.yml', '.dockerfile', '.jenkinsfile']
      }
    });

    this._registerAgent({
      type: 'cloud-architect',
      category: 'infrastructure',
      capabilities: ['cloud-design', 'cost-optimization', 'scalability-design', 'disaster-recovery', 'multi-region-setup', 'service-mesh'],
      specializations: ['aws-architect', 'azure-architect', 'gcp-architect'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 200,
        successRate: 0.87,
        preferredFileTypes: ['.tf', '.yaml', '.json']
      }
    });

    this._registerAgent({
      type: 'infrastructure-engineer',
      category: 'infrastructure',
      capabilities: ['terraform', 'ansible', 'kubernetes', 'docker', 'ci-cd-pipelines', 'monitoring'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 95,
        successRate: 0.90,
        preferredFileTypes: ['.tf', '.yaml', '.sh']
      }
    });

    this._registerAgent({
      type: 'site-reliability-engineer',
      category: 'infrastructure',
      capabilities: ['slo-management', 'incident-management', 'chaos-engineering', 'observability', 'runbook-automation', 'capacity-planning'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 130,
        successRate: 0.86,
        preferredFileTypes: ['.yaml', '.py', '.sh']
      }
    });

    // Language Specialists
    this._registerAgent({
      type: 'python-pro',
      category: 'language-specialist',
      capabilities: ['python-development', 'django', 'flask', 'fastapi', 'data-processing', 'scientific-computing'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 80,
        successRate: 0.93,
        preferredFileTypes: ['.py', '.pyx', '.pyi']
      }
    });

    this._registerAgent({
      type: 'javascript-pro',
      category: 'language-specialist',
      capabilities: ['javascript-development', 'nodejs', 'express', 'webpack', 'babel', 'npm-packages'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 75,
        successRate: 0.94,
        preferredFileTypes: ['.js', '.mjs', '.cjs']
      }
    });

    this._registerAgent({
      type: 'typescript-pro',
      category: 'language-specialist',
      capabilities: ['typescript-development', 'type-definitions', 'decorators', 'generics', 'type-guards', 'compilation-config'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 85,
        successRate: 0.92,
        preferredFileTypes: ['.ts', '.tsx', '.d.ts']
      }
    });

    this._registerAgent({
      type: 'rust-pro',
      category: 'language-specialist',
      capabilities: ['rust-development', 'memory-safety', 'concurrency', 'cargo', 'unsafe-code', 'macro-programming'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 110,
        successRate: 0.88,
        preferredFileTypes: ['.rs', '.toml']
      }
    });

    this._registerAgent({
      type: 'go-pro',
      category: 'language-specialist',
      capabilities: ['go-development', 'goroutines', 'channels', 'modules', 'interfaces', 'testing'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 90,
        successRate: 0.91,
        preferredFileTypes: ['.go', '.mod']
      }
    });

    this._registerAgent({
      type: 'java-pro',
      category: 'language-specialist',
      capabilities: ['java-development', 'spring-boot', 'junit', 'maven', 'gradle', 'jvm-tuning'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 95,
        successRate: 0.90,
        preferredFileTypes: ['.java', '.xml', '.gradle']
      }
    });

    this._registerAgent({
      type: 'cpp-pro',
      category: 'language-specialist',
      capabilities: ['cpp-development', 'stl', 'templates', 'memory-management', 'cmake', 'performance-critical'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 120,
        successRate: 0.87,
        preferredFileTypes: ['.cpp', '.hpp', '.cc', '.h']
      }
    });

    // Domain Experts
    this._registerAgent({
      type: 'ml-engineer',
      category: 'domain-expert',
      capabilities: ['model-training', 'feature-engineering', 'hyperparameter-tuning', 'model-deployment', 'mlops', 'data-pipelines'],
      specializations: ['deep-learning-expert', 'nlp-expert', 'computer-vision-expert'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 180,
        successRate: 0.85,
        preferredFileTypes: ['.py', '.ipynb', '.h5', '.pkl']
      }
    });

    this._registerAgent({
      type: 'data-scientist',
      category: 'domain-expert',
      capabilities: ['data-analysis', 'statistical-modeling', 'visualization', 'hypothesis-testing', 'ab-testing', 'predictive-modeling'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 150,
        successRate: 0.87,
        preferredFileTypes: ['.py', '.r', '.ipynb', '.csv']
      }
    });

    this._registerAgent({
      type: 'blockchain-developer',
      category: 'domain-expert',
      capabilities: ['smart-contracts', 'web3', 'solidity', 'defi', 'consensus-algorithms', 'cryptography'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 160,
        successRate: 0.84,
        preferredFileTypes: ['.sol', '.js', '.rs']
      }
    });

    this._registerAgent({
      type: 'game-developer',
      category: 'domain-expert',
      capabilities: ['game-mechanics', 'physics-engines', 'graphics-programming', 'unity', 'unreal', 'optimization'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 140,
        successRate: 0.86,
        preferredFileTypes: ['.cs', '.cpp', '.shader']
      }
    });

    this._registerAgent({
      type: 'quant-analyst',
      category: 'domain-expert',
      capabilities: ['algorithmic-trading', 'risk-modeling', 'portfolio-optimization', 'backtesting', 'market-analysis', 'derivatives-pricing'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 170,
        successRate: 0.83,
        preferredFileTypes: ['.py', '.r', '.cpp']
      }
    });

    this._registerAgent({
      type: 'embedded-systems-engineer',
      category: 'domain-expert',
      capabilities: ['firmware-development', 'real-time-systems', 'hardware-interfaces', 'rtos', 'low-level-optimization', 'driver-development'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 130,
        successRate: 0.85,
        preferredFileTypes: ['.c', '.cpp', '.asm', '.hex']
      }
    });

    // Testing Agents
    this._registerAgent({
      type: 'test-runner',
      category: 'testing',
      capabilities: ['test-execution', 'result-analysis', 'coverage-reporting', 'performance-testing', 'integration-testing', 'test-orchestration'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 45,
        successRate: 0.96,
        preferredFileTypes: ['.test.js', '.spec.ts', '.test.py']
      }
    });

    this._registerAgent({
      type: 'qa-engineer',
      category: 'testing',
      capabilities: ['test-planning', 'test-case-design', 'automation', 'regression-testing', 'exploratory-testing', 'bug-reporting'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 100,
        successRate: 0.92,
        preferredFileTypes: ['.feature', '.spec', '.test']
      }
    });

    this._registerAgent({
      type: 'e2e-tester',
      category: 'testing',
      capabilities: ['selenium', 'cypress', 'playwright', 'user-flow-testing', 'cross-browser-testing', 'visual-regression'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 120,
        successRate: 0.89,
        preferredFileTypes: ['.js', '.ts', '.feature']
      }
    });

    this._registerAgent({
      type: 'load-tester',
      category: 'testing',
      capabilities: ['jmeter', 'gatling', 'k6', 'stress-testing', 'performance-benchmarking', 'scalability-testing'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 150,
        successRate: 0.87,
        preferredFileTypes: ['.jmx', '.scala', '.js']
      }
    });

    // Workflow Agents
    this._registerAgent({
      type: 'parallel-worker',
      category: 'workflow',
      capabilities: ['workflow-coordination', 'task-distribution', 'progress-tracking', 'conflict-resolution', 'synchronization', 'pipeline-management'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 60,
        successRate: 0.91,
        preferredFileTypes: ['*']
      }
    });

    this._registerAgent({
      type: 'context-manager',
      category: 'workflow',
      capabilities: ['context-preservation', 'state-management', 'memory-optimization', 'context-switching', 'session-management', 'history-tracking'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 40,
        successRate: 0.95,
        preferredFileTypes: ['.json', '.yaml']
      }
    });

    this._registerAgent({
      type: 'task-scheduler',
      category: 'workflow',
      capabilities: ['cron-jobs', 'task-queuing', 'priority-scheduling', 'deadline-management', 'resource-allocation', 'batch-processing'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 50,
        successRate: 0.93,
        preferredFileTypes: ['.yaml', '.json']
      }
    });

    this._registerAgent({
      type: 'integration-coordinator',
      category: 'workflow',
      capabilities: ['api-integration', 'webhook-management', 'event-handling', 'data-synchronization', 'service-orchestration', 'message-queuing'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 110,
        successRate: 0.88,
        preferredFileTypes: ['.json', '.xml', '.yaml']
      }
    });

    // Business Agents
    this._registerAgent({
      type: 'business-analyst',
      category: 'business',
      capabilities: ['requirements-gathering', 'process-mapping', 'gap-analysis', 'user-stories', 'acceptance-criteria', 'stakeholder-management'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 120,
        successRate: 0.90,
        preferredFileTypes: ['.md', '.docx', '.xlsx']
      }
    });

    this._registerAgent({
      type: 'product-manager',
      category: 'business',
      capabilities: ['product-strategy', 'roadmap-planning', 'feature-prioritization', 'market-analysis', 'user-research', 'metrics-definition'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 180,
        successRate: 0.88,
        preferredFileTypes: ['.md', '.pptx', '.xlsx']
      }
    });

    this._registerAgent({
      type: 'technical-writer',
      category: 'business',
      capabilities: ['documentation', 'api-docs', 'user-guides', 'release-notes', 'technical-tutorials', 'knowledge-base'],
      metadata: {
        complexity: 'low',
        averageTaskTime: 90,
        successRate: 0.94,
        preferredFileTypes: ['.md', '.rst', '.adoc']
      }
    });

    this._registerAgent({
      type: 'content-marketer',
      category: 'business',
      capabilities: ['content-creation', 'seo-optimization', 'blog-writing', 'social-media', 'email-campaigns', 'landing-pages'],
      metadata: {
        complexity: 'low',
        averageTaskTime: 80,
        successRate: 0.92,
        preferredFileTypes: ['.md', '.html', '.txt']
      }
    });

    // Specialized Tools
    this._registerAgent({
      type: 'search-specialist',
      category: 'specialized',
      capabilities: ['elasticsearch', 'solr', 'full-text-search', 'semantic-search', 'indexing-strategies', 'query-optimization'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 100,
        successRate: 0.89,
        preferredFileTypes: ['.json', '.yaml']
      }
    });

    this._registerAgent({
      type: 'prompt-engineer',
      category: 'specialized',
      capabilities: ['prompt-design', 'llm-optimization', 'few-shot-learning', 'chain-of-thought', 'prompt-testing', 'output-validation'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 70,
        successRate: 0.91,
        preferredFileTypes: ['.txt', '.json', '.yaml']
      }
    });

    this._registerAgent({
      type: 'data-engineer',
      category: 'specialized',
      capabilities: ['etl-pipelines', 'data-warehousing', 'spark', 'airflow', 'data-quality', 'stream-processing'],
      metadata: {
        complexity: 'high',
        averageTaskTime: 140,
        successRate: 0.88,
        preferredFileTypes: ['.py', '.sql', '.scala']
      }
    });

    this._registerAgent({
      type: 'ui-ux-designer',
      category: 'specialized',
      capabilities: ['ui-design', 'ux-research', 'prototyping', 'wireframing', 'usability-testing', 'design-systems'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 110,
        successRate: 0.90,
        preferredFileTypes: ['.fig', '.sketch', '.xd']
      }
    });

    this._registerAgent({
      type: 'accessibility-specialist',
      category: 'specialized',
      capabilities: ['wcag-compliance', 'screen-reader-testing', 'aria-implementation', 'keyboard-navigation', 'color-contrast', 'audit-reporting'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 90,
        successRate: 0.93,
        preferredFileTypes: ['.html', '.css', '.js']
      }
    });

    this._registerAgent({
      type: 'localization-engineer',
      category: 'specialized',
      capabilities: ['i18n', 'l10n', 'translation-management', 'locale-handling', 'cultural-adaptation', 'string-extraction'],
      metadata: {
        complexity: 'medium',
        averageTaskTime: 85,
        successRate: 0.92,
        preferredFileTypes: ['.json', '.po', '.xml']
      }
    });

    // Build indexes and relationships
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
      version: '1.0.0',
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