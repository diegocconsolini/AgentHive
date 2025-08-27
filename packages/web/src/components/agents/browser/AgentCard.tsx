import React from 'react';
import { Agent } from '../../../types';
import { AgentIcon, StatusBadge } from '../shared';

interface AgentCardProps {
  agent: Agent;
  isSelected?: boolean;
  onSelect?: (agent: Agent) => void;
  onToggleStatus?: (agentId: string, currentStatus: string) => void;
  compact?: boolean;
  showControls?: boolean;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isSelected = false,
  onSelect,
  onToggleStatus,
  compact = false,
  showControls = true,
}) => {
  const handleCardClick = () => {
    onSelect?.(agent);
  };

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleStatus?.(agent.id, agent.status);
  };

  if (compact) {
    return (
      <div 
        className={`
          p-3 rounded-lg border cursor-pointer transition-all duration-200
          ${isSelected 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }
          hover:shadow-sm
        `}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3">
          <AgentIcon category={agent.category} model={agent.model} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {agent.name}
              </h3>
              <StatusBadge status={agent.status} showText={false} size="sm" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {agent.description}
            </p>
          </div>
          {agent.performance?.healthScore && (
            <div className="text-xs font-medium">
              <span className={`
                px-2 py-1 rounded-full
                ${agent.performance.healthScore >= 80 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : agent.performance.healthScore >= 60
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }
              `}>
                {agent.performance.healthScore}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        p-6 rounded-xl border cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg'
        }
        bg-white dark:bg-gray-800
      `}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-4">
        <AgentIcon category={agent.category} model={agent.model} size="lg" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {agent.name}
              </h3>
              <StatusBadge status={agent.status} />
              {agent.hasErrors && (
                <span 
                  className="text-red-500 text-sm"
                  title={agent.errorMessage || 'Agent has errors'}
                >
                  ⚠️
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              v{agent.version}
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {agent.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {agent.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md"
              >
                {tag}
              </span>
            ))}
            {agent.tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                +{agent.tags.length - 3} more
              </span>
            )}
          </div>

          {/* Capabilities */}
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Capabilities:
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {agent.capabilities.slice(0, 3).join(', ')}
              {agent.capabilities.length > 3 && ` +${agent.capabilities.length - 3} more`}
            </div>
          </div>

          {/* Performance metrics */}
          {agent.performance && (
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <span>Health:</span>
                <span className={`font-medium ${
                  agent.performance.healthScore >= 80 
                    ? 'text-green-600 dark:text-green-400'
                    : agent.performance.healthScore >= 60
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {agent.performance.healthScore}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Avg Response:</span>
                <span className="font-medium">{agent.performance.metrics.avgResponseTime.toFixed(1)}s</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Success Rate:</span>
                <span className="font-medium">{(agent.performance.metrics.successRate * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}

          {/* Quick actions */}
          {showControls && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleToggleStatus}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${agent.status === 'running'
                    ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400'
                    : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400'
                  }
                `}
              >
                {agent.status === 'running' ? 'Stop' : 'Start'}
              </button>
              
              <button className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors">
                Configure
              </button>
              
              <button className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors">
                Logs
              </button>

              <div className="flex items-center gap-1 ml-auto text-xs text-gray-500 dark:text-gray-400">
                <span>★ {agent.rating.toFixed(1)}</span>
                <span>•</span>
                <span>{agent.popularity.toLocaleString()} uses</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

AgentCard.displayName = 'AgentCard';