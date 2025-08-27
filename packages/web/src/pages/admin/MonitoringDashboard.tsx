import React, { useState, useEffect } from 'react';
import { 
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  CpuIcon,
  DatabaseIcon,
  HardDriveIcon,
  MemoryStickIcon,
  NetworkIcon,
  RefreshCw,
  ServerIcon,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
  Eye,
  Settings,
  Download,
  Bell,
  LineChart
} from 'lucide-react';
import type { PerformanceMetrics, Alert as AlertType, SystemHealth } from '@/types/admin';
import { useMonitoring } from '@/hooks/useMonitoring';
import { formatBytes, formatNumber } from '@/lib/utils';

// Mock chart component - in a real implementation, use recharts or similar
const MetricChart: React.FC<{ 
  data: any[]; 
  title: string; 
  color: string;
  unit?: string;
}> = ({ title, color, unit = '' }) => (
  <div className="h-32 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800">
    <div className="text-center text-gray-500 dark:text-gray-400">
      <LineChart className="h-8 w-8 mx-auto mb-2" />
      <div className="text-sm">{title} Chart</div>
      <div className="text-xs">Chart placeholder</div>
    </div>
  </div>
);

export const MonitoringDashboard: React.FC = () => {
  const {
    metrics,
    alerts,
    systemHealth,
    historicalData,
    loading,
    error,
    timeRange,
    setTimeRange,
    refreshData,
    acknowledgeAlert,
    createAlert,
    getMetricHistory
  } = useMonitoring();

  const [selectedMetric, setSelectedMetric] = useState('cpu');
  const [alertsFilter, setAlertsFilter] = useState<'all' | 'active' | 'acknowledged'>('active');
  const [activeTab, setActiveTab] = useState('overview');

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 dark:text-green-200 dark:bg-green-900/50';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900/50';
      case 'critical': return 'text-red-600 bg-red-100 dark:text-red-200 dark:bg-red-900/50';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-900/50';
    }
  };

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info': return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default: return <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const renderSystemOverview = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="card">
        <div className="card-content p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ServerIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{systemHealth?.score || 0}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">System Health</div>
              </div>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthStatusColor(systemHealth?.status || 'unknown')}`}>
              {systemHealth?.status || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-content p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CpuIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics?.cpu.usage.toFixed(1) || 0}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">CPU Usage</div>
              </div>
            </div>
            {getTrendIcon('stable')}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-content p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MemoryStickIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics?.memory.percentage.toFixed(1) || 0}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Memory Usage</div>
              </div>
            </div>
            {getTrendIcon('up')}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-content p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {alerts?.filter(a => a.isActive).length || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Active Alerts</div>
              </div>
            </div>
            {alerts?.some(a => a.level === 'critical') && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                Critical
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceCharts = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center justify-between text-gray-900 dark:text-gray-100">
            <div className="flex items-center">
              <CpuIcon className="h-5 w-5 mr-2" />
              CPU Performance
            </div>
            <select
              className="w-32 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </h3>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics?.cpu.usage.toFixed(1)}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Current</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics?.cpu.cores}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Cores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics?.cpu.loadAverage[0].toFixed(2)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Load Avg</div>
              </div>
            </div>
            <MetricChart 
              data={historicalData?.cpu || []} 
              title="CPU Usage Over Time"
              color="#3B82F6"
              unit="%"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
            <MemoryStickIcon className="h-5 w-5 mr-2" />
            Memory Performance
          </h3>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics?.memory.percentage.toFixed(1)}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Usage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatBytes(metrics?.memory.used || 0)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatBytes(metrics?.memory.available || 0)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Available</div>
              </div>
            </div>
            <MetricChart 
              data={historicalData?.memory || []} 
              title="Memory Usage Over Time"
              color="#8B5CF6"
              unit="%"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
            <HardDriveIcon className="h-5 w-5 mr-2" />
            Disk Performance
          </h3>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics?.disk.percentage.toFixed(1)}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Usage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatBytes(metrics?.disk.used || 0)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatBytes(metrics?.disk.total || 0)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              </div>
            </div>
            <MetricChart 
              data={historicalData?.disk || []} 
              title="Disk Usage Over Time"
              color="#EF4444"
              unit="%"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
            <NetworkIcon className="h-5 w-5 mr-2" />
            Network Performance
          </h3>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatBytes(metrics?.network.inbound || 0)}/s</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Inbound</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatBytes(metrics?.network.outbound || 0)}/s</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Outbound</div>
              </div>
            </div>
            <MetricChart 
              data={historicalData?.network || []} 
              title="Network Traffic Over Time"
              color="#10B981"
              unit="MB/s"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderApplicationMetrics = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
            <DatabaseIcon className="h-5 w-5 mr-2" />
            Database Performance
          </h3>
        </div>
        <div className="card-content">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Connections</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics?.database.connections}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Query Time</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics?.database.queryTime}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Queries/min</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(metrics?.database.queryCount || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
            <Activity className="h-5 w-5 mr-2" />
            Agent Performance
          </h3>
        </div>
        <div className="card-content">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Agents</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">12</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Response Time</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">145ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Success Rate</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">98.5%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
            <Users className="h-5 w-5 mr-2" />
            User Activity
          </h3>
        </div>
        <div className="card-content">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Users</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">23</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Sessions</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">31</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Requests/min</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">1,247</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlertsPanel = () => {
    const filteredAlerts = alerts?.filter(alert => {
      switch (alertsFilter) {
        case 'active':
          return alert.isActive;
        case 'acknowledged':
          return !alert.isActive && alert.acknowledgedAt;
        default:
          return true;
      }
    }) || [];

    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
                <Bell className="h-5 w-5 mr-2" />
                System Alerts ({filteredAlerts.length})
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <select
                className="w-32 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={alertsFilter}
                onChange={(e) => setAlertsFilter(e.target.value as any)}
              >
                <option value="all">All Alerts</option>
                <option value="active">Active</option>
                <option value="acknowledged">Acknowledged</option>
              </select>
              <button className="btn-outline btn-sm" onClick={() => createAlert({})}>
                Create Alert
              </button>
            </div>
          </div>
        </div>
        <div className="card-content">
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 border rounded-lg ${getAlertLevelColor(alert.level)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        alert.level === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
                        alert.level === 'warning' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                      }`}>
                        {alert.level}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">{alert.type}</span>
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{alert.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.message}</p>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {alert.isActive && (
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredAlerts.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">No alerts</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {alertsFilter === 'active' ? 'No active alerts at this time.' : 'No alerts match the current filter.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-200">
              Failed to load monitoring data: {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">System Monitoring</h1>
          <p className="text-gray-600 dark:text-gray-400">Real-time system performance and health monitoring</p>
        </div>
        <div className="flex space-x-2">
          <button className="btn-outline" onClick={() => {/* Export data */}}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
          <button className="btn-outline" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => {/* Configure alerts */}}>
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </button>
        </div>
      </div>

      {/* System Overview */}
      {renderSystemOverview()}

      {/* Main Content Tabs */}
      <div>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              type="button"
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'performance'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('performance')}
            >
              Performance
            </button>
            <button
              type="button"
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'application'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('application')}
            >
              Application
            </button>
            <button
              type="button"
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('alerts')}
            >
              Alerts
            </button>
          </nav>
        </div>

        {activeTab === 'performance' && (
        <div className="space-y-6 mt-6">
          {renderPerformanceCharts()}
        </div>
        )}

        {activeTab === 'application' && (
        <div className="space-y-6 mt-6">
          {renderApplicationMetrics()}
        </div>
        )}

        {activeTab === 'alerts' && (
        <div className="space-y-6 mt-6">
          {renderAlertsPanel()}
        </div>
        )}
      </div>
    </div>
  );
};