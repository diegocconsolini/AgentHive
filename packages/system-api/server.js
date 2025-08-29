const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

class EpicMemoryManager {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 4001;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Epic Memory Manager',
        version: '1.0.0'
      });
    });

    // API status endpoint
    this.app.get('/api/status', (req, res) => {
      res.json({
        service: 'Epic Memory Manager',
        status: 'running',
        features: {
          agentCapabilityManagement: 'available',
          contextPersistence: 'available',
          performanceMonitoring: 'available',
          migrationTools: 'available'
        },
        endpoints: {
          health: '/health',
          status: '/api/status',
          agents: '/api/agents',
          contexts: '/api/contexts'
        }
      });
    });

    // Agents endpoint (placeholder)
    this.app.get('/api/agents', (req, res) => {
      res.json({
        agents: [],
        capabilities: [
          'dynamic_orchestration',
          'load_balancing',
          'capability_routing'
        ],
        count: 0
      });
    });

    // Contexts endpoint (placeholder)
    this.app.get('/api/contexts', (req, res) => {
      res.json({
        contexts: [],
        features: [
          'intelligent_state_management',
          'session_persistence',
          'context_migration'
        ],
        count: 0
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'Epic Memory Manager',
        description: 'Advanced context and agent management system for AI workflows',
        version: '1.0.0',
        documentation: '/api/status'
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        available_endpoints: ['/', '/health', '/api/status', '/api/agents', '/api/contexts']
      });
    });
  }

  async start() {
    try {
      this.app.listen(this.port, () => {
        console.log(`🧠 Epic Memory Manager started successfully`);
        console.log(`📡 Server running on port ${this.port}`);
        console.log(`🔗 Health check: http://localhost:${this.port}/health`);
        console.log(`📊 API status: http://localhost:${this.port}/api/status`);
        console.log(`🎯 Ready for advanced agent orchestration!`);
      });
    } catch (error) {
      console.error('Failed to start Epic Memory Manager:', error);
      process.exit(1);
    }
  }
}

// Start the server
const memoryManager = new EpicMemoryManager();
memoryManager.start();

module.exports = EpicMemoryManager;