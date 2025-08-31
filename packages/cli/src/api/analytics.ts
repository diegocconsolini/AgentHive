import { ApiClient } from './client.js';
import { 
  SystemStatus,
  PerformanceMetrics,
  BenchmarkResult,
  CommandResult
} from '../types/commands.js';
import { Validator } from '../utils/validation.js';
import { createSuccessResult } from '../utils/errors.js';

export class AnalyticsService {
  constructor(private apiClient: ApiClient) {}

  async getStatus(options: { detailed?: boolean; component?: string } = {}): Promise<CommandResult<SystemStatus>> {
    const query = `
      query SystemStatus($detailed: Boolean!, $component: String) {
        systemStatus(detailed: $detailed, component: $component) {
          status
          uptime
          version
          timestamp
          services {
            name
            status
            responseTime
            lastCheck
            details
          }
          ${options.detailed ? `
          resources {
            cpu
            memory
            disk
            network
          }
          database {
            status
            connections
            queryTime
          }
          cache {
            status
            hitRate
            memoryUsage
          }
          ` : ''}
        }
      }
    `;

    const response = await this.apiClient.request(query, {
      detailed: !!options.detailed,
      component: options.component
    }, { skipAuth: true });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to get system status', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.systemStatus, 'System status retrieved successfully');
  }

  async getMetrics(options: { 
    category?: 'performance' | 'usage' | 'errors'; 
    timeRange?: string;
  } = {}): Promise<CommandResult<PerformanceMetrics>> {
    let timeFilter: any = {};
    
    if (options.timeRange) {
      const range = Validator.timeRange(options.timeRange);
      timeFilter = {
        start: range.start.toISOString(),
        end: range.end.toISOString()
      };
    }

    const query = `
      query Metrics($category: MetricCategory, $timeRange: TimeRangeInput) {
        metrics(category: $category, timeRange: $timeRange) {
          category
          timeRange {
            start
            end
            duration
          }
          metrics {
            name
            value
            unit
            timestamp
            tags
          }
          aggregations {
            avg
            min
            max
            sum
            count
          }
        }
      }
    `;

    const response = await this.apiClient.request(query, {
      category: options.category?.toUpperCase(),
      timeRange: Object.keys(timeFilter).length > 0 ? timeFilter : null
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to get metrics', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.metrics, 'Metrics retrieved successfully');
  }

  async healthCheck(options: { 
    component?: 'all' | 'api' | 'db' | 'cache'; 
    timeout?: number 
  } = {}): Promise<CommandResult<any>> {
    const query = `
      query HealthCheck($component: String, $timeout: Int) {
        healthCheck(component: $component, timeout: $timeout) {
          overall
          components {
            name
            status
            responseTime
            details
            lastCheck
            error
          }
          timestamp
          duration
        }
      }
    `;

    const response = await this.apiClient.request(query, {
      component: options.component,
      timeout: options.timeout
    }, { 
      skipAuth: true, 
      timeout: (options.timeout || 30) * 1000 
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Health check failed', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.healthCheck, 'Health check completed');
  }

  async getLogs(options: { 
    level?: 'error' | 'warn' | 'info' | 'debug';
    lines?: number;
    since?: string;
    component?: string;
  } = {}): Promise<CommandResult<any[]>> {
    const query = `
      query Logs($filter: LogFilter, $options: LogOptions) {
        logs(filter: $filter, options: $options) {
          timestamp
          level
          message
          component
          metadata
          traceId
        }
      }
    `;

    const filter: any = {};
    if (options.level) filter.level = options.level.toUpperCase();
    if (options.component) filter.component = options.component;
    if (options.since) {
      const sinceDate = new Date(options.since);
      if (!isNaN(sinceDate.getTime())) {
        filter.since = sinceDate.toISOString();
      }
    }

    const logOptions: any = {};
    if (options.lines) logOptions.limit = options.lines;

    const response = await this.apiClient.request(query, {
      filter: Object.keys(filter).length > 0 ? filter : null,
      options: Object.keys(logOptions).length > 0 ? logOptions : null
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to get logs', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.logs || [], 'Logs retrieved successfully');
  }

  async analyzePerformance(options: { 
    agent?: string; 
    duration?: string; 
  } = {}): Promise<CommandResult<any>> {
    let timeFilter: any = {};
    
    if (options.duration) {
      const range = Validator.timeRange(options.duration);
      timeFilter = {
        start: range.start.toISOString(),
        end: range.end.toISOString()
      };
    }

    const query = `
      query AnalyzePerformance($filter: PerformanceFilter, $timeRange: TimeRangeInput) {
        analyzePerformance(filter: $filter, timeRange: $timeRange) {
          overview {
            totalRequests
            averageResponseTime
            errorRate
            throughput
          }
          trends {
            responseTime {
              timestamps
              values
              trend
            }
            throughput {
              timestamps
              values
              trend
            }
            errorRate {
              timestamps
              values
              trend
            }
          }
          bottlenecks {
            component
            severity
            description
            recommendations
          }
          slowestOperations {
            operation
            averageTime
            callCount
            impact
          }
          recommendations {
            priority
            category
            description
            expectedImpact
          }
        }
      }
    `;

    const filter: any = {};
    if (options.agent) filter.agentName = options.agent;

    const response = await this.apiClient.request(query, {
      filter: Object.keys(filter).length > 0 ? filter : null,
      timeRange: Object.keys(timeFilter).length > 0 ? timeFilter : null
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to analyze performance', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.analyzePerformance, 'Performance analysis completed');
  }

  async runBenchmark(options: { 
    suite?: 'basic' | 'full' | 'custom';
    iterations?: number;
    concurrency?: number;
  } = {}): Promise<CommandResult<BenchmarkResult[]>> {
    const mutation = `
      mutation RunBenchmark($options: BenchmarkOptions) {
        runBenchmark(options: $options) {
          name
          iterations
          duration
          throughput
          p50
          p95
          p99
          errors
          metadata
        }
      }
    `;

    const response = await this.apiClient.request(mutation, {
      options: {
        suite: options.suite || 'basic',
        iterations: options.iterations || 100,
        concurrency: options.concurrency || 1
      }
    }, { timeout: 300000 }); // 5 minute timeout for benchmarks

    if (response.errors) {
      return { 
        success: false, 
        error: 'Benchmark failed', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.runBenchmark || [], 'Benchmark completed successfully');
  }

  async profileOperation(operation: string, options: { 
    duration?: number;
    output?: 'flamegraph' | 'callgrind' | 'json';
  } = {}): Promise<CommandResult<any>> {
    const mutation = `
      mutation ProfileOperation($operation: String!, $options: ProfileOptions) {
        profileOperation(operation: $operation, options: $options) {
          operation
          duration
          samples
          hotPaths {
            function
            percentage
            calls
          }
          profile
          format
        }
      }
    `;

    const response = await this.apiClient.request(mutation, {
      operation,
      options: {
        duration: options.duration || 30,
        format: options.output || 'json'
      }
    }, { timeout: (options.duration || 30) * 1000 + 10000 });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Profiling failed', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.profileOperation, 'Profiling completed successfully');
  }

  async optimizeSystem(options: { 
    dryRun?: boolean;
    component?: 'db' | 'cache' | 'api' | 'all';
    aggressive?: boolean;
  } = {}): Promise<CommandResult<any>> {
    const mutation = `
      mutation OptimizeSystem($options: OptimizationOptions) {
        optimizeSystem(options: $options) {
          applied {
            component
            optimization
            description
            expectedImpact
            actualImpact
          }
          recommendations {
            component
            optimization
            description
            estimatedImpact
            risk
          }
          summary {
            totalOptimizations
            estimatedImprovement
            warnings
          }
        }
      }
    `;

    const response = await this.apiClient.request(mutation, {
      options: {
        dryRun: options.dryRun || false,
        component: options.component,
        aggressive: options.aggressive || false
      }
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'System optimization failed', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.optimizeSystem, 'System optimization completed');
  }

  async getUsageStats(options: { 
    timeRange?: string;
    granularity?: 'hour' | 'day' | 'week' | 'month';
  } = {}): Promise<CommandResult<any>> {
    let timeFilter: any = {};
    
    if (options.timeRange) {
      const range = Validator.timeRange(options.timeRange);
      timeFilter = {
        start: range.start.toISOString(),
        end: range.end.toISOString()
      };
    }

    const query = `
      query UsageStats($timeRange: TimeRangeInput, $granularity: Granularity) {
        usageStats(timeRange: $timeRange, granularity: $granularity) {
          totalUsers
          activeUsers
          totalSessions
          averageSessionDuration
          topAgents {
            name
            usage
          }
          activityOverTime {
            timestamp
            users
            sessions
            operations
          }
          operationBreakdown {
            operation
            count
            percentage
          }
          userGrowth {
            period
            newUsers
            churnRate
            retentionRate
          }
        }
      }
    `;

    const response = await this.apiClient.request(query, {
      timeRange: Object.keys(timeFilter).length > 0 ? timeFilter : null,
      granularity: options.granularity?.toUpperCase()
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to get usage statistics', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.usageStats, 'Usage statistics retrieved successfully');
  }

  async getErrorAnalysis(options: { 
    timeRange?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  } = {}): Promise<CommandResult<any>> {
    let timeFilter: any = {};
    
    if (options.timeRange) {
      const range = Validator.timeRange(options.timeRange);
      timeFilter = {
        start: range.start.toISOString(),
        end: range.end.toISOString()
      };
    }

    const query = `
      query ErrorAnalysis($timeRange: TimeRangeInput, $severity: Severity) {
        errorAnalysis(timeRange: $timeRange, severity: $severity) {
          totalErrors
          errorRate
          criticalErrors
          errorsByType {
            type
            count
            percentage
            trend
          }
          errorsByComponent {
            component
            count
            severity
          }
          topErrors {
            message
            count
            firstSeen
            lastSeen
            affected
          }
          patterns {
            pattern
            frequency
            description
          }
          recommendations {
            priority
            issue
            solution
            impact
          }
        }
      }
    `;

    const response = await this.apiClient.request(query, {
      timeRange: Object.keys(timeFilter).length > 0 ? timeFilter : null,
      severity: options.severity?.toUpperCase()
    });

    if (response.errors) {
      return { 
        success: false, 
        error: 'Failed to get error analysis', 
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }

    return createSuccessResult(response.data?.errorAnalysis, 'Error analysis completed successfully');
  }
}