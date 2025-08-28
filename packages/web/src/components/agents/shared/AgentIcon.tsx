import React from 'react';
import { AgentCategory, ClaudeModel } from '../../../types';

interface AgentIconProps {
  category: AgentCategory;
  model?: ClaudeModel;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Dynamic icon mapping based on category name
const getCategoryIcon = (category: string): string => {
  const iconMap: Record<string, string> = {
    'development': '💻',
    'devops': '🏗️',
    'ai-ml': '🧠', 
    'security': '🔒',
    'data': '📊',
    'business': '💼',
    'general': '⚙️',
    'content': '✍️',
    'design': '🎨',
    'specialized': '🔧',
    'testing': '🧪',
  };
  
  return iconMap[category] || '📦'; // Default icon if category not found
};

// Dynamic model color mapping
const getModelColor = (model: string): string => {
  if (model.includes('haiku')) return 'text-emerald-500';
  if (model.includes('sonnet')) return 'text-blue-500';
  if (model.includes('opus')) return 'text-purple-500';
  return 'text-gray-500'; // Default color
};

const sizeClasses = {
  sm: 'w-6 h-6 text-sm',
  md: 'w-8 h-8 text-base',
  lg: 'w-10 h-10 text-lg',
  xl: 'w-12 h-12 text-xl',
};

export const AgentIcon: React.FC<AgentIconProps> = ({ 
  category, 
  model, 
  size = 'md',
  className = '' 
}) => {
  const icon = getCategoryIcon(category);
  const modelColor = model ? getModelColor(model) : '';
  
  return (
    <div className={`
      ${sizeClasses[size]} 
      ${className}
      relative flex items-center justify-center
      bg-gray-100 dark:bg-gray-800
      rounded-lg border border-gray-200 dark:border-gray-700
      transition-colors duration-200
    `}>
      <span className="text-lg leading-none">{icon}</span>
      {model && (
        <div className={`
          absolute -top-1 -right-1 
          w-3 h-3 rounded-full 
          ${modelColor} 
          bg-current opacity-80
        `} />
      )}
    </div>
  );
};

AgentIcon.displayName = 'AgentIcon';