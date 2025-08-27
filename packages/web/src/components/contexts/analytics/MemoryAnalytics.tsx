import React, { useMemo } from 'react';
import { MemoryAnalyticsProps, MemoryAnalytics as MemoryAnalyticsType } from '../../../types/context';

interface StatCard {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: string;
  color: string;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
}

export const MemoryAnalytics: React.FC<MemoryAnalyticsProps> = ({
  analytics,
  loading,
  error,
  onRefresh,
  onCleanupAction
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const statCards: StatCard[] = useMemo(() => [
    {
      title: 'Total Contexts',
      value: analytics.totalContexts.toLocaleString(),
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900'
    },
    {
      title: 'Storage Used',
      value: formatBytes(analytics.totalSize),
      change: Math.round((analytics.totalSize / analytics.sizeLimit) * 100),
      changeType: analytics.totalSize / analytics.sizeLimit > 0.8 ? 'decrease' : 'increase',
      icon: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z',
      color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900'
    },
    {
      title: 'Average Importance',
      value: analytics.averageImportance.toFixed(1) + '/10',
      change: analytics.averageImportance,
      changeType: analytics.averageImportance >= 6 ? 'increase' : 'decrease',
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900'
    },
    {
      title: 'Quality Score',
      value: analytics.qualityMetrics.overallScore.toFixed(1) + '/10',
      change: analytics.qualityMetrics.overallScore,
      changeType: analytics.qualityMetrics.overallScore >= 7 ? 'increase' : 'decrease',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900'
    }
  ], [analytics]);

  const categoryChartData: ChartData[] = useMemo(() => 
    analytics.categoryDistribution.map((category, index) => ({
      label: category.category,
      value: category.percentage,
      color: [
        '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', 
        '#EF4444', '#06B6D4', '#84CC16', '#F97316'
      ][index % 8]
    }))
  , [analytics.categoryDistribution]);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
  };

  const getUsagePercentage = (): number => {
    return (analytics.totalSize / analytics.sizeLimit) * 100;
  };

  const getUsageColor = (): string => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <svg className="animate-spin mx-auto h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="h-8 w-8 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
              Error loading analytics
            </h3>
            <p className="mt-1 text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Memory Analytics
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Overview of your contextual memory usage and patterns
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </p>
                {stat.change !== undefined && (
                  <p className={`text-sm flex items-center ${
                    stat.changeType === 'increase' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d={
                        stat.changeType === 'increase'
                          ? "M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                          : "M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                      } clipRule="evenodd" />
                    </svg>
                    {stat.change}%
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Storage Usage */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Storage Usage
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatBytes(analytics.totalSize)} / {formatBytes(analytics.sizeLimit)}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
          <div
            className={`h-4 rounded-full transition-all duration-300 ${getUsageColor()}`}
            style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{getUsagePercentage().toFixed(1)}% used</span>
          <span>{formatBytes(analytics.sizeLimit - analytics.totalSize)} remaining</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Content Distribution
          </h3>
          
          <div className="space-y-3">
            {analytics.categoryDistribution.map((category, index) => (
              <div key={category.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {category.category}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {category.count} ({category.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${category.percentage}%`,
                      backgroundColor: categoryChartData[index]?.color || '#6B7280'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Access Patterns */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Access Patterns
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Most Active Hour
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {analytics.accessPatterns.sort((a, b) => b.count - a.count)[0]?.hour}:00
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Average Age
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {formatDuration(analytics.qualityMetrics.averageAge)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Access Frequency
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {analytics.qualityMetrics.accessFrequency.toFixed(1)}/day
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Growth Trend
        </h3>
        
        <div className="h-64 flex items-end space-x-2">
          {analytics.growthTrend.slice(-30).map((point, index) => {
            const maxCount = Math.max(...analytics.growthTrend.map(p => p.count));
            const height = (point.count / maxCount) * 100;
            
            return (
              <div
                key={index}
                className="flex-1 bg-blue-200 dark:bg-blue-800 hover:bg-blue-300 dark:hover:bg-blue-700 transition-colors rounded-t"
                style={{ height: `${height}%` }}
                title={`${new Date(point.date).toLocaleDateString()}: ${point.count} contexts`}
              />
            );
          })}
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quality Metrics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {analytics.qualityMetrics.duplicates}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Duplicates
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {analytics.qualityMetrics.staleContexts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Stale Contexts
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {analytics.qualityMetrics.orphanedContexts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Orphaned
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {analytics.qualityMetrics.overallScore.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Quality Score
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryAnalytics;