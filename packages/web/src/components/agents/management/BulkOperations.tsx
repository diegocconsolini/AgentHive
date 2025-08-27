import React, { useState, useMemo } from 'react';
import { Agent, BulkOperation, BulkOperationType } from '../../../types';
import { StatusBadge, ProgressIndicator, IndeterminateProgress } from '../shared';
import { AgentIcon } from '../shared/AgentIcon';

interface BulkOperationsProps {
  selectedAgents: string[];
  agents: Agent[];
  onSelectionChange: (selectedIds: string[]) => void;
  onBulkOperation?: (operation: BulkOperationType, agentIds: string[]) => Promise<void>;
  className?: string;
}

interface BulkOperationState {
  operation: BulkOperation | null;
  showConfirm: boolean;
  confirmOperation?: BulkOperationType;
}

const operationLabels: Record<BulkOperationType, string> = {
  start: 'Start Agents',
  stop: 'Stop Agents',
  restart: 'Restart Agents',
  delete: 'Delete Agents',
  update_config: 'Update Configuration',
  export: 'Export Configurations',
  import: 'Import Configurations',
};

const operationDescriptions: Record<BulkOperationType, string> = {
  start: 'Start all selected agents that are currently stopped',
  stop: 'Stop all selected agents that are currently running',
  restart: 'Restart all selected agents',
  delete: 'Permanently delete all selected agents',
  update_config: 'Apply configuration changes to selected agents',
  export: 'Export configuration files for selected agents',
  import: 'Import and apply configuration files',
};

const dangerousOperations: BulkOperationType[] = ['delete', 'restart'];

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedAgents,
  agents,
  onSelectionChange,
  onBulkOperation,
  className = '',
}) => {
  const [operationState, setOperationState] = useState<BulkOperationState>({
    operation: null,
    showConfirm: false,
  });

  const selectedAgentObjects = useMemo(() => {
    return agents.filter(agent => selectedAgents.includes(agent.id));
  }, [agents, selectedAgents]);

  const operationCounts = useMemo(() => {
    const counts = {
      canStart: selectedAgentObjects.filter(a => a.status === 'stopped' || a.status === 'error').length,
      canStop: selectedAgentObjects.filter(a => a.status === 'running' || a.status === 'starting').length,
      canRestart: selectedAgentObjects.filter(a => a.status === 'running' || a.status === 'error').length,
      total: selectedAgents.length,
    };
    return counts;
  }, [selectedAgentObjects, selectedAgents]);

  const handleSelectAll = () => {
    if (selectedAgents.length === agents.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(agents.map(a => a.id));
    }
  };

  const handleSelectByStatus = (status: string) => {
    const statusAgents = agents.filter(a => a.status === status).map(a => a.id);
    onSelectionChange([...new Set([...selectedAgents, ...statusAgents])]);
  };

  const handleSelectByCategory = (category: string) => {
    const categoryAgents = agents.filter(a => a.category === category).map(a => a.id);
    onSelectionChange([...new Set([...selectedAgents, ...categoryAgents])]);
  };

  const handleOperation = async (operation: BulkOperationType) => {
    if (dangerousOperations.includes(operation)) {
      setOperationState({
        operation: null,
        showConfirm: true,
        confirmOperation: operation,
      });
      return;
    }

    await executeOperation(operation);
  };

  const executeOperation = async (operation: BulkOperationType) => {
    if (!onBulkOperation) return;

    const bulkOp: BulkOperation = {
      id: Date.now().toString(),
      type: operation,
      agentIds: selectedAgents,
      status: 'running',
      progress: 0,
      startedAt: new Date().toISOString(),
      results: [],
      errors: [],
    };

    setOperationState({
      operation: bulkOp,
      showConfirm: false,
    });

    try {
      await onBulkOperation(operation, selectedAgents);
      
      // Simulate successful completion
      setOperationState(prev => ({
        ...prev,
        operation: prev.operation ? {
          ...prev.operation,
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString(),
        } : null,
      }));

      // Clear operation after brief delay
      setTimeout(() => {
        setOperationState({ operation: null, showConfirm: false });
      }, 2000);

    } catch (error) {
      setOperationState(prev => ({
        ...prev,
        operation: prev.operation ? {
          ...prev.operation,
          status: 'failed',
          completedAt: new Date().toISOString(),
        } : null,
      }));
    }
  };

  const handleConfirmOperation = () => {
    if (operationState.confirmOperation) {
      executeOperation(operationState.confirmOperation);
    }
  };

  const handleCancelOperation = () => {
    setOperationState({ operation: null, showConfirm: false });
  };

  const isOperationDisabled = (operation: BulkOperationType): boolean => {
    if (selectedAgents.length === 0) return true;
    if (operationState.operation?.status === 'running') return true;

    switch (operation) {
      case 'start':
        return operationCounts.canStart === 0;
      case 'stop':
        return operationCounts.canStop === 0;
      case 'restart':
        return operationCounts.canRestart === 0;
      default:
        return false;
    }
  };

  if (selectedAgents.length === 0) {
    return (
      <div className={`${className} p-6 text-center`}>
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No agents selected
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select one or more agents to perform bulk operations.
        </p>
        
        {/* Quick selection buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-md transition-colors"
          >
            Select All ({agents.length})
          </button>
          <button
            onClick={() => handleSelectByStatus('running')}
            className="px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400 rounded-md transition-colors"
          >
            Select Running
          </button>
          <button
            onClick={() => handleSelectByStatus('stopped')}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-md transition-colors"
          >
            Select Stopped
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Selection summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            {selectedAgents.length} Agents Selected
          </h3>
          <button
            onClick={() => onSelectionChange([])}
            className="text-sm text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear Selection
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {operationCounts.canStart}
            </div>
            <div className="text-green-600 dark:text-green-400">Can Start</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {operationCounts.canStop}
            </div>
            <div className="text-red-600 dark:text-red-400">Can Stop</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {operationCounts.canRestart}
            </div>
            <div className="text-blue-600 dark:text-blue-400">Can Restart</div>
          </div>
        </div>
      </div>

      {/* Selected agents preview */}
      <div className="max-h-48 overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Selected Agents
        </h4>
        <div className="space-y-2">
          {selectedAgentObjects.map(agent => (
            <div 
              key={agent.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <AgentIcon category={agent.category} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {agent.name}
                  </span>
                  <StatusBadge status={agent.status} showText={false} size="sm" />
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {agent.category} • v{agent.version}
                </div>
              </div>
              <button
                onClick={() => onSelectionChange(selectedAgents.filter(id => id !== agent.id))}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Operation progress */}
      {operationState.operation && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              {operationLabels[operationState.operation.type]}
            </h4>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {operationState.operation.status === 'completed' 
                ? 'Completed' 
                : operationState.operation.status === 'failed'
                ? 'Failed'
                : 'In Progress'
              }
            </span>
          </div>
          
          {operationState.operation.status === 'running' ? (
            <IndeterminateProgress size="md" />
          ) : (
            <ProgressIndicator
              progress={operationState.operation.progress}
              status={operationState.operation.status === 'completed' ? 'completed' : 'error'}
            />
          )}
        </div>
      )}

      {/* Bulk operation buttons */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Available Operations
        </h4>

        {/* Primary operations */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleOperation('start')}
            disabled={isOperationDisabled('start')}
            className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Start ({operationCounts.canStart})
          </button>
          
          <button
            onClick={() => handleOperation('stop')}
            disabled={isOperationDisabled('stop')}
            className="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Stop ({operationCounts.canStop})
          </button>
          
          <button
            onClick={() => handleOperation('restart')}
            disabled={isOperationDisabled('restart')}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Restart ({operationCounts.canRestart})
          </button>
        </div>

        {/* Secondary operations */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleOperation('export')}
            disabled={isOperationDisabled('export')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export Configs
          </button>
          
          <button
            onClick={() => handleOperation('update_config')}
            disabled={isOperationDisabled('update_config')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Configs
          </button>
        </div>

        {/* Danger zone */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h5 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
            Danger Zone
          </h5>
          <button
            onClick={() => handleOperation('delete')}
            disabled={isOperationDisabled('delete')}
            className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Selected Agents
          </button>
        </div>
      </div>

      {/* Confirmation dialog */}
      {operationState.showConfirm && operationState.confirmOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Confirm {operationLabels[operationState.confirmOperation]}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {operationDescriptions[operationState.confirmOperation]}
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-4">
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                This operation will affect {selectedAgents.length} agents and cannot be undone.
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmOperation}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={handleCancelOperation}
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

BulkOperations.displayName = 'BulkOperations';