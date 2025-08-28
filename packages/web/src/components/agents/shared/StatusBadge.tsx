import React from 'react';
import { AgentStatus } from '../../../types';

interface StatusBadgeProps {
  status: AgentStatus;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<AgentStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  stopped: {
    label: 'Stopped',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-600',
    icon: '⏸️',
  },
  starting: {
    label: 'Starting',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: '🔄',
  },
  running: {
    label: 'Running',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: '✅',
  },
  stopping: {
    label: 'Stopping',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    icon: '⏹️',
  },
  error: {
    label: 'Error',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: '❌',
  },
  active: {
    label: 'Active',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: '✅',
  },
  inactive: {
    label: 'Inactive',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-600',
    icon: '⏸️',
  },
  unknown: {
    label: 'Unknown',
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700',
    icon: '❓',
  },
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showText = true,
  size = 'md',
  className = '',
}) => {
  const config = statusConfig[status] || statusConfig.unknown;
  
  return (
    <div className={`
      ${sizeClasses[size]}
      ${config.color}
      ${config.bgColor}
      ${config.borderColor}
      ${className}
      inline-flex items-center gap-1.5
      border rounded-full font-medium
      transition-colors duration-200
    `}>
      <span className="text-xs leading-none">{config.icon}</span>
      {showText && (
        <span className="leading-none">{config.label}</span>
      )}
    </div>
  );
};

// Dot indicator for compact spaces
export const StatusDot: React.FC<Omit<StatusBadgeProps, 'showText'>> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const config = statusConfig[status] || statusConfig.unknown;
  
  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };
  
  return (
    <div 
      className={`
        ${dotSizes[size]}
        ${config.bgColor.replace('bg-', 'bg-').replace('/20', '')}
        ${className}
        rounded-full border-2
        ${config.borderColor}
        transition-colors duration-200
      `}
      title={config.label}
      aria-label={`Agent status: ${config.label}`}
    />
  );
};

StatusBadge.displayName = 'StatusBadge';
StatusDot.displayName = 'StatusDot';