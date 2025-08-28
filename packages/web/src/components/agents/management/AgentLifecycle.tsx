import React, { useState, useEffect } from 'react';
import { Agent, AgentLifecycleActions } from '../../../types';
import { AgentControls } from './AgentControls';
import { AgentStatus } from './AgentStatus';
import { BulkOperations } from './BulkOperations';

interface AgentLifecycleProps {
  agents: Agent[];
  selectedAgent?: Agent | null;
  selectedAgents?: string[];
  onAgentSelect?: (agent: Agent) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  actions?: Partial<AgentLifecycleActions>;
  showBulkOperations?: boolean;
  className?: string;
}

export const AgentLifecycle: React.FC<AgentLifecycleProps> = ({
  agents,
  selectedAgent,
  selectedAgents = [],
  onAgentSelect,
  onSelectionChange,
  actions,
  showBulkOperations = true,
  className = '',
}) => {
  const [view, setView] = useState<'single' | 'bulk'>('single');
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // Mock lifecycle actions for development
  const defaultActions: AgentLifecycleActions = {
    start: async (agentId: string) => {
      console.log(`Starting agent ${agentId}`);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    },
    stop: async (agentId: string) => {
      console.log(`Stopping agent ${agentId}`);
      await new Promise(resolve => setTimeout(resolve, 1500));
    },
    restart: async (agentId: string) => {
      console.log(`Restarting agent ${agentId}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    },
    delete: async (agentId: string) => {
      console.log(`Deleting agent ${agentId}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    clone: async (agentId: string, newName: string) => {
      console.log(`Cloning agent ${agentId} as ${newName}`);
      await new Promise(resolve => setTimeout(resolve, 2500));
      // Return mock cloned agent
      const original = agents.find(a => a.id === agentId);
      if (!original) throw new Error('Agent not found');
      
      return {
        ...original,
        id: `${agentId}-clone-${Date.now()}`,
        name: newName,
        status: 'stopped' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
    export: async (agentId: string) => {
      console.log(`Exporting agent ${agentId} configuration`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Return mock config
      const agent = agents.find(a => a.id === agentId);
      return agent?.config || {} as any;
    },
    import: async (config: any) => {
      console.log('Importing agent configuration', config);
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Return mock imported agent
      return {
        id: `imported-${Date.now()}`,
        name: 'Imported Agent',
        description: 'Agent created from imported configuration',
        version: '1.0.0',
        tags: ['imported'],
        category: 'general' as const,
        model: 'sonnet' as const,
        capabilities: [],
        dependencies: [],
        lastUpdated: new Date().toISOString(),
        popularity: 0,
        rating: 0,
        status: 'stopped' as const,
        config,
        performance: null as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: false,
        hasErrors: false,
      };
    },
  };

  const mergedActions = { ...defaultActions, ...actions };

  const handleBulkOperation = async (operation: string, agentIds: string[]) => {
    console.log(`Bulk ${operation} operation on agents:`, agentIds);
    
    switch (operation) {
      case 'start':
        for (const id of agentIds) {
          if (mergedActions.start) await mergedActions.start(id);
        }
        break;
      case 'stop':
        for (const id of agentIds) {
          if (mergedActions.stop) await mergedActions.stop(id);
        }
        break;
      case 'restart':
        for (const id of agentIds) {
          if (mergedActions.restart) await mergedActions.restart(id);
        }
        break;
      case 'delete':
        for (const id of agentIds) {
          if (mergedActions.delete) await mergedActions.delete(id);
        }
        break;
      case 'export':
        for (const id of agentIds) {
          if (mergedActions.export) await mergedActions.export(id);
        }
        break;
      default:
        console.warn(`Unsupported bulk operation: ${operation}`);
    }
  };

  // Simulate real-time status updates
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      // This would normally be handled by WebSocket connections
      // For now, just log that we're checking for updates
      console.log('Checking for real-time agent status updates...');
    }, 5000);

    return () => clearInterval(interval);
  }, [realTimeUpdates]);

  const activeCount = agents.filter(a => a.status === 'active').length;
  const inactiveCount = agents.filter(a => a.status === 'inactive').length;
  const errorCount = agents.filter(a => a.status === 'error').length;

  return (
    <div className={`${className} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Agent Lifecycle Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Control and monitor agent states and operations
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Real-time updates toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Real-time updates
            </span>
            <button
              onClick={() => setRealTimeUpdates(!realTimeUpdates)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${realTimeUpdates 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200 dark:bg-gray-700'
                }
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${realTimeUpdates ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* View mode toggle */}
          {showBulkOperations && (
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg p-1">
              <button
                onClick={() => setView('single')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  view === 'single'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Single Agent
              </button>
              <button
                onClick={() => setView('bulk')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  view === 'bulk'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Bulk Operations
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {agents.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Agents
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {activeCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <div>
              <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {inactiveCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Inactive
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                {errorCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Errors
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      {view === 'single' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent status */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            {selectedAgent ? (
              <AgentStatus agent={selectedAgent} showDetails />
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No agent selected
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select an agent from the registry to view its status and manage its lifecycle.
                </p>
              </div>
            )}
          </div>

          {/* Agent controls */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            {selectedAgent ? (
              <AgentControls
                agent={selectedAgent}
                onStart={mergedActions.start}
                onStop={mergedActions.stop}
                onRestart={mergedActions.restart}
                onDelete={mergedActions.delete}
                onClone={mergedActions.clone}
                onExport={mergedActions.export}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No agent selected
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select an agent to access lifecycle controls.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <BulkOperations
            selectedAgents={selectedAgents}
            agents={agents}
            onSelectionChange={onSelectionChange || (() => {})}
            onBulkOperation={handleBulkOperation}
          />
        </div>
      )}

      {/* Recent activity log */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {/* Mock activity entries */}
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">2 minutes ago</span>
            <span className="text-gray-900 dark:text-gray-100">
              Agent <strong>python-pro</strong> started successfully
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">5 minutes ago</span>
            <span className="text-gray-900 dark:text-gray-100">
              Agent <strong>rust-pro</strong> configuration updated
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">12 minutes ago</span>
            <span className="text-gray-900 dark:text-gray-100">
              Agent <strong>data-scientist</strong> stopped due to error
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">18 minutes ago</span>
            <span className="text-gray-900 dark:text-gray-100">
              Bulk operation: 3 agents restarted
            </span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            View all activity →
          </button>
        </div>
      </div>
    </div>
  );
};

AgentLifecycle.displayName = 'AgentLifecycle';