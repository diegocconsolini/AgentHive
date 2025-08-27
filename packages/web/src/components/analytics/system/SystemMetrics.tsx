import React, { useMemo, useState } from 'react';
import { SystemMetrics as ISystemMetrics, TimeRange, TimeSeries } from '../../../types/analytics';
import { TimeSeriesChart, GaugeChart, formatBytes, formatPercentage } from '../shared';
import { Cpu, MemoryStick, HardDrive, Network, TrendingUp } from 'lucide-react';
import { subMinutes } from 'date-fns';

interface SystemMetricsProps {
  metrics: ISystemMetrics;
  timeRange: TimeRange;
  className?: string;
}

// Generate mock historical data for charts
const generateHistoricalData = (currentValue: number, points: number = 50): TimeSeries => {
  const data = [];
  const now = new Date();
  
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = subMinutes(now, i * 2); // Every 2 minutes
    // Generate realistic variations around the current value
    const variation = (Math.random() - 0.5) * 0.3 * currentValue;
    const value = Math.max(0, Math.min(100, currentValue + variation));
    data.push({ timestamp, value });
  }
  
  return {
    name: 'Usage',
    data,
    unit: '%',
    color: '#3B82F6',
  };
};

const generateNetworkData = (incoming: number, outgoing: number): TimeSeries[] => {
  const data = [];
  const now = new Date();
  
  for (let i = 49; i >= 0; i--) {
    const timestamp = subMinutes(now, i * 2);
    data.push({
      timestamp,
      incoming: incoming + (Math.random() - 0.5) * incoming * 0.4,
      outgoing: outgoing + (Math.random() - 0.5) * outgoing * 0.4,
    });
  }
  
  return [
    {
      name: 'Incoming',
      data: data.map(d => ({ timestamp: d.timestamp, value: d.incoming / 1024 / 1024 })), // Convert to MB/s
      unit: 'MB/s',
      color: '#10B981',
    },
    {
      name: 'Outgoing',
      data: data.map(d => ({ timestamp: d.timestamp, value: d.outgoing / 1024 / 1024 })), // Convert to MB/s
      unit: 'MB/s',
      color: '#F59E0B',
    },
  ];
};

export const SystemMetrics: React.FC<SystemMetricsProps> = ({
  metrics,
  timeRange,
  className = '',
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'cpu' | 'memory' | 'disk' | 'network'>('cpu');

  const cpuData = useMemo(() => generateHistoricalData(metrics.cpu.usage), [metrics.cpu.usage]);
  const memoryData = useMemo(() => generateHistoricalData(metrics.memory.percentage), [metrics.memory.percentage]);
  const diskData = useMemo(() => generateHistoricalData(metrics.disk.percentage), [metrics.disk.percentage]);
  const networkData = useMemo(() => generateNetworkData(metrics.network.incoming, metrics.network.outgoing), [metrics.network]);

  const metricTabs = [
    {
      id: 'cpu' as const,
      label: 'CPU',
      icon: <Cpu className="w-4 h-4" />,
      color: 'blue',
    },
    {
      id: 'memory' as const,
      label: 'Memory',
      icon: <MemoryStick className="w-4 h-4" />,
      color: 'green',
    },
    {
      id: 'disk' as const,
      label: 'Disk',
      icon: <HardDrive className="w-4 h-4" />,
      color: 'purple',
    },
    {
      id: 'network' as const,
      label: 'Network',
      icon: <Network className="w-4 h-4" />,
      color: 'yellow',
    },
  ];

  const renderMetricContent = () => {
    switch (selectedMetric) {
      case 'cpu':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                  CPU Usage Over Time
                </h4>
                <TimeSeriesChart
                  data={[cpuData]}
                  height={200}
                  formatValue={(value) => formatPercentage(value)}
                  showLegend={false}
                />
              </div>
              <div className="flex justify-center">
                <GaugeChart
                  value={metrics.cpu.usage}
                  min={0}
                  max={100}
                  title="Current CPU Usage"
                  unit="%"
                  thresholds={{ warning: 70, critical: 90 }}
                  size={180}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Cores</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.cpu.cores}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Load (1m)</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.cpu.load[0].toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Load (5m)</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.cpu.load[1].toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Load (15m)</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.cpu.load[2].toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        );

      case 'memory':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Memory Usage Over Time
                </h4>
                <TimeSeriesChart
                  data={[memoryData]}
                  height={200}
                  formatValue={(value) => formatPercentage(value)}
                  showLegend={false}
                />
              </div>
              <div className="flex justify-center">
                <GaugeChart
                  value={metrics.memory.percentage}
                  min={0}
                  max={100}
                  title="Memory Usage"
                  unit="%"
                  thresholds={{ warning: 75, critical: 90 }}
                  size={180}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatBytes(metrics.memory.total)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Used</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatBytes(metrics.memory.used)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Available</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatBytes(metrics.memory.available)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Usage</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatPercentage(metrics.memory.percentage)}
                </div>
              </div>
            </div>
          </div>
        );

      case 'disk':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Disk Usage Over Time
                </h4>
                <TimeSeriesChart
                  data={[diskData]}
                  height={200}
                  formatValue={(value) => formatPercentage(value)}
                  showLegend={false}
                />
              </div>
              <div className="flex justify-center">
                <GaugeChart
                  value={metrics.disk.percentage}
                  min={0}
                  max={100}
                  title="Disk Usage"
                  unit="%"
                  thresholds={{ warning: 80, critical: 95 }}
                  size={180}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatBytes(metrics.disk.total)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Used</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatBytes(metrics.disk.used)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Available</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatBytes(metrics.disk.available)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Usage</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatPercentage(metrics.disk.percentage)}
                </div>
              </div>
            </div>
          </div>
        );

      case 'network':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                Network Traffic Over Time
              </h4>
              <TimeSeriesChart
                data={networkData}
                height={250}
                formatValue={(value) => `${value.toFixed(2)} MB/s`}
                showLegend={true}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Incoming Traffic</div>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatBytes(metrics.network.incoming)}/s
                </div>
                <div className="flex items-center text-sm text-green-600 dark:text-green-400 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% vs last hour
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Outgoing Traffic</div>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatBytes(metrics.network.outgoing)}/s
                </div>
                <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8% vs last hour
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          System Metrics
        </h3>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Last updated: {metrics.timestamp.toLocaleTimeString()}
        </div>
      </div>

      {/* Metric tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {metricTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedMetric(tab.id)}
              className={`
                flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${selectedMetric === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Metric content */}
      {renderMetricContent()}
    </div>
  );
};