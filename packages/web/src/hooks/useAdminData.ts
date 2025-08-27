import { useState, useEffect, useCallback } from 'react';
import type { SystemDashboard, SystemHealth, Alert } from '@/types/admin';

// Mock data for development - replace with actual API calls
const mockSystemHealth: SystemHealth = {
  status: 'healthy',
  score: 94,
  checks: [
    {
      name: 'Database Connection',
      status: 'pass',
      message: 'Connection healthy',
      responseTime: 23
    },
    {
      name: 'Redis Cache',
      status: 'pass',
      message: 'Cache operational',
      responseTime: 5
    },
    {
      name: 'File System',
      status: 'warn',
      message: 'Disk usage at 78%',
      responseTime: 12
    },
    {
      name: 'External APIs',
      status: 'pass',
      message: 'All APIs responding',
      responseTime: 145
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
    createdAt: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: '2',
    type: 'security',
    level: 'critical',
    title: 'Failed Login Attempts',
    message: 'Multiple failed login attempts detected from IP 192.168.1.100',
    isActive: true,
    createdAt: new Date(Date.now() - 300000).toISOString()
  }
];

const mockDashboardData: SystemDashboard = {
  systemHealth: mockSystemHealth,
  performanceMetrics: {
    cpu: {
      usage: 65.4,
      cores: 8,
      loadAverage: [1.2, 1.5, 1.8]
    },
    memory: {
      used: 6442450944, // 6GB
      total: 16106127360, // 15GB
      available: 9663676416, // 9GB
      percentage: 40.0
    },
    disk: {
      used: 107374182400, // 100GB
      total: 214748364800, // 200GB
      percentage: 50.0
    },
    network: {
      inbound: 1024000, // 1MB/s
      outbound: 512000   // 500KB/s
    },
    database: {
      connections: 45,
      queryTime: 12.3,
      queryCount: 1543
    }
  },
  resourceUtilization: {
    agents: {
      active: 12,
      total: 15,
      averageResponseTime: 145,
      errorRate: 2.1
    },
    contexts: {
      total: 1247,
      averageSize: 2048,
      growthRate: 15.3
    },
    users: {
      active: 23,
      total: 156,
      sessionCount: 31
    }
  },
  recentActivity: [
    {
      id: '1',
      type: 'user_action',
      title: 'User Registration',
      description: 'New user john.doe@example.com registered',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      severity: 'info',
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'user'
      }
    },
    {
      id: '2',
      type: 'system_event',
      title: 'Agent Deployed',
      description: 'Agent "data-processor-v2" deployed successfully',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      severity: 'info'
    },
    {
      id: '3',
      type: 'security_alert',
      title: 'Permission Changed',
      description: 'User permissions updated for admin@example.com',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      severity: 'warning',
      user: {
        id: '2',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
  ],
  alerts: mockAlerts
};

export const useAdminData = () => {
  const [dashboardData, setDashboardData] = useState<SystemDashboard | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would be an API call:
      // const response = await fetch('/api/admin/dashboard');
      // const data = await response.json();
      
      setDashboardData(mockDashboardData);
      setSystemHealth(mockDashboardData.systemHealth);
      setAlerts(mockDashboardData.alerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      // In a real implementation, this would be an API call:
      // await fetch(`/api/admin/alerts/${alertId}/acknowledge`, { method: 'POST' });
      
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId 
            ? { ...alert, isActive: false, acknowledgedAt: new Date().toISOString() }
            : alert
        )
      );
      
      // Update dashboard data as well
      setDashboardData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          alerts: prevData.alerts.map(alert => 
            alert.id === alertId 
              ? { ...alert, isActive: false, acknowledgedAt: new Date().toISOString() }
              : alert
          )
        };
      });
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    systemHealth,
    alerts,
    loading,
    error,
    refetch,
    acknowledgeAlert
  };
};