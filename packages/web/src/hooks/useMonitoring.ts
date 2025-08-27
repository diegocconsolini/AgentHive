import { useState, useEffect, useCallback } from 'react';
import type { PerformanceMetrics, SystemHealth, Alert } from '@/types/admin';

const mockMetrics: PerformanceMetrics = {
  cpu: {
    usage: 65.4,
    cores: 8,
    loadAverage: [1.2, 1.5, 1.8]
  },
  memory: {
    used: 6442450944,
    total: 16106127360,
    available: 9663676416,
    percentage: 40.0
  },
  disk: {
    used: 107374182400,
    total: 214748364800,
    percentage: 50.0
  },
  network: {
    inbound: 1024000,
    outbound: 512000
  },
  database: {
    connections: 45,
    queryTime: 12.3,
    queryCount: 1543
  }
};

const mockSystemHealth: SystemHealth = {
  status: 'healthy',
  score: 94,
  checks: [
    {
      name: 'Database Connection',
      status: 'pass',
      message: 'Connection healthy',
      responseTime: 23
    }
  ],
  lastUpdated: new Date().toISOString()
};

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'performance',
    level: 'warning',
    title: 'High CPU Usage',
    message: 'CPU usage has been above 80% for the last 15 minutes',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const useMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [historicalData, setHistoricalData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMetrics(mockMetrics);
      setAlerts(mockAlerts);
      setSystemHealth(mockSystemHealth);
      setHistoricalData({});
    } catch (err) {
      setError('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isActive: false, acknowledgedAt: new Date().toISOString() }
        : alert
    ));
  }, []);

  const createAlert = useCallback(async (alertData: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);

  const getMetricHistory = useCallback(async (metric: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [];
  }, []);

  useEffect(() => {
    fetchData();
    
    // Set up real-time updates
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
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
  };
};