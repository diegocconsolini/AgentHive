import React from 'react';
import { TrendingUp, Clock, CheckCircle, Activity, Users, Target } from 'lucide-react';
import { useSSPSystemOverview, useSSPAllAnalytics } from '../../../hooks/useSSP';
import { LoadingSpinner } from '../../common/LoadingSpinner';

interface SSPAnalyticsProps {
  className?: string;
}

export const SSPAnalytics: React.FC<SSPAnalyticsProps> = ({ className = '' }) => {
  const { overview, loading: overviewLoading, error: overviewError, refetch: refetchOverview } = useSSPSystemOverview();
  const { allAnalytics, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useSSPAllAnalytics();

  if (overviewLoading || analyticsLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" text="Loading SSP analytics..." />
      </div>
    );
  }

  const error = overviewError || analyticsError;
  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
        <p className="text-red-600 dark:text-red-400">Error loading SSP data: {error}</p>
        <button 
          onClick={() => {
            refetchOverview();
            refetchAnalytics();
          }}
          className="mt-2 text-sm text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-purple-600 dark:text-purple-400" />
            Success Patterns Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time insights into agent performance and learning patterns
          </p>
        </div>
        <button 
          onClick={() => {
            refetchOverview();
            refetchAnalytics();
          }}
          className="btn btn-secondary btn-sm"
        >
          Refresh Data
        </button>
      </div>

      {/* System Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Executions
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {overview.totalExecutions}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Success Rate
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatPercentage(overview.overallSuccessRate)}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Avg Duration
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatDuration(overview.avgExecutionTime)}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Agents
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {overview.activeAgents}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Performance Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Agent Performance Breakdown
          </h3>
        </div>
        <div className="card-content">
          {allAnalytics.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Agent
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Executions
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Success Rate
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Avg Duration
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Sessions
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {allAnalytics
                    .sort((a, b) => b.totalExecutions - a.totalExecutions)
                    .map((analytics) => (
                      <tr key={analytics.agentId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {analytics.agentId}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {analytics.totalExecutions}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            analytics.successRate >= 0.9 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                              : analytics.successRate >= 0.7
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                          }`}>
                            {formatPercentage(analytics.successRate)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {formatDuration(analytics.avgExecutionTime)}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {analytics.uniqueSessions}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {new Date(analytics.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No execution data yet
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Agent executions will appear here once they start running procedures
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Learning Insights */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Learning Insights
          </h3>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            {overview && overview.totalExecutions > 0 ? (
              <>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      System Learning Active
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Recording patterns from {overview.totalExecutions} procedure executions across {overview.activeAgents} agents
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      Performance Optimization
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Average execution time: {formatDuration(overview.avgExecutionTime)} with {formatPercentage(overview.overallSuccessRate)} success rate
                    </p>
                  </div>
                </div>

                {allAnalytics.length > 1 && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        Cross-Agent Learning
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Sharing successful patterns between {allAnalytics.length} active agents
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Start using agents to see learning insights appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};