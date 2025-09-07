import React from 'react';
import { TrendingUp, Activity, Clock, CheckCircle } from 'lucide-react';
import { useSSPSystemOverview } from '../../hooks/useSSP';
import { Link } from 'react-router-dom';

export const SSPMetricsCard: React.FC = () => {
  const { overview, loading, error } = useSSPSystemOverview();

  if (loading) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                SSP Learning
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Loading...
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                SSP Learning
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Offline
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Start using agents to see patterns
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(0)}%`;
  };

  return (
    <Link to="/analytics" className="block group">
      <div className="card group-hover:shadow-md transition-shadow">
        <div className="card-header pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Success Patterns
              </h3>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400">
              View all →
            </span>
          </div>
        </div>
        <div className="card-content pt-0">
          <div className="space-y-3">
            {/* Main metric */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {overview.totalExecutions}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Executions
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatPercentage(overview.overallSuccessRate)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Success Rate
                </p>
              </div>
            </div>

            {/* Secondary metrics */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDuration(overview.avgExecutionTime)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Avg Time
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {overview.activeAgents}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Active Agents
                  </p>
                </div>
              </div>
            </div>

            {/* Learning indicator */}
            {overview.totalExecutions > 0 && (
              <div className="flex items-center space-x-2 pt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  AI learning from {overview.activeAgents} agents
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};