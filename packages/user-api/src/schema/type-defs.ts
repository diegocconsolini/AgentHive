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

  type AgentMemory {
    id: ID!
    agentId: String!
    userId: String!
    knowledge: MemoryKnowledge!
    interactions: [MemoryInteraction!]!
    patterns: MemoryPatterns!
    performance: MemoryPerformance!
    created: DateTime!
    updated: DateTime!
    lastAccessed: DateTime
  }

  type MemoryKnowledge {
    concepts: [String!]!
    relationships: [String!]!
    confidence: Float!
  }

  type MemoryInteraction {
    id: ID!
    timestamp: DateTime!
    summary: String!
    success: Boolean!
    duration: Int
    tokens: Int
  }

  type MemoryPatterns {
    successPatterns: [String!]!
    preferences: [String!]!
    commonTasks: [String!]!
  }

  type MemoryPerformance {
    successRate: Float!
    averageTime: Int!
    totalInteractions: Int!
    lastPerformanceUpdate: DateTime!
  }

  type MemorySearchResult {
    memory: AgentMemory!
    similarity: Float!
    category: String!
    relationships: [MemoryRelationship!]!
  }

  type MemoryRelationship {
    memoryId: String!
    similarity: Float!
    relationshipType: String!
  }

  type MemoryAnalytics {
    totalMemories: Int!
    categoryDistribution: [CategoryCount!]!
    topAccessedMemories: [AccessCount!]!
    averageRelationships: Float!
    memoryHealth: MemoryHealth!
  }

  type CategoryCount {
    category: String!
    count: Int!
  }

  type AccessCount {
    memoryId: String!
    accessCount: Int!
  }

  type MemoryHealth {
    indexingHealth: Float!
    categorizationHealth: Float!
    relationshipHealth: Float!
    overallHealth: Float!
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

  input CreateAgentMemoryInput {
    agentId: String!
    userId: String!
    knowledge: MemoryKnowledgeInput!
    interactions: [MemoryInteractionInput!] = []
    patterns: MemoryPatternsInput!
  }

  input UpdateAgentMemoryInput {
    knowledge: MemoryKnowledgeInput
    interactions: [MemoryInteractionInput!]
    patterns: MemoryPatternsInput
  }

  input MemoryKnowledgeInput {
    concepts: [String!]!
    relationships: [String!]!
    confidence: Float!
  }

  input MemoryInteractionInput {
    timestamp: DateTime!
    summary: String!
    success: Boolean!
    duration: Int
    tokens: Int
  }

  input MemoryPatternsInput {
    successPatterns: [String!]!
    preferences: [String!]!
    commonTasks: [String!]!
  }

  input MemorySearchInput {
    query: String!
    limit: Int = 10
    threshold: Float = 0.3
    agentId: String
    category: String
    includeRelated: Boolean = false
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

  type OrchestrationResult {
    success: Boolean!
    output: String!
    selectedAgent: String!
    agentName: String!
    routingReason: String!
    contextUsed: String!
    provider: String!
    model: String!
    tokens: TokenUsage!
    duration: Int!
    orchestrationTime: Int!
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

  input OrchestrationInput {
    prompt: String!
    routingStrategy: String
    priority: String
    sessionId: String
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

    # Smart Memory Index queries
    agentMemory(id: ID!): AgentMemory
    agentMemories(agentId: String!, userId: String!): [AgentMemory!]!
    searchAgentMemories(input: MemorySearchInput!): [MemorySearchResult!]!
    memoryAnalytics: MemoryAnalytics!

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

    # Smart Memory Index management
    createAgentMemory(input: CreateAgentMemoryInput!): AgentMemory!
    updateAgentMemory(id: ID!, input: UpdateAgentMemoryInput!): AgentMemory!
    deleteAgentMemory(id: ID!): Boolean!

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
    orchestrateRequest(input: OrchestrationInput!): OrchestrationResult!

    # Analytics
    trackEvent(eventType: String!, eventData: String!): Boolean!
  }
`;