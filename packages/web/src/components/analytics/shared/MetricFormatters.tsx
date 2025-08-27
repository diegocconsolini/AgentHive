import React from 'react';
import { format } from 'date-fns';

// Utility functions for formatting metrics and values
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
};

export const formatNumber = (value: number, compact = false): string => {
  if (compact) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatCurrency = (value: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatLatency = (ms: number): string => {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

export const formatThroughput = (rps: number): string => {
  if (rps < 1) return `${(rps * 60).toFixed(1)}/min`;
  return `${rps.toFixed(1)}/s`;
};

export const formatTimestamp = (date: Date | string, formatString = 'MMM dd, HH:mm'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatString);
};

export const formatChange = (value: number, suffix = '%'): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}${suffix}`;
};

// React component for formatted metric display
interface MetricValueProps {
  value: number;
  format: 'number' | 'percentage' | 'currency' | 'bytes' | 'duration' | 'latency' | 'throughput';
  decimals?: number;
  compact?: boolean;
  showSign?: boolean;
  suffix?: string;
  className?: string;
}

export const MetricValue: React.FC<MetricValueProps> = ({
  value,
  format: formatType,
  decimals = 1,
  compact = false,
  showSign = false,
  suffix = '',
  className = '',
}) => {
  const formatValue = () => {
    switch (formatType) {
      case 'number':
        return formatNumber(value, compact);
      case 'percentage':
        return formatPercentage(value, decimals);
      case 'currency':
        return formatCurrency(value);
      case 'bytes':
        return formatBytes(value, decimals);
      case 'duration':
        return formatDuration(value);
      case 'latency':
        return formatLatency(value);
      case 'throughput':
        return formatThroughput(value);
      default:
        return value.toString();
    }
  };

  const formattedValue = formatValue();
  const displayValue = showSign && value > 0 ? `+${formattedValue}` : formattedValue;

  return (
    <span className={className}>
      {displayValue}
      {suffix && <span className="text-xs ml-1">{suffix}</span>}
    </span>
  );
};

// Trend indicator component
interface TrendIndicatorProps {
  value: number;
  className?: string;
  showValue?: boolean;
  format?: 'number' | 'percentage';
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  value,
  className = '',
  showValue = true,
  format = 'percentage',
}) => {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const colorClass = isPositive 
    ? 'text-green-600 dark:text-green-400' 
    : isNegative 
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-500 dark:text-gray-400';

  const arrowIcon = isPositive ? '↗' : isNegative ? '↘' : '→';

  return (
    <span className={`inline-flex items-center text-sm ${colorClass} ${className}`}>
      <span className="mr-1">{arrowIcon}</span>
      {showValue && (
        <MetricValue
          value={Math.abs(value)}
          format={format}
          showSign={false}
        />
      )}
    </span>
  );
};

// Status indicator component
interface StatusIndicatorProps {
  status: 'healthy' | 'warning' | 'critical' | 'offline' | 'unknown';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  showLabel = false,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusConfig = {
    healthy: { color: 'bg-green-500', label: 'Healthy' },
    warning: { color: 'bg-yellow-500', label: 'Warning' },
    critical: { color: 'bg-red-500', label: 'Critical' },
    offline: { color: 'bg-gray-500', label: 'Offline' },
    unknown: { color: 'bg-gray-400', label: 'Unknown' },
  };

  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className={`rounded-full ${config.color} ${sizeClasses[size]}`} />
      {showLabel && (
        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          {config.label}
        </span>
      )}
    </div>
  );
};

// Metric card component for displaying key metrics
interface MetricCardProps {
  title: string;
  value: number;
  format: 'number' | 'percentage' | 'currency' | 'bytes' | 'duration' | 'latency' | 'throughput';
  trend?: number;
  trendFormat?: 'number' | 'percentage';
  icon?: React.ReactNode;
  className?: string;
  description?: string;
  status?: 'healthy' | 'warning' | 'critical';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  format,
  trend,
  trendFormat = 'percentage',
  icon,
  className = '',
  description,
  status,
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <div className="flex items-baseline mt-2">
            <MetricValue
              value={value}
              format={format}
              className="text-2xl font-bold text-gray-900 dark:text-gray-100"
            />
            {trend !== undefined && (
              <div className="ml-2">
                <TrendIndicator
                  value={trend}
                  format={trendFormat}
                />
              </div>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end">
          {icon && (
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              {icon}
            </div>
          )}
          {status && (
            <StatusIndicator status={status} showLabel={false} />
          )}
        </div>
      </div>
    </div>
  );
};