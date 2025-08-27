import React, { useState, useCallback } from 'react';
import { 
  HardDrive,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Settings,
  Calendar,
  Clock,
  Database,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Archive,
  Cloud,
  Server,
  Key,
  FileText,
  History,
  Trash2,
  Edit,
  Copy,
  ExternalLink
} from 'lucide-react';
import type { BackupInfo, BackupSchedule, BackupDestination } from '@/types/admin';
import { useBackupManagement } from '@/hooks/useBackupManagement';
import { formatBytes, formatDate, formatDuration } from '@/lib/utils';

export const BackupManagement: React.FC = () => {
  const {
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
  } = useBackupManagement();

  const [activeTab, setActiveTab] = useState('backups');
  const [showCreateBackupDialog, setShowCreateBackupDialog] = useState(false);
  const [showCreateScheduleDialog, setShowCreateScheduleDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<BackupSchedule | null>(null);
  const [restorePoint, setRestorePoint] = useState<BackupInfo | null>(null);

  const handleCreateBackup = useCallback(async (backupData: any) => {
    try {
      await createBackup(backupData);
      setShowCreateBackupDialog(false);
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }, [createBackup]);

  const handleCreateSchedule = useCallback(async (scheduleData: any) => {
    try {
      await createSchedule(scheduleData);
      setShowCreateScheduleDialog(false);
    } catch (error) {
      console.error('Failed to create schedule:', error);
    }
  }, [createSchedule]);

  const handleRestore = useCallback(async (backupId: string, options: any) => {
    try {
      await restoreBackup(backupId, options);
      setShowRestoreDialog(false);
      setRestorePoint(null);
    } catch (error) {
      console.error('Failed to restore backup:', error);
    }
  }, [restoreBackup]);

  const getBackupStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getBackupTypeIcon = (type: string) => {
    switch (type) {
      case 'full':
        return <Database className="h-4 w-4 text-blue-600" />;
      case 'incremental':
        return <Archive className="h-4 w-4 text-green-600" />;
      case 'differential':
        return <FileText className="h-4 w-4 text-purple-600" />;
      default:
        return <HardDrive className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDestinationIcon = (type: string) => {
    switch (type) {
      case 's3':
      case 'gcs':
      case 'azure':
        return <Cloud className="h-4 w-4" />;
      case 'local':
        return <Server className="h-4 w-4" />;
      default:
        return <HardDrive className="h-4 w-4" />;
    }
  };

  const renderBackupCard = (backup: BackupInfo) => {
    const isRunning = runningBackups.some(rb => rb.id === backup.id);
    const progress = isRunning ? runningBackups.find(rb => rb.id === backup.id)?.progress || 0 : 100;

    return (
      <div key={backup.id} className="card hover:shadow-md transition-shadow">
        <div className="card-header pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {getBackupTypeIcon(backup.type)}
              <div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">{backup.type.charAt(0).toUpperCase() + backup.type.slice(1)} Backup</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{backup.description || `Backup created on ${formatDate(backup.startTime)}`}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getBackupStatusIcon(backup.status)}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                backup.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
                backup.status === 'running' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200' :
                backup.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}>
                {backup.status}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card-content pt-0">
          <div className="space-y-3">
            {isRunning && (
              <div>
                <div className="flex items-center justify-between text-sm mb-2 text-gray-900 dark:text-gray-100">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
            
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Size</label>
                <div className="text-sm text-gray-900 dark:text-gray-100">{formatBytes(backup.size)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</label>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {backup.duration ? formatDuration(backup.duration) : 'N/A'}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Started</label>
                <div className="text-sm text-gray-900 dark:text-gray-100">{formatDate(backup.startTime)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Retention</label>
                <div className="text-sm text-gray-900 dark:text-gray-100">{formatDate(backup.retentionUntil)}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <button
                  className="btn-outline btn-sm"
                  onClick={() => downloadBackup(backup.id)}
                  disabled={backup.status !== 'completed'}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </button>
                <button
                  className="btn-outline btn-sm"
                  onClick={() => validateBackup(backup.id)}
                  disabled={backup.status !== 'completed'}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Validate
                </button>
                <button
                  className="btn-outline btn-sm"
                  onClick={() => {
                    setRestorePoint(backup);
                    setShowRestoreDialog(true);
                  }}
                  disabled={backup.status !== 'completed'}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Restore
                </button>
              </div>
              <button
                className="btn-ghost btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => deleteBackup(backup.id)}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderScheduleCard = (schedule: BackupSchedule) => (
    <div key={schedule.id} className="card hover:shadow-md transition-shadow">
      <div className="card-header pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">{schedule.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)} backup every {schedule.cronExpression}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={schedule.isActive}
                onChange={(e) => {
                  if (e.target.checked) {
                    resumeSchedule(schedule.id);
                  } else {
                    pauseSchedule(schedule.id);
                  }
                }}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
            </label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              schedule.isActive ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
            }`}>
              {schedule.isActive ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="card-content pt-0">
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Retention</label>
              <div className="text-sm text-gray-900 dark:text-gray-100">{schedule.retentionDays} days</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Destinations</label>
              <div className="text-sm text-gray-900 dark:text-gray-100">{schedule.destinations.length} configured</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Run</label>
              <div className="text-sm text-gray-900 dark:text-gray-100">
                {schedule.lastRun ? formatDate(schedule.lastRun) : 'Never'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Next Run</label>
              <div className="text-sm text-gray-900 dark:text-gray-100">{formatDate(schedule.nextRun)}</div>
            </div>
          </div>
          
          {schedule.destinations.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Backup Destinations</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {schedule.destinations.map((dest, index) => (
                  <div key={index} className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs text-gray-900 dark:text-gray-100">
                    {getDestinationIcon(dest.type)}
                    <span>{dest.type.toUpperCase()}</span>
                    {dest.isEncrypted && <Key className="h-3 w-3 text-green-600" />}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <button
                className="btn-outline btn-sm"
                onClick={() => createBackup({ scheduleId: schedule.id, type: schedule.type })}
              >
                <Play className="h-3 w-3 mr-1" />
                Run Now
              </button>
              <button
                className="btn-outline btn-sm"
                onClick={() => {
                  setSelectedSchedule(schedule);
                  setShowCreateScheduleDialog(true);
                }}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </button>
            </div>
            <button
              className="btn-ghost btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => deleteSchedule(schedule.id)}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStatsCards = () => (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="card">
        <div className="card-content p-4">
          <div className="flex items-center space-x-2">
            <Database className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalBackups || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Backups</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-content p-4">
          <div className="flex items-center space-x-2">
            <Archive className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatBytes(stats?.totalSize || 0)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Size</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-content p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-8 w-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.activeSchedules || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Active Schedules</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-content p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.successRate || 0}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="ml-2 text-sm text-red-700 dark:text-red-200">
              Failed to load backup management data: {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Backup & Recovery</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage system backups, schedules, and recovery operations</p>
        </div>
        <div className="flex space-x-2">
          <button className="btn-outline" onClick={() => setShowCreateScheduleDialog(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Create Schedule
          </button>
          <button className="btn" onClick={() => setShowCreateBackupDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Backup
          </button>
        </div>
      </div>

      {/* Statistics */}
      {renderStatsCards()}

      {/* Main Content */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('backups')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'backups'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Backups ({backups.length})
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedules'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Schedules ({schedules.length})
            </button>
            <button
              onClick={() => setActiveTab('destinations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'destinations'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Destinations ({destinations.length})
            </button>
          </nav>
        </div>

        {activeTab === 'backups' && (
          <div className="space-y-6">
            {runningBackups.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Running Backups ({runningBackups.length})
                  </h3>
                </div>
                <div className="card-content">
                  <div className="space-y-4">
                    {runningBackups.map((backup) => (
                      <div key={backup.id} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{backup.type} Backup</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200">
                            Running
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300" style={{ width: `${backup.progress}%` }}></div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{backup.progress}%</span>
                          <button className="btn-outline btn-sm" onClick={() => {/* Cancel backup */}}>
                            <Pause className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          <div className="grid gap-6 lg:grid-cols-2">
            {backups.map(renderBackupCard)}
          </div>

            {backups.length === 0 && (
              <div className="card">
                <div className="card-content py-12 text-center">
                  <HardDrive className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">No backups found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create your first backup to protect your data.
                  </p>
                  <button className="btn" onClick={() => setShowCreateBackupDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Backup
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedules' && (
          <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {schedules.map(renderScheduleCard)}
          </div>

            {schedules.length === 0 && (
              <div className="card">
                <div className="card-content py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">No schedules configured</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Set up automated backup schedules to ensure regular data protection.
                  </p>
                  <button className="btn" onClick={() => setShowCreateScheduleDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Schedule
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'destinations' && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Backup Destinations</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure storage locations for your backups
                </p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {destinations.map((destination, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getDestinationIcon(destination.type)}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{destination.type.toUpperCase()}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {destination.isEncrypted ? 'Encrypted' : 'Not encrypted'}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="btn-outline btn-sm"
                            onClick={() => testDestination(index)}
                          >
                            Test Connection
                          </button>
                          <button
                            className="btn-ghost btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Backup Dialog */}
      {showCreateBackupDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New Backup</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a manual backup of your system data
              </p>
            </div>
            <div className="p-6">
              <BackupForm
                onSubmit={handleCreateBackup}
                onCancel={() => setShowCreateBackupDialog(false)}
                destinations={destinations}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Schedule Dialog */}
      {showCreateScheduleDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedSchedule ? 'Edit' : 'Create'} Backup Schedule</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedSchedule ? 'Update' : 'Configure'} automated backup schedule
              </p>
            </div>
            <div className="p-6">
              <ScheduleForm
                schedule={selectedSchedule}
                onSubmit={handleCreateSchedule}
                onCancel={() => {
                  setShowCreateScheduleDialog(false);
                  setSelectedSchedule(null);
                }}
                destinations={destinations}
              />
            </div>
          </div>
        </div>
      )}

      {/* Restore Dialog */}
      {showRestoreDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Restore from Backup</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Restore your system from a backup point
              </p>
            </div>
            <div className="p-6">
              {restorePoint && (
                <RestoreForm
                  backup={restorePoint}
                  onSubmit={(options) => handleRestore(restorePoint.id, options)}
                  onCancel={() => {
                    setShowRestoreDialog(false);
                    setRestorePoint(null);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Form components would be implemented here...
const BackupForm: React.FC<any> = ({ onSubmit, onCancel, destinations }) => {
  const [formData, setFormData] = useState({
    type: 'full',
    description: '',
    destinations: [],
    encryption: true,
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      {/* Form implementation */}
      <div className="flex justify-end space-x-2">
        <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn">Create Backup</button>
      </div>
    </form>
  );
};

const ScheduleForm: React.FC<any> = ({ schedule, onSubmit, onCancel, destinations }) => {
  return <div>Schedule form implementation...</div>;
};

const RestoreForm: React.FC<any> = ({ backup, onSubmit, onCancel }) => {
  return <div>Restore form implementation...</div>;
};