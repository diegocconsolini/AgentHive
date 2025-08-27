import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Context {
    id: ID!
    name: String!
    description: String
    data: JSON
    createdAt: String
    updatedAt: String
    tags: [String]
  }

  type Agent {
    id: ID!
    name: String!
    type: String!
    status: String
    capabilities: [String]
  }

  input ContextInput {
    name: String!
    description: String
    data: JSON
    tags: [String]
  }

  input AgentInput {
    name: String!
    type: String!
    capabilities: [String]
  }

  scalar JSON

  type Query {
    context(id: ID!): Context
    contexts(page: Int, limit: Int): [Context]
    searchContexts(query: String, filters: JSON): [Context]
    
    agent(id: ID!): Agent
    agents: [Agent]
  }

  type Mutation {
    createContext(input: ContextInput!): Context
    updateContext(id: ID!, input: ContextInput!): Context
    deleteContext(id: ID!): Boolean

    registerAgent(input: AgentInput!): Agent
    updateAgent(id: ID!, input: AgentInput!): Agent
    removeAgent(id: ID!): Boolean
  }

  type Subscription {
    contextCreated: Context
    contextUpdated: Context
    contextDeleted: ID
    
    agentStatusChanged: Agent
  }
`;

// Note: Actual scalar implementation for JSON would be added in resolvers