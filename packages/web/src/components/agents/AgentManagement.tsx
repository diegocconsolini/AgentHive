import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Agent, AgentManagementState, AgentRegistryState } from '../../types';
import { AgentRegistry } from './browser';
import { AgentLifecycle } from './management';
import { PerformanceMetrics } from './monitoring';
import { LoadingSpinner } from '../common';

interface AgentManagementProps {
  className?: string;
}

const GET_AGENTS = gql`
  query GetAgents($filter: AgentFilter) {
    agents(filter: $filter) {
      id
      name
      description
      version
      category
      model
      tags
      capabilities
      dependencies
      config {
        temperature
        maxTokens
        timeout
      }
      status
      popularity
      rating
      systemPrompt
      isPublic
      authorId
      createdAt
      updatedAt
    }
  }
`;

const CREATE_AGENT = gql`
  mutation CreateAgent($input: CreateAgentInput!) {
    createAgent(input: $input) {
      id
      name
      description
      version
      category
      model
      tags
      capabilities
      dependencies
      status
      popularity
      rating
      createdAt
    }
  }
`;

const UPDATE_AGENT = gql`
  mutation UpdateAgent($id: ID!, $input: UpdateAgentInput!) {
    updateAgent(id: $id, input: $input) {
      id
      name
      description
      version
      category
      model
      tags
      capabilities
      dependencies
      status
      updatedAt
    }
  }
`;

const DELETE_AGENT = gql`
  mutation DeleteAgent($id: ID!) {
    deleteAgent(id: $id)
  }
`;

// Mock AgentService class removed - now using real GraphQL APIs

export const AgentManagement: React.FC<AgentManagementProps> = ({
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'registry' | 'lifecycle' | 'monitoring'>('registry');
  
  // GraphQL queries and mutations
  const { data, loading, error, refetch } = useQuery(GET_AGENTS, {
    variables: {
      filter: {
        limit: 100, // Increased to show all agents
        offset: 0,
      }
    },
    errorPolicy: 'all',
  });
  
  const [createAgent] = useMutation(CREATE_AGENT);
  const [updateAgent] = useMutation(UPDATE_AGENT);
  const [deleteAgent] = useMutation(DELETE_AGENT);
  
  const agents = data?.agents || [];
  
  // Registry state
  const [registryState, setRegistryState] = useState<AgentRegistryState>({
    agents: [],
    filteredAgents: [],
    selectedAgent: null,
    searchParams: { sortBy: 'name', sortOrder: 'asc', page: 1, limit: 20 },
    loading: false,
    error: null,
  });

  // Management state
  const [managementState, setManagementState] = useState<AgentManagementState>({
    selectedAgents: [],
    bulkOperation: null,
    showConfigEditor: false,
    showDependencyGraph: false,
    activeTab: 'single',
  });

  // Update registry state when agents are loaded
  useEffect(() => {
    if (agents.length > 0) {
      setRegistryState(prev => ({
        ...prev,
        agents: agents,
        filteredAgents: agents,
      }));
    }
  }, [agents]);

  // Real-time updates simulation (disabled for now with real GraphQL)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (agents.length > 0) {
        // Simulate status changes
        const randomAgent = agents[Math.floor(Math.random() * agents.length)];
        const currentStatus = randomAgent.status;
        
        // Small chance of status change
        if (Math.random() < 0.1) {
          const newStatus = currentStatus === 'running' ? 'stopped' : 'running';
          try {
            await updateAgent({
              variables: {
                id: randomAgent.id,
                input: {
                  // Note: status update may need to be added to UpdateAgentInput schema
                  name: randomAgent.name
                }
              }
            });
            
            // Refresh agents
            refetch();
          } catch (err) {
            console.error('Failed to update agent status:', err);
          }
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [agents, updateAgent, refetch]);

  const handleAgentSelect = (agent: Agent) => {
    setRegistryState(prev => ({
      ...prev,
      selectedAgent: agent,
    }));
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setManagementState(prev => ({
      ...prev,
      selectedAgents: selectedIds,
    }));
  };

  const handleAgentToggleStatus = async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;
      
      await updateAgent({
        variables: {
          id: agentId,
          input: {
            status: newStatus
          }
        }
      });
      
      // Refresh agents
      refetch();
    } catch (err) {
      console.error('Failed to toggle agent status:', err);
    }
  };

  const handleAgentConfigure = (agent: Agent) => {
    console.log('Opening configuration for agent:', agent.name);
    // TODO: Implement agent configuration modal/page
    alert(`Configuration panel for ${agent.name} is not yet implemented.`);
  };

  const handleAgentViewLogs = (agent: Agent) => {
    console.log('Opening logs for agent:', agent.name);
    // TODO: Implement agent logs modal/page
    alert(`Logs viewer for ${agent.name} is not yet implemented.`);
  };

  const registryActions = useMemo(() => ({
    onAgentSelect: handleAgentSelect,
    onSelectionChange: handleSelectionChange,
    onStatusToggle: handleAgentToggleStatus,
    onRefresh: () => refetch(),
  }), [refetch]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error loading agents: {error.message}</div>;

  return (
    <div className={`w-full h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Agent Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage and monitor your AI agents
            </p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('registry')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'registry'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Registry
            </button>
            <button
              onClick={() => setActiveTab('lifecycle')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'lifecycle'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Lifecycle
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'monitoring'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Monitoring
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'registry' && (
          <AgentRegistry
            agents={agents}
            loading={loading}
            error={error?.message || null}
            selectedAgent={registryState.selectedAgent}
            onAgentSelect={handleAgentSelect}
            onAgentToggleStatus={handleAgentToggleStatus}
            onAgentConfigure={handleAgentConfigure}
            onAgentViewLogs={handleAgentViewLogs}
          />
        )}
        
        {activeTab === 'lifecycle' && (
          <AgentLifecycle
            agents={agents}
            selectedAgent={registryState.selectedAgent}
            selectedAgents={managementState.selectedAgents}
            onAgentSelect={handleAgentSelect}
            onSelectionChange={handleSelectionChange}
          />
        )}
        
        {activeTab === 'monitoring' && (
          <PerformanceMetrics
            agents={agents}
            selectedAgent={registryState.selectedAgent}
          />
        )}
      </div>
    </div>
  );
};

export default AgentManagement;