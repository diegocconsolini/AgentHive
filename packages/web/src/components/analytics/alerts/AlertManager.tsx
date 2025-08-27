import React, { useState, useMemo } from 'react';
import { AlertRule, Alert, AnomalyDetection, TimeRange } from '../../../types/analytics';
import { MetricCard, TimeSeriesChart, StatusIndicator } from '../shared';
import { formatNumber, formatLatency, formatPercentage, formatTimestamp } from '../shared/MetricFormatters';
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Settings,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Mail,
  Zap
} from 'lucide-react';
import { subDays, subHours, subMinutes } from 'date-fns';

interface AlertManagerProps {
  timeRange: TimeRange;
  className?: string;
}

// Mock data generators
const generateAlertRules = (): AlertRule[] => [
  {
    id: 'cpu-high',
    name: 'High CPU Usage',
    description: 'Alert when CPU usage exceeds 80% for more than 5 minutes',
    metric: 'cpu_usage',
    condition: {
      operator: 'gt',
      threshold: 80,
      duration: 300,
    },
    severity: 'warning',
    enabled: true,
    notifications: {
      email: ['admin@company.com', 'devops@company.com'],
      webhook: ['https://hooks.slack.com/services/...'],
    },
    createdAt: subDays(new Date(), 30),
    updatedAt: subDays(new Date(), 5),
  },
  {
    id: 'memory-critical',
    name: 'Critical Memory Usage',
    description: 'Alert when memory usage exceeds 90%',
    metric: 'memory_usage',
    condition: {
      operator: 'gt',
      threshold: 90,
    },
    severity: 'critical',
    enabled: true,
    notifications: {
      email: ['admin@company.com'],
      webhook: ['https://hooks.slack.com/services/...'],
    },
    createdAt: subDays(new Date(), 15),
    updatedAt: subDays(new Date(), 2),
  },
  {
    id: 'response-time-slow',
    name: 'Slow Response Time',
    description: 'Alert when average response time exceeds 2 seconds',
    metric: 'response_time',
    condition: {
      operator: 'gt',
      threshold: 2000,
      duration: 180,
    },
    severity: 'warning',
    enabled: true,
    notifications: {
      email: ['performance@company.com'],
    },
    createdAt: subDays(new Date(), 10),
    updatedAt: subDays(new Date(), 1),
  },
  {
    id: 'error-rate-high',
    name: 'High Error Rate',
    description: 'Alert when error rate exceeds 5%',
    metric: 'error_rate',
    condition: {
      operator: 'gt',
      threshold: 5,
      duration: 120,
    },
    severity: 'critical',
    enabled: false,
    notifications: {
      email: ['engineering@company.com'],
      webhook: ['https://hooks.pagerduty.com/...'],
    },
    createdAt: subDays(new Date(), 7),
    updatedAt: new Date(),
  },
];

const generateActiveAlerts = (): Alert[] => [
  {
    id: 'alert-001',
    ruleId: 'cpu-high',
    ruleName: 'High CPU Usage',
    severity: 'warning',
    message: 'CPU usage has been above 80% for 6 minutes',
    value: 85.3,
    threshold: 80,
    triggeredAt: subMinutes(new Date(), 12),
    status: 'active',
    metadata: {
      host: 'server-01',
      service: 'web-app',
    },
  },
  {
    id: 'alert-002',
    ruleId: 'response-time-slow',
    ruleName: 'Slow Response Time',
    severity: 'warning',
    message: 'Average response time exceeded 2 seconds',
    value: 2.3,
    threshold: 2.0,
    triggeredAt: subMinutes(new Date(), 8),
    resolvedAt: subMinutes(new Date(), 2),
    status: 'resolved',
    metadata: {
      endpoint: '/api/memories',
      region: 'us-east-1',
    },
  },
  {
    id: 'alert-003',
    ruleId: 'memory-critical',
    ruleName: 'Critical Memory Usage',
    severity: 'critical',
    message: 'Memory usage reached critical levels',
    value: 92.1,
    threshold: 90,
    triggeredAt: subMinutes(new Date(), 45),
    status: 'active',
    metadata: {
      host: 'db-server-02',
      service: 'postgresql',
    },
  },
];

const generateAnomalyDetection = (): AnomalyDetection[] => [
  {
    metric: 'api_requests',
    detected: true,
    confidence: 0.87,
    expectedRange: [150, 250],
    actualValue: 89,
    severity: 'medium',
    description: 'API request volume is significantly lower than expected',
    recommendations: ['Check for service outages', 'Review traffic routing', 'Monitor user activity'],
  },
  {
    metric: 'memory_growth',
    detected: true,
    confidence: 0.94,
    expectedRange: [2, 5],
    actualValue: 12,
    severity: 'high',
    description: 'Memory growth rate is abnormally high',
    recommendations: ['Check for memory leaks', 'Review recent deployments', 'Monitor garbage collection'],
  },
  {
    metric: 'agent_response_time',
    detected: true,
    confidence: 0.76,
    expectedRange: [800, 1200],
    actualValue: 1850,
    severity: 'medium',
    description: 'Agent response times are higher than usual',
    recommendations: ['Check agent resource allocation', 'Review model performance', 'Monitor queue lengths'],
  },
];

export const AlertManager: React.FC<AlertManagerProps> = ({
  timeRange,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'overview' | 'rules' | 'history' | 'anomalies'>('overview');
  const [alertRules] = useState<AlertRule[]>(generateAlertRules());
  const [activeAlerts] = useState<Alert[]>(generateActiveAlerts());
  const [anomalies] = useState<AnomalyDetection[]>(generateAnomalyDetection());
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);

  // Calculate alert statistics
  const alertStats = useMemo(() => {
    const totalRules = alertRules.length;
    const enabledRules = alertRules.filter(r => r.enabled).length;
    const totalActiveAlerts = activeAlerts.filter(a => a.status === 'active').length;
    const criticalAlerts = activeAlerts.filter(a => a.status === 'active' && a.severity === 'critical').length;
    const detectedAnomalies = anomalies.filter(a => a.detected).length;

    return [
      {
        title: 'Alert Rules',
        value: enabledRules,
        format: 'number' as const,
        trend: 0,
        icon: <Settings className="w-6 h-6" />,
        status: 'healthy' as const,
        description: `${totalRules} total rules`,
      },
      {
        title: 'Active Alerts',
        value: totalActiveAlerts,
        format: 'number' as const,
        trend: -25.6,
        icon: <AlertTriangle className="w-6 h-6" />,
        status: criticalAlerts > 0 ? 'critical' as const : totalActiveAlerts > 0 ? 'warning' as const : 'healthy' as const,
        description: `${criticalAlerts} critical`,
      },
      {
        title: 'Anomalies Detected',
        value: detectedAnomalies,
        format: 'number' as const,
        trend: 12.5,
        icon: <Zap className="w-6 h-6" />,
        status: detectedAnomalies > 2 ? 'warning' as const : 'healthy' as const,
      },
      {
        title: 'Resolved (24h)',
        value: activeAlerts.filter(a => a.status === 'resolved').length,
        format: 'number' as const,
        trend: 15.3,
        icon: <CheckCircle className="w-6 h-6" />,
        status: 'healthy' as const,
      },
    ];
  }, [alertRules, activeAlerts, anomalies]);

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: Alert['status']) => {
    switch (status) {
      case 'active':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'silenced':
        return <EyeOff className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Alert statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {alertStats.map((stat) => (
          <MetricCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            format={stat.format}
            trend={stat.trend}
            icon={stat.icon}
            status={stat.status}
            description={stat.description}
          />
        ))}
      </div>

      {/* Active alerts */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Active Alerts
          </h4>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {activeAlerts.filter(a => a.status === 'active').map((alert) => (
            <div key={alert.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(alert.status)}
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">
                      {alert.ruleName}
                    </h5>
                    <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${getSeverityColor(alert.severity)}
                    `}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {alert.message}
                  </p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Value:</span> {formatNumber(alert.value)}
                    </div>
                    <div>
                      <span className="font-medium">Threshold:</span> {formatNumber(alert.threshold)}
                    </div>
                    <div>
                      <span className="font-medium">Triggered:</span> {formatTimestamp(alert.triggeredAt)}
                    </div>
                    {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                      <div className="flex items-center space-x-2">
                        {Object.entries(alert.metadata).map(([key, value]) => (
                          <span key={key} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => {/* Acknowledge alert */}}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Acknowledge"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {/* Silence alert */}}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Silence"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {activeAlerts.filter(a => a.status === 'active').length === 0 && (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Active Alerts
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                All systems are operating normally.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent anomalies */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Recent Anomalies
        </h4>
        <div className="space-y-4">
          {anomalies.filter(a => a.detected).map((anomaly, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {anomaly.metric.replace('_', ' ')}
                    </span>
                    <span className={`
                      inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${anomaly.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                        anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                      }
                    `}>
                      {formatPercentage(anomaly.confidence * 100)} confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {anomaly.description}
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Expected:</span> {anomaly.expectedRange[0]} - {anomaly.expectedRange[1]}{' '}
                    <span className="font-medium ml-4">Actual:</span> {anomaly.actualValue}
                  </div>
                  {anomaly.recommendations && (
                    <div className="mt-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Recommended Actions:
                      </div>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                        {anomaly.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRules = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Alert Rules
            </h4>
            <button
              onClick={() => {/* Create new rule */}}
              className="btn btn-primary btn-sm inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {alertRules.map((rule) => (
            <div key={rule.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">
                      {rule.name}
                    </h5>
                    <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${getSeverityColor(rule.severity)}
                    `}>
                      {rule.severity}
                    </span>
                    <StatusIndicator
                      status={rule.enabled ? 'healthy' : 'offline'}
                      showLabel
                      size="sm"
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {rule.description}
                  </p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Metric:</span> {rule.metric}
                    </div>
                    <div>
                      <span className="font-medium">Condition:</span> {rule.condition.operator} {rule.condition.threshold}
                      {rule.condition.duration && (
                        <span> for {rule.condition.duration}s</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>{rule.notifications.email?.length || 0} recipients</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedRule(rule)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Edit Rule"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {/* Toggle rule */}}
                    className={`p-2 ${rule.enabled ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    title={rule.enabled ? 'Disable Rule' : 'Enable Rule'}
                  >
                    {rule.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {/* Delete rule */}}
                    className="p-2 text-red-400 hover:text-red-600"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${className}`}>
      {/* Header with view mode toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Alert Management
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
            onClick={() => setViewMode('rules')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'rules'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Rules
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'history'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setViewMode('anomalies')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'anomalies'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Anomalies
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'overview' && renderOverview()}
      {viewMode === 'rules' && renderRules()}
      {viewMode === 'history' && (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Alert History
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Historical alert data and resolution tracking coming soon...
          </p>
        </div>
      )}
      {viewMode === 'anomalies' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Anomaly Detection
          </h4>
          <div className="space-y-4">
            {anomalies.map((anomaly, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100">
                    {anomaly.metric.replace('_', ' ')}
                  </h5>
                  <div className="flex items-center space-x-2">
                    <span className={`
                      inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${anomaly.detected 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                      }
                    `}>
                      {anomaly.detected ? 'Detected' : 'Normal'}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatPercentage(anomaly.confidence * 100)} confidence
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {anomaly.description}
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Expected Range:</span>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {anomaly.expectedRange[0]} - {anomaly.expectedRange[1]}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Actual Value:</span>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {anomaly.actualValue}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Severity:</span>
                    <div className={`font-medium capitalize ${
                      anomaly.severity === 'high' ? 'text-red-600 dark:text-red-400' :
                      anomaly.severity === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`}>
                      {anomaly.severity}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};