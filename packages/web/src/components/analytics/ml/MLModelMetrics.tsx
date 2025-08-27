import React, { useMemo, useState } from 'react';
import { MLMetrics, TimeRange, TimeSeries } from '../../../types/analytics';
import { TimeSeriesChart, MetricCard, GaugeChart, BarChart } from '../shared';
import { formatLatency, formatNumber, formatPercentage, TrendIndicator } from '../shared/MetricFormatters';
import { 
  Brain, 
  Target, 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Database 
} from 'lucide-react';
import { subHours, subMinutes } from 'date-fns';

interface MLModelMetricsProps {
  timeRange: TimeRange;
  className?: string;
}

// Mock data generator for ML metrics
const generateMLMetrics = (): MLMetrics => {
  const accuracy = 0.87 + Math.random() * 0.1;
  return {
    modelId: 'context-classifier-v2',
    modelVersion: '2.1.4',
    accuracy: {
      current: accuracy,
      trend: Array.from({ length: 50 }, (_, i) => ({
        timestamp: subMinutes(new Date(), (49 - i) * 5),
        value: accuracy + (Math.random() - 0.5) * 0.05,
      })),
      benchmark: 0.85,
    },
    precision: 0.89 + Math.random() * 0.05,
    recall: 0.84 + Math.random() * 0.08,
    f1Score: 0.86 + Math.random() * 0.06,
    inferenceTime: {
      average: 120 + Math.random() * 40,
      p95: 180 + Math.random() * 60,
      p99: 240 + Math.random() * 80,
      trend: Array.from({ length: 50 }, (_, i) => ({
        timestamp: subMinutes(new Date(), (49 - i) * 5),
        value: 120 + Math.random() * 30,
      })),
    },
    throughput: {
      requestsPerSecond: 25 + Math.random() * 10,
      trend: Array.from({ length: 50 }, (_, i) => ({
        timestamp: subMinutes(new Date(), (49 - i) * 5),
        value: 25 + Math.random() * 8,
      })),
    },
    trainingData: {
      size: 15432,
      lastUpdate: subHours(new Date(), 6),
      quality: 0.92,
    },
    errors: {
      count: Math.floor(Math.random() * 15),
      rate: Math.random() * 0.05,
      types: {
        'timeout': 3,
        'validation_error': 2,
        'model_error': 1,
        'data_error': 1,
      },
    },
  };
};

const generateMultipleModels = (): MLMetrics[] => [
  { ...generateMLMetrics(), modelId: 'context-classifier', modelVersion: '2.1.4' },
  { ...generateMLMetrics(), modelId: 'importance-scorer', modelVersion: '1.8.2' },
  { ...generateMLMetrics(), modelId: 'similarity-detector', modelVersion: '1.5.1' },
  { ...generateMLMetrics(), modelId: 'content-summarizer', modelVersion: '3.0.1' },
];

export const MLModelMetrics: React.FC<MLModelMetricsProps> = ({
  timeRange,
  className = '',
}) => {
  const [selectedModel, setSelectedModel] = useState<string>('context-classifier');
  const [viewMode, setViewMode] = useState<'single' | 'comparison'>('single');
  
  const models = useMemo(() => generateMultipleModels(), []);
  const currentModel = models.find(m => m.modelId === selectedModel) || models[0];

  const accuracyTimeSeries: TimeSeries = {
    name: 'Accuracy',
    data: currentModel.accuracy.trend,
    unit: '%',
    color: '#3B82F6',
  };

  const inferenceTimeSeries: TimeSeries = {
    name: 'Inference Time',
    data: currentModel.inferenceTime.trend,
    unit: 'ms',
    color: '#10B981',
  };

  const throughputTimeSeries: TimeSeries = {
    name: 'Throughput',
    data: currentModel.throughput.trend,
    unit: 'req/s',
    color: '#F59E0B',
  };

  const errorBreakdown = Object.entries(currentModel.errors.types).map(([type, count]) => ({
    label: type.replace('_', ' '),
    value: count,
  }));

  const modelComparison = models.map(model => ({
    name: model.modelId,
    accuracy: model.accuracy.current * 100,
    avgLatency: model.inferenceTime.average,
    throughput: model.throughput.requestsPerSecond,
    errorRate: model.errors.rate * 100,
  }));

  const performanceMetrics = [
    {
      title: 'Model Accuracy',
      value: currentModel.accuracy.current * 100,
      format: 'percentage' as const,
      trend: ((currentModel.accuracy.current - currentModel.accuracy.benchmark) / currentModel.accuracy.benchmark) * 100,
      icon: <Target className="w-6 h-6" />,
      status: currentModel.accuracy.current >= currentModel.accuracy.benchmark ? 'healthy' as const : 'warning' as const,
      description: `vs ${formatPercentage(currentModel.accuracy.benchmark * 100)} benchmark`,
    },
    {
      title: 'Avg Inference Time',
      value: currentModel.inferenceTime.average,
      format: 'latency' as const,
      trend: -8.5, // Mock improvement
      icon: <Clock className="w-6 h-6" />,
      status: currentModel.inferenceTime.average < 200 ? 'healthy' as const : 'warning' as const,
    },
    {
      title: 'Throughput',
      value: currentModel.throughput.requestsPerSecond,
      format: 'throughput' as const,
      trend: 12.3,
      icon: <Zap className="w-6 h-6" />,
      status: 'healthy' as const,
    },
    {
      title: 'Error Rate',
      value: currentModel.errors.rate * 100,
      format: 'percentage' as const,
      trend: -15.2, // Lower is better
      icon: <AlertTriangle className="w-6 h-6" />,
      status: currentModel.errors.rate < 0.05 ? 'healthy' as const : 'critical' as const,
    },
  ];

  const renderSingleModelView = () => (
    <div className="space-y-6">
      {/* Performance metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric) => (
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

      {/* Model info and gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Model Information
            </h4>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              v{currentModel.modelVersion}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Model ID</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {currentModel.modelId}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Training Data</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {formatNumber(currentModel.trainingData.size)} samples
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Data Quality</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {formatPercentage(currentModel.trainingData.quality * 100)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Updated</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {currentModel.trainingData.lastUpdate.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Precision</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatPercentage(currentModel.precision * 100)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Recall</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatPercentage(currentModel.recall * 100)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">F1 Score</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatPercentage(currentModel.f1Score * 100)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Performance Overview
          </h4>
          <div className="space-y-6">
            <div className="flex justify-center">
              <GaugeChart
                value={currentModel.accuracy.current * 100}
                min={0}
                max={100}
                title="Accuracy"
                unit="%"
                thresholds={{ warning: 80, critical: 70 }}
                size={140}
              />
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                {currentModel.accuracy.current >= currentModel.accuracy.benchmark ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentModel.accuracy.current >= currentModel.accuracy.benchmark
                    ? 'Above benchmark'
                    : 'Below benchmark'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Accuracy Trend
          </h4>
          <TimeSeriesChart
            data={[accuracyTimeSeries]}
            height={250}
            formatValue={(value) => formatPercentage(value)}
            showLegend={false}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Inference Performance
          </h4>
          <TimeSeriesChart
            data={[inferenceTimeSeries]}
            height={250}
            formatValue={(value) => formatLatency(value)}
            showLegend={false}
          />
        </div>
      </div>

      {/* Error analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Throughput Trend
          </h4>
          <TimeSeriesChart
            data={[throughputTimeSeries]}
            height={250}
            formatValue={(value) => `${formatNumber(value)} req/s`}
            showLegend={false}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Error Breakdown
          </h4>
          <BarChart
            data={errorBreakdown}
            height={250}
            formatValue={(value) => formatNumber(value)}
            showLegend={false}
            horizontal
          />
        </div>
      </div>
    </div>
  );

  const renderComparisonView = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Model Comparison
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Model</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Accuracy</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Avg Latency</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Throughput</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Error Rate</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
              </tr>
            </thead>
            <tbody>
              {modelComparison.map((model, index) => (
                <tr key={model.name} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/50' : ''}>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    {model.name}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {formatPercentage(model.accuracy)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {formatLatency(model.avgLatency)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {formatNumber(model.throughput)}/s
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {formatPercentage(model.errorRate)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {model.accuracy > 85 && model.errorRate < 5 ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    ) : model.accuracy > 75 ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mx-auto" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500 mx-auto" />
                    )}
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
            Accuracy Comparison
          </h4>
          <BarChart
            data={modelComparison.map(m => ({ label: m.name, value: m.accuracy }))}
            height={300}
            formatValue={(value) => formatPercentage(value)}
            showLegend={false}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Latency Comparison
          </h4>
          <BarChart
            data={modelComparison.map(m => ({ label: m.name, value: m.avgLatency }))}
            height={300}
            formatValue={(value) => formatLatency(value)}
            showLegend={false}
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
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            ML Model Performance
          </h3>
        </div>

        <div className="flex items-center space-x-4">
          {/* View mode toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'single'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Single Model
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

          {/* Model selector */}
          {viewMode === 'single' && (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {models.map((model) => (
                <option key={model.modelId} value={model.modelId}>
                  {model.modelId} (v{model.modelVersion})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'single' ? renderSingleModelView() : renderComparisonView()}
    </div>
  );
};