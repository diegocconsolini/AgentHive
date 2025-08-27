import React from 'react';
import { AccessPattern } from '../../../types/context';

interface UsagePatternsProps {
  patterns: AccessPattern[];
  className?: string;
}

export const UsagePatterns: React.FC<UsagePatternsProps> = ({
  patterns,
  className = ''
}) => {
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const pattern = patterns.find(p => p.hour === hour);
    return {
      hour,
      count: pattern?.count || 0,
      contexts: pattern?.contexts || []
    };
  });

  const dailyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
    const pattern = patterns.find(p => p.day === day);
    return {
      day,
      count: pattern?.count || 0,
      contexts: pattern?.contexts || []
    };
  });

  const maxHourlyCount = Math.max(...hourlyData.map(d => d.count));
  const maxDailyCount = Math.max(...dailyData.map(d => d.count));

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Usage Patterns
      </h3>

      {/* Hourly Pattern */}
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
          Activity by Hour
        </h4>
        <div className="flex items-end space-x-1 h-32 mb-2">
          {hourlyData.map(({ hour, count }) => (
            <div
              key={hour}
              className="flex-1 flex flex-col items-center"
              title={`${hour}:00 - ${count} accesses`}
            >
              <div
                className="w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t"
                style={{ 
                  height: maxHourlyCount > 0 ? `${(count / maxHourlyCount) * 100}%` : '2px'
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>0</span>
          <span>6</span>
          <span>12</span>
          <span>18</span>
          <span>24</span>
        </div>
      </div>

      {/* Daily Pattern */}
      <div>
        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
          Activity by Day
        </h4>
        <div className="space-y-2">
          {dailyData.map(({ day, count }) => (
            <div key={day} className="flex items-center">
              <div className="w-12 text-sm text-gray-600 dark:text-gray-400">
                {day}
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 ml-3">
                <div
                  className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ 
                    width: maxDailyCount > 0 ? `${Math.max((count / maxDailyCount) * 100, 5)}%` : '5%'
                  }}
                >
                  <span className="text-xs text-white font-medium">
                    {count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UsagePatterns;