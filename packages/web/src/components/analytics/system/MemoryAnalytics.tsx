import React, { useMemo, useState } from 'react';
import { MemoryUsage, ContextAnalytics, TimeRange, TimeSeries } from '../../../types/analytics';
import { TimeSeriesChart, PieChart, BarChart, MetricCard, TrendIndicator } from '../shared';
import { formatBytes, formatNumber, formatPercentage } from '../shared/MetricFormatters';
import { 
  Database, 
  TrendingUp, 
  Archive, 
  AlertTriangle, 
  Lightbulb,
  Tag,
  Clock,
  BarChart3 
} from 'lucide-react';
import { subDays, subHours } from 'date-fns';

interface MemoryAnalyticsProps {
  timeRange: TimeRange;
  className?: string;
}

// Mock data generators
const generateMemoryUsage = (): MemoryUsage => ({
  totalMemories: 1247 + Math.floor(Math.random() * 100),
  totalSize: 2.1e9 + Math.random() * 1e9,
  averageSize: 1.68e6 + Math.random() * 5e5,
  growthRate: 2.3 + (Math.random() - 0.5) * 2,
  distribution: {
    byTag: {
      'work': 423,
      'personal': 298,
      'research': 187,
      'meetings': 156,
      'ideas': 134,
      'projects': 49,
    },
    bySize: [
      { range: '< 1KB', count: 234 },
      { range: '1KB - 10KB', count: 567 },
      { range: '10KB - 100KB', count: 312 },
      { range: '100KB - 1MB', count: 89 },
      { range: '> 1MB', count: 45 },
    ],
    byAge: [
      { range: '< 1 day', count: 23 },
      { range: '1-7 days', count: 89 },
      { range: '1-4 weeks', count: 234 },
      { range: '1-3 months', count: 456 },
      { range: '3-6 months', count: 298 },
      { range: '> 6 months', count: 147 },
    ],
  },
});

const generateContextAnalytics = (): ContextAnalytics => ({
  accessFrequency: {
    'high': 234,
    'medium': 567,
    'low': 312,
    'never': 134,
  },
  qualityScores: {
    average: 7.8,
    distribution: [
      { score: 10, count: 123 },
      { score: 9, count: 187 },
      { score: 8, count: 234 },
      { score: 7, count: 298 },
      { score: 6, count: 156 },
      { score: 5, count: 89 },
      { score: 4, count: 67 },
      { score: 3, count: 45 },
      { score: 2, count: 23 },
      { score: 1, count: 25 },
    ],
  },
  retentionAnalysis: {
    activeContexts: 934,
    staleContexts: 189,
    archiveCandidates: ['ctx-123', 'ctx-456', 'ctx-789'],
  },
  optimizationSuggestions: [
    {
      type: 'cleanup',
      description: 'Remove 47 contexts that haven\'t been accessed in 6+ months',
      impact: 15,
      contexts: ['ctx-old-1', 'ctx-old-2'],
    },
    {
      type: 'archive',
      description: 'Archive 23 contexts with low quality scores',
      impact: 8,
      contexts: ['ctx-low-1', 'ctx-low-2'],
    },
    {
      type: 'merge',
      description: 'Merge 12 similar contexts to reduce redundancy',
      impact: 12,
      contexts: ['ctx-dup-1', 'ctx-dup-2'],
    },
  ],
});

const generateMemoryTrends = (days: number): TimeSeries[] => {
  const data: TimeSeries[] = [];
  const now = new Date();
  
  // Total size trend
  const sizeData = [];
  for (let i = days - 1; i >= 0; i--) {
    const timestamp = subDays(now, i);
    const baseSize = 2.1e9;
    const growth = (days - i) * 0.023 * baseSize; // 2.3% growth rate
    const noise = (Math.random() - 0.5) * 0.1 * baseSize;
    sizeData.push({ timestamp, value: baseSize + growth + noise });
  }
  
  data.push({
    name: 'Storage Size',
    data: sizeData,
    unit: 'bytes',
    color: '#3B82F6',
  });

  // Count trend
  const countData = [];
  for (let i = days - 1; i >= 0; i--) {
    const timestamp = subDays(now, i);
    const baseCount = 1200;
    const growth = (days - i) * 2.5; // ~2-3 new memories per day
    const noise = (Math.random() - 0.5) * 10;
    countData.push({ timestamp, value: baseCount + growth + noise });
  }
  
  data.push({
    name: 'Memory Count',
    data: countData,
    unit: 'items',
    color: '#10B981',
  });

  return data;
};

export const MemoryAnalytics: React.FC<MemoryAnalyticsProps> = ({
  timeRange,
  className = '',
}) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'optimization'>('overview');
  
  const memoryUsage = useMemo(() => generateMemoryUsage(), []);
  const contextAnalytics = useMemo(() => generateContextAnalytics(), []);
  
  const days = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
  const memoryTrends = useMemo(() => generateMemoryTrends(days), [days]);

  const tagDistribution = Object.entries(memoryUsage.distribution.byTag).map(([tag, count]) => ({
    label: tag,
    value: count,
  }));

  const sizeDistribution = memoryUsage.distribution.bySize.map(item => ({
    label: item.range,
    value: item.count,
  }));

  const ageDistribution = memoryUsage.distribution.byAge.map(item => ({
    label: item.range,
    value: item.count,
  }));

  const accessFrequencyData = Object.entries(contextAnalytics.accessFrequency).map(([freq, count]) => ({
    label: freq,
    value: count,
    color: freq === 'high' ? '#10B981' : freq === 'medium' ? '#F59E0B' : freq === 'low' ? '#EF4444' : '#6B7280',
  }));

  const views = [
    { id: 'overview' as const, label: 'Overview', icon: <Database className="w-4 h-4" /> },
    { id: 'trends' as const, label: 'Trends', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'optimization' as const, label: 'Optimization', icon: <Lightbulb className="w-4 h-4" /> },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Memories"
          value={memoryUsage.totalMemories}
          format="number"
          trend={memoryUsage.growthRate}
          icon={<Database className="w-6 h-6" />}
          status="healthy"
        />
        <MetricCard
          title="Storage Used"
          value={memoryUsage.totalSize}
          format="bytes"
          trend={1.2}
          icon={<Archive className="w-6 h-6" />}
          status="healthy"
        />
        <MetricCard
          title="Avg. Size"
          value={memoryUsage.averageSize}
          format="bytes"
          trend={-0.5}
          icon={<BarChart3 className="w-6 h-6" />}
          status="healthy"
        />
        <MetricCard
          title="Quality Score"
          value={contextAnalytics.qualityScores.average}
          format="number"
          trend={0.3}
          icon={<TrendingUp className="w-6 h-6" />}
          status="healthy"
        />
      </div>

      {/* Distribution charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Distribution by Tag
          </h4>
          <PieChart
            data={tagDistribution}
            height={300}
            formatValue={(value) => formatNumber(value)}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Access Frequency
          </h4>
          <PieChart
            data={accessFrequencyData}
            height={300}
            formatValue={(value) => formatNumber(value)}
          />
        </div>
      </div>

      {/* Size and age distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Size Distribution
          </h4>
          <BarChart
            data={sizeDistribution}
            height={250}
            formatValue={(value) => formatNumber(value)}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Age Distribution
          </h4>
          <BarChart
            data={ageDistribution}
            height={250}
            formatValue={(value) => formatNumber(value)}
          />
        </div>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Memory Growth Trends
        </h4>
        <TimeSeriesChart
          data={memoryTrends}
          height={400}
          formatValue={(value, series) => 
            series?.unit === 'bytes' ? formatBytes(value) : formatNumber(value)
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Growth Rate
          </h4>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatPercentage(memoryUsage.growthRate)}
            </div>
            <TrendIndicator value={memoryUsage.growthRate} />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            per day
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Projected Size (30d)
          </h4>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatBytes(memoryUsage.totalSize * (1 + (memoryUsage.growthRate / 100) * 30))}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            estimated
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Retention Rate
          </h4>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatPercentage((contextAnalytics.retentionAnalysis.activeContexts / memoryUsage.totalMemories) * 100)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            active contexts
          </div>
        </div>
      </div>
    </div>
  );

  const renderOptimization = () => (
    <div className="space-y-6">
      {/* Optimization summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Active Contexts</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Frequently accessed</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(contextAnalytics.retentionAnalysis.activeContexts)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Stale Contexts</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rarely accessed</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(contextAnalytics.retentionAnalysis.staleContexts)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <Archive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Archive Candidates</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ready to archive</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(contextAnalytics.retentionAnalysis.archiveCandidates.length)}
          </div>
        </div>
      </div>

      {/* Optimization suggestions */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Optimization Recommendations
        </h4>
        <div className="space-y-4">
          {contextAnalytics.optimizationSuggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0">
                {suggestion.type === 'cleanup' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                {suggestion.type === 'archive' && <Archive className="w-5 h-5 text-blue-500" />}
                {suggestion.type === 'merge' && <Database className="w-5 h-5 text-green-500" />}
                {suggestion.type === 'split' && <BarChart3 className="w-5 h-5 text-purple-500" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {suggestion.type} Recommendation
                  </h5>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {formatPercentage(suggestion.impact)} savings
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {suggestion.description}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Affects {suggestion.contexts.length} contexts
                  </span>
                  <button className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quality score distribution */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Quality Score Distribution
        </h4>
        <BarChart
          data={contextAnalytics.qualityScores.distribution.map(item => ({
            label: `Score ${item.score}`,
            value: item.count,
          }))}
          height={300}
          formatValue={(value) => formatNumber(value)}
        />
      </div>
    </div>
  );

  return (
    <div className={`${className}`}>
      {/* View tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setSelectedView(view.id)}
              className={`
                flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${selectedView === view.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              {view.icon}
              <span>{view.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* View content */}
      {selectedView === 'overview' && renderOverview()}
      {selectedView === 'trends' && renderTrends()}
      {selectedView === 'optimization' && renderOptimization()}
    </div>
  );
};