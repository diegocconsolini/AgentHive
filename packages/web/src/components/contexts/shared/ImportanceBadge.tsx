import React from 'react';
import { ImportanceScore } from '../../../types/context';

interface ImportanceBadgeProps {
  importance: ImportanceScore;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  showFactors?: boolean;
  onClick?: () => void;
  className?: string;
}

const getImportanceColor = (score: number): string => {
  if (score >= 9) return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-700';
  if (score >= 7) return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-100 dark:border-orange-700';
  if (score >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-700';
  if (score >= 3) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700';
  return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600';
};

const getImportanceLabel = (score: number): string => {
  if (score >= 9) return 'Critical';
  if (score >= 7) return 'High';
  if (score >= 5) return 'Medium';
  if (score >= 3) return 'Low';
  return 'Minimal';
};

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base'
};

export const ImportanceBadge: React.FC<ImportanceBadgeProps> = ({
  importance,
  size = 'md',
  showScore = true,
  showFactors = false,
  onClick,
  className = ''
}) => {
  const score = Math.round(importance.overall * 10) / 10;
  const colorClass = getImportanceColor(score);
  const label = getImportanceLabel(score);
  const sizeClass = sizeClasses[size];
  const isClickable = !!onClick;

  const badgeContent = (
    <>
      <div className="flex items-center gap-1">
        {importance.isManuallySet && (
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        )}
        {importance.isLocked && (
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        )}
        {showScore ? `${score}/10` : label}
      </div>
      
      {showFactors && size !== 'sm' && (
        <div className="mt-1 space-y-1">
          <div className="text-xs opacity-75">
            <div className="flex justify-between">
              <span>Recency:</span>
              <span>{Math.round(importance.factors.recency * 10) / 10}</span>
            </div>
            <div className="flex justify-between">
              <span>Frequency:</span>
              <span>{Math.round(importance.factors.frequency * 10) / 10}</span>
            </div>
            <div className="flex justify-between">
              <span>Relevance:</span>
              <span>{Math.round(importance.factors.relevance * 10) / 10}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (isClickable) {
    return (
      <button
        onClick={onClick}
        className={`
          inline-flex flex-col border rounded-full font-medium transition-colors
          hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${colorClass} ${sizeClass} ${className}
        `}
        title={`Importance: ${score}/10 (${label})${importance.isManuallySet ? ' - Manually set' : ''}${importance.isLocked ? ' - Locked' : ''}`}
      >
        {badgeContent}
      </button>
    );
  }

  return (
    <span
      className={`
        inline-flex flex-col border rounded-full font-medium
        ${colorClass} ${sizeClass} ${className}
      `}
      title={`Importance: ${score}/10 (${label})${importance.isManuallySet ? ' - Manually set' : ''}${importance.isLocked ? ' - Locked' : ''}`}
    >
      {badgeContent}
    </span>
  );
};

export default ImportanceBadge;