import { Command } from 'commander';
import { MemoryManagerAPI } from '../../api/index.js';
import { OutputFormatter } from '../../utils/output.js';
import { InteractivePrompts } from '../../utils/prompts.js';
import { ErrorHandler } from '../../utils/errors.js';
import { handleErrors, withErrorHandling } from '../../utils/decorators.js';
import { 
  StatusOptions,
  MetricsOptions,
  HealthCheckOptions,
  LogsOptions,
  PerfAnalyzeOptions,
  PerfBenchmarkOptions,
  PerfProfileOptions,
  PerfOptimizeOptions,
  OutputFormat
} from '../../types/commands.js';
import * as fs from 'fs';

export class PerformanceCommand {
  private api: MemoryManagerAPI;

  constructor() {
    this.api = new MemoryManagerAPI();
  }

  getCommand(): Command {
    const perfCmd = new Command('perf')
      .description('Performance monitoring and analysis commands')
      .addHelpText('after', `
Examples:
  $ memory perf analyze --agent=my-agent --duration=24h  # Analyze performance
  $ memory perf benchmark --suite=full                   # Run benchmark suite
  $ memory perf profile "search_memories"                # Profile operation
  $ memory perf optimize --component=db --dry-run        # Preview optimizations
`);

    // Analyze command
    perfCmd
      .command('analyze')
      .description('Analyze system performance over time')
      .option('--agent <agent>', 'analyze performance for specific agent')
      .option('--duration <duration>', 'time duration (e.g., 1h, 24h, 7d)', '24h')
      .option('--include-breakdown', 'include detailed performance breakdown')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.analyzePerformance.bind(this)));

    // Benchmark command
    perfCmd
      .command('benchmark')
      .description('Run performance benchmarks')
      .option('--suite <suite>', 'benchmark suite (basic, full, custom)', 'basic')
      .option('--iterations <count>', 'number of iterations', '100')
      .option('--concurrency <level>', 'concurrency level', '1')
      .option('--warmup <count>', 'warmup iterations', '10')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.runBenchmark.bind(this)));

    // Profile command
    perfCmd
      .command('profile')
      .argument('<operation>', 'operation to profile')
      .description('Profile a specific operation')
      .option('--duration <seconds>', 'profiling duration in seconds', '30')
      .option('--output <format>', 'output format (flamegraph, callgrind, json)', 'json')
      .option('--file <file>', 'save profile to file')
      .action(withErrorHandling(this.profileOperation.bind(this)));

    // Optimize command
    perfCmd
      .command('optimize')
      .description('Optimize system performance')
      .option('--dry-run', 'preview optimizations without applying')
      .option('--component <component>', 'component to optimize (db, cache, api, all)', 'all')
      .option('--aggressive', 'apply aggressive optimizations')
      .option('--format <format>', 'output format', 'json')
      .action(withErrorHandling(this.optimizeSystem.bind(this)));

    return perfCmd;
  }

    private async analyzePerformance(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const analyzeOptions: PerfAnalyzeOptions = {
      agent: options.agent,
      duration: options.duration,
      includeBreakdown: options.includeBreakdown
    };

    const result = await this.api.analytics.analyzePerformance(analyzeOptions);
    
    if (result.success && result.data && format !== 'json') {
      // Enhanced formatting for performance analysis
      const data = result.data;
      
      console.log(OutputFormatter.format({
        overview: data.overview,
        bottlenecks: data.bottlenecks?.slice(0, 5), // Top 5 bottlenecks
        recommendations: data.recommendations?.slice(0, 3) // Top 3 recommendations
      }, format));

      if (data.trends) {
        console.log('\n' + OutputFormatter.format(data.trends, 'table'));
      }
    } else {
      OutputFormatter.result(result, format);
    }
  }

    private async runBenchmark(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const benchmarkOptions: PerfBenchmarkOptions = {
      suite: options.suite as 'basic' | 'full' | 'custom',
      iterations: parseInt(options.iterations),
      concurrency: parseInt(options.concurrency)
    };

    // Show progress for long-running benchmarks
    if (!format || format === 'json') {
      console.log('Running benchmark suite...');
    }

    const result = await this.api.analytics.runBenchmark(benchmarkOptions);
    
    if (result.success && result.data && format !== 'json') {
      // Enhanced formatting for benchmark results
      const benchmarks = result.data;
      
      console.log('\n' + OutputFormatter.formatList(benchmarks, {
        format: 'table',
        title: 'Benchmark Results',
        columns: ['name', 'iterations', 'duration', 'throughput', 'p50', 'p95', 'p99', 'errors']
      }));
    } else {
      OutputFormatter.result(result, format);
    }
  }

    private async profileOperation(operation: string, options: any): Promise<void> {
    const profileOptions: PerfProfileOptions = {
      operation,
      duration: parseInt(options.duration),
      output: options.output as 'flamegraph' | 'callgrind' | 'json'
    };

    console.log(`Profiling operation "${operation}" for ${options.duration} seconds...`);

    const result = await this.api.analytics.profileOperation(operation, profileOptions);
    
    if (result.success && result.data) {
      if (options.file) {
        const content = typeof result.data.profile === 'string' 
          ? result.data.profile 
          : JSON.stringify(result.data, null, 2);
        
        fs.writeFileSync(options.file, content);
        OutputFormatter.success(`Profile saved to ${options.file}`, undefined, 'json');
      } else {
        if (options.output === 'json') {
          console.log(JSON.stringify(result.data, null, 2));
        } else {
          console.log(result.data.profile);
        }
      }
    } else {
      OutputFormatter.result(result, 'json');
    }
  }

    private async optimizeSystem(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    if (!options.dryRun) {
      const confirmed = await InteractivePrompts.confirm('confirmed', {
        message: 'This will apply system optimizations. Continue?'
      });
      if (!confirmed) {
        OutputFormatter.info('Cancelled', format);
        return;
      }
    }

    const optimizeOptions: PerfOptimizeOptions = {
      dryRun: options.dryRun,
      component: options.component as 'db' | 'cache' | 'api' | 'all',
      aggressive: options.aggressive
    };

    const result = await this.api.analytics.optimizeSystem(optimizeOptions);
    
    if (result.success && result.data && format !== 'json') {
      const data = result.data;
      
      if (options.dryRun) {
        console.log('Optimization Preview:');
      } else {
        console.log('Applied Optimizations:');
      }
      
      if (data.applied?.length > 0) {
        console.log('\n' + OutputFormatter.formatList(data.applied, {
          format: 'table',
          title: 'Applied',
          columns: ['component', 'optimization', 'expectedImpact', 'actualImpact']
        }));
      }

      if (data.recommendations?.length > 0) {
        console.log('\n' + OutputFormatter.formatList(data.recommendations, {
          format: 'table',
          title: 'Recommendations',
          columns: ['component', 'optimization', 'estimatedImpact', 'risk']
        }));
      }

      if (data.summary) {
        console.log('\n' + OutputFormatter.format(data.summary, format));
      }
    } else {
      OutputFormatter.result(result, format);
    }
  }
}

// System monitoring commands
export class MonitoringCommand {
  private api: MemoryManagerAPI;

  constructor() {
    this.api = new MemoryManagerAPI();
  }

  getCommand(): Command {
    const monitorCmd = new Command('monitor')
      .description('System monitoring and health commands')
      .addHelpText('after', `
Examples:
  $ memory status --detailed                    # Check system status
  $ memory metrics --category=performance      # Get performance metrics
  $ memory health-check --component=db         # Check database health
  $ memory logs --level=error --tail           # Stream error logs
`);

    // Status command
    monitorCmd
      .command('status')
      .description('Check system status')
      .option('--detailed', 'include detailed system information')
      .option('--component <component>', 'check specific component (all, api, db, cache)')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.getStatus.bind(this)));

    // Metrics command
    monitorCmd
      .command('metrics')
      .description('Get system metrics')
      .option('--category <category>', 'metric category (performance, usage, errors)')
      .option('--time-range <range>', 'time range (e.g., 1h, 24h, 7d)', '1h')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.getMetrics.bind(this)));

    // Health check command
    monitorCmd
      .command('health-check')
      .description('Perform comprehensive health check')
      .option('--component <component>', 'component to check (all, api, db, cache)', 'all')
      .option('--timeout <seconds>', 'timeout per check in seconds', '30')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.healthCheck.bind(this)));

    // Logs command
    monitorCmd
      .command('logs')
      .description('View system logs')
      .option('--level <level>', 'log level (error, warn, info, debug)', 'info')
      .option('--lines <count>', 'number of log lines to show', '100')
      .option('--tail', 'follow log output')
      .option('--since <time>', 'show logs since time (e.g., 2023-01-01T00:00:00Z)')
      .option('--component <component>', 'filter by component')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.getLogs.bind(this)));

    // Usage stats command
    monitorCmd
      .command('usage')
      .description('Get usage statistics')
      .option('--time-range <range>', 'time range (e.g., 24h, 7d, 30d)', '24h')
      .option('--granularity <granularity>', 'data granularity (hour, day, week)', 'hour')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.getUsageStats.bind(this)));

    // Error analysis command
    monitorCmd
      .command('errors')
      .description('Analyze system errors')
      .option('--time-range <range>', 'time range (e.g., 24h, 7d)', '24h')
      .option('--severity <severity>', 'error severity (low, medium, high, critical)')
      .option('--format <format>', 'output format', 'json')
      .action(handleErrors(this.getErrorAnalysis.bind(this)));

    return monitorCmd;
  }

    private async getStatus(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const statusOptions: StatusOptions = {
      detailed: options.detailed,
      component: options.component as 'all' | 'api' | 'db' | 'cache'
    };

    const result = await this.api.analytics.getStatus(statusOptions);
    
    if (result.success && result.data && format !== 'json') {
      const status = result.data;
      
      // Color-coded status display
      const statusColor = status.status === 'healthy' ? 'green' : 
                         status.status === 'degraded' ? 'yellow' : 'red';
      
      console.log(`Overall Status: ${status.status.toUpperCase()}`);
      console.log(`Uptime: ${Math.floor(status.uptime / 3600)}h ${Math.floor((status.uptime % 3600) / 60)}m`);
      console.log(`Version: ${status.version}`);
      
      if (status.services?.length > 0) {
        console.log('\n' + OutputFormatter.formatList(status.services, {
          format: 'table',
          title: 'Services',
          columns: ['name', 'status', 'responseTime', 'lastCheck']
        }));
      }
    } else {
      OutputFormatter.result(result, format);
    }
  }

    private async getMetrics(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const metricsOptions: MetricsOptions = {
      category: options.category as 'performance' | 'usage' | 'errors',
      timeRange: options.timeRange,
      format: format as OutputFormat
    };

    const result = await this.api.analytics.getMetrics(metricsOptions);
    
    if (result.success && result.data && format !== 'json') {
      const metrics = result.data;
      
      console.log(`Metrics (${metrics.category}) - ${metrics.timeRange.duration}`);
      
      if (metrics.metrics?.length > 0) {
        console.log('\n' + OutputFormatter.formatList(metrics.metrics, {
          format: 'table',
          title: 'Metrics',
          columns: ['name', 'value', 'unit', 'timestamp']
        }));
      }
    } else {
      OutputFormatter.result(result, format);
    }
  }

    private async healthCheck(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const healthOptions: HealthCheckOptions = {
      component: options.component as 'all' | 'api' | 'db' | 'cache',
      timeout: parseInt(options.timeout)
    };

    const result = await this.api.analytics.healthCheck(healthOptions);
    
    if (result.success && result.data && format !== 'json') {
      const health = result.data;
      
      console.log(`Overall Health: ${health.overall}`);
      console.log(`Check Duration: ${health.duration}ms`);
      
      if (health.components?.length > 0) {
        console.log('\n' + OutputFormatter.formatList(health.components, {
          format: 'table',
          title: 'Component Health',
          columns: ['name', 'status', 'responseTime', 'error']
        }));
      }
    } else {
      OutputFormatter.result(result, format);
    }
  }

    private async getLogs(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const logsOptions: LogsOptions = {
      level: options.level as 'error' | 'warn' | 'info' | 'debug',
      lines: options.lines ? parseInt(options.lines) : undefined,
      tail: options.tail,
      follow: options.tail
    };

    if (options.tail) {
      console.log('Following logs (Ctrl+C to exit)...\n');
    }

    const result = await this.api.analytics.getLogs(logsOptions);
    
    if (result.success && result.data) {
      if (format === 'json') {
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        result.data.forEach((log: any) => {
          const timestamp = new Date(log.timestamp).toLocaleString();
          const level = log.level.padEnd(5);
          console.log(`${timestamp} [${level}] ${log.component}: ${log.message}`);
        });
      }
    } else {
      OutputFormatter.result(result, format);
    }
  }

    private async getUsageStats(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const result = await this.api.analytics.getUsageStats({
      timeRange: options.timeRange,
      granularity: options.granularity as 'hour' | 'day' | 'week' | 'month'
    });
    
    OutputFormatter.result(result, format);
  }

    private async getErrorAnalysis(options: any): Promise<void> {
    const format = options.json ? 'json' : options.format;

    const result = await this.api.analytics.getErrorAnalysis({
      timeRange: options.timeRange,
      severity: options.severity as 'low' | 'medium' | 'high' | 'critical'
    });
    
    OutputFormatter.result(result, format);
  }
}