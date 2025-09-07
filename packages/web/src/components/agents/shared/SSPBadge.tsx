import React from 'react';
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useSSPAnalytics } from '../../../hooks/useSSP';

interface SSPBadgeProps {
  agentId: string;
  compact?: boolean;
  className?: string;
}

export const SSPBadge: React.FC<SSPBadgeProps> = ({ 
  agentId, 
  compact = false, 
  className = '' 
}) => {
  const { analytics, loading } = useSSPAnalytics(agentId, false); // Don't auto-refresh for performance

  if (loading || !analytics || analytics.totalExecutions === 0) {
    return compact ? null : (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 ${className}`}>
        <TrendingUp className="w-3 h-3 mr-1" />
        No data
      </div>
    );
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.9) return 'text-green-700 bg-green-100 dark:bg-green-900/50 dark:text-green-300';
    if (rate >= 0.7) return 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300';
    return 'text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-300';
  };

  const getSuccessRateIcon = (rate: number) => {
    if (rate >= 0.9) return CheckCircle;
    if (rate >= 0.7) return AlertCircle;
    return AlertCircle;
  };

  if (compact) {
    const SuccessIcon = getSuccessRateIcon(analytics.successRate);
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSuccessRateColor(analytics.successRate)} ${className}`}>
        <SuccessIcon className="w-3 h-3 mr-1" />
        {Math.round(analytics.successRate * 100)}%
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Success Rate Badge */}
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSuccessRateColor(analytics.successRate)}`}>
        <CheckCircle className="w-3 h-3 mr-1" />
        {Math.round(analytics.successRate * 100)}% success
      </div>

      {/* Additional Metrics */}
      <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
        <span className="flex items-center">
          <TrendingUp className="w-3 h-3 mr-1" />
          {analytics.totalExecutions} runs
        </span>
        <span className="flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {formatDuration(analytics.avgExecutionTime)}
        </span>
      </div>
    </div>
  );
};