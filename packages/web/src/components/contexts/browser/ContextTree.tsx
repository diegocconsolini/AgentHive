import React, { useState, useMemo } from 'react';
import { Context, ContextRelationship } from '../../../types/context';
import { ContextIcon, ImportanceBadge } from '../shared';

interface ContextTreeProps {
  contexts: Context[];
  relationships: ContextRelationship[];
  selectedContexts: string[];
  onContextSelect: (context: Context) => void;
  onContextToggle: (context: Context) => void;
  showCheckboxes?: boolean;
  className?: string;
}

interface TreeNode {
  context: Context;
  children: TreeNode[];
  parent: TreeNode | null;
  depth: number;
  isExpanded: boolean;
}

export const ContextTree: React.FC<ContextTreeProps> = ({
  contexts = [], // Default to empty array
  relationships = [], // Default to empty array
  selectedContexts = [],
  onContextSelect,
  onContextToggle,
  showCheckboxes = false,
  className = ''
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build tree structure from contexts and relationships
  const treeNodes = useMemo(() => {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Create nodes for all contexts (with safe access)
    contexts?.forEach(context => {
      if (!context || !context.id) return; // Skip invalid contexts
      
      nodeMap.set(context.id, {
        context,
        children: [],
        parent: null,
        depth: 0,
        isExpanded: expandedNodes.has(context.id)
      });
    });

    // Build parent-child relationships (with safe access)
    relationships?.forEach(rel => {
      if (!rel || !rel.targetContextId || !rel.id) return; // Skip invalid relationships
      
      const parentNode = nodeMap.get(rel.targetContextId);
      const childNode = nodeMap.get(rel.id);

      if (parentNode && childNode && (
        rel.type === 'parent_of' || 
        rel.type === 'depends_on' || 
        rel.type === 'references'
      )) {
        childNode.parent = parentNode;
        parentNode.children.push(childNode);
      }
    });

    // Calculate depths and identify root nodes
    const calculateDepth = (node: TreeNode, depth = 0): void => {
      node.depth = depth;
      node.children.forEach(child => calculateDepth(child, depth + 1));
    };

    nodeMap.forEach(node => {
      if (!node.parent) {
        rootNodes.push(node);
        calculateDepth(node);
      }
    });

    // Sort nodes by importance within each level
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.sort((a, b) => {
        return b.context.importance.overall - a.context.importance.overall;
      });
    };

    const sortAllNodes = (nodes: TreeNode[]): TreeNode[] => {
      return sortNodes(nodes).map(node => ({
        ...node,
        children: sortAllNodes(node.children)
      }));
    };

    return sortAllNodes(rootNodes);
  }, [contexts, relationships, expandedNodes]);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allNodeIds = contexts?.map(c => c.id).filter(Boolean) || [];
    setExpandedNodes(new Set(allNodeIds));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const renderNode = (node: TreeNode): React.ReactNode => {
    const { context } = node;
    const isSelected = selectedContexts.includes(context.id);
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(context.id);

    const formatDate = (date: Date) => {
      const now = new Date();
      const diff = now.getTime() - new Date(date).getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days}d ago`;
      return new Date(date).toLocaleDateString();
    };

    return (
      <div key={context.id}>
        {/* Node Row */}
        <div
          className={`
            flex items-center gap-2 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
            ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''}
            ${context.isArchived ? 'opacity-75' : ''}
            ${context.isStale ? 'bg-orange-50 dark:bg-orange-900/20' : ''}
          `}
          style={{ paddingLeft: `${12 + node.depth * 24}px` }}
        >
          {/* Expand/Collapse Button */}
          <div className="w-6 h-6 flex items-center justify-center">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(context.id);
                }}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg 
                  className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>

          {/* Checkbox */}
          {showCheckboxes && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onContextToggle(context)}
              onClick={(e) => e.stopPropagation()}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
          )}

          {/* Context Icon */}
          <div className="flex-shrink-0">
            <ContextIcon type={context.type} size="sm" />
          </div>

          {/* Context Info */}
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onContextSelect(context)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {context.title || `Untitled ${context.type}`}
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>{Math.round(context.metadata.size / 1024)} KB</span>
                  <span>•</span>
                  <span>{formatDate(context.updatedAt)}</span>
                  {context.source && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600 dark:text-blue-400">{context.source}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-2">
                <ImportanceBadge 
                  importance={context.importance} 
                  size="sm" 
                  showScore={false}
                />
                {hasChildren && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                    {node.children.length}
                  </span>
                )}
              </div>
            </div>
            
            {/* Tags */}
            {context.tags && context.tags.length > 0 && (
              <div className="flex gap-1 mt-1">
                {context.tags.slice(0, 2).map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100"
                  >
                    {tag}
                  </span>
                ))}
                {context.tags.length > 2 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{context.tags.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Status Indicators */}
            <div className="flex items-center gap-1 mt-1">
              {context.isStale && (
                <span className="text-xs text-orange-600 dark:text-orange-400">Stale</span>
              )}
              {context.isArchived && (
                <span className="text-xs text-gray-600 dark:text-gray-400">Archived</span>
              )}
              {context.version > 1 && (
                <span className="text-xs text-purple-600 dark:text-purple-400">v{context.version}</span>
              )}
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(childNode => renderNode(childNode))}
          </div>
        )}
      </div>
    );
  };

  if (treeNodes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="mt-4 text-sm">No contexts to display</p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 ${className}`}>
      {/* Tree Controls */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {contexts.length} contexts in tree view
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {treeNodes.map(node => renderNode(node))}
      </div>
    </div>
  );
};

export default ContextTree;