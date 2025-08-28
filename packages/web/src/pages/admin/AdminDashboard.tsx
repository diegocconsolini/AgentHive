import React from 'react';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  CpuIcon, 
  DatabaseIcon, 
  HardDriveIcon, 
  MemoryStickIcon,
  NetworkIcon,
  RefreshCw,
  ServerIcon,
  ShieldIcon,
  TrendingUpIcon,
  UsersIcon,
  XCircle 
} from 'lucide-react';
import type { SystemDashboard, HealthCheck, Alert as AlertType } from '@/types/admin';
import { useAdminData } from '@/hooks/useAdminData';
import { formatBytes, formatDuration, formatNumber } from '@/lib/utils';

export const AdminDashboard: React.FC = () => {
  const { 
    dashboardData, 
    loading, 
    error, 
    refetch,
    acknowledgeAlert 
  } = useAdminData();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">System Dashboard</h1>
          <div className="animate-spin">
            <RefreshCw className="h-5 w-5" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="card-header pb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
              <div className="card-content">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-200">
              Failed to load dashboard data: {error || 'Unknown error'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warn': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const renderHealthCheck = (check: HealthCheck) => (
    <div key={check.name} className="flex items-center justify-between p-3 border rounded">
      <div className="flex items-center space-x-2">
        {getHealthIcon(check.status)}
        <span className="font-medium">{check.name}</span>
      </div>
      <div className="text-right">
        {check.responseTime && (
          <div className="text-sm text-gray-500">{check.responseTime}ms</div>
        )}
        <div className="text-sm">{check.message}</div>
      </div>
    </div>
  );

  const renderAlert = (alert: AlertType) => (
    <div key={alert.id} className={`alert ${
      alert.level === 'critical' ? 'alert-critical' :
      alert.level === 'warning' ? 'alert-warning' :
      'alert-info'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
              alert.level === 'critical' ? 'badge-critical' :
              alert.level === 'warning' ? 'badge-warning' :
              'badge-info'
            }`}>
              {alert.level}
            </span>
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              {alert.type}
            </span>
          </div>
          <h4 className="font-medium">{alert.title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.message}</p>
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
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Dashboard</h1>
          <p className="text-gray-600">Monitor system health, performance, and activity</p>
        </div>
        <div className="flex space-x-2">
          <button className="btn-outline btn-sm flex items-center" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="card">
          <div className="card-header pb-2">
            <h3 className="text-sm font-medium flex items-center text-gray-900 dark:text-gray-100">
              <ServerIcon className="h-4 w-4 mr-2" />
              System Health
            </h3>
          </div>
          <div className="card-content">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getHealthStatusColor(dashboardData.systemHealth.status)}`}>
                {dashboardData.systemHealth.status}
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {dashboardData.systemHealth.score}%
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Last updated: {new Date(dashboardData.systemHealth.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header pb-2">
            <h3 className="text-sm font-medium flex items-center text-gray-900 dark:text-gray-100">
              <CpuIcon className="h-4 w-4 mr-2" />
              CPU Usage
            </h3>
          </div>
          <div className="card-content">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {dashboardData.performanceMetrics.cpu.usage.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {dashboardData.performanceMetrics.cpu.cores} cores
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${dashboardData.performanceMetrics.cpu.usage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header pb-2">
            <h3 className="text-sm font-medium flex items-center text-gray-900 dark:text-gray-100">
              <MemoryStickIcon className="h-4 w-4 mr-2" />
              Memory Usage
            </h3>
          </div>
          <div className="card-content">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {dashboardData.performanceMetrics.memory.percentage.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatBytes(dashboardData.performanceMetrics.memory.used)} / {formatBytes(dashboardData.performanceMetrics.memory.total)}
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${dashboardData.performanceMetrics.memory.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-medium flex items-center text-gray-900 dark:text-gray-100">
              <HardDriveIcon className="h-4 w-4 mr-2" />
              Disk Usage
            </h3>
          </div>
          <div className="card-content">
            <div className="text-2xl font-bold">
              {dashboardData.performanceMetrics.disk.percentage.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">
              {formatBytes(dashboardData.performanceMetrics.disk.used)} / {formatBytes(dashboardData.performanceMetrics.disk.total)}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{ width: `${dashboardData.performanceMetrics.disk.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Utilization */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-medium flex items-center text-gray-900 dark:text-gray-100">
              <Activity className="h-4 w-4 mr-2" />
              Active Agents
            </h3>
          </div>
          <div className="card-content">
            <div className="text-2xl font-bold">
              {dashboardData.resourceUtilization.agents.active}
            </div>
            <p className="text-xs text-gray-500">
              of {dashboardData.resourceUtilization.agents.total} total
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Avg Response Time</span>
                <span>{dashboardData.resourceUtilization.agents.averageResponseTime}ms</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Error Rate</span>
                <span className={dashboardData.resourceUtilization.agents.errorRate > 5 ? 'text-red-600' : 'text-green-600'}>
                  {dashboardData.resourceUtilization.agents.errorRate.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-medium flex items-center text-gray-900 dark:text-gray-100">
              <DatabaseIcon className="h-4 w-4 mr-2" />
              Contexts
            </h3>
          </div>
          <div className="card-content">
            <div className="text-2xl font-bold">
              {formatNumber(dashboardData.resourceUtilization.contexts.total)}
            </div>
            <p className="text-xs text-gray-500">
              Avg size: {formatBytes(dashboardData.resourceUtilization.contexts.averageSize)}
            </p>
            <div className="flex items-center mt-2">
              <TrendingUpIcon className="h-3 w-3 mr-1 text-green-600" />
              <span className="text-xs text-green-600">
                {dashboardData.resourceUtilization.contexts.growthRate.toFixed(1)}% growth
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-medium flex items-center text-gray-900 dark:text-gray-100">
              <UsersIcon className="h-4 w-4 mr-2" />
              Active Users
            </h3>
          </div>
          <div className="card-content">
            <div className="text-2xl font-bold">
              {dashboardData.resourceUtilization.users.active}
            </div>
            <p className="text-xs text-gray-500">
              of {dashboardData.resourceUtilization.users.total} total
            </p>
            <div className="flex items-center mt-2">
              <NetworkIcon className="h-3 w-3 mr-1 text-blue-600" />
              <span className="text-xs text-blue-600">
                {dashboardData.resourceUtilization.users.sessionCount} active sessions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Checks */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
            <ShieldIcon className="h-5 w-5 mr-2" />
            System Health Checks
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Detailed health status for all system components
          </p>
        </div>
        <div className="card-content">
          <div className="space-y-2">
            {dashboardData.systemHealth.checks.map(renderHealthCheck)}
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {dashboardData.alerts.filter(alert => alert.isActive).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
              <AlertCircle className="h-5 w-5 mr-2" />
              Active Alerts ({dashboardData.alerts.filter(alert => alert.isActive).length})
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              System alerts requiring attention
            </p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {dashboardData.alerts
                .filter(alert => alert.isActive)
                .slice(0, 5)
                .map(renderAlert)}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
            <Activity className="h-5 w-5 mr-2" />
            Recent Activity
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Latest system events and user activities
          </p>
        </div>
        <div className="card-content">
          <div className="space-y-3">
            {dashboardData.recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  activity.severity === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
                  activity.severity === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' : 
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
                }`}>
                  {activity.type}
                </span>
                <div className="flex-1">
                  <h4 className="font-medium">{activity.title}</h4>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                    <span>{new Date(activity.timestamp).toLocaleString()}</span>
                    {activity.user && <span>by {activity.user.name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};