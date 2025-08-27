import React, { useState } from 'react';
import { Agent, AgentStatus } from '../../../types';
import { StatusBadge, ProgressIndicator } from '../shared';

interface AgentControlsProps {
  agent: Agent;
  onStart?: (agentId: string) => Promise<void>;
  onStop?: (agentId: string) => Promise<void>;
  onRestart?: (agentId: string) => Promise<void>;
  onDelete?: (agentId: string) => Promise<void>;
  onClone?: (agentId: string, newName: string) => Promise<void>;
  onExport?: (agentId: string) => Promise<void>;
  disabled?: boolean;
  showAdvanced?: boolean;
  className?: string;
}

interface OperationState {
  type: 'start' | 'stop' | 'restart' | 'delete' | 'clone' | 'export' | null;
  loading: boolean;
  progress: number;
}

export const AgentControls: React.FC<AgentControlsProps> = ({
  agent,
  onStart,
  onStop,
  onRestart,
  onDelete,
  onClone,
  onExport,
  disabled = false,
  showAdvanced = true,
  className = '',
}) => {
  const [operation, setOperation] = useState<OperationState>({
    type: null,
    loading: false,
    progress: 0,
  });
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneName, setCloneName] = useState(`${agent.name}-copy`);

  const executeOperation = async (
    type: OperationState['type'],
    operation: () => Promise<void>
  ) => {
    if (!operation || disabled) return;

    setOperation({ type, loading: true, progress: 0 });

    try {
      // Simulate progress for UI feedback
      const progressInterval = setInterval(() => {
        setOperation(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 20, 90)
        }));
      }, 200);

      await operation();
      
      clearInterval(progressInterval);
      setOperation({ type, loading: true, progress: 100 });

      // Brief completion state
      setTimeout(() => {
        setOperation({ type: null, loading: false, progress: 0 });
      }, 1000);
      
    } catch (error) {
      console.error(`Agent ${type} operation failed:`, error);
      setOperation({ type: null, loading: false, progress: 0 });
    }
  };

  const handleStart = () => executeOperation('start', () => onStart?.(agent.id));
  const handleStop = () => executeOperation('stop', () => onStop?.(agent.id));
  const handleRestart = () => executeOperation('restart', () => onRestart?.(agent.id));
  const handleExport = () => executeOperation('export', () => onExport?.(agent.id));

  const handleDelete = () => {
    if (showConfirmDelete) {
      executeOperation('delete', () => onDelete?.(agent.id));
      setShowConfirmDelete(false);
    } else {
      setShowConfirmDelete(true);
    }
  };

  const handleClone = () => {
    if (showCloneDialog && cloneName.trim()) {
      executeOperation('clone', () => onClone?.(agent.id, cloneName.trim()));
      setShowCloneDialog(false);
    } else {
      setShowCloneDialog(true);
    }
  };

  const canStart = agent.status === 'stopped' || agent.status === 'error';
  const canStop = agent.status === 'running' || agent.status === 'starting';
  const canRestart = agent.status === 'running' || agent.status === 'error';

  const isOperationLoading = (opType: string) => operation.loading && operation.type === opType;

  return (
    <div className={`${className} space-y-4`}>
      {/* Status and basic info */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-3">
          <StatusBadge status={agent.status} />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {agent.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Version {agent.version}
            </p>
          </div>
        </div>
        
        {agent.performance && (
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Health: {agent.performance.healthScore}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Uptime: {agent.performance.metrics.uptime.toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      {/* Operation progress */}
      {operation.loading && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              {operation.type === 'start' && 'Starting agent...'}
              {operation.type === 'stop' && 'Stopping agent...'}
              {operation.type === 'restart' && 'Restarting agent...'}
              {operation.type === 'delete' && 'Deleting agent...'}
              {operation.type === 'clone' && 'Cloning agent...'}
              {operation.type === 'export' && 'Exporting configuration...'}
            </span>
            <span className="text-sm text-blue-600 dark:text-blue-400">
              {operation.progress}%
            </span>
          </div>
          <ProgressIndicator 
            progress={operation.progress} 
            status="running" 
            size="sm" 
          />
        </div>
      )}

      {/* Primary controls */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={handleStart}
          disabled={!canStart || disabled || operation.loading}
          className={`
            px-4 py-2 rounded-md font-medium transition-all duration-200
            ${canStart && !disabled && !operation.loading
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }
            ${isOperationLoading('start') ? 'opacity-75' : ''}
          `}
        >
          {isOperationLoading('start') ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Starting
            </span>
          ) : (
            'Start'
          )}
        </button>

        <button
          onClick={handleStop}
          disabled={!canStop || disabled || operation.loading}
          className={`
            px-4 py-2 rounded-md font-medium transition-all duration-200
            ${canStop && !disabled && !operation.loading
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }
            ${isOperationLoading('stop') ? 'opacity-75' : ''}
          `}
        >
          {isOperationLoading('stop') ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Stopping
            </span>
          ) : (
            'Stop'
          )}
        </button>

        <button
          onClick={handleRestart}
          disabled={!canRestart || disabled || operation.loading}
          className={`
            px-4 py-2 rounded-md font-medium transition-all duration-200
            ${canRestart && !disabled && !operation.loading
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }
            ${isOperationLoading('restart') ? 'opacity-75' : ''}
          `}
        >
          {isOperationLoading('restart') ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Restarting
            </span>
          ) : (
            'Restart'
          )}
        </button>
      </div>

      {/* Advanced controls */}
      {showAdvanced && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Advanced Operations
            </span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700 ml-4" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleClone}
              disabled={disabled || operation.loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOperationLoading('clone') ? 'Cloning...' : 'Clone'}
            </button>

            <button
              onClick={handleExport}
              disabled={disabled || operation.loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOperationLoading('export') ? 'Exporting...' : 'Export'}
            </button>
          </div>

          {/* Danger zone */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  Danger Zone
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Irreversible operations
                </p>
              </div>
            </div>

            <button
              onClick={handleDelete}
              disabled={disabled || operation.loading}
              className={`
                w-full px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                ${showConfirmDelete
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isOperationLoading('delete') ? 'opacity-75' : ''}
              `}
            >
              {isOperationLoading('delete') ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </span>
              ) : showConfirmDelete ? (
                'Confirm Delete'
              ) : (
                'Delete Agent'
              )}
            </button>

            {showConfirmDelete && (
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="w-full mt-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Clone dialog */}
      {showCloneDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Clone Agent
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter a name for the cloned agent:
            </p>
            <input
              type="text"
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new agent name"
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleClone}
                disabled={!cloneName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-md font-medium transition-colors disabled:cursor-not-allowed"
              >
                Clone
              </button>
              <button
                onClick={() => setShowCloneDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AgentControls.displayName = 'AgentControls';