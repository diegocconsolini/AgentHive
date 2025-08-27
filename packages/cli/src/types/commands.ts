// Base command interfaces
export interface CommandOptions {
  json?: boolean;
  verbose?: boolean;
}

export interface BaseCommandOptions extends CommandOptions {
  apiUrl?: string;
}

export interface CommandResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

// Output formats
export type OutputFormat = 'json' | 'table' | 'tree' | 'yaml' | 'csv';

// Auth command types
export interface LoginOptions extends CommandOptions {
  email?: string;
  password?: string;
  token?: string;
  interactive?: boolean;
}

export interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface WhoAmIResult {
  authenticated: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  tokenValid: boolean;
}

// Config command types
export interface ConfigOptions extends CommandOptions {
  force?: boolean;
}

export interface ConfigValue {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

// Memory command types
export interface MemoryListOptions extends CommandOptions {
  limit?: string;
  search?: string;
  tags?: string;
  offset?: string;
}

export interface MemoryCreateOptions extends CommandOptions {
  title?: string;
  content?: string;
  tags?: string;
}

export interface MemoryUpdateOptions extends CommandOptions {
  title?: string;
  content?: string;
  tags?: string;
}

export interface MemoryDeleteOptions extends CommandOptions {
  force?: boolean;
}

export interface Memory {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// System command types
export interface SystemStatusResult {
  timestamp: string;
  status: 'healthy' | 'partial' | 'unhealthy' | 'unknown';
  api: {
    reachable: boolean;
    url: string | null;
    responseTime: number | null;
    error: string | null;
  };
  authentication: {
    authenticated: boolean;
    user: any;
    tokenValid: boolean;
  };
}

export interface SystemVersionResult {
  cli: {
    version: string;
    name: string;
  };
  node: {
    version: string;
    platform: string;
    arch: string;
  };
  configuration: {
    apiUrl: string;
    configPath: string;
  };
}

export interface DiagnosticCheck {
  name: string;
  success: boolean;
  warning: boolean;
  message: string;
  details: any;
  error: string | null;
}

export interface SystemDoctorResult {
  timestamp: string;
  checks: DiagnosticCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

// Global CLI options
export interface GlobalOptions {
  verbose?: boolean;
  apiUrl?: string;
  configPath?: string;
  noColors?: boolean;
  json?: boolean;
}

// Command handler interface
export interface CommandHandler<TOptions = any, TResult = any> {
  execute(options: TOptions): Promise<CommandResult<TResult>>;
}

// Base command class interface
export interface BaseCommand {
  getCommand(): any; // Commander Command type
}

// Agent related types
export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentOptions extends BaseCommandOptions {
  name: string;
  description?: string;
  model?: 'haiku' | 'sonnet' | 'opus';
  systemPrompt?: string;
  tools?: string[];
  template?: string;
  fromFile?: string;
}

export interface AgentListOptions extends BaseCommandOptions {
  format?: OutputFormat;
  filter?: string;
  sortBy?: 'name' | 'created' | 'updated';
  limit?: number;
}

export interface AgentShowOptions extends BaseCommandOptions {
  detailed?: boolean;
  includeSessions?: boolean;
}

export interface AgentTestScenario {
  name: string;
  description: string;
  input: string;
  expectedOutput?: string;
  expectedBehavior?: string;
}

export interface AgentTestOptions extends BaseCommandOptions {
  scenario?: string;
  iterations?: number;
  timeout?: number;
}

export interface AgentBenchmarkOptions extends BaseCommandOptions {
  iterations?: number;
  warmup?: number;
  scenario?: string;
}

export interface BenchmarkResult {
  name: string;
  iterations: number;
  duration: number;
  throughput: number;
  p50: number;
  p95: number;
  p99: number;
  errors: number;
}

// Context related types  
export interface Context {
  id: string;
  name: string;
  description: string;
  agentId?: string;
  memories: Memory[];
  metadata: Record<string, any>;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface CreateContextOptions extends BaseCommandOptions {
  name: string;
  description?: string;
  agentId?: string;
  fromTemplate?: string;
}

export interface ContextListOptions extends BaseCommandOptions {
  agent?: string;
  status?: 'active' | 'archived';
  format?: OutputFormat;
}

export interface ContextAnalysisOptions extends BaseCommandOptions {
  depth?: 'shallow' | 'deep';
  includeMetrics?: boolean;
}

export interface ContextAnalysis {
  contextId: string;
  memoryCount: number;
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  complexity: number;
  relationships: ContextRelationship[];
}

export interface ContextRelationship {
  type: 'semantic' | 'temporal' | 'causal';
  strength: number;
  description: string;
}

export interface ContextMergeOptions extends BaseCommandOptions {
  strategy?: 'union' | 'priority' | 'custom';
  conflictResolution?: 'source' | 'target' | 'merge';
}

// Enhanced Memory types
export interface MemorySearchOptions extends BaseCommandOptions {
  query: string;
  agent?: string;
  context?: string;
  tags?: string[];
  limit?: number;
  similarity?: number;
}

export interface MemoryTagOptions extends BaseCommandOptions {
  add?: string[];
  remove?: string[];
  replace?: string[];
}

export interface MemoryAnalysisOptions extends BaseCommandOptions {
  agent?: string;
  timeRange?: string;
  includeRelationships?: boolean;
}

export interface MemoryClusterOptions extends BaseCommandOptions {
  method?: 'semantic' | 'temporal' | 'hybrid';
  clusters?: number;
  threshold?: number;
}

export interface MemoryCluster {
  id: string;
  name: string;
  memories: Memory[];
  centroid: string;
  similarity: number;
}

export interface MemoryGraphOptions extends BaseCommandOptions {
  output?: 'svg' | 'png' | 'dot' | 'json';
  layout?: 'force' | 'circular' | 'hierarchical';
}

export interface MemoryGraph {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
}

export interface MemoryNode {
  id: string;
  memoryId: string;
  title: string;
  size: number;
  color: string;
}

export interface MemoryEdge {
  source: string;
  target: string;
  weight: number;
  type: 'semantic' | 'temporal' | 'causal';
}

// Performance & Monitoring types
export interface StatusOptions extends BaseCommandOptions {
  detailed?: boolean;
  component?: 'all' | 'api' | 'db' | 'cache';
}

export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'error';
  services: ServiceStatus[];
  uptime: number;
  version: string;
  timestamp: string;
}

export interface ServiceStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  details?: Record<string, any>;
}

export interface MetricsOptions extends BaseCommandOptions {
  category?: 'performance' | 'usage' | 'errors';
  timeRange?: string;
  format?: OutputFormat;
}

export interface PerformanceMetrics {
  category: 'performance' | 'usage' | 'errors';
  metrics: Metric[];
  timeRange: TimeRange;
}

export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface TimeRange {
  start: string;
  end: string;
  duration: string;
}

export interface HealthCheckOptions extends BaseCommandOptions {
  component?: 'all' | 'api' | 'db' | 'cache';
  timeout?: number;
}

export interface LogsOptions extends BaseCommandOptions {
  level?: 'error' | 'warn' | 'info' | 'debug';
  tail?: boolean;
  lines?: number;
  follow?: boolean;
}

export interface PerfAnalyzeOptions extends BaseCommandOptions {
  agent?: string;
  duration?: string;
  includeBreakdown?: boolean;
}

export interface PerfBenchmarkOptions extends BaseCommandOptions {
  suite?: 'basic' | 'full' | 'custom';
  iterations?: number;
  concurrency?: number;
}

export interface PerfProfileOptions extends BaseCommandOptions {
  operation: string;
  output?: 'flamegraph' | 'callgrind' | 'json';
  duration?: number;
}

export interface PerfOptimizeOptions extends BaseCommandOptions {
  dryRun?: boolean;
  component?: 'db' | 'cache' | 'api' | 'all';
  aggressive?: boolean;
}

// Development related types
export interface ScaffoldOptions extends BaseCommandOptions {
  type: 'agent' | 'context' | 'memory' | 'command';
  name: string;
  template?: string;
  overwrite?: boolean;
}

export interface ScaffoldTemplate {
  type: 'agent' | 'context' | 'memory' | 'command';
  name: string;
  files: TemplateFile[];
}

export interface TemplateFile {
  path: string;
  content: string;
  executable?: boolean;
}

export interface MigrateOptions extends BaseCommandOptions {
  direction?: 'up' | 'down';
  version?: string;
  steps?: number;
  dryRun?: boolean;
}

export interface MigrationInfo {
  version: string;
  name: string;
  status: 'pending' | 'applied' | 'failed';
  appliedAt?: string;
}

export interface SeedOptions extends BaseCommandOptions {
  environment?: 'dev' | 'staging' | 'test';
  dataset?: string;
  clean?: boolean;
}

export interface BackupOptions extends BaseCommandOptions {
  destination?: string;
  compress?: boolean;
  includeConfig?: boolean;
  includeSecrets?: boolean;
}

export interface RestoreOptions extends BaseCommandOptions {
  backupFile: string;
  force?: boolean;
  excludeConfig?: boolean;
}

export interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  components: string[];
  compressed: boolean;
}

export interface DevTestOptions extends BaseCommandOptions {
  type?: 'unit' | 'integration' | 'e2e';
  pattern?: string;
  coverage?: boolean;
}

export interface ValidateConfigOptions extends BaseCommandOptions {
  environment?: string;
  strict?: boolean;
}

export interface LintOptions extends BaseCommandOptions {
  fix?: boolean;
  format?: 'json' | 'text' | 'compact';
  rules?: string[];
}

export interface DocsGenerateOptions extends BaseCommandOptions {
  output?: 'html' | 'markdown' | 'pdf';
  destination?: string;
  includeApi?: boolean;
}

// Configuration & Environment types
export interface ConfigGetOptions extends BaseCommandOptions {
  environment?: string;
  decrypt?: boolean;
}

export interface ConfigSetOptions extends BaseCommandOptions {
  environment?: string;
  encrypt?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'json';
}

export interface ConfigListOptions extends BaseCommandOptions {
  environment?: string;
  format?: OutputFormat;
  includeSecrets?: boolean;
}

export interface ConfigValidateOptions extends BaseCommandOptions {
  environment?: string;
  strict?: boolean;
}

export interface ConfigExportOptions extends BaseCommandOptions {
  environment?: string;
  output?: string;
  format?: 'json' | 'yaml' | 'env';
  includeSecrets?: boolean;
}

export interface ConfigImportOptions extends BaseCommandOptions {
  file: string;
  environment?: string;
  merge?: boolean;
  overwrite?: boolean;
}

export interface ConfigKey {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  required?: boolean;
  default?: any;
}

export interface Environment {
  name: string;
  active: boolean;
  config: Record<string, any>;
  createdAt: string;
  lastUsed: string;
}

export interface EnvCreateOptions extends BaseCommandOptions {
  name: string;
  fromTemplate?: string;
  copyFrom?: string;
}

export interface EnvListOptions extends BaseCommandOptions {
  status?: 'active' | 'inactive';
  format?: OutputFormat;
}

export interface EnvSwitchOptions extends BaseCommandOptions {
  name: string;
  force?: boolean;
}

export interface EnvDeleteOptions extends BaseCommandOptions {
  name: string;
  force?: boolean;
}

// Interactive wizard types
export interface WizardStep {
  name: string;
  title: string;
  fields: WizardField[];
  condition?: (answers: Record<string, any>) => boolean;
}

export interface WizardField {
  name: string;
  type: 'input' | 'password' | 'select' | 'checkbox' | 'confirm' | 'editor';
  message: string;
  choices?: string[] | { name: string; value: any }[];
  default?: any;
  validate?: (input: any) => boolean | string;
  when?: (answers: Record<string, any>) => boolean;
}