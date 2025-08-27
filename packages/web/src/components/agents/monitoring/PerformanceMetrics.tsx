import React, { useMemo } from 'react';
import { Agent, AgentPerformance, DataPoint } from '../../../types';

interface PerformanceMetricsProps {
  agents: Agent[];
  selectedAgent?: Agent | null;
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d';
  onTimeRangeChange?: (range: '1h' | '6h' | '24h' | '7d' | '30d') => void;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  status: 'good' | 'warning' | 'error';
  icon?: React.ReactNode;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  change,
  status,
  icon,
  className = '',
}) => {
  const statusColors = {
    good: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };

  const statusTextColors = {
    good: 'text-green-700 dark:text-green-400',
    warning: 'text-yellow-700 dark:text-yellow-400',
    error: 'text-red-700 dark:text-red-400',
  };

  return (
    <div className={`${className} p-4 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <div className={statusTextColors[status]}>{icon}</div>}
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {title}
          </h3>
        </div>
        {change !== undefined && (
          <span className={`
            text-xs px-2 py-0.5 rounded-full
            ${change > 0 
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : change < 0
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }
          `}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>
      
      <div className={`text-2xl font-bold ${statusTextColors[status]}`}>
        {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
        <span className="text-sm font-normal ml-1">{unit}</span>
      </div>
    </div>
  );
};

// Simple chart component (would normally use Chart.js or similar)
const SimpleLineChart: React.FC<{
  data: DataPoint[];
  color: string;
  height?: number;
}> = ({ data, color, height = 100 }) => {
  if (data.length === 0) {
    return (
      <div className={`w-full bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm`} style={{ height }}>
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg width="100%" height="100%" className="overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = ((maxValue - point.value) / range) * 80 + 10;
            return `${x}%,${y}%`;
          }).join(' ')}
        />
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = ((maxValue - point.value) / range) * 80 + 10;
          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={`${y}%`}
              r="2"
              fill={color}
            />
          );
        })}
      </svg>
    </div>
  );
};

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  agents,
  selectedAgent,
  timeRange = '24h',
  onTimeRangeChange,
  className = '',
}) => {
  // Calculate aggregate metrics
  const aggregatedMetrics = useMemo(() => {
    const runningAgents = agents.filter(a => a.status === 'running' && a.performance);
    
    if (runningAgents.length === 0) {
      return {
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        totalApiCalls: 0,
        avgSuccessRate: 0,
        avgResponseTime: 0,
        avgHealthScore: 0,
        totalErrors: 0,
      };
    }

    return {
      avgCpuUsage: runningAgents.reduce((sum, a) => sum + a.performance!.metrics.cpuUsage, 0) / runningAgents.length,
      avgMemoryUsage: runningAgents.reduce((sum, a) => sum + a.performance!.metrics.memoryUsage, 0) / runningAgents.length,
      totalApiCalls: runningAgents.reduce((sum, a) => sum + a.performance!.metrics.apiCalls, 0),
      avgSuccessRate: runningAgents.reduce((sum, a) => sum + a.performance!.metrics.successRate, 0) / runningAgents.length,
      avgResponseTime: runningAgents.reduce((sum, a) => sum + a.performance!.metrics.avgResponseTime, 0) / runningAgents.length,
      avgHealthScore: runningAgents.reduce((sum, a) => sum + a.performance!.healthScore, 0) / runningAgents.length,
      totalErrors: runningAgents.reduce((sum, a) => sum + a.performance!.metrics.errorCount, 0),
    };
  }, [agents]);

  // Mock trend data for demo
  const generateMockTrendData = (baseValue: number, points: number = 24): DataPoint[] => {
    return Array.from({ length: points }, (_, i) => ({
      timestamp: new Date(Date.now() - (points - i) * 60 * 60 * 1000).toISOString(),
      value: baseValue + (Math.random() - 0.5) * baseValue * 0.3,
    }));
  };

  const timeRangeOptions = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
  ];

  const isAgentView = selectedAgent && selectedAgent.performance;
  const performance = selectedAgent?.performance;

  return (
    <div className={`${className} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Performance Metrics
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isAgentView 
              ? `Metrics for ${selectedAgent.name}` 
              : `System-wide metrics for ${agents.length} agents`
            }
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Time range selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Time Range:</span>
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange?.(e.target.value as any)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* View toggle */}
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            <button
              onClick={() => {/* Toggle to system view */}}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                !isAgentView
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              System
            </button>
            <button
              onClick={() => {/* Toggle to agent view */}}
              disabled={!selectedAgent}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isAgentView
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              Agent
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAgentView && performance ? (
          <>
            <MetricCard
              title="Health Score"
              value={performance.healthScore}
              unit="%"
              status={performance.healthScore >= 80 ? 'good' : performance.healthScore >= 60 ? 'warning' : 'error'}
              icon={<div className="w-4 h-4">❤️</div>}
            />
            <MetricCard
              title="Response Time"
              value={performance.metrics.avgResponseTime}
              unit="s"
              status={performance.metrics.avgResponseTime > 3 ? 'error' : performance.metrics.avgResponseTime > 2 ? 'warning' : 'good'}
              icon={<div className="w-4 h-4">⚡</div>}
            />
            <MetricCard
              title="Success Rate"
              value={(performance.metrics.successRate * 100).toFixed(1)}
              unit="%"
              status={performance.metrics.successRate < 0.9 ? 'error' : performance.metrics.successRate < 0.95 ? 'warning' : 'good'}
              icon={<div className="w-4 h-4">✅</div>}
            />
            <MetricCard
              title="API Calls"
              value={performance.metrics.apiCalls.toLocaleString()}
              status="good"
              icon={<div className="w-4 h-4">🔗</div>}
            />
          </>
        ) : (
          <>
            <MetricCard
              title="Avg Health Score"
              value={aggregatedMetrics.avgHealthScore.toFixed(0)}
              unit="%"
              status={aggregatedMetrics.avgHealthScore >= 80 ? 'good' : aggregatedMetrics.avgHealthScore >= 60 ? 'warning' : 'error'}
              icon={<div className="w-4 h-4">❤️</div>}
            />
            <MetricCard
              title="Avg Response Time"
              value={aggregatedMetrics.avgResponseTime}
              unit="s"
              status={aggregatedMetrics.avgResponseTime > 3 ? 'error' : aggregatedMetrics.avgResponseTime > 2 ? 'warning' : 'good'}
              icon={<div className="w-4 h-4">⚡</div>}
            />
            <MetricCard
              title="Avg Success Rate"
              value={(aggregatedMetrics.avgSuccessRate * 100).toFixed(1)}
              unit="%"
              status={aggregatedMetrics.avgSuccessRate < 0.9 ? 'error' : aggregatedMetrics.avgSuccessRate < 0.95 ? 'warning' : 'good'}
              icon={<div className="w-4 h-4">✅</div>}
            />
            <MetricCard
              title="Total API Calls"
              value={aggregatedMetrics.totalApiCalls.toLocaleString()}
              status="good"
              icon={<div className="w-4 h-4">🔗</div>}
            />
          </>
        )}
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Resource Usage
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {isAgentView && performance 
                    ? `${performance.metrics.cpuUsage}%`
                    : `${aggregatedMetrics.avgCpuUsage.toFixed(1)}%`
                  }
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    (isAgentView && performance ? performance.metrics.cpuUsage : aggregatedMetrics.avgCpuUsage) > 80 
                      ? 'bg-red-500' 
                      : (isAgentView && performance ? performance.metrics.cpuUsage : aggregatedMetrics.avgCpuUsage) > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ 
                    width: `${isAgentView && performance ? performance.metrics.cpuUsage : aggregatedMetrics.avgCpuUsage}%` 
                  }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {isAgentView && performance 
                    ? `${performance.metrics.memoryUsage} MB`
                    : `${aggregatedMetrics.avgMemoryUsage.toFixed(0)} MB`
                  }
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    (isAgentView && performance ? performance.metrics.memoryUsage : aggregatedMetrics.avgMemoryUsage) > 500 
                      ? 'bg-red-500' 
                      : (isAgentView && performance ? performance.metrics.memoryUsage : aggregatedMetrics.avgMemoryUsage) > 300
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, (isAgentView && performance ? performance.metrics.memoryUsage : aggregatedMetrics.avgMemoryUsage) / 10)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Error Tracking
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                  Total Errors
                </span>
              </div>
              <span className="text-lg font-bold text-red-700 dark:text-red-400">
                {isAgentView && performance 
                  ? performance.metrics.errorCount
                  : aggregatedMetrics.totalErrors
                }
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Uptime
                </span>
              </div>
              <span className="text-lg font-bold text-green-700 dark:text-green-400">
                {isAgentView && performance 
                  ? `${performance.metrics.uptime.toFixed(1)}%`
                  : `${agents.filter(a => a.status === 'running').length}/${agents.length}`
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Performance Trends
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Response Time
            </h4>
            <SimpleLineChart
              data={generateMockTrendData(isAgentView && performance ? performance.metrics.avgResponseTime : aggregatedMetrics.avgResponseTime)}
              color="#3B82F6"
              height={120}
            />
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Calls
            </h4>
            <SimpleLineChart
              data={generateMockTrendData(isAgentView && performance ? performance.metrics.apiCalls / 10 : aggregatedMetrics.totalApiCalls / 100)}
              color="#10B981"
              height={120}
            />
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Error Rate
            </h4>
            <SimpleLineChart
              data={generateMockTrendData(isAgentView && performance ? performance.metrics.errorCount / 10 : aggregatedMetrics.totalErrors / 10)}
              color="#EF4444"
              height={120}
            />
          </div>
        </div>
      </div>

      {/* Agent Performance Comparison */}
      {!isAgentView && agents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Agent Performance Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Health
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    API Calls
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {agents.filter(a => a.performance).slice(0, 5).map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {agent.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          agent.performance!.healthScore >= 80 ? 'bg-green-500' :
                          agent.performance!.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {agent.performance!.healthScore}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {agent.performance!.metrics.avgResponseTime.toFixed(1)}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {agent.performance!.metrics.apiCalls.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {(agent.performance!.metrics.successRate * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

PerformanceMetrics.displayName = 'PerformanceMetrics';