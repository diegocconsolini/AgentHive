import { useState, useEffect, useCallback } from 'react';
import type { AuditLogEntry, AuditLogFilter } from '@/types/admin';

const mockLogs: AuditLogEntry[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    userId: '1',
    userEmail: 'admin@example.com',
    action: 'user_create',
    resource: 'user',
    resourceId: '123',
    details: {
      userName: 'John Doe',
      userEmail: 'john.doe@example.com',
      role: 'USER'
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    outcome: 'success',
    risk: 'low'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    userId: '2',
    userEmail: 'user@example.com',
    action: 'login_attempt',
    resource: 'auth',
    details: {
      attemptCount: 3,
      reason: 'invalid_password'
    },
    ipAddress: '192.168.1.200',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    outcome: 'failure',
    risk: 'medium'
  }
];

const mockStats = {
  total: 1247,
  successful: 1089,
  failed: 158,
  highRisk: 23
};

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });
  const [filters, setFilters] = useState<AuditLogFilter>({});
  const [stats, setStats] = useState(mockStats);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setLogs(mockLogs);
      setPagination(prev => ({ ...prev, total: mockLogs.length }));
    } catch (err) {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFilters = useCallback((newFilters: Partial<AuditLogFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const updatePagination = useCallback((newPagination: Partial<typeof pagination>) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);

  const refreshLogs = useCallback(() => {
    fetchLogs();
  }, [fetchLogs]);

  const exportLogs = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const getLogDetails = useCallback(async (logId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockLogs.find(log => log.id === logId) || null;
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    pagination,
    filters,
    stats,
    updateFilters,
    updatePagination,
    refreshLogs,
    exportLogs,
    getLogDetails
  };
};