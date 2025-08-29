export const typeDefs = `
  scalar DateTime

  enum UserRole {
    USER
    ADMIN
    MODERATOR
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: UserRole!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Memory {
    id: ID!
    title: String!
    content: String!
    tags: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    userId: ID!
    user: User!
  }

  type AuthTokens {
    accessToken: String!
    refreshToken: String!
    expiresIn: Int!
  }

  type AuthPayload {
    user: User!
    tokens: AuthTokens!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input RegisterInput {
    email: String!
    name: String!
    password: String!
  }

  input CreateMemoryInput {
    title: String!
    content: String!
    tags: [String!] = []
  }

  input UpdateMemoryInput {
    title: String
    content: String
    tags: [String!]
  }

  input MemoryFilter {
    search: String
    tags: [String!]
    dateRange: DateRangeInput
    limit: Int = 10
    offset: Int = 0
  }

  input DateRangeInput {
    start: DateTime!
    end: DateTime!
  }

  type AgentExecutionResult {
    success: Boolean!
    output: String!
    agentName: String!
    provider: String!
    model: String!
    tokens: TokenUsage!
    duration: Int!
    cost: Float!
    error: String
  }

  type TokenUsage {
    prompt: Int!
    completion: Int!
    total: Int!
  }

  input AgentExecutionInput {
    agentId: String!
    prompt: String!
    context: String
  }

  type Query {
    # User queries
    me: User

    # Memory queries
    memories(filter: MemoryFilter): [Memory!]!
    memory(id: ID!): Memory
  }

  type Context {
    id: ID!
    title: String!
    content: String!
    type: String!
    fileName: String
    filePath: String
    fileSize: String
    mimeType: String
    metadata: ContextMetadata!
    importance: ImportanceScore!
    tags: [String!]!
    userId: ID!
    user: User!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ContextMetadata {
    size: Int
    wordCount: Int
    characterCount: Int
    lineCount: Int
    language: String
    encoding: String
    checksum: String
  }

  type ImportanceScore {
    overall: Float!
    factors: ImportanceFactors!
    isManuallySet: Boolean!
    isLocked: Boolean!
  }

  type ImportanceFactors {
    recency: Float!
    frequency: Float!
    relevance: Float!
    userRating: Float!
    accessPattern: Float!
  }

  type Agent {
    id: ID!
    name: String!
    description: String!
    version: String!
    category: String!
    model: String!
    tags: [String!]!
    capabilities: [String!]!
    dependencies: [String!]!
    config: AgentConfig!
    status: String!
    popularity: Int!
    rating: Float!
    systemPrompt: String!
    isPublic: Boolean!
    authorId: ID
    author: User
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AgentConfig {
    temperature: Float
    maxTokens: Int
    timeout: Int
    retries: Int
    customSettings: String
  }

  type AnalyticsEvent {
    id: ID!
    userId: ID!
    eventType: String!
    eventData: String!
    sessionId: String
    userAgent: String
    ipAddress: String
    createdAt: DateTime!
  }

  type AnalyticsOverview {
    totalUsers: Int!
    totalMemories: Int!
    totalContexts: Int!
    totalAgents: Int!
    activeUsers: Int!
    memoryGrowth: [MetricPoint!]!
    contextGrowth: [MetricPoint!]!
    agentUsage: [AgentUsageMetric!]!
  }

  type MetricPoint {
    date: String!
    value: Int!
  }

  type AgentUsageMetric {
    agentName: String!
    usageCount: Int!
    rating: Float!
  }

  input CreateContextInput {
    title: String!
    content: String!
    type: String!
    fileName: String
    filePath: String
    fileSize: String
    mimeType: String
    tags: [String!] = []
  }

  input UpdateContextInput {
    title: String
    content: String
    tags: [String!]
  }

  input ContextFilter {
    search: String
    type: String
    tags: [String!]
    dateRange: DateRangeInput
    limit: Int = 10
    offset: Int = 0
  }

  input CreateAgentInput {
    name: String!
    description: String!
    version: String!
    category: String!
    model: String!
    tags: [String!] = []
    capabilities: [String!] = []
    dependencies: [String!] = []
    systemPrompt: String!
    isPublic: Boolean = true
  }

  input UpdateAgentInput {
    description: String
    version: String
    category: String
    model: String
    tags: [String!]
    capabilities: [String!]
    dependencies: [String!]
    systemPrompt: String
    isPublic: Boolean
    status: String
  }

  input AgentFilter {
    search: String
    category: String
    model: String
    status: String
    isPublic: Boolean
    tags: [String!]
    limit: Int = 20
    offset: Int = 0
  }

  type Query {
    # User queries
    me: User

    # Memory queries
    memories(filter: MemoryFilter): [Memory!]!
    memory(id: ID!): Memory

    # Context queries
    contexts(filter: ContextFilter): [Context!]!
    context(id: ID!): Context

    # Agent queries
    agents(filter: AgentFilter): [Agent!]!
    agent(id: ID!): Agent

    # Analytics queries
    analyticsOverview: AnalyticsOverview!
    analyticsEvents(limit: Int = 100, offset: Int = 0): [AnalyticsEvent!]!
  }

  type Mutation {
    # Authentication
    login(input: LoginInput!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    refreshToken(token: String!): AuthTokens!
    logout(refreshToken: String!): Boolean!

    # Memory management
    createMemory(input: CreateMemoryInput!): Memory!
    updateMemory(id: ID!, input: UpdateMemoryInput!): Memory!
    deleteMemory(id: ID!): Boolean!

    # Context management
    createContext(input: CreateContextInput!): Context!
    updateContext(id: ID!, input: UpdateContextInput!): Context!
    deleteContext(id: ID!): Boolean!

    # Agent management
    createAgent(input: CreateAgentInput!): Agent!
    updateAgent(id: ID!, input: UpdateAgentInput!): Agent!
    deleteAgent(id: ID!): Boolean!

    # Agent execution
    executeAgent(input: AgentExecutionInput!): AgentExecutionResult!

    # Analytics
    trackEvent(eventType: String!, eventData: String!): Boolean!
  }
`;