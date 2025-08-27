const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');

// Import other necessary dependencies
const StorageManager = require('../storage/StorageManager');
const AgentCapabilityManager = require('../agents/AgentCapabilityManager');
const { typeDefs } = require('./graphql/schema');
const { resolvers } = require('./graphql/resolvers');

class ApiGateway {
  constructor(config) {
    this.app = express();
    this.config = config;
    this.storageManager = new StorageManager();
    this.agentCapabilityManager = new AgentCapabilityManager();
    
    this.initializeMiddleware();
    this.setupRoutes();
    this.setupGraphQL();
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests, please try again later.'
    });
    this.app.use(limiter);

    // JSON body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // RESTful endpoints for context CRUD operations
    const router = express.Router();

    // Authentication middleware
    router.use(this.authenticateRequest.bind(this));

    // Create context
    router.post('/contexts', this.createContext.bind(this));

    // Read context
    router.get('/contexts/:id', this.getContext.bind(this));

    // Update context
    router.put('/contexts/:id', this.updateContext.bind(this));

    // Delete context
    router.delete('/contexts/:id', this.deleteContext.bind(this));

    // List contexts
    router.get('/contexts', this.listContexts.bind(this));

    // Search contexts
    router.get('/contexts/search', this.searchContexts.bind(this));

    // Agent management routes
    router.post('/agents', this.registerAgent.bind(this));
    router.get('/agents', this.listAgents.bind(this));
    router.delete('/agents/:id', this.removeAgent.bind(this));

    this.app.use('/api/v1', router);
  }

  setupGraphQL() {
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers: resolvers(this.storageManager, this.agentCapabilityManager)
    });

    const apolloServer = new ApolloServer({
      schema,
      context: ({ req }) => {
        // Pass authentication context to GraphQL resolvers
        return {
          user: req.user,
          storageManager: this.storageManager,
          agentCapabilityManager: this.agentCapabilityManager
        };
      },
      introspection: this.config.enableGraphQLIntrospection,
      playground: this.config.enableGraphQLPlayground
    });

    apolloServer.applyMiddleware({ app: this.app, path: '/graphql' });
  }

  authenticateRequest(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, this.config.jwtSecret);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(403).json({ error: 'Invalid or expired token' });
    }
  }

  // Context CRUD method implementations
  async createContext(req, res) {
    try {
      const context = await this.storageManager.create(req.body);
      res.status(201).json(context);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getContext(req, res) {
    try {
      const context = await this.storageManager.get(req.params.id);
      if (!context) {
        return res.status(404).json({ error: 'Context not found' });
      }
      res.json(context);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateContext(req, res) {
    try {
      const updatedContext = await this.storageManager.update(req.params.id, req.body);
      res.json(updatedContext);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteContext(req, res) {
    try {
      await this.storageManager.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async listContexts(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const contexts = await this.storageManager.list(page, limit);
      res.json(contexts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async searchContexts(req, res) {
    try {
      const { query, filters } = req.query;
      const results = await this.storageManager.search(query, filters);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Agent management methods
  async registerAgent(req, res) {
    try {
      const agent = await this.agentCapabilityManager.register(req.body);
      res.status(201).json(agent);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async listAgents(req, res) {
    try {
      const agents = await this.agentCapabilityManager.list();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async removeAgent(req, res) {
    try {
      await this.agentCapabilityManager.remove(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Server start method
  start() {
    const port = this.config.port || 3000;
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, () => {
        console.log(`API Gateway running on port ${port}`);
        resolve(this.server);
      }).on('error', reject);
    });
  }

  // Server stop method
  stop() {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export default ApiGateway;