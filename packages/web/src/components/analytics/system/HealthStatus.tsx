import React from 'react';
import { SystemHealth, ServiceStatus } from '../../../types/analytics';
import { StatusIndicator, formatDuration, formatLatency } from '../shared';
import { CheckCircle, AlertTriangle, XCircle, Clock, Activity, Server } from 'lucide-react';

interface HealthStatusProps {
  health: SystemHealth;
  className?: string;
  showDetails?: boolean;
}

export const HealthStatus: React.FC<HealthStatusProps> = ({
  health,
  className = '',
  showDetails = true,
}) => {
  const getStatusIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getServiceStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'degraded':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'offline':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const overallStatusText = {
    healthy: 'All Systems Operational',
    warning: 'Some Issues Detected',
    critical: 'Critical Issues Present',
    unknown: 'Status Unknown',
  };

  const healthyServices = health.services.filter(s => s.status === 'online').length;
  const totalServices = health.services.length;
  const healthPercentage = (healthyServices / totalServices) * 100;

  return (
    <div className={`p-6 ${className}`}>
      {/* Overall Status Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {getStatusIcon(health.status)}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              System Health
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {overallStatusText[health.status]}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {healthPercentage.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Services Online
          </div>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatDuration(health.uptime)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Since last restart
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Server className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Services</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {healthyServices}/{totalServices}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Online services
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Check</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {health.lastChecked.toLocaleTimeString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Health monitoring
          </div>
        </div>
      </div>

      {/* Service Details */}
      {showDetails && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Service Status Details
          </h4>
          <div className="space-y-3">
            {health.services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <StatusIndicator 
                    status={service.status === 'online' ? 'healthy' : service.status === 'degraded' ? 'warning' : 'critical'} 
                    size="md"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {service.name}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        Last check: {service.lastCheck.toLocaleTimeString()}
                      </span>
                      {service.responseTime && (
                        <span>
                          Response: {formatLatency(service.responseTime)}
                        </span>
                      )}
                      {service.errorCount > 0 && (
                        <span className="text-red-500 dark:text-red-400">
                          {service.errorCount} errors
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${getServiceStatusColor(service.status)}
                  `}>
                    {service.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          System health is monitored continuously. 
          {health.status === 'healthy' && ' All services are operating normally.'}
          {health.status === 'warning' && ' Some services may be experiencing issues.'}
          {health.status === 'critical' && ' Critical services are offline or degraded.'}
        </div>
      </div>
    </div>
  );
};