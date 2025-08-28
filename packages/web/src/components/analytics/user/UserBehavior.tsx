import React, { useMemo, useState } from 'react';
import { UserBehavior as IUserBehavior, UserEngagementMetrics, TimeRange, TimeSeries } from '../../../types/analytics';
import { TimeSeriesChart, MetricCard, BarChart, PieChart, Heatmap } from '../shared';
import { formatDuration, formatNumber, formatPercentage, TrendIndicator } from '../shared/MetricFormatters';
import { 
  Users, 
  Clock, 
  MousePointer, 
  TrendingUp, 
  Activity,
  Calendar,
  Target,
  UserCheck,
  Repeat,
  AlertTriangle
} from 'lucide-react';
import { subDays, subHours, subWeeks } from 'date-fns';

interface UserBehaviorProps {
  timeRange: TimeRange;
  className?: string;
}

// Mock data generators
const generateUserBehavior = (userId: string): IUserBehavior => ({
  userId,
  sessionData: {
    totalSessions: 145 + Math.floor(Math.random() * 100),
    averageSessionDuration: 780 + Math.random() * 600, // 13-23 minutes
    sessionsToday: Math.floor(Math.random() * 8) + 1,
    lastActive: subHours(new Date(), Math.random() * 24),
  },
  featureUsage: {
    'memory_creation': {
      count: 234 + Math.floor(Math.random() * 100),
      lastUsed: subHours(new Date(), Math.random() * 48),
      timeSpent: 12460, // seconds
    },
    'search': {
      count: 567 + Math.floor(Math.random() * 200),
      lastUsed: subHours(new Date(), Math.random() * 6),
      timeSpent: 8920,
    },
    'analytics': {
      count: 89 + Math.floor(Math.random() * 50),
      lastUsed: subHours(new Date(), Math.random() * 12),
      timeSpent: 4560,
    },
    'agent_interaction': {
      count: 156 + Math.floor(Math.random() * 80),
      lastUsed: subHours(new Date(), Math.random() * 24),
      timeSpent: 9840,
    },
    'export': {
      count: 34 + Math.floor(Math.random() * 20),
      lastUsed: subDays(new Date(), Math.random() * 7),
      timeSpent: 2340,
    },
  },
  workflows: {
    commonPaths: [
      ['login', 'dashboard', 'memory_creation', 'save'],
      ['login', 'search', 'view_memory', 'edit'],
      ['login', 'analytics', 'memory_analytics', 'export'],
      ['login', 'agents', 'python-pro', 'analyze_code'],
    ],
    dropOffPoints: [
      { step: 'memory_creation', dropOffRate: 0.23 },
      { step: 'export', dropOffRate: 0.45 },
      { step: 'agent_setup', dropOffRate: 0.34 },
      { step: 'advanced_search', dropOffRate: 0.56 },
    ],
  },
  engagement: {
    dailyActiveTime: 45 + Math.random() * 60, // minutes
    weeklyActiveTime: 420 + Math.random() * 300,
    monthlyActiveTime: 1800 + Math.random() * 1200,
    streakDays: Math.floor(Math.random() * 30) + 1,
  },
});

const generateEngagementMetrics = (): UserEngagementMetrics => ({
  totalUsers: 2847,
  activeUsers: {
    daily: 423 + Math.floor(Math.random() * 100),
    weekly: 1234 + Math.floor(Math.random() * 200),
    monthly: 2156 + Math.floor(Math.random() * 300),
  },
  retention: {
    day1: 0.78 + Math.random() * 0.15,
    day7: 0.62 + Math.random() * 0.20,
    day30: 0.45 + Math.random() * 0.25,
  },
  featureAdoption: [
    {
      feature: 'Memory Creation',
      adoptionRate: 0.89,
      trend: Array.from({ length: 30 }, (_, i) => ({
        timestamp: subDays(new Date(), 29 - i),
        value: 0.85 + Math.random() * 0.1,
      })),
    },
    {
      feature: 'Agent Interaction',
      adoptionRate: 0.67,
      trend: Array.from({ length: 30 }, (_, i) => ({
        timestamp: subDays(new Date(), 29 - i),
        value: 0.6 + Math.random() * 0.15,
      })),
    },
    {
      feature: 'Analytics',
      adoptionRate: 0.34,
      trend: Array.from({ length: 30 }, (_, i) => ({
        timestamp: subDays(new Date(), 29 - i),
        value: 0.25 + Math.random() * 0.2,
      })),
    },
    {
      feature: 'Advanced Search',
      adoptionRate: 0.23,
      trend: Array.from({ length: 30 }, (_, i) => ({
        timestamp: subDays(new Date(), 29 - i),
        value: 0.15 + Math.random() * 0.2,
      })),
    },
  ],
  churnRate: 0.08,
});

const generateActivityHeatmap = (): { x: string; y: string; value: number }[] => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const data = [];
  
  for (const day of days) {
    for (const hour of hours) {
      // Simulate realistic activity patterns
      const isWeekend = day === 'Sat' || day === 'Sun';
      const hourNum = parseInt(hour);
      const isWorkHours = hourNum >= 9 && hourNum <= 17;
      
      let baseActivity = 10;
      if (!isWeekend && isWorkHours) baseActivity = 50;
      else if (!isWeekend) baseActivity = 25;
      else if (hourNum >= 10 && hourNum <= 20) baseActivity = 30;
      
      data.push({
        x: hour,
        y: day,
        value: baseActivity + Math.random() * 20,
      });
    }
  }
  
  return data;
};

export const UserBehavior: React.FC<UserBehaviorProps> = ({
  timeRange,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'cohort' | 'funnel'>('overview');
  const [selectedUserId, setSelectedUserId] = useState<string>('user-001');
  
  const engagementMetrics = useMemo(() => generateEngagementMetrics(), []);
  const userBehavior = useMemo(() => generateUserBehavior(selectedUserId), [selectedUserId]);
  const activityHeatmap = useMemo(() => generateActivityHeatmap(), []);

  // Generate user activity trends
  const userActivityTrends: TimeSeries[] = useMemo(() => {
    const days = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
    
    return [
      {
        name: 'Daily Active Users',
        data: Array.from({ length: days }, (_, i) => ({
          timestamp: subDays(new Date(), days - i - 1),
          value: engagementMetrics.activeUsers.daily + (Math.random() - 0.5) * 100,
        })),
        color: '#3B82F6',
        unit: 'users',
      },
      {
        name: 'Session Duration',
        data: Array.from({ length: days }, (_, i) => ({
          timestamp: subDays(new Date(), days - i - 1),
          value: userBehavior.sessionData.averageSessionDuration + (Math.random() - 0.5) * 300,
        })),
        color: '#10B981',
        unit: 'seconds',
      },
    ];
  }, [timeRange, engagementMetrics, userBehavior]);

  const overviewMetrics = [
    {
      title: 'Total Users',
      value: engagementMetrics.totalUsers,
      format: 'number' as const,
      trend: 12.3,
      icon: <Users className="w-6 h-6" />,
      status: 'healthy' as const,
    },
    {
      title: 'Daily Active Users',
      value: engagementMetrics.activeUsers.daily,
      format: 'number' as const,
      trend: 8.7,
      icon: <UserCheck className="w-6 h-6" />,
      status: 'healthy' as const,
      description: `${formatPercentage((engagementMetrics.activeUsers.daily / engagementMetrics.totalUsers) * 100)} of total`,
    },
    {
      title: 'Avg Session Duration',
      value: userBehavior.sessionData.averageSessionDuration,
      format: 'duration' as const,
      trend: 15.2,
      icon: <Clock className="w-6 h-6" />,
      status: 'healthy' as const,
    },
    {
      title: 'Retention Rate (7d)',
      value: engagementMetrics.retention.day7 * 100,
      format: 'percentage' as const,
      trend: -2.1,
      icon: <Repeat className="w-6 h-6" />,
      status: engagementMetrics.retention.day7 > 0.6 ? 'healthy' as const : 'warning' as const,
    },
  ];

  const featureUsageData = Object.entries(userBehavior.featureUsage).map(([feature, usage]) => ({
    label: feature.replace('_', ' '),
    value: usage.count,
  }));

  const retentionData = [
    { label: 'Day 1', value: engagementMetrics.retention.day1 * 100 },
    { label: 'Day 7', value: engagementMetrics.retention.day7 * 100 },
    { label: 'Day 30', value: engagementMetrics.retention.day30 * 100 },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key metrics */}
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

      {/* Activity trends */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          User Activity Trends
        </h4>
        <TimeSeriesChart
          data={userActivityTrends}
          height={300}
          formatValue={(value, series) => 
            series?.unit === 'users' ? formatNumber(value) : formatDuration(value)
          }
        />
      </div>

      {/* Feature adoption and usage patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Feature Usage Distribution
          </h4>
          <PieChart
            data={featureUsageData}
            height={300}
            formatValue={(value) => formatNumber(value)}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            User Retention
          </h4>
          <BarChart
            data={retentionData}
            height={300}
            formatValue={(value) => formatPercentage(value)}
            showLegend={false}
          />
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Activity Heatmap (By Day & Hour)
        </h4>
        <Heatmap
          data={activityHeatmap}
          title="User Activity by Time"
          formatValue={(value) => formatNumber(value)}
        />
      </div>
    </div>
  );

  const renderDetailed = () => (
    <div className="space-y-6">
      {/* User selector */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <option value="user-001">User 001 (Power User)</option>
          <option value="user-002">User 002 (Regular User)</option>
          <option value="user-003">User 003 (New User)</option>
          <option value="user-004">User 004 (Returning User)</option>
        </select>
      </div>

      {/* User metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Sessions"
          value={userBehavior.sessionData.totalSessions}
          format="number"
          trend={5.2}
          icon={<Activity className="w-6 h-6" />}
          status="healthy"
        />
        <MetricCard
          title="Sessions Today"
          value={userBehavior.sessionData.sessionsToday}
          format="number"
          trend={0}
          icon={<Calendar className="w-6 h-6" />}
          status="healthy"
        />
        <MetricCard
          title="Streak Days"
          value={userBehavior.engagement.streakDays}
          format="number"
          trend={12.5}
          icon={<Target className="w-6 h-6" />}
          status="healthy"
          description="consecutive days"
        />
        <MetricCard
          title="Monthly Active Time"
          value={userBehavior.engagement.monthlyActiveTime}
          format="duration"
          trend={8.3}
          icon={<Clock className="w-6 h-6" />}
          status="healthy"
        />
      </div>

      {/* Feature usage details */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Feature Usage Details
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Feature</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Usage Count</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Time Spent</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Last Used</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Avg per Session</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(userBehavior.featureUsage).map(([feature, usage], index) => (
                <tr key={feature} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/50' : ''}>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    {feature.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {formatNumber(usage.count)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {formatDuration(usage.timeSpent)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {usage.lastUsed.toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {formatDuration(usage.timeSpent / usage.count)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User workflow analysis */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Common User Workflows
        </h4>
        <div className="space-y-4">
          {userBehavior.workflows.commonPaths.map((path, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                {index + 1}
              </div>
              <div className="flex items-center space-x-2 text-sm">
                {path.map((step, stepIndex) => (
                  <React.Fragment key={stepIndex}>
                    <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      {step.replace('_', ' ')}
                    </span>
                    {stepIndex < path.length - 1 && (
                      <span className="text-gray-400 dark:text-gray-500">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drop-off analysis */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Drop-off Points Analysis
        </h4>
        <div className="space-y-3">
          {userBehavior.workflows.dropOffPoints.map((point) => (
            <div key={point.step} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {point.step.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {formatPercentage(point.dropOffRate * 100)}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">drop-off</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCohortAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Feature Adoption Trends
        </h4>
        <TimeSeriesChart
          data={engagementMetrics.featureAdoption.map(feature => ({
            name: feature.feature,
            data: feature.trend.map(point => ({ ...point, value: point.value * 100 })),
            color: feature.feature === 'Memory Creation' ? '#3B82F6' : 
                   feature.feature === 'Agent Interaction' ? '#10B981' :
                   feature.feature === 'Analytics' ? '#F59E0B' : '#8B5CF6',
            unit: '%',
          }))}
          height={400}
          formatValue={(value) => formatPercentage(value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Current Feature Adoption
          </h4>
          <BarChart
            data={engagementMetrics.featureAdoption.map(f => ({
              label: f.feature,
              value: f.adoptionRate * 100,
            }))}
            height={300}
            formatValue={(value) => formatPercentage(value)}
            horizontal
          />
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            User Engagement Cohorts
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="font-medium text-green-800 dark:text-green-300">High Engagement</span>
              <span className="text-green-600 dark:text-green-400">
                {formatNumber(Math.floor(engagementMetrics.totalUsers * 0.2))} users
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="font-medium text-blue-800 dark:text-blue-300">Medium Engagement</span>
              <span className="text-blue-600 dark:text-blue-400">
                {formatNumber(Math.floor(engagementMetrics.totalUsers * 0.5))} users
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <span className="font-medium text-yellow-800 dark:text-yellow-300">Low Engagement</span>
              <span className="text-yellow-600 dark:text-yellow-400">
                {formatNumber(Math.floor(engagementMetrics.totalUsers * 0.2))} users
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="font-medium text-red-800 dark:text-red-300">At Risk</span>
              <span className="text-red-600 dark:text-red-400">
                {formatNumber(Math.floor(engagementMetrics.totalUsers * 0.1))} users
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${className}`}>
      {/* Header with view mode toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
            <MousePointer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            User Behavior Analytics
          </h3>
        </div>

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
            onClick={() => setViewMode('cohort')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'cohort'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Cohort Analysis
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'overview' && renderOverview()}
      {viewMode === 'detailed' && renderDetailed()}
      {viewMode === 'cohort' && renderCohortAnalysis()}
    </div>
  );
};