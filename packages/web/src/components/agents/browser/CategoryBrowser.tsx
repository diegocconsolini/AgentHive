import React from 'react';
import { AgentCategory, Agent } from '../../../types';
import { AgentIcon } from '../shared';

interface CategoryBrowserProps {
  agents: Agent[];
  selectedCategory?: AgentCategory;
  onCategorySelect: (category?: AgentCategory) => void;
  className?: string;
}

// Dynamic category info based on actual data
const getCategoryInfo = (category: string) => {
  const colors = [
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  ];
  
  const colorIndex = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  
  return {
    label: category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    description: `${category.charAt(0).toUpperCase() + category.slice(1)} agents and tools`,
    color: colors[colorIndex],
  };
};

export const CategoryBrowser: React.FC<CategoryBrowserProps> = ({
  agents,
  selectedCategory,
  onCategorySelect,
  className = '',
}) => {
  // Count agents by category
  const categoryCounts = agents.reduce((acc, agent) => {
    acc[agent.category] = (acc[agent.category] || 0) + 1;
    return acc;
  }, {} as Record<AgentCategory, number>);

  // Get active agents count by category
  const activeCounts = agents
    .filter(agent => agent.status === 'active')
    .reduce((acc, agent) => {
      acc[agent.category] = (acc[agent.category] || 0) + 1;
      return acc;
    }, {} as Record<AgentCategory, number>);

  const availableCategories = Object.keys(categoryCounts).sort();

  return (
    <div className={`${className} space-y-3`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Categories
        </h3>
        <button
          onClick={() => onCategorySelect(undefined)}
          className={`text-sm font-medium transition-colors ${
            !selectedCategory
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          View All
        </button>
      </div>

      <div className="space-y-2">
        {availableCategories.map((category) => {
          const info = getCategoryInfo(category);
          const count = categoryCounts[category] || 0;
          const activeCount = activeCounts[category] || 0;
          const isSelected = selectedCategory === category;

          return (
            <div
              key={category}
              onClick={() => onCategorySelect(category)}
              className={`
                p-4 rounded-lg border cursor-pointer transition-all duration-200
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }
                bg-white dark:bg-gray-800
              `}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <AgentIcon category={category} size="md" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {info.label}
                    </h4>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`
                        px-2 py-1 rounded-full font-medium
                        ${info.color}
                      `}>
                        {count}
                      </span>
                      {activeCount > 0 && (
                        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                          {activeCount} active
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {info.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {agents.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Total Agents
            </div>
          </div>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {agents.filter(a => a.status === 'active').length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Active
            </div>
          </div>
        </div>
      </div>

      {/* Popular tags */}
      {(() => {
        const tagCounts: Record<string, number> = {};
        const filteredAgents = selectedCategory 
          ? agents.filter(a => a.category === selectedCategory)
          : agents;
          
        filteredAgents.forEach(agent => {
          agent.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });

        const popularTags = Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8);

        if (popularTags.length === 0) return null;

        return (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Popular Tags
              {selectedCategory && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  in {getCategoryInfo(selectedCategory).label}
                </span>
              )}
            </h4>
            <div className="flex flex-wrap gap-1">
              {popularTags.map(([tag, count]) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md"
                  title={`${count} agents`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

CategoryBrowser.displayName = 'CategoryBrowser';