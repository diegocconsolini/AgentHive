import { useState, useEffect, useCallback } from 'react';
import type { BackupInfo, BackupSchedule, BackupDestination } from '@/types/admin';

const mockBackups: BackupInfo[] = [
  {
    id: '1',
    type: 'full',
    status: 'completed',
    size: 5368709120, // 5GB
    startTime: new Date(Date.now() - 86400000 * 1).toISOString(),
    endTime: new Date(Date.now() - 86400000 * 1 + 3600000).toISOString(),
    duration: 3600, // 1 hour
    description: 'Scheduled full backup',
    retentionUntil: new Date(Date.now() + 86400000 * 30).toISOString()
  },
  {
    id: '2',
    type: 'incremental',
    status: 'completed',
    size: 1073741824, // 1GB
    startTime: new Date(Date.now() - 3600000 * 12).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 12 + 900000).toISOString(),
    duration: 900, // 15 minutes
    description: 'Incremental backup',
    retentionUntil: new Date(Date.now() + 86400000 * 7).toISOString()
  }
];

const mockSchedules: BackupSchedule[] = [
  {
    id: '1',
    name: 'Daily Full Backup',
    type: 'full',
    cronExpression: '0 2 * * *',
    isActive: true,
    retentionDays: 30,
    destinations: [
      { type: 's3', config: {}, isEncrypted: true },
      { type: 'local', config: {}, isEncrypted: false }
    ],
    lastRun: new Date(Date.now() - 86400000 * 1).toISOString(),
    nextRun: new Date(Date.now() + 86400000 * 1).toISOString()
  }
];

const mockDestinations: BackupDestination[] = [
  { type: 's3', config: { bucket: 'backups', region: 'us-east-1' }, isEncrypted: true },
  { type: 'local', config: { path: '/backup' }, isEncrypted: false }
];

const mockStats = {
  totalBackups: 45,
  totalSize: 107374182400, // 100GB
  activeSchedules: 3,
  successRate: 98
};

export const useBackupManagement = () => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [runningBackups, setRunningBackups] = useState<Array<BackupInfo & { progress: number }>>([]);
  const [destinations, setDestinations] = useState<BackupDestination[]>([]);
  const [stats, setStats] = useState(mockStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setBackups(mockBackups);
      setSchedules(mockSchedules);
      setDestinations(mockDestinations);
      setRunningBackups([]);
    } catch (err) {
      setError('Failed to load backup management data');
    } finally {
      setLoading(false);
    }
  }, []);

  const createBackup = useCallback(async (backupData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const restoreBackup = useCallback(async (backupId: string, options: any) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }, []);

  const deleteBackup = useCallback(async (backupId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);

  const createSchedule = useCallback(async (scheduleData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const updateSchedule = useCallback(async (scheduleId: string, scheduleData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const deleteSchedule = useCallback(async (scheduleId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);

  const pauseSchedule = useCallback(async (scheduleId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
  }, []);

  const resumeSchedule = useCallback(async (scheduleId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
  }, []);

  const testDestination = useCallback(async (destinationIndex: number) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const downloadBackup = useCallback(async (backupId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);

  const validateBackup = useCallback(async (backupId: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    backups,
    schedules,
    runningBackups,
    destinations,
    stats,
    loading,
    error,
    createBackup,
    restoreBackup,
    deleteBackup,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    pauseSchedule,
    resumeSchedule,
    testDestination,
    downloadBackup,
    validateBackup
  };
};