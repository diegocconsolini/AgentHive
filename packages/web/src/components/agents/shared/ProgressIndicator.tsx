import React from 'react';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  status?: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
  label?: string;
}

const statusColors = {
  pending: 'bg-gray-200 dark:bg-gray-700',
  running: 'bg-blue-500',
  completed: 'bg-green-500',
  error: 'bg-red-500',
  cancelled: 'bg-orange-500',
};

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  status = 'running',
  size = 'md',
  showPercentage = false,
  className = '',
  label,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const progressColor = statusColors[status];
  
  return (
    <div className={`${className} w-full`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`
        ${sizeClasses[size]}
        w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden
      `}>
        <div
          className={`${sizeClasses[size]} ${progressColor} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

// Circular progress indicator for compact spaces
interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  status?: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  className?: string;
  showPercentage?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 40,
  strokeWidth = 4,
  status = 'running',
  className = '',
  showPercentage = true,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;
  
  const statusColors = {
    pending: 'stroke-gray-300',
    running: 'stroke-blue-500',
    completed: 'stroke-green-500',
    error: 'stroke-red-500',
    cancelled: 'stroke-orange-500',
  };
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          className="stroke-gray-200 dark:stroke-gray-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className={`${statusColors[status]} transition-all duration-300 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Indeterminate progress for unknown duration tasks
export const IndeterminateProgress: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  return (
    <div className={`${className} w-full`}>
      <div className={`
        ${sizeClasses[size]}
        w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden
      `}>
        <div className={`
          ${sizeClasses[size]}
          bg-blue-500 rounded-full animate-pulse
          transform scale-x-50 origin-left
        `} 
        style={{
          animation: 'indeterminate 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        }} />
      </div>
      
      <style jsx>{`
        @keyframes indeterminate {
          0% {
            transform: scaleX(0) translateX(0);
          }
          40% {
            transform: scaleX(0.4) translateX(100%);
          }
          100% {
            transform: scaleX(0) translateX(200%);
          }
        }
      `}</style>
    </div>
  );
};

ProgressIndicator.displayName = 'ProgressIndicator';
CircularProgress.displayName = 'CircularProgress';
IndeterminateProgress.displayName = 'IndeterminateProgress';