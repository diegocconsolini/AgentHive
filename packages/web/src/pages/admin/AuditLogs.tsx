import React, { useState, useCallback, useEffect } from 'react';
import { 
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  User,
  Globe,
  Monitor,
  Activity,
  Shield,
  Database,
  Settings,
  Key,
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import type { AuditLogEntry, AuditLogFilter } from '@/types/admin';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { formatDate, formatRelativeTime } from '@/lib/utils';

export const AuditLogs: React.FC = () => {
  const {
    logs,
    loading,
    error,
    pagination,
    filters,
    stats,
    updateFilters,
    updatePagination,
    exportLogs,
    refreshLogs,
    getLogDetails
  } = useAuditLogs();

  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: filters.dateRange?.start ? new Date(filters.dateRange.start) : undefined,
    end: filters.dateRange?.end ? new Date(filters.dateRange.end) : undefined,
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search: searchTerm || undefined });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, updateFilters]);

  const handleDateRangeChange = useCallback((start?: Date, end?: Date) => {
    setDateRange({ start, end });
    updateFilters({
      dateRange: start && end ? {
        start: start.toISOString(),
        end: end.toISOString()
      } : undefined
    });
  }, [updateFilters]);

  const handleExport = useCallback(async () => {
    try {
      await exportLogs();
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  }, [exportLogs]);

  const handleViewDetails = useCallback(async (logId: string) => {
    try {
      const details = await getLogDetails(logId);
      setSelectedLog(details);
      setShowDetailsDialog(true);
    } catch (error) {
      console.error('Failed to load log details:', error);
    }
  }, [getLogDetails]);

  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (actionLower.includes('update') || actionLower.includes('edit')) return <Settings className="h-4 w-4 text-blue-600" />;
    if (actionLower.includes('delete')) return <XCircle className="h-4 w-4 text-red-600" />;
    if (actionLower.includes('login') || actionLower.includes('auth')) return <Key className="h-4 w-4 text-purple-600" />;
    if (actionLower.includes('view') || actionLower.includes('access')) return <Eye className="h-4 w-4 text-gray-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getResourceIcon = (resource: string) => {
    const resourceLower = resource.toLowerCase();
    if (resourceLower.includes('user')) return <User className="h-4 w-4" />;
    if (resourceLower.includes('agent')) return <Activity className="h-4 w-4" />;
    if (resourceLower.includes('context')) return <Database className="h-4 w-4" />;
    if (resourceLower.includes('config')) return <Settings className="h-4 w-4" />;
    if (resourceLower.includes('role') || resourceLower.includes('permission')) return <Shield className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">High Risk</span>;
      case 'medium':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200">Medium Risk</span>;
      case 'low':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Low Risk</span>;
      default:
        return null;
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    return outcome === 'success' 
      ? <CheckCircle className="h-4 w-4 text-green-600" />
      : <XCircle className="h-4 w-4 text-red-600" />;
  };

  const renderLogEntry = (log: AuditLogEntry) => (
    <div key={log.id} className="card hover:shadow-md transition-shadow">
      <div className="card-content p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex items-center space-x-2">
              {getActionIcon(log.action)}
              {getResourceIcon(log.resource)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-sm">{log.action}</span>
                <span className="text-gray-400">on</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {log.resource}
                </span>
                {log.resourceId && (
                  <span className="text-xs text-gray-500">#{log.resourceId}</span>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{log.userEmail || 'System'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatRelativeTime(log.timestamp)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Globe className="h-3 w-3" />
                  <span className="font-mono text-xs">{log.ipAddress}</span>
                </div>
              </div>
              
              {Object.keys(log.details).length > 0 && (
                <div className="text-xs text-gray-500">
                  {Object.entries(log.details).slice(0, 2).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium">{key}:</span> {String(value).substring(0, 50)}
                      {String(value).length > 50 && '...'}
                    </div>
                  ))}
                  {Object.keys(log.details).length > 2 && (
                    <div className="text-gray-400">
                      +{Object.keys(log.details).length - 2} more details
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {getOutcomeIcon(log.outcome)}
            {getRiskBadge(log.risk)}
            <button
              className="btn-outline btn-sm"
              onClick={() => handleViewDetails(log.id)}
            >
              <Eye className="h-3 w-3" />
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
            <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.total || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Events</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-content p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.successful || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Successful</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-content p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.failed || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Failed</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-content p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.highRisk || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">High Risk</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </h3>
      </div>
      <div className="card-content">
        <div className="grid gap-4 md:grid-cols-6">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                id="search"
                type="text"
                placeholder="Search logs..."
                className="w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="action" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Action</label>
            <select
              id="action"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={filters.action || 'all'}
              onChange={(e) => updateFilters({ action: e.target.value === 'all' ? undefined : e.target.value })}
            >
              <option value="all">All actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="view">View</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="resource" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resource</label>
            <select
              id="resource"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={filters.resource || 'all'}
              onChange={(e) => updateFilters({ resource: e.target.value === 'all' ? undefined : e.target.value })}
            >
              <option value="all">All resources</option>
              <option value="user">Users</option>
              <option value="agent">Agents</option>
              <option value="context">Contexts</option>
              <option value="role">Roles</option>
              <option value="config">Configuration</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="outcome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Outcome</label>
            <select
              id="outcome"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={filters.outcome || 'all'}
              onChange={(e) => updateFilters({ outcome: e.target.value === 'all' ? undefined : e.target.value as any })}
            >
              <option value="all">All outcomes</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="risk" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Risk Level</label>
            <select
              id="risk"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={filters.risk || 'all'}
              onChange={(e) => updateFilters({ risk: e.target.value === 'all' ? undefined : e.target.value as any })}
            >
              <option value="all">All risks</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
            <div className="flex space-x-2">
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                onChange={(e) => handleDateRangeChange(e.target.value ? new Date(e.target.value) : undefined, dateRange.end)}
                placeholder="Start date"
              />
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
                onChange={(e) => handleDateRangeChange(dateRange.start, e.target.value ? new Date(e.target.value) : undefined)}
                placeholder="End date"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-4">
          <button className="btn-outline" onClick={() => {
            setSearchTerm('');
            setDateRange({});
            updateFilters({
              search: undefined,
              action: undefined,
              resource: undefined,
              outcome: undefined,
              risk: undefined,
              dateRange: undefined,
              userId: undefined
            });
          }}>
            Clear Filters
          </button>
          <button className="btn btn-primary" onClick={refreshLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );

  const renderLogDetails = () => {
    if (!selectedLog) return null;

    return (
      showDetailsDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                {getActionIcon(selectedLog.action)}
                <span>Audit Log Details</span>
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Detailed information about the audit event
              </p>
            </div>
            <div className="p-6">
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">Event Information</h3>
              </div>
              <div className="card-content">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Action</label>
                    <div className="flex items-center space-x-2">
                      {getActionIcon(selectedLog.action)}
                      <span className="font-mono text-gray-900 dark:text-gray-100">{selectedLog.action}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resource</label>
                    <div className="flex items-center space-x-2">
                      {getResourceIcon(selectedLog.resource)}
                      <span className="font-mono text-gray-900 dark:text-gray-100">{selectedLog.resource}</span>
                      {selectedLog.resourceId && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          #{selectedLog.resourceId}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Outcome</label>
                    <div className="flex items-center space-x-2">
                      {getOutcomeIcon(selectedLog.outcome)}
                      <span className="capitalize text-gray-900 dark:text-gray-100">{selectedLog.outcome}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Risk Level</label>
                    <div>{getRiskBadge(selectedLog.risk)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timestamp</label>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">{formatDate(selectedLog.timestamp)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration</label>
                    <span className="text-gray-900 dark:text-gray-100">{formatRelativeTime(selectedLog.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">User & Session Information</h3>
              </div>
              <div className="card-content">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User</label>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">{selectedLog.userEmail || 'System'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">IP Address</label>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="font-mono text-gray-900 dark:text-gray-100">{selectedLog.ipAddress}</span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User Agent</label>
                    <div className="flex items-start space-x-2">
                      <Monitor className="h-4 w-4 text-gray-400 mt-1" />
                      <span className="text-sm break-all text-gray-900 dark:text-gray-100">{selectedLog.userAgent}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Details */}
            {Object.keys(selectedLog.details).length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">Event Details</h3>
                </div>
                <div className="card-content">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
                    <pre className="text-sm overflow-x-auto text-gray-900 dark:text-gray-100">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button className="btn-outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </button>
            <button className="btn btn-primary" onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
            }}>
              Copy to Clipboard
            </button>
          </div>
            </div>
          </div>
        </div>
      )
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
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
            <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-200">
              Failed to load audit logs: {error}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor system activities and security events</p>
        </div>
        <div className="flex space-x-2">
          <button className="btn-outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Statistics */}
      {renderStatsCards()}

      {/* Filters */}
      {renderFilters()}

      {/* Audit Logs */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center justify-between text-gray-900 dark:text-gray-100">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Audit Events ({pagination.total})
            </div>
          </h3>
        </div>
        <div className="card-content">
          <div className="space-y-3">
            {logs.map(renderLogEntry)}
          </div>

          {logs.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">No audit logs found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                No events match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="btn-outline btn-sm"
                  disabled={pagination.page <= 1}
                  onClick={() => updatePagination({ page: pagination.page - 1 })}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                </span>
                <button
                  className="btn-outline btn-sm"
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                  onClick={() => updatePagination({ page: pagination.page + 1 })}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Details Dialog */}
      {renderLogDetails()}
    </div>
  );
};