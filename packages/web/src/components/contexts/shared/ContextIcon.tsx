import React from 'react';
import { Context, ContextType } from '../../../types/context';

interface ContextIconProps {
  type: ContextType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const iconMap: Record<ContextType, string> = {
  text: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  json: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
  code: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  markdown: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
  yaml: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  xml: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  csv: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2zM3 9h18M9 9v10m6-10v10',
  binary: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  document: 'M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M4 5a2 2 0 012-2v0a2 2 0 012 2v0a2 2 0 012 2H6a2 2 0 01-2-2V5z M6 7h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z'
};

const colorMap: Record<ContextType, string> = {
  text: 'text-slate-600 dark:text-slate-400',
  json: 'text-yellow-600 dark:text-yellow-400',
  code: 'text-blue-600 dark:text-blue-400',
  markdown: 'text-green-600 dark:text-green-400',
  yaml: 'text-orange-600 dark:text-orange-400',
  xml: 'text-red-600 dark:text-red-400',
  csv: 'text-purple-600 dark:text-purple-400',
  binary: 'text-gray-600 dark:text-gray-400',
  image: 'text-pink-600 dark:text-pink-400',
  document: 'text-indigo-600 dark:text-indigo-400'
};

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8'
};

export const ContextIcon: React.FC<ContextIconProps> = ({
  type,
  size = 'md',
  className = ''
}) => {
  const iconPath = iconMap[type] || iconMap.text;
  const colorClass = colorMap[type] || colorMap.text;
  const sizeClass = sizeMap[size];

  return (
    <svg
      className={`${sizeClass} ${colorClass} ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={iconPath}
      />
    </svg>
  );
};

export default ContextIcon;