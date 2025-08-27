export interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  tags: string[];
  category: AgentCategory;
  model: ClaudeModel;
  tools?: string[];
  capabilities: string[];
  dependencies: string[];
  lastUpdated: string;
  popularity: number;
  rating: number;
}

export interface Agent extends AgentMetadata {
  status: AgentStatus;
  config: AgentConfig;
  performance: AgentPerformance;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  hasErrors: boolean;
  errorMessage?: string;
}

export interface AgentConfig {
  id: string;
  agentId: string;
  systemPrompt: string;
  model: ClaudeModel;
  tools: string[];
  parameters: Record<string, any>;
  environment: Record<string, string>;
  resources: ResourceLimits;
  validation: ValidationRules;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  config: Partial<AgentConfig>;
  preview: string;
  isPublic: boolean;
  usageCount: number;
}

export interface AgentPerformance {
  agentId: string;
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    apiCalls: number;
    successRate: number;
    avgResponseTime: number;
    medianResponseTime: number;
    p95ResponseTime: number;
    errorCount: number;
    uptime: number;
  };
  healthScore: number;
  lastChecked: string;
  trends: {
    responseTime: DataPoint[];
    apiCalls: DataPoint[];
    errorRate: DataPoint[];
  };
}

export interface DataPoint {
  timestamp: string;
  value: number;
}

export interface ResourceLimits {
  maxMemory: number;
  maxCpuTime: number;
  maxApiCalls: number;
  timeoutMs: number;
}

export interface ValidationRules {
  required: string[];
  types: Record<string, string>;
  constraints: Record<string, any>;
}

export interface AgentLog {
  id: string;
  agentId: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  duration?: number;
  error?: string;
}

export interface AgentAlert {
  id: string;
  agentId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  isResolved: boolean;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface DependencyNode {
  id: string;
  name: string;
  type: 'agent' | 'tool' | 'resource';
  status: 'healthy' | 'warning' | 'error';
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'depends_on' | 'conflicts_with' | 'enhances';
  strength: number;
}

export interface BulkOperation {
  id: string;
  type: BulkOperationType;
  agentIds: string[];
  status: OperationStatus;
  progress: number;
  startedAt: string;
  completedAt?: string;
  results: BulkOperationResult[];
  errors: BulkOperationError[];
}

export interface BulkOperationResult {
  agentId: string;
  success: boolean;
  message?: string;
  data?: any;
}

export interface BulkOperationError {
  agentId: string;
  error: string;
  code?: string;
}

// Enums
export type AgentStatus = 
  | 'stopped' 
  | 'starting' 
  | 'running' 
  | 'stopping' 
  | 'error' 
  | 'unknown';

export type AgentCategory = 
  | 'development'
  | 'infrastructure' 
  | 'ai-ml'
  | 'security'
  | 'data'
  | 'business'
  | 'general';

export type ClaudeModel = 
  | 'haiku'
  | 'sonnet'
  | 'opus';

export type LogLevel = 
  | 'debug'
  | 'info'
  | 'warn'
  | 'error';

export type AlertType = 
  | 'performance'
  | 'error'
  | 'security'
  | 'resource'
  | 'dependency';

export type AlertSeverity = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type BulkOperationType = 
  | 'start'
  | 'stop'
  | 'restart'
  | 'delete'
  | 'update_config'
  | 'export'
  | 'import';

export type OperationStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

// API interfaces
export interface AgentListResponse {
  agents: Agent[];
  total: number;
  page: number;
  limit: number;
  categories: string[];
}

export interface AgentSearchParams {
  query?: string;
  category?: AgentCategory;
  status?: AgentStatus;
  tags?: string[];
  sortBy?: 'name' | 'popularity' | 'rating' | 'lastUpdated';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AgentLifecycleActions {
  create: (template: AgentTemplate) => Promise<Agent>;
  start: (agentId: string) => Promise<void>;
  stop: (agentId: string) => Promise<void>;
  restart: (agentId: string) => Promise<void>;
  delete: (agentId: string) => Promise<void>;
  clone: (agentId: string, newName: string) => Promise<Agent>;
  export: (agentId: string) => Promise<AgentConfig>;
  import: (config: AgentConfig) => Promise<Agent>;
}

export interface AgentConfigValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// UI State interfaces
export interface AgentRegistryState {
  agents: Agent[];
  filteredAgents: Agent[];
  selectedAgent: Agent | null;
  searchParams: AgentSearchParams;
  loading: boolean;
  error: string | null;
}

export interface AgentManagementState {
  selectedAgents: string[];
  bulkOperation: BulkOperation | null;
  showConfigEditor: boolean;
  showDependencyGraph: boolean;
  activeTab: string;
}

export interface AgentMonitoringState {
  performanceData: Record<string, AgentPerformance>;
  alerts: AgentAlert[];
  logs: AgentLog[];
  refreshInterval: number;
  isRealTimeEnabled: boolean;
}