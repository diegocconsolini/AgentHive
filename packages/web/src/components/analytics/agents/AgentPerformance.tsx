import React, { useMemo, useState } from 'react';
import { AgentMetrics, AgentComparison, TimeRange } from '../../../types/analytics';
import { TimeSeriesChart, MetricCard, BarChart } from '../shared';
import { formatLatency, formatNumber, formatPercentage, formatCurrency, TrendIndicator } from '../shared/MetricFormatters';
import { 
  Bot, 
  Clock, 
  CheckCircle, 
  Zap, 
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';
import { subMinutes } from 'date-fns';

interface AgentPerformanceProps {
  timeRange: TimeRange;
  className?: string;
}

// Mock data generators
const generateAgentMetrics = (agentId: string, agentType: string): AgentMetrics => {
  const baseResponseTime = agentType === 'python-pro' ? 800 : agentType === 'data-analyst' ? 1200 : 600;
  const successRate = 0.88 + Math.random() * 0.1;
  
  return {
    agentId,
    agentType,
    performance: {
      responseTime: {
        average: baseResponseTime + Math.random() * 200,
        p50: baseResponseTime + Math.random() * 100,
        p95: baseResponseTime * 1.5 + Math.random() * 300,
        p99: baseResponseTime * 2 + Math.random() * 500,
        trend: Array.from({ length: 50 }, (_, i) => ({
          timestamp: subMinutes(new Date(), (49 - i) * 5),
          value: baseResponseTime + (Math.random() - 0.5) * 200,
        })),
      },
      successRate: {
        current: successRate,
        trend: Array.from({ length: 50 }, (_, i) => ({
          timestamp: subMinutes(new Date(), (49 - i) * 5),
          value: Math.min(1, successRate + (Math.random() - 0.5) * 0.1),
        })),
      },
      throughput: {
        requestsPerMinute: 15 + Math.random() * 20,
        trend: Array.from({ length: 50 }, (_, i) => ({
          timestamp: subMinutes(new Date(), (49 - i) * 5),
          value: 15 + Math.random() * 15,
        })),
      },
    },
    resources: {
      cpuUsage: 20 + Math.random() * 40,
      memoryUsage: 512 + Math.random() * 1024,
      cost: 2.30 + Math.random() * 3.50,
    },
    errors: {
      count: Math.floor(Math.random() * 12),
      rate: Math.random() * 0.08,
      breakdown: {
        'timeout': Math.floor(Math.random() * 5),
        'validation_error': Math.floor(Math.random() * 3),
        'execution_error': Math.floor(Math.random() * 4),
        'resource_error': Math.floor(Math.random() * 2),
      },
    },
    taskDistribution: {
      'code_analysis': Math.random() * 30,
      'data_processing': Math.random() * 25,
      'report_generation': Math.random() * 20,
      'optimization': Math.random() * 15,
      'monitoring': Math.random() * 10,
    },
  };
};

const generateAgentsList = (): AgentMetrics[] => [
  generateAgentMetrics('agent-001', 'python-pro'),
  generateAgentMetrics('agent-002', 'data-analyst'),
  generateAgentMetrics('agent-003', 'frontend-developer'),
  generateAgentMetrics('agent-004', 'devops-engineer'),
  generateAgentMetrics('agent-005', 'code-reviewer'),
  generateAgentMetrics('agent-006', 'security-auditor'),
];

export const AgentPerformance: React.FC<AgentPerformanceProps> = ({
  timeRange,
  className = '',
}) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('agent-001');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'comparison'>('overview');
  
  const agents = useMemo(() => generateAgentsList(), []);
  const currentAgent = agents.find(a => a.agentId === selectedAgent) || agents[0];

  // Aggregate metrics for overview
  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.performance.successRate.current > 0.8).length;
  const avgResponseTime = agents.reduce((acc, a) => acc + a.performance.responseTime.average, 0) / agents.length;
  const totalCost = agents.reduce((acc, a) => acc + a.resources.cost, 0);
  const avgSuccessRate = agents.reduce((acc, a) => acc + a.performance.successRate.current, 0) / agents.length;

  const overviewMetrics = [
    {
      title: 'Active Agents',
      value: activeAgents,
      format: 'number' as const,
      trend: 8.3,
      icon: <Users className="w-6 h-6" />,
      status: 'healthy' as const,
      description: `${totalAgents} total`,
    },
    {
      title: 'Avg Response Time',
      value: avgResponseTime,
      format: 'latency' as const,
      trend: -5.2,
      icon: <Clock className="w-6 h-6" />,
      status: avgResponseTime < 1000 ? 'healthy' as const : 'warning' as const,
    },
    {
      title: 'Success Rate',
      value: avgSuccessRate * 100,
      format: 'percentage' as const,
      trend: 2.1,
      icon: <CheckCircle className="w-6 h-6" />,
      status: avgSuccessRate > 0.85 ? 'healthy' as const : 'critical' as const,
    },
    {
      title: 'Total Cost',
      value: totalCost,
      format: 'currency' as const,
      trend: -3.7,
      icon: <DollarSign className="w-6 h-6" />,
      status: 'healthy' as const,
      description: 'per hour',
    },
  ];

  const agentComparison = agents.map(agent => ({
    name: agent.agentType,
    responseTime: agent.performance.responseTime.average,
    successRate: agent.performance.successRate.current * 100,
    throughput: agent.performance.throughput.requestsPerMinute,
    cost: agent.resources.cost,
    errorRate: agent.errors.rate * 100,
  }));

  const taskDistributionData = Object.entries(currentAgent.taskDistribution).map(([task, count]) => ({
    label: task.replace('_', ' '),
    value: count,
  }));

  const errorBreakdownData = Object.entries(currentAgent.errors.breakdown).map(([type, count]) => ({
    label: type.replace('_', ' '),
    value: count,
  }));

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Overview metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewMetrics.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            format={metric.format}
            trend={metric.trend}
            icon={metric.icon}
            status={metric.status}
            description={metric.description}
          />
        ))}
      </div>

      {/* Top performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Top Performing Agents
          </h4>
          <div className="space-y-3">
            {agents
              .sort((a, b) => b.performance.successRate.current - a.performance.successRate.current)
              .slice(0, 5)
              .map((agent) => (
                <div key={agent.agentId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bot className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {agent.agentType}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {agent.agentId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {formatPercentage(agent.performance.successRate.current * 100)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatLatency(agent.performance.responseTime.average)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Resource Utilization
          </h4>
          <BarChart
            data={agentComparison.map(a => ({ label: a.name, value: a.cost }))}
            height={250}
            formatValue={(value) => formatCurrency(value)}
            title="Cost per Agent ($/hour)"
          />
        </div>
      </div>

      {/* System-wide trends */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Agent Performance Trends
        </h4>
        <TimeSeriesChart
          data={[
            {
              name: 'Avg Response Time',
              data: currentAgent.performance.responseTime.trend.map(p => ({ ...p, value: p.value })),
              color: '#3B82F6',
              unit: 'ms',
            },
            {
              name: 'Success Rate',
              data: currentAgent.performance.successRate.trend.map(p => ({ ...p, value: p.value * 100 })),
              color: '#10B981',
              unit: '%',
            },
          ]}
          height={300}
          formatValue={(value, series) => 
            series?.unit === 'ms' ? formatLatency(value) : formatPercentage(value)
          }
        />
      </div>
    </div>
  );

  const renderDetailed = () => (
    <div className="space-y-6">
      {/* Agent selector */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          {agents.map((agent) => (
            <option key={agent.agentId} value={agent.agentId}>
              {agent.agentType} ({agent.agentId})
            </option>
          ))}
        </select>
      </div>

      {/* Agent details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Response Time"
          value={currentAgent.performance.responseTime.average}
          format="latency"
          trend={-8.2}
          icon={<Clock className="w-6 h-6" />}
          status={currentAgent.performance.responseTime.average < 1000 ? 'healthy' : 'warning'}
          description={`P95: ${formatLatency(currentAgent.performance.responseTime.p95)}`}
        />
        <MetricCard
          title="Success Rate"
          value={currentAgent.performance.successRate.current * 100}
          format="percentage"
          trend={1.5}
          icon={<CheckCircle className="w-6 h-6" />}
          status={currentAgent.performance.successRate.current > 0.85 ? 'healthy' : 'critical'}
        />
        <MetricCard
          title="Throughput"
          value={currentAgent.performance.throughput.requestsPerMinute}
          format="number"
          trend={12.3}
          icon={<Zap className="w-6 h-6" />}
          status="healthy"
          description="req/min"
        />
        <MetricCard
          title="Cost"
          value={currentAgent.resources.cost}
          format="currency"
          trend={-5.1}
          icon={<DollarSign className="w-6 h-6" />}
          status="healthy"
          description="per hour"
        />
      </div>

      {/* Performance charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Response Time Trend
          </h4>
          <TimeSeriesChart
            data={[{
              name: 'Response Time',
              data: currentAgent.performance.responseTime.trend,
              color: '#3B82F6',
              unit: 'ms',
            }]}
            height={250}
            formatValue={(value) => formatLatency(value)}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Task Distribution
          </h4>
          <BarChart
            data={taskDistributionData}
            height={250}
            formatValue={(value) => formatNumber(value)}
          />
        </div>
      </div>

      {/* Resource and error analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Resource Usage
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">CPU Usage</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatPercentage(currentAgent.resources.cpuUsage)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Memory Usage</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatNumber(currentAgent.resources.memoryUsage)} MB
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Error Rate</span>
              <span className={`font-medium ${
                currentAgent.errors.rate < 0.05 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatPercentage(currentAgent.errors.rate * 100)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Errors</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatNumber(currentAgent.errors.count)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Error Breakdown
          </h4>
          <BarChart
            data={errorBreakdownData}
            height={200}
            formatValue={(value) => formatNumber(value)}
            horizontal
          />
        </div>
      </div>
    </div>
  );

  const renderComparison = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Agent Performance Comparison
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Agent</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Response Time</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Success Rate</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Throughput</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Cost</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Error Rate</th>
              </tr>
            </thead>
            <tbody>
              {agentComparison.map((agent, index) => (
                <tr key={agent.name} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/50' : ''}>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    {agent.name}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {formatLatency(agent.responseTime)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {formatPercentage(agent.successRate)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {formatNumber(agent.throughput)}/min
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {formatCurrency(agent.cost)}/hr
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={agent.errorRate < 5 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {formatPercentage(agent.errorRate)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Response Time Comparison
          </h4>
          <BarChart
            data={agentComparison.map(a => ({ label: a.name, value: a.responseTime }))}
            height={300}
            formatValue={(value) => formatLatency(value)}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Cost Efficiency
          </h4>
          <BarChart
            data={agentComparison.map(a => ({ label: a.name, value: a.cost }))}
            height={300}
            formatValue={(value) => formatCurrency(value)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Agent Performance
          </h3>
        </div>

        {/* View mode toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'overview'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'detailed'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Detailed
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'comparison'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Comparison
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'overview' && renderOverview()}
      {viewMode === 'detailed' && renderDetailed()}
      {viewMode === 'comparison' && renderComparison()}
    </div>
  );
};