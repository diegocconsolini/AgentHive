import React, { useState, useCallback } from 'react';
import { Calendar, Clock, ChevronDown } from 'lucide-react';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';
import { TimeRange } from '../../../types/analytics';

interface DateRangePickerProps {
  value: TimeRange;
  onChange: (timeRange: TimeRange) => void;
  className?: string;
  disabled?: boolean;
  showPresets?: boolean;
  presets?: TimeRangePreset[];
}

interface TimeRangePreset {
  label: string;
  value: TimeRange['preset'];
  getRange: () => { start: Date; end: Date };
}

const defaultPresets: TimeRangePreset[] = [
  {
    label: 'Last Hour',
    value: '1h',
    getRange: () => ({
      start: subDays(new Date(), 0),
      end: new Date(),
    }),
  },
  {
    label: 'Last 6 Hours',
    value: '6h',
    getRange: () => ({
      start: subDays(new Date(), 0),
      end: new Date(),
    }),
  },
  {
    label: 'Last 24 Hours',
    value: '24h',
    getRange: () => ({
      start: subDays(new Date(), 1),
      end: new Date(),
    }),
  },
  {
    label: 'Last 7 Days',
    value: '7d',
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 7)),
      end: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last 30 Days',
    value: '30d',
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 30)),
      end: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last 90 Days',
    value: '90d',
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 90)),
      end: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last Year',
    value: '1y',
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 365)),
      end: endOfDay(new Date()),
    }),
  },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
  showPresets = true,
  presets = defaultPresets,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(format(value.start, 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(value.end, 'yyyy-MM-dd'));

  const handlePresetSelect = useCallback((preset: TimeRangePreset) => {
    const range = preset.getRange();
    onChange({
      start: range.start,
      end: range.end,
      preset: preset.value,
    });
    setIsOpen(false);
  }, [onChange]);

  const handleCustomRangeApply = useCallback(() => {
    const start = startOfDay(new Date(customStart));
    const end = endOfDay(new Date(customEnd));
    
    if (start <= end) {
      onChange({
        start,
        end,
        preset: 'custom',
      });
      setIsOpen(false);
    }
  }, [customStart, customEnd, onChange]);

  const formatDisplayValue = useCallback(() => {
    if (value.preset && value.preset !== 'custom') {
      const preset = presets.find(p => p.value === value.preset);
      return preset?.label || 'Custom Range';
    }
    
    const startStr = format(value.start, 'MMM dd');
    const endStr = format(value.end, 'MMM dd, yyyy');
    return `${startStr} - ${endStr}`;
  }, [value, presets]);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 
          rounded-lg bg-white dark:bg-gray-800 text-sm font-medium 
          text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'ring-2 ring-primary-500 border-primary-500' : ''}
        `}
      >
        <Calendar className="w-4 h-4 mr-2" />
        {formatDisplayValue()}
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 z-50 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
            <div className="p-4">
              {showPresets && (
                <>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Quick Select
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {presets.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => handlePresetSelect(preset)}
                          className={`
                            px-3 py-2 text-sm rounded-md border transition-colors
                            ${value.preset === preset.value
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                              : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }
                          `}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Custom Range
                    </h4>
                  </div>
                </>
              )}
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    max={customEnd}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    min={customStart}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCustomRangeApply}
                    disabled={customStart > customEnd}
                    className="px-3 py-2 text-sm bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-md disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Time range selector with refresh controls
interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (timeRange: TimeRange) => void;
  refreshInterval?: number;
  onRefreshIntervalChange?: (interval: number) => void;
  isAutoRefresh?: boolean;
  onToggleAutoRefresh?: (enabled: boolean) => void;
  lastUpdated?: Date;
  className?: string;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  refreshInterval = 30000,
  onRefreshIntervalChange,
  isAutoRefresh = false,
  onToggleAutoRefresh,
  lastUpdated,
  className = '',
}) => {
  const refreshIntervals = [
    { label: '5s', value: 5000 },
    { label: '15s', value: 15000 },
    { label: '30s', value: 30000 },
    { label: '1m', value: 60000 },
    { label: '5m', value: 300000 },
    { label: '15m', value: 900000 },
  ];

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <DateRangePicker
        value={value}
        onChange={onChange}
      />
      
      {onRefreshIntervalChange && (
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <select
            value={refreshInterval}
            onChange={(e) => onRefreshIntervalChange(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {refreshIntervals.map((interval) => (
              <option key={interval.value} value={interval.value}>
                {interval.label}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {onToggleAutoRefresh && (
        <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={isAutoRefresh}
            onChange={(e) => onToggleAutoRefresh(e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
          />
          <span>Auto Refresh</span>
        </label>
      )}
      
      {lastUpdated && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Updated {format(lastUpdated, 'HH:mm:ss')}
        </div>
      )}
    </div>
  );
};