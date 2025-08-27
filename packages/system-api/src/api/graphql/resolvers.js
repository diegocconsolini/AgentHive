import { GraphQLScalarType, Kind } from 'graphql';
import { PubSub } from 'graphql-subscriptions';

// Create a PubSub instance for real-time subscriptions
const pubsub = new PubSub();

// Custom JSON scalar to handle JSON data
const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Custom JSON scalar type',
  serialize: (value) => {
    // Convert to JSON string if not already a string
    return typeof value === 'string' ? value : JSON.stringify(value);
  },
  parseValue: (value) => {
    // Parse JSON string to object
    return typeof value === 'string' ? JSON.parse(value) : value;
  },
  parseLiteral: (ast) => {
    // Handle parsing of JSON literals in GraphQL queries
    switch (ast.kind) {
      case Kind.STRING:
        return JSON.parse(ast.value);
      case Kind.OBJECT:
        throw new Error('JSON scalar must be a string');
      default:
        return null;
    }
  }
});

export const resolvers = (contextStorage, agentManager) => ({
  JSON: JSONScalar,

  Query: {
    // Context Queries
    context: async (_, { id }) => {
      return await contextStorage.get(id);
    },
    contexts: async (_, { page = 1, limit = 10 }) => {
      return await contextStorage.list(page, limit);
    },
    searchContexts: async (_, { query, filters }) => {
      return await contextStorage.search(query, filters);
    },

    // Agent Queries
    agent: async (_, { id }) => {
      return await agentManager.get(id);
    },
    agents: async () => {
      return await agentManager.list();
    }
  },

  Mutation: {
    // Context Mutations
    createContext: async (_, { input }) => {
      const context = await contextStorage.create(input);
      
      // Publish real-time event for context creation
      pubsub.publish('CONTEXT_CREATED', { contextCreated: context });
      
      return context;
    },
    updateContext: async (_, { id, input }) => {
      const updatedContext = await contextStorage.update(id, input);
      
      // Publish real-time event for context update
      pubsub.publish('CONTEXT_UPDATED', { contextUpdated: updatedContext });
      
      return updatedContext;
    },
    deleteContext: async (_, { id }) => {
      await contextStorage.delete(id);
      
      // Publish real-time event for context deletion
      pubsub.publish('CONTEXT_DELETED', { contextDeleted: id });
      
      return true;
    },

    // Agent Mutations
    registerAgent: async (_, { input }) => {
      const agent = await agentManager.register(input);
      
      // Publish real-time event for agent registration
      pubsub.publish('AGENT_STATUS_CHANGED', { agentStatusChanged: agent });
      
      return agent;
    },
    updateAgent: async (_, { id, input }) => {
      const updatedAgent = await agentManager.update(id, input);
      
      // Publish real-time event for agent update
      pubsub.publish('AGENT_STATUS_CHANGED', { agentStatusChanged: updatedAgent });
      
      return updatedAgent;
    },
    removeAgent: async (_, { id }) => {
      await agentManager.remove(id);
      return true;
    }
  },

  Subscription: {
    contextCreated: {
      subscribe: () => pubsub.asyncIterator(['CONTEXT_CREATED'])
    },
    contextUpdated: {
      subscribe: () => pubsub.asyncIterator(['CONTEXT_UPDATED'])
    },
    contextDeleted: {
      subscribe: () => pubsub.asyncIterator(['CONTEXT_DELETED'])
    },
    agentStatusChanged: {
      subscribe: () => pubsub.asyncIterator(['AGENT_STATUS_CHANGED'])
    }
  }
});