import React from 'react';
import { Agent, AgentPerformance } from '../../../types';
import { StatusBadge, StatusDot, CircularProgress } from '../shared';

interface AgentStatusProps {
  agent: Agent;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

interface StatusMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'good' | 'warning' | 'error';
  className?: string;
}

const StatusMetric: React.FC<StatusMetricProps> = ({
  label,
  value,
  unit = '',
  status = 'good',
  className = '',
}) => {
  const statusColors = {
    good: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className={`${className}`}>
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
        {label}
      </div>
      <div className={`text-sm font-medium ${statusColors[status]}`}>
        {typeof value === 'number' && value % 1 !== 0 
          ? value.toFixed(1) 
          : value
        }{unit}
      </div>
    </div>
  );
};

export const AgentStatus: React.FC<AgentStatusProps> = ({
  agent,
  showDetails = true,
  compact = false,
  className = '',
}) => {
  const getHealthStatus = (score: number): 'good' | 'warning' | 'error' => {
    if (score >= 80) return 'good';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const formatUptime = (hours: number): string => {
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(1)}h`;
  };

  if (compact) {
    return (
      <div className={`${className} flex items-center gap-3`}>
        <StatusDot status={agent.status} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {agent.name}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
          </div>
        </div>
        {agent.performance && (
          <div className="flex items-center gap-2">
            <CircularProgress
              progress={agent.performance.healthScore}
              size={24}
              strokeWidth={2}
              status={agent.performance.healthScore >= 80 ? 'completed' : 
                     agent.performance.healthScore >= 60 ? 'running' : 'error'}
              showPercentage={false}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {agent.performance.healthScore}%
            </span>
          </div>
        )}
      </div>
    );
  }

  const performance = agent.performance;
  const lastUpdated = new Date(agent.lastUpdated);
  const timeSinceUpdate = Date.now() - lastUpdated.getTime();
  const isStale = timeSinceUpdate > 5 * 60 * 1000; // 5 minutes

  return (
    <div className={`${className} space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusBadge status={agent.status} />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {agent.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Version {agent.version}
            </p>
          </div>
        </div>
        
        {performance && (
          <div className="flex items-center gap-3">
            <CircularProgress
              progress={performance.healthScore}
              size={48}
              strokeWidth={3}
              status={performance.healthScore >= 80 ? 'completed' : 
                     performance.healthScore >= 60 ? 'running' : 'error'}
            />
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Health Score
              </div>
              <div className={`text-xs ${
                performance.healthScore >= 80 
                  ? 'text-green-600 dark:text-green-400'
                  : performance.healthScore >= 60
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {getHealthStatus(performance.healthScore).charAt(0).toUpperCase() + 
                 getHealthStatus(performance.healthScore).slice(1)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {agent.hasErrors && agent.errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-red-500 text-sm mt-0.5">⚠️</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-red-700 dark:text-red-400">
                Agent Error
              </div>
              <div className="text-sm text-red-600 dark:text-red-300 mt-1">
                {agent.errorMessage}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance metrics */}
      {performance && showDetails && (
        <div className="space-y-4">
          {/* Quick metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatusMetric
              label="CPU Usage"
              value={performance.metrics.cpuUsage}
              unit="%"
              status={performance.metrics.cpuUsage > 80 ? 'error' : 
                     performance.metrics.cpuUsage > 60 ? 'warning' : 'good'}
            />
            <StatusMetric
              label="Memory"
              value={performance.metrics.memoryUsage}
              unit="MB"
              status={performance.metrics.memoryUsage > 500 ? 'error' : 
                     performance.metrics.memoryUsage > 300 ? 'warning' : 'good'}
            />
            <StatusMetric
              label="API Calls"
              value={performance.metrics.apiCalls.toLocaleString()}
              status="good"
            />
            <StatusMetric
              label="Success Rate"
              value={(performance.metrics.successRate * 100).toFixed(1)}
              unit="%"
              status={performance.metrics.successRate < 0.9 ? 'error' : 
                     performance.metrics.successRate < 0.95 ? 'warning' : 'good'}
            />
          </div>

          {/* Response time metrics */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Response Times
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <StatusMetric
                label="Average"
                value={performance.metrics.avgResponseTime}
                unit="s"
                status={performance.metrics.avgResponseTime > 3 ? 'error' : 
                       performance.metrics.avgResponseTime > 2 ? 'warning' : 'good'}
              />
              <StatusMetric
                label="Median" 
                value={performance.metrics.medianResponseTime}
                unit="s"
                status={performance.metrics.medianResponseTime > 2 ? 'error' : 
                       performance.metrics.medianResponseTime > 1.5 ? 'warning' : 'good'}
              />
              <StatusMetric
                label="95th Percentile"
                value={performance.metrics.p95ResponseTime}
                unit="s"
                status={performance.metrics.p95ResponseTime > 5 ? 'error' : 
                       performance.metrics.p95ResponseTime > 3 ? 'warning' : 'good'}
              />
            </div>
          </div>

          {/* Reliability metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <StatusMetric
                label="Uptime"
                value={performance.metrics.uptime}
                unit="%"
                status={performance.metrics.uptime < 95 ? 'error' : 
                       performance.metrics.uptime < 99 ? 'warning' : 'good'}
              />
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Since deployment
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <StatusMetric
                label="Error Count"
                value={performance.metrics.errorCount}
                status={performance.metrics.errorCount > 20 ? 'error' : 
                       performance.metrics.errorCount > 10 ? 'warning' : 'good'}
              />
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Last 24 hours
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last updated */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Last updated:</span>
            <span className={`
              ${isStale 
                ? 'text-yellow-600 dark:text-yellow-400' 
                : 'text-gray-900 dark:text-gray-100'
              }
            `}>
              {lastUpdated.toLocaleString()}
            </span>
            {isStale && (
              <span className="text-yellow-500" title="Data may be stale">
                ⚠️
              </span>
            )}
          </div>
          
          {performance && (
            <span className="text-gray-600 dark:text-gray-400">
              Health checked: {new Date(performance.lastChecked).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

AgentStatus.displayName = 'AgentStatus';