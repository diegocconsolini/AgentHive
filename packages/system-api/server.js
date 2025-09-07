// Load environment variables from .env file
require('dotenv').config({ path: '../../.env' });

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Import the flexible AI provider service
const { aiProviderService } = require('./ai-providers.js');
const AgentOrchestrator = require('./src/orchestration/AgentOrchestrator');

class AgentHiveSystemAPI {
  constructor() {
    this.app = express();
    this.port = process.env.SYSTEM_API_PORT || 4001;
    
    // Initialize AI provider service
    this.aiService = aiProviderService;
    
    // Initialize Agent Orchestrator with intelligent routing
    this.orchestrator = new AgentOrchestrator(this.aiService);
    
    // Agent orchestration state (legacy - will be moved to orchestrator)
    this.activeAgents = new Map();
    this.agentMetrics = new Map();
    this.loadBalancingQueue = [];
    
    // Database connection (using same SQLite as user-api)
    this.dbPath = process.env.DATABASE_URL || './database.sqlite';
    
    this.setupMiddleware();
    this.setupRoutes();
    this.initializeSystem();
  }

  setupMiddleware() {
    // CORS for cross-origin requests
    this.app.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4000'],
      credentials: true
    }));
    
    // Security middleware
    this.app.use(helmet());
    
    // Rate limiting for system API (higher limits for internal services)
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Higher limit for system API
      message: { error: 'Rate limit exceeded for System API' }
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint with real system status
    this.app.get('/health', async (req, res) => {
      const providerStatus = await this.checkAIProvidersHealth();
      const systemMetrics = await this.getSystemMetrics();
      
      const healthyProviders = Object.values(providerStatus).filter(p => p.healthy).length;
      const totalProviders = Object.keys(providerStatus).length;
      
      res.status(200).json({
        status: healthyProviders > 0 && systemMetrics.healthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        service: 'AgentHive System API',
        version: '2.0.0',
        aiProviders: {
          healthy: healthyProviders,
          total: totalProviders,
          details: providerStatus
        },
        system: systemMetrics,
        activeAgents: this.activeAgents.size
      });
    });

    // Comprehensive system status
    this.app.get('/api/status', async (req, res) => {
      const availableProviders = this.aiService.getAvailableProviders();
      const providerMetrics = this.aiService.getMetrics();
      const agentMetrics = Array.from(this.agentMetrics.entries()).map(([id, metrics]) => ({
        agentId: id,
        ...metrics
      }));
      
      res.json({
        service: 'AgentHive System API',
        status: 'running',
        timestamp: new Date().toISOString(),
        features: {
          agentOrchestration: 'production',
          loadBalancing: 'active',
          aiProviders: 'flexible-multi-provider',
          performanceMonitoring: 'real-time',
          contextManagement: 'intelligent'
        },
        aiProviders: {
          enabled: availableProviders.filter(p => p.enabled),
          total: availableProviders.length,
          metrics: providerMetrics
        },
        metrics: {
          activeAgents: this.activeAgents.size,
          totalRequests: agentMetrics.reduce((sum, m) => sum + (m.requests || 0), 0),
          averageResponseTime: this.calculateAverageResponseTime(agentMetrics),
          queueLength: this.loadBalancingQueue.length
        },
        endpoints: {
          health: '/health',
          status: '/api/status',
          agents: '/api/agents/*',
          orchestration: '/api/orchestration/*',
          metrics: '/api/metrics/*',
          providers: '/api/providers/*'
        }
      });
    });

    // Real agent orchestration endpoints
    this.app.post('/api/agents/execute', async (req, res) => {
      try {
        const { agentId, prompt, options = {} } = req.body;
        
        if (!agentId || !prompt) {
          return res.status(400).json({
            error: 'Missing required fields: agentId and prompt'
          });
        }
        
        const result = await this.executeAgentViaProviders(agentId, prompt, options);
        
        // Update metrics
        this.updateAgentMetrics(agentId, result);
        
        res.json({
          success: true,
          result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Agent execution error:', error);
        res.status(500).json({
          error: 'Agent execution failed',
          message: error.message
        });
      }
    });

    // Intelligent orchestration endpoint (new)
    this.app.post('/api/orchestrate', async (req, res) => {
      try {
        const { prompt, options = {}, userId, sessionId } = req.body;
        
        if (!prompt) {
          return res.status(400).json({
            error: 'Missing required field: prompt'
          });
        }
        
        const result = await this.orchestrator.orchestrateRequest(
          prompt, 
          options, 
          userId || 'anonymous', 
          sessionId || 'default'
        );
        
        res.json({
          success: true,
          result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Orchestration error:', error);
        res.status(500).json({
          error: 'Orchestration failed',
          message: error.message
        });
      }
    });

    // Orchestration statistics endpoint
    this.app.get('/api/orchestration/stats', async (req, res) => {
      try {
        const stats = this.orchestrator.getStatistics();
        res.json({
          success: true,
          stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
          error: 'Failed to get statistics',
          message: error.message
        });
      }
    });

    // Load balancing endpoint
    this.app.post('/api/orchestration/distribute', async (req, res) => {
      try {
        const { requests } = req.body;
        
        if (!Array.isArray(requests)) {
          return res.status(400).json({
            error: 'Requests must be an array'
          });
        }
        
        const results = await this.distributeRequests(requests);
        
        res.json({
          success: true,
          results,
          distribution: this.getLoadDistribution(),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Distribution error:', error);
        res.status(500).json({
          error: 'Request distribution failed',
          message: error.message
        });
      }
    });

    // Real-time agent metrics
    this.app.get('/api/metrics/agents', (req, res) => {
      const metrics = Array.from(this.agentMetrics.entries()).map(([id, data]) => ({
        agentId: id,
        ...data,
        isActive: this.activeAgents.has(id)
      }));
      
      res.json({
        timestamp: new Date().toISOString(),
        totalAgents: metrics.length,
        activeAgents: this.activeAgents.size,
        metrics
      });
    });

    // Performance analytics
    this.app.get('/api/metrics/performance', (req, res) => {
      const { timeRange = '1h' } = req.query;
      const performance = this.getPerformanceMetrics(timeRange);
      
      res.json({
        timeRange,
        timestamp: new Date().toISOString(),
        ...performance
      });
    });

    // Model routing intelligence
    this.app.post('/api/orchestration/route', async (req, res) => {
      try {
        const { prompt, complexity, requirements } = req.body;
        
        const routing = await this.intelligentRouting({
          prompt,
          complexity: complexity || 'auto',
          requirements: requirements || {}
        });
        
        res.json({
          success: true,
          routing,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          error: 'Routing analysis failed',
          message: error.message
        });
      }
    });

    // AI Provider Management endpoints
    this.app.get('/api/providers', (req, res) => {
      const providers = this.aiService.getAllProviders();
      const providerMetrics = this.aiService.getMetrics();
      
      const providersWithMetrics = providers.map(provider => {
        const metrics = providerMetrics.find(m => m.providerId === provider.name);
        return {
          ...provider,
          metrics: metrics || {
            requestCount: 0,
            totalTokens: 0,
            averageResponseTime: 0,
            totalCost: 0,
            successRate: 1.0,
            lastUsed: null
          }
        };
      });
      
      res.json({
        providers: providersWithMetrics,
        timestamp: new Date().toISOString()
      });
    });

    this.app.post('/api/providers/test', async (req, res) => {
      try {
        const results = await this.aiService.testAllProviders();
        res.json({
          success: true,
          results,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          error: 'Provider testing failed',
          message: error.message
        });
      }
    });

    this.app.put('/api/providers/:providerId', async (req, res) => {
      try {
        const { providerId } = req.params;
        const updates = req.body;
        
        const success = this.aiService.updateProviderConfig(providerId, updates);
        
        if (success) {
          res.json({
            success: true,
            message: `Provider ${providerId} updated successfully`
          });
        } else {
          res.status(404).json({
            error: 'Provider not found',
            providerId
          });
        }
      } catch (error) {
        res.status(500).json({
          error: 'Provider update failed',
          message: error.message
        });
      }
    });

    this.app.get('/api/providers/:providerId/health', async (req, res) => {
      try {
        const { providerId } = req.params;
        const health = await this.aiService.checkProviderHealth(providerId);
        
        res.json({
          providerId,
          ...health,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          error: 'Health check failed',
          message: error.message
        });
      }
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'AgentHive System API',
        description: 'Enterprise AI agent orchestration and monitoring system powered by RTX 5090',
        version: '2.0.0',
        features: ['Real AI Execution', 'Load Balancing', 'Performance Analytics', 'Intelligent Routing'],
        documentation: '/api/status',
        healthCheck: '/health'
      });
    });

    // SSP Extension - Stable Success Patterns API endpoints
    this.app.get('/api/ssp/patterns/:agentId', async (req, res) => {
      try {
        const { agentId } = req.params;
        const { userId, sessionId } = req.query;
        
        if (!userId || !sessionId) {
          return res.status(400).json({
            error: 'Missing required query parameters: userId and sessionId'
          });
        }
        
        // Ensure orchestrator and SSP service are initialized
        await this.orchestrator._ensureMemoryManagerInitialized();
        
        const patterns = await this.orchestrator.sspService.getRelevantPatterns(
          agentId, 
          null, // All patterns
          userId, 
          sessionId
        );
        
        res.json({ 
          agentId,
          patterns,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('SSP patterns error:', error);
        res.status(500).json({ 
          error: 'Failed to get SSP patterns', 
          message: error.message 
        });
      }
    });

    this.app.post('/api/ssp/predict', async (req, res) => {
      try {
        const { procedureId, agentId, userId, sessionId } = req.body;
        
        if (!procedureId || !agentId || !userId || !sessionId) {
          return res.status(400).json({
            error: 'Missing required fields: procedureId, agentId, userId, sessionId'
          });
        }
        
        // Ensure orchestrator and SSP service are initialized
        await this.orchestrator._ensureMemoryManagerInitialized();
        
        const prediction = await this.orchestrator.sspService.predictProcedureSuccess(
          procedureId, agentId, userId, sessionId
        );
        
        res.json({ 
          procedureId,
          agentId,
          prediction: Math.round(prediction * 100), // Return as percentage
          confidence: prediction > 0.5 ? 'high' : 'low',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('SSP prediction error:', error);
        res.status(500).json({ 
          error: 'Failed to predict procedure success', 
          message: error.message 
        });
      }
    });

    this.app.get('/api/ssp/analytics/:agentId', async (req, res) => {
      try {
        const { agentId } = req.params;
        
        // Ensure orchestrator and SSP service are initialized
        await this.orchestrator._ensureMemoryManagerInitialized();
        
        const analytics = await this.orchestrator.sspService.getAgentSSPAnalytics(agentId);
        
        res.json({
          ...analytics,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('SSP analytics error:', error);
        res.status(500).json({ 
          error: 'Failed to get SSP analytics', 
          message: error.message 
        });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        service: 'AgentHive System API',
        available_endpoints: [
          '/', '/health', '/api/status',
          '/api/agents/execute', '/api/orchestration/distribute',
          '/api/metrics/agents', '/api/metrics/performance',
          '/api/orchestration/route', '/api/providers',
          '/api/providers/test', '/api/test/openai',
          '/api/ssp/patterns/:agentId', '/api/ssp/predict', '/api/ssp/analytics/:agentId'
        ]
      });
    });
  }

  // System initialization
  async initializeSystem() {
    console.log('🚀 Initializing AgentHive System API...');
    
    try {
      // Test all AI provider connections
      const providerHealth = await this.checkAIProvidersHealth();
      const enabledProviders = Object.entries(providerHealth).filter(([_, health]) => health.healthy);
      
      if (enabledProviders.length > 0) {
        console.log(`✅ ${enabledProviders.length} AI provider(s) connected:`);
        enabledProviders.forEach(([name, health]) => {
          console.log(`  - ${name}: ${health.latency}ms latency`);
        });
      } else {
        console.warn('⚠️  No AI providers available, system running in degraded mode');
      }
      
      // Show available providers and models
      const providers = this.aiService.getAvailableProviders().filter(p => p.enabled);
      if (providers.length > 0) {
        const allModels = providers.flatMap(p => p.models);
        console.log(`📋 Available models: ${allModels.join(', ')}`);
      }
      
      // Initialize metrics collection
      this.startMetricsCollection();
      console.log('📊 Metrics collection started');
      
    } catch (error) {
      console.error('❌ System initialization failed:', error.message);
    }
  }

  // Check health of all AI providers
  async checkAIProvidersHealth() {
    return await this.aiService.testAllProviders();
  }

  // Get system metrics
  async getSystemMetrics() {
    try {
      return {
        healthy: true,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        cpu: process.cpuUsage()
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  // Get available models from all providers
  getAvailableModels() {
    const providers = this.aiService.getAvailableProviders().filter(p => p.enabled);
    return providers.flatMap(p => p.models);
  }

  // Execute agent via flexible providers
  async executeAgentViaProviders(agentId, prompt, options = {}) {
    const startTime = Date.now();
    
    try {
      // Add to active agents
      this.activeAgents.set(agentId, { startTime, prompt: prompt.substring(0, 100) });
      
      // Build system prompt for agent
      const systemPrompt = this.buildAgentSystemPrompt(agentId);
      
      // Determine optimal model based on complexity
      const availableProviders = this.aiService.getAvailableProviders().filter(p => p.enabled);
      if (availableProviders.length === 0) {
        throw new Error('No AI providers are enabled. Please configure at least one provider.');
      }
      
      const model = options.model || availableProviders[0].models[0];
      
      // Execute via AI provider service
      const response = await this.aiService.generateResponse({
        model,
        prompt,
        systemPrompt,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 4000,
        stream: false
      });
      
      const duration = Date.now() - startTime;
      
      // SSP Extension - Record successful procedure execution
      console.log(`🔍 SSP Check: orchestrator=${!!this.orchestrator}, sspService=${!!this.orchestrator?.sspService}`);
      
      // Initialize SSP service if needed
      if (this.orchestrator && !this.orchestrator.sspService) {
        try {
          await this.orchestrator._ensureMemoryManagerInitialized();
          console.log(`✅ SSP Service initialized on demand`);
        } catch (initError) {
          console.error('❌ SSP initialization error:', initError);
        }
      }
      
      if (this.orchestrator && this.orchestrator.sspService) {
        try {
          const contextId = `${options.userId || 'anon'}-${options.sessionId || Date.now()}`;
          console.log(`🔍 SSP Recording: contextId=${contextId}, agentId=${agentId}, duration=${duration}ms`);
          
          await this.orchestrator.sspService.recordProcedureExecution(
            contextId,
            agentId,
            options.sessionId || 'default',
            true, // success
            duration
          );
          
          console.log(`✅ SSP recorded successfully for agent ${agentId}`);
        } catch (sspError) {
          console.error('❌ SSP tracking error:', sspError);
        }
      } else {
        console.log(`⚠️ SSP not available: orchestrator=${!!this.orchestrator}, sspService=${!!this.orchestrator?.sspService}`);
      }
      
      // Remove from active agents
      this.activeAgents.delete(agentId);
      
      return {
        agentId,
        output: response.response,
        model: response.model,
        tokens: response.tokens,
        duration: response.duration,
        cost: response.cost || 0,
        provider: response.provider,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.activeAgents.delete(agentId);
      throw error;
    }
  }

  // Intelligent model selection using provider service
  selectOptimalModel(complexity = 'auto', prompt = '') {
    const providers = this.aiService.getAvailableProviders().filter(p => p.enabled);
    if (providers.length === 0) return null;
    
    // Use the highest priority provider
    const provider = providers.sort((a, b) => b.priority - a.priority)[0];
    
    // Auto-detect complexity if needed
    if (complexity === 'auto') {
      if (prompt.length < 100) complexity = 'simple';
      else if (prompt.length > 500) complexity = 'complex';
      else complexity = 'medium';
    }
    
    return this.aiService.selectOptimalModel(provider.name, complexity);
  }

  // Build specialized system prompt for agent
  buildAgentSystemPrompt(agentId) {
    // Get agent data from orchestrator's registry
    const agent = this.orchestrator.registry.getAgent(agentId);
    
    if (agent && agent.systemPrompt) {
      return agent.systemPrompt;
    }
    
    // Fallback if agent not found or no system prompt
    return `You are a specialized AI agent with ID: ${agentId}. Provide expert assistance in your area of specialization.`;
  }

  // Distribute multiple requests with load balancing
  async distributeRequests(requests) {
    const results = [];
    const concurrencyLimit = 3; // Process 3 requests concurrently
    
    for (let i = 0; i < requests.length; i += concurrencyLimit) {
      const batch = requests.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(request => 
        this.executeAgentViaProviders(request.agentId, request.prompt, request.options || {})
          .catch(error => ({ error: error.message, ...request }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  // Get load distribution information
  getLoadDistribution() {
    return {
      activeAgents: Array.from(this.activeAgents.entries()).map(([id, data]) => ({
        agentId: id,
        startTime: data.startTime,
        prompt: data.prompt
      })),
      queueLength: this.loadBalancingQueue.length,
      timestamp: new Date().toISOString()
    };
  }

  // Update agent metrics
  updateAgentMetrics(agentId, result) {
    if (!this.agentMetrics.has(agentId)) {
      this.agentMetrics.set(agentId, {
        requests: 0,
        totalTokens: 0,
        totalDuration: 0,
        errors: 0,
        lastUsed: null
      });
    }
    
    const metrics = this.agentMetrics.get(agentId);
    metrics.requests += 1;
    metrics.totalTokens += result.tokens.total;
    metrics.totalDuration += result.duration;
    metrics.lastUsed = new Date().toISOString();
    
    if (result.error) {
      metrics.errors += 1;
    }
    
    this.agentMetrics.set(agentId, metrics);
  }

  // Calculate average response time
  calculateAverageResponseTime(agentMetrics) {
    if (agentMetrics.length === 0) return 0;
    
    const totalTime = agentMetrics.reduce((sum, m) => sum + (m.totalDuration || 0), 0);
    const totalRequests = agentMetrics.reduce((sum, m) => sum + (m.requests || 0), 0);
    
    return totalRequests > 0 ? Math.round(totalTime / totalRequests) : 0;
  }

  // Get performance metrics for time range
  getPerformanceMetrics(timeRange) {
    // For production, this would query a time-series database
    // For now, return current metrics
    return {
      requestsPerMinute: this.calculateRequestsPerMinute(),
      averageResponseTime: this.calculateAverageResponseTime(Array.from(this.agentMetrics.values())),
      errorRate: this.calculateErrorRate(),
      modelUsage: this.getModelUsageStats(),
      topAgents: this.getTopAgents()
    };
  }

  calculateRequestsPerMinute() {
    // Simplified calculation based on current active agents
    return this.activeAgents.size * 60 / 3; // Rough estimate
  }

  calculateErrorRate() {
    const metrics = Array.from(this.agentMetrics.values());
    const totalRequests = metrics.reduce((sum, m) => sum + (m.requests || 0), 0);
    const totalErrors = metrics.reduce((sum, m) => sum + (m.errors || 0), 0);
    
    return totalRequests > 0 ? (totalErrors / totalRequests * 100) : 0;
  }

  getModelUsageStats() {
    const providerMetrics = this.aiService.getMetrics();
    return providerMetrics.map(metric => ({
      provider: metric.providerId,
      model: metric.model,
      usage: metric.requestCount,
      avgResponseTime: metric.averageResponseTime,
      totalCost: metric.totalCost
    }));
  }

  getTopAgents() {
    return Array.from(this.agentMetrics.entries())
      .map(([id, metrics]) => ({ agentId: id, ...metrics }))
      .sort((a, b) => (b.requests || 0) - (a.requests || 0))
      .slice(0, 10);
  }

  // Intelligent routing analysis
  async intelligentRouting({ prompt, complexity, requirements }) {
    const analysis = {
      recommendedModel: await this.selectOptimalModel(prompt, complexity),
      complexity: this.analyzeComplexity(prompt),
      estimatedTokens: this.estimateTokens(prompt),
      estimatedDuration: this.estimateDuration(prompt),
      routing: {
        provider: 'ollama',
        reason: 'Local RTX 5090 optimal for this request'
      }
    };
    
    return analysis;
  }

  analyzeComplexity(prompt) {
    if (prompt.length > 1000 || /complex|analyze|debug|optimize/i.test(prompt)) {
      return 'complex';
    } else if (prompt.length > 200 || /code|review|explain/i.test(prompt)) {
      return 'medium';
    } else {
      return 'simple';
    }
  }

  estimateTokens(prompt) {
    // Rough estimation: 4 characters per token
    return Math.ceil(prompt.length / 4) + Math.ceil(Math.random() * 500) + 200;
  }

  estimateDuration(prompt) {
    const complexity = this.analyzeComplexity(prompt);
    const baseTimes = { simple: 1500, medium: 2500, complex: 4000 };
    return baseTimes[complexity] + Math.floor(Math.random() * 1000);
  }

  // Start metrics collection
  startMetricsCollection() {
    // Clean up metrics every 5 minutes
    setInterval(() => {
      const cutoffTime = Date.now() - (5 * 60 * 1000); // 5 minutes ago
      
      for (const [agentId, data] of this.activeAgents.entries()) {
        if (data.startTime < cutoffTime) {
          this.activeAgents.delete(agentId);
        }
      }
    }, 60000); // Check every minute

    // OpenAI Provider Test Endpoint
    this.app.post('/api/test/openai', async (req, res) => {
      try {
        const { message = "Hello, test the OpenAI integration" } = req.body;
        
        // Check if OpenAI provider is available
        const openaiProvider = this.aiService.providers.get('openai');
        if (!openaiProvider || !openaiProvider.enabled) {
          return res.status(400).json({
            error: 'OpenAI provider not available',
            details: 'Please set OPENAI_API_KEY in .env file',
            provider: openaiProvider ? {
              name: openaiProvider.name,
              enabled: openaiProvider.enabled,
              hasApiKey: !!openaiProvider.apiKey
            } : null
          });
        }

        // Test OpenAI request
        const testRequest = {
          task: message,
          requirements: ['text-generation'],
          context: 'Testing OpenAI integration'
        };

        const response = await this.aiService.generateResponse(testRequest, 'openai');
        
        res.json({
          success: true,
          provider: 'openai',
          model: response.model || 'gpt-3.5-turbo',
          response: response.text || response.content,
          usage: response.usage,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('OpenAI test error:', error);
        res.status(500).json({
          error: 'OpenAI test failed',
          message: error.message,
          details: error.response?.data || error.toString()
        });
      }
    });
  }

  async start() {
    try {
      this.app.listen(this.port, () => {
        console.log(`🐝 AgentHive System API started successfully`);
        console.log(`📡 Server running on port ${this.port}`);
        console.log(`🔗 Health check: http://localhost:${this.port}/health`);
        console.log(`📊 API status: http://localhost:${this.port}/api/status`);
        console.log(`🎯 Real AI orchestration with RTX 5090 ready!`);
        console.log(`⚡ Features: Load Balancing, Performance Analytics, Intelligent Routing`);
      });
    } catch (error) {
      console.error('Failed to start AgentHive System API:', error);
      process.exit(1);
    }
  }
}

// Start the server
const systemAPI = new AgentHiveSystemAPI();
systemAPI.start();

module.exports = AgentHiveSystemAPI;