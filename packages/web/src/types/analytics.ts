// Analytics type definitions for performance monitoring and metrics

export interface TimeRange {
  start: Date;
  end: Date;
  preset?: '1h' | '6h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'custom';
}

export interface MetricPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface TimeSeries {
  name: string;
  data: MetricPoint[];
  unit?: string;
  color?: string;
}

// System Metrics
export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
    load: [number, number, number]; // 1m, 5m, 15m
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    available: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
    available: number;
  };
  network: {
    incoming: number;
    outgoing: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  uptime: number; // seconds
  services: ServiceStatus[];
  lastChecked: Date;
}

export interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime?: number;
  lastCheck: Date;
  errorCount: number;
}

// Memory Analytics
export interface MemoryUsage {
  totalMemories: number;
  totalSize: number; // bytes
  averageSize: number;
  growthRate: number; // percentage per day
  distribution: {
    byTag: Record<string, number>;
    bySize: { range: string; count: number }[];
    byAge: { range: string; count: number }[];
  };
}

export interface ContextAnalytics {
  accessFrequency: Record<string, number>;
  qualityScores: {
    average: number;
    distribution: { score: number; count: number }[];
  };
  retentionAnalysis: {
    activeContexts: number;
    staleContexts: number;
    archiveCandidates: string[];
  };
  optimizationSuggestions: {
    type: 'cleanup' | 'archive' | 'merge' | 'split';
    description: string;
    impact: number;
    contexts: string[];
  }[];
}

// ML Model Metrics
export interface MLMetrics {
  modelId: string;
  modelVersion: string;
  accuracy: {
    current: number;
    trend: MetricPoint[];
    benchmark: number;
  };
  precision: number;
  recall: number;
  f1Score: number;
  inferenceTime: {
    average: number;
    p95: number;
    p99: number;
    trend: MetricPoint[];
  };
  throughput: {
    requestsPerSecond: number;
    trend: MetricPoint[];
  };
  trainingData: {
    size: number;
    lastUpdate: Date;
    quality: number;
  };
  errors: {
    count: number;
    rate: number;
    types: Record<string, number>;
  };
}

// Agent Performance
export interface AgentMetrics {
  agentId: string;
  agentType: string;
  performance: {
    responseTime: {
      average: number;
      p50: number;
      p95: number;
      p99: number;
      trend: MetricPoint[];
    };
    successRate: {
      current: number;
      trend: MetricPoint[];
    };
    throughput: {
      requestsPerMinute: number;
      trend: MetricPoint[];
    };
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    cost: number;
  };
  errors: {
    count: number;
    rate: number;
    breakdown: Record<string, number>;
  };
  taskDistribution: Record<string, number>;
}

export interface AgentComparison {
  agents: AgentMetrics[];
  benchmarks: {
    responseTime: number;
    successRate: number;
    efficiency: number;
  };
  recommendations: {
    agentId: string;
    type: 'scale_up' | 'scale_down' | 'optimize' | 'replace';
    reason: string;
    impact: number;
  }[];
}

// User Behavior Analytics
export interface UserBehavior {
  userId: string;
  sessionData: {
    totalSessions: number;
    averageSessionDuration: number;
    sessionsToday: number;
    lastActive: Date;
  };
  featureUsage: Record<string, {
    count: number;
    lastUsed: Date;
    timeSpent: number;
  }>;
  workflows: {
    commonPaths: string[][];
    dropOffPoints: { step: string; dropOffRate: number }[];
  };
  engagement: {
    dailyActiveTime: number;
    weeklyActiveTime: number;
    monthlyActiveTime: number;
    streakDays: number;
  };
}

export interface UserEngagementMetrics {
  totalUsers: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  retention: {
    day1: number;
    day7: number;
    day30: number;
  };
  featureAdoption: {
    feature: string;
    adoptionRate: number;
    trend: MetricPoint[];
  }[];
  churnRate: number;
}

// Cost Analysis
export interface CostAnalysis {
  current: {
    total: number;
    breakdown: {
      storage: number;
      compute: number;
      apiCalls: number;
      mlProcessing: number;
    };
  };
  forecast: {
    nextMonth: number;
    confidence: number;
  };
  optimization: {
    potential: number;
    recommendations: {
      type: string;
      description: string;
      savings: number;
      effort: 'low' | 'medium' | 'high';
    }[];
  };
  trends: TimeSeries[];
}

// Alerting
export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  metric: string;
  condition: {
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
    threshold: number;
    duration?: number; // seconds
  };
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  notifications: {
    email?: string[];
    webhook?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'resolved' | 'silenced';
  metadata?: Record<string, any>;
}

export interface AnomalyDetection {
  metric: string;
  detected: boolean;
  confidence: number;
  expectedRange: [number, number];
  actualValue: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendations?: string[];
}

// Dashboard Builder
export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'alert' | 'status';
  title: string;
  config: WidgetConfig;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  refreshInterval?: number;
}

export interface WidgetConfig {
  // Chart widget
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'scatter' | 'area';
  metrics?: string[];
  timeRange?: TimeRange;
  
  // Metric widget
  metric?: string;
  format?: 'number' | 'percentage' | 'currency' | 'bytes' | 'duration';
  showTrend?: boolean;
  
  // Table widget
  columns?: string[];
  sortBy?: string;
  limit?: number;
  
  // Alert widget
  alertTypes?: string[];
  showResolved?: boolean;
  
  // Status widget
  services?: string[];
  
  // Common
  filters?: Record<string, any>;
  customization?: {
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
    animation?: boolean;
  };
}

export interface CustomDashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'masonry';
  columns: number;
  isDefault: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags?: string[];
}

// Reports
export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'system' | 'performance' | 'usage' | 'cost' | 'security' | 'custom';
  sections: ReportSection[];
  schedule?: ReportSchedule;
  recipients: string[];
  format: 'pdf' | 'html' | 'json' | 'csv';
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSection {
  id: string;
  name: string;
  type: 'metrics' | 'chart' | 'table' | 'text' | 'alert';
  config: {
    metrics?: string[];
    timeRange?: TimeRange;
    chartType?: string;
    limit?: number;
    content?: string;
  };
  position: number;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string; // HH:MM format
  timezone: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun: Date;
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  templateName: string;
  generatedAt: Date;
  timeRange: TimeRange;
  format: string;
  size: number;
  downloadUrl?: string;
  recipients: string[];
  status: 'generating' | 'completed' | 'failed' | 'expired';
  error?: string;
}

// Filter types
export interface AnalyticsFilters {
  timeRange: TimeRange;
  services?: string[];
  agents?: string[];
  users?: string[];
  tags?: string[];
  severity?: string[];
  customFilters?: Record<string, any>;
}

// Performance tracking
export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  chartRenderTime: number;
  dataFetchTime: number;
  memoryUsage: number;
}

export interface RegressionAlert {
  metric: string;
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  severity: 'minor' | 'major' | 'critical';
  detectedAt: Date;
  affectedComponents: string[];
}

// WebSocket message types for real-time updates
export interface RealtimeMetricUpdate {
  type: 'metric_update';
  metric: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface RealtimeAlert {
  type: 'alert';
  alert: Alert;
}

export interface RealtimeSystemStatus {
  type: 'system_status';
  status: SystemHealth;
}

export type RealtimeMessage = RealtimeMetricUpdate | RealtimeAlert | RealtimeSystemStatus;