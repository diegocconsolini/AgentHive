import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Activity, Server, Database, Cpu, MemoryStick, HardDrive, AlertTriangle, CheckCircle } from 'lucide-react';
import { TimeRange, SystemMetrics, SystemHealth, RealtimeMessage } from '../../../types/analytics';
import { TimeRangeSelector, MetricCard, StatusIndicator } from '../shared';
import { SystemMetrics as SystemMetricsComponent } from '../system/SystemMetrics';
import { HealthStatus } from '../system/HealthStatus';
import { subDays } from 'date-fns';

interface AnalyticsDashboardProps {
  className?: string;
}

const GET_ANALYTICS_OVERVIEW = gql`
  query GetAnalyticsOverview {
    analyticsOverview {
      totalUsers
      totalMemories
      totalContexts
      totalAgents
      activeUsers
      memoryGrowth {
        date
        value
      }
      contextGrowth {
        date
        value
      }
      agentUsage {
        agentName
        usageCount
        rating
      }
    }
  }
`;

// Mock data generators for development
const generateMockSystemMetrics = (): SystemMetrics => ({
  timestamp: new Date(),
  cpu: {
    usage: 20 + Math.random() * 40,
    cores: 8,
    load: [
      Math.random() * 2,
      Math.random() * 2,
      Math.random() * 2,
    ] as [number, number, number],
  },
  memory: {
    used: 2.1e9 + Math.random() * 1e9,
    total: 4e9,
    percentage: 45 + Math.random() * 20,
    available: 1.9e9 - Math.random() * 5e8,
  },
  disk: {
    used: 45e9 + Math.random() * 10e9,
    total: 100e9,
    percentage: 45 + Math.random() * 10,
    available: 55e9 - Math.random() * 10e9,
  },
  network: {
    incoming: Math.random() * 1000000,
    outgoing: Math.random() * 1000000,
  },
});

const generateMockSystemHealth = (): SystemHealth => ({
  status: Math.random() > 0.8 ? 'warning' : 'healthy',
  uptime: 86400 * 7 + Math.random() * 86400,
  lastChecked: new Date(),
  services: [
    {
      name: 'API Gateway',
      status: Math.random() > 0.9 ? 'degraded' : 'online',
      responseTime: 150 + Math.random() * 200,
      lastCheck: new Date(),
      errorCount: Math.floor(Math.random() * 5),
    },
    {
      name: 'Memory Store',
      status: 'online',
      responseTime: 50 + Math.random() * 100,
      lastCheck: new Date(),
      errorCount: 0,
    },
    {
      name: 'ML Pipeline',
      status: Math.random() > 0.95 ? 'offline' : 'online',
      responseTime: 300 + Math.random() * 500,
      lastCheck: new Date(),
      errorCount: Math.floor(Math.random() * 2),
    },
    {
      name: 'Agent Manager',
      status: 'online',
      responseTime: 100 + Math.random() * 150,
      lastCheck: new Date(),
      errorCount: 0,
    },
    {
      name: 'Context Index',
      status: Math.random() > 0.92 ? 'degraded' : 'online',
      responseTime: 80 + Math.random() * 120,
      lastCheck: new Date(),
      errorCount: Math.floor(Math.random() * 3),
    },
  ],
});

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className = '',
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: subDays(new Date(), 1),
    end: new Date(),
    preset: '24h',
  });
  
  // Real GraphQL data
  const { data: analyticsData, loading, error, refetch } = useQuery(GET_ANALYTICS_OVERVIEW, {
    errorPolicy: 'all',
    pollInterval: 30000, // Poll every 30 seconds for real-time updates
  });
  
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>(generateMockSystemMetrics());
  const [systemHealth, setSystemHealth] = useState<SystemHealth>(generateMockSystemHealth());
  const [isConnected, setIsConnected] = useState(true); // Always connected to GraphQL

  // Simulate WebSocket connection and real-time updates
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let websocket: WebSocket | null = null;

    const connectWebSocket = () => {
      try {
        // In a real implementation, this would connect to actual WebSocket
        // websocket = new WebSocket('ws://localhost:4000/analytics');
        setIsConnected(true);
        
        // Simulate real-time updates with interval
        if (isAutoRefresh) {
          interval = setInterval(() => {
            setSystemMetrics(generateMockSystemMetrics());
            setSystemHealth(generateMockSystemHealth());
            setLastUpdated(new Date());
          }, refreshInterval);
        }
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (interval) clearInterval(interval);
      if (websocket) websocket.close();
    };
  }, [isAutoRefresh, refreshInterval]);

  const handleTimeRangeChange = useCallback((newTimeRange: TimeRange) => {
    setTimeRange(newTimeRange);
    // In a real implementation, this would trigger data refetch
  }, []);

  const handleRefreshIntervalChange = useCallback((newInterval: number) => {
    setRefreshInterval(newInterval);
  }, []);

  const handleToggleAutoRefresh = useCallback((enabled: boolean) => {
    setIsAutoRefresh(enabled);
  }, []);

  const overviewStats = useMemo(() => [
    {
      title: 'CPU Usage',
      value: systemMetrics.cpu.usage,
      format: 'percentage' as const,
      trend: Math.random() > 0.5 ? 2.3 : -1.8,
      icon: <Cpu className="w-6 h-6" />,
      status: systemMetrics.cpu.usage > 80 ? 'critical' as const : systemMetrics.cpu.usage > 60 ? 'warning' as const : 'healthy' as const,
    },
    {
      title: 'Memory Usage',
      value: systemMetrics.memory.percentage,
      format: 'percentage' as const,
      trend: Math.random() > 0.5 ? 1.2 : -0.5,
      icon: <MemoryStick className="w-6 h-6" />,
      status: systemMetrics.memory.percentage > 85 ? 'critical' as const : systemMetrics.memory.percentage > 70 ? 'warning' as const : 'healthy' as const,
    },
    {
      title: 'Disk Usage',
      value: systemMetrics.disk.percentage,
      format: 'percentage' as const,
      trend: Math.random() > 0.5 ? 0.8 : -0.3,
      icon: <HardDrive className="w-6 h-6" />,
      status: systemMetrics.disk.percentage > 90 ? 'critical' as const : systemMetrics.disk.percentage > 75 ? 'warning' as const : 'healthy' as const,
    },
    {
      title: 'Uptime',
      value: systemHealth.uptime / 86400, // Convert to days
      format: 'number' as const,
      description: 'days',
      trend: Math.random() > 0.9 ? -0.1 : 0.1,
      icon: <Activity className="w-6 h-6" />,
      status: systemHealth.status as 'healthy' | 'warning' | 'critical',
    },
  ], [systemMetrics, systemHealth]);

  const connectionStatus = isConnected ? 'healthy' : 'critical';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with time range selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Performance Analytics
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <StatusIndicator status={connectionStatus} size="sm" />
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Services:</span>
                <span className="font-medium">
                  {systemHealth.services.filter(s => s.status === 'online').length}/
                  {systemHealth.services.length} Online
                </span>
              </div>
            </div>
          </div>
        </div>

        <TimeRangeSelector
          value={timeRange}
          onChange={handleTimeRangeChange}
          refreshInterval={refreshInterval}
          onRefreshIntervalChange={handleRefreshIntervalChange}
          isAutoRefresh={isAutoRefresh}
          onToggleAutoRefresh={handleToggleAutoRefresh}
          lastUpdated={lastUpdated}
        />
      </div>

      {/* System overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat) => (
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

      {/* Real Analytics Data from GraphQL */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">Loading analytics data...</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="text-red-600 dark:text-red-400">Error loading analytics: {error.message}</div>
        </div>
      ) : analyticsData ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            System Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {analyticsData.analyticsOverview.totalUsers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {analyticsData.analyticsOverview.totalMemories}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Memories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {analyticsData.analyticsOverview.totalContexts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Contexts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {analyticsData.analyticsOverview.totalAgents}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {analyticsData.analyticsOverview.activeUsers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
            </div>
          </div>
          
          {analyticsData.analyticsOverview.agentUsage.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                Top Agent Usage
              </h4>
              <div className="space-y-2">
                {analyticsData.analyticsOverview.agentUsage.slice(0, 3).map((agent: any) => (
                  <div key={agent.agentName} className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">{agent.agentName}</span>
                    <div className="text-right">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {agent.usageCount} uses
                      </span>
                      <span className="ml-2 text-sm text-yellow-600 dark:text-yellow-400">
                        ⭐{agent.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* System health status */}
      <HealthStatus
        health={systemHealth}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      />

      {/* Detailed system metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SystemMetricsComponent
          metrics={systemMetrics}
          timeRange={timeRange}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        />
        
        {/* Additional metrics panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Network Activity
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Incoming Traffic</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {(systemMetrics.network.incoming / 1024 / 1024).toFixed(2)} MB/s
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Outgoing Traffic</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {(systemMetrics.network.outgoing / 1024 / 1024).toFixed(2)} MB/s
              </span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Load Average</span>
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {systemMetrics.cpu.load.map(l => l.toFixed(2)).join(', ')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    1m, 5m, 15m
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active alerts section */}
      {systemHealth.services.some(s => s.status !== 'online') && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Active System Alerts
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <ul className="list-disc list-inside space-y-1">
                  {systemHealth.services
                    .filter(s => s.status !== 'online')
                    .map(service => (
                      <li key={service.name}>
                        {service.name}: {service.status} 
                        {service.errorCount > 0 && ` (${service.errorCount} errors)`}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};