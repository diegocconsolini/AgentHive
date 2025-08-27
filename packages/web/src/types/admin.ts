// Admin panel types for enterprise features
import type { User } from './index';

// System Health and Status
export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100
  checks: HealthCheck[];
  lastUpdated: string;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  responseTime?: number;
  metadata?: Record<string, any>;
}

// Performance Metrics
export interface PerformanceMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    available: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    inbound: number;
    outbound: number;
  };
  database: {
    connections: number;
    queryTime: number;
    queryCount: number;
  };
}

// Resource Utilization
export interface ResourceMetrics {
  agents: {
    active: number;
    total: number;
    averageResponseTime: number;
    errorRate: number;
  };
  contexts: {
    total: number;
    averageSize: number;
    growthRate: number;
  };
  users: {
    active: number;
    total: number;
    sessionCount: number;
  };
}

// Activity Feed
export interface ActivityFeedItem {
  id: string;
  type: 'user_action' | 'system_event' | 'security_alert' | 'performance_alert';
  title: string;
  description: string;
  user?: User;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
  metadata?: Record<string, any>;
}

// Alert System
export interface Alert {
  id: string;
  type: 'performance' | 'security' | 'system' | 'business';
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  isActive: boolean;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}

// System Dashboard
export interface SystemDashboard {
  systemHealth: SystemHealth;
  performanceMetrics: PerformanceMetrics;
  resourceUtilization: ResourceMetrics;
  recentActivity: ActivityFeedItem[];
  alerts: Alert[];
}

// User Management
export interface UserWithStats extends User {
  stats: {
    loginCount: number;
    lastLogin: string;
    agentsUsed: number;
    contextsCreated: number;
    isOnline: boolean;
  };
}

export interface UserManagementConfig {
  users: UserWithStats[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  filters: {
    role?: string;
    status?: 'active' | 'inactive' | 'suspended';
    search?: string;
  };
}

// Role-Based Access Control (RBAC)
export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
  conditions?: AccessCondition[];
}

export interface AccessCondition {
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'greater_than' | 'less_than';
  value: any;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  inherits?: Role[];
  isSystemRole: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccessPolicy {
  id: string;
  subject: string; // user, role, or group ID
  subjectType: 'user' | 'role' | 'group';
  resource: string;
  action: string;
  effect: 'allow' | 'deny';
  conditions: AccessCondition[];
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Agent Management in Admin Context
export interface AdminAgentInfo {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'inactive' | 'error';
  deployedAt: string;
  lastUsed: string;
  usageCount: number;
  performanceMetrics: {
    averageResponseTime: number;
    successRate: number;
    errorCount: number;
  };
  configuration: Record<string, any>;
}

// Configuration Management
export interface ConfigurationItem {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  environment: string;
  description: string;
  isSecret: boolean;
  isRequired: boolean;
  validation?: ConfigValidation;
  lastModified: string;
  modifiedBy: string;
}

export interface ConfigValidation {
  schema?: string;
  min?: number;
  max?: number;
  pattern?: string;
  allowedValues?: any[];
}

export interface ConfigurationEnvironment {
  name: string;
  description: string;
  isActive: boolean;
  configurations: ConfigurationItem[];
  lastDeployed?: string;
}

// Backup and Recovery
export interface BackupInfo {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'running' | 'completed' | 'failed' | 'scheduled';
  size: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
  retentionUntil: string;
  metadata?: Record<string, any>;
}

export interface BackupSchedule {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  cronExpression: string;
  isActive: boolean;
  retentionDays: number;
  destinations: BackupDestination[];
  lastRun?: string;
  nextRun: string;
}

export interface BackupDestination {
  type: 'local' | 's3' | 'gcs' | 'azure';
  config: Record<string, any>;
  isEncrypted: boolean;
}

// Audit Logging
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  outcome: 'success' | 'failure';
  risk: 'low' | 'medium' | 'high';
}

export interface AuditLogFilter {
  dateRange?: {
    start: string;
    end: string;
  };
  userId?: string;
  action?: string;
  resource?: string;
  outcome?: 'success' | 'failure';
  risk?: 'low' | 'medium' | 'high';
  search?: string;
}

// Admin Panel Module Interface
export interface AdminPanelModule {
  dashboard: SystemDashboard;
  userManagement: UserManagementConfig;
  roleManagement: Role[];
  configManagement: ConfigurationEnvironment[];
  backupManagement: {
    backups: BackupInfo[];
    schedules: BackupSchedule[];
  };
  auditLogs: {
    entries: AuditLogEntry[];
    filters: AuditLogFilter;
  };
  systemHealth: SystemHealth;
  alerts: Alert[];
}

// Quick Actions
export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: () => void;
  requiresConfirmation: boolean;
  permissions: string[];
}

// System Maintenance
export interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  type: 'scheduled' | 'emergency';
  impactLevel: 'low' | 'medium' | 'high';
  affectedServices: string[];
}

// Enterprise Features
export interface EnterpriseFeature {
  name: string;
  enabled: boolean;
  configuration: Record<string, any>;
  dependencies: string[];
  status: 'available' | 'configured' | 'disabled' | 'error';
}

export interface TenantInfo {
  id: string;
  name: string;
  domain?: string;
  settings: Record<string, any>;
  users: User[];
  quotas: {
    users: number;
    storage: number;
    agents: number;
    contexts: number;
  };
  usage: {
    users: number;
    storage: number;
    agents: number;
    contexts: number;
  };
  isActive: boolean;
  createdAt: string;
}

// Analytics and Insights Types
export interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  avgSessionDuration: number;
  bounceRate: number;
  totalRequests: number;
  uniqueVisitors: number;
  conversionRate: number;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  recommendations: string[];
  potentialImpact?: {
    cost?: number;
    performance?: number;
    efficiency?: number;
  };
  createdAt: string;
  status: 'new' | 'reviewed' | 'implemented' | 'dismissed';
}

export interface UsageReport {
  id: string;
  name: string;
  type: 'usage' | 'performance' | 'cost' | 'security' | 'custom';
  timeRange: string;
  createdAt: string;
  createdBy: string;
  data: Record<string, any>;
  format: 'pdf' | 'csv' | 'xlsx' | 'json';
  status: 'generating' | 'ready' | 'failed';
}

export interface PerformanceAnalytics {
  averageResponseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  concurrentUsers: number;
}

export interface CostAnalysis {
  totalCost: number;
  costPerUser: number;
  costTrend: 'up' | 'down' | 'stable';
  savings: number;
  budgetUtilization: number;
  serviceBreakdown: Array<{
    name: string;
    category: string;
    cost: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  optimizationOpportunities: Array<{
    service: string;
    potentialSavings: number;
    recommendation: string;
    effort: 'low' | 'medium' | 'high';
  }>;
}

export interface PredictiveModel {
  id: string;
  name: string;
  description: string;
  type: 'capacity' | 'cost' | 'performance' | 'usage';
  accuracy: number;
  lastRun: string;
  nextUpdate: string;
  predictions: Array<{
    metric: string;
    value: string;
    confidence: number;
    timeframe: string;
  }>;
  status: 'training' | 'ready' | 'stale' | 'error';
}

export interface CustomDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'text';
  title: string;
  config: Record<string, any>;
  dataSource: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gaps: number;
}