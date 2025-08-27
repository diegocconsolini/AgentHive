import React, { useState } from 'react';
import { ImportanceScore } from '../../../types/context';

interface ImportanceScoringProps {
  importance: ImportanceScore;
  onUpdate: (updates: Partial<ImportanceScore>) => void;
  onRecalculate: () => void;
  editable?: boolean;
  showDetails?: boolean;
  className?: string;
}

interface ScoreBreakdown {
  label: string;
  value: number;
  description: string;
  color: string;
  editable: boolean;
}

export const ImportanceScoring: React.FC<ImportanceScoringProps> = ({
  importance,
  onUpdate,
  onRecalculate,
  editable = false,
  showDetails = true,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingValues, setEditingValues] = useState(importance);

  const scoreBreakdown: ScoreBreakdown[] = [
    {
      label: 'Recency',
      value: importance.factors.recency,
      description: 'How recently this context was created or accessed',
      color: 'bg-blue-500',
      editable: true
    },
    {
      label: 'Frequency',
      value: importance.factors.frequency,
      description: 'How often this context has been accessed',
      color: 'bg-green-500',
      editable: true
    },
    {
      label: 'Relevance',
      value: importance.factors.relevance,
      description: 'How relevant this context is to current work',
      color: 'bg-purple-500',
      editable: true
    },
    {
      label: 'User Rating',
      value: importance.factors.userRating,
      description: 'Manual rating assigned by the user',
      color: 'bg-orange-500',
      editable: true
    },
    {
      label: 'Access Pattern',
      value: importance.factors.accessPattern,
      description: 'Pattern of access (recent vs distributed)',
      color: 'bg-pink-500',
      editable: false
    }
  ];

  const handleEdit = () => {
    setEditingValues({ ...importance });
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate({
      ...editingValues,
      isManuallySet: true,
      lastCalculated: new Date()
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingValues({ ...importance });
    setIsEditing(false);
  };

  const handleFactorChange = (factor: keyof ImportanceScore['factors'], value: number) => {
    setEditingValues(prev => ({
      ...prev,
      factors: {
        ...prev.factors,
        [factor]: value
      }
    }));
  };

  const calculateOverallScore = (factors: ImportanceScore['factors']): number => {
    // Weighted average calculation
    const weights = {
      recency: 0.25,
      frequency: 0.20,
      relevance: 0.30,
      userRating: 0.15,
      accessPattern: 0.10
    };

    return (
      factors.recency * weights.recency +
      factors.frequency * weights.frequency +
      factors.relevance * weights.relevance +
      factors.userRating * weights.userRating +
      factors.accessPattern * weights.accessPattern
    );
  };

  const overallScore = isEditing 
    ? calculateOverallScore(editingValues.factors)
    : importance.overall;

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-red-600 dark:text-red-400';
    if (score >= 6) return 'text-orange-600 dark:text-orange-400';
    if (score >= 4) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 2) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 8) return 'Critical';
    if (score >= 6) return 'High';
    if (score >= 4) return 'Medium';
    if (score >= 2) return 'Low';
    return 'Minimal';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Importance Score
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {importance.isManuallySet ? 'Manually adjusted' : 'Automatically calculated'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {importance.isLocked && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Locked
              </span>
            )}
            
            {editable && !isEditing && (
              <button
                onClick={handleEdit}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
              >
                Edit Score
              </button>
            )}
            
            {!importance.isLocked && !isEditing && (
              <button
                onClick={onRecalculate}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm transition-colors"
              >
                Recalculate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overall Score Display */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {overallScore.toFixed(1)}
              <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">/10</span>
            </div>
            <div className={`text-sm font-medium mt-1 ${getScoreColor(overallScore)}`}>
              {getScoreLabel(overallScore)} Priority
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-300 dark:text-gray-600"
                  fill="none"
                  strokeWidth="3"
                  stroke="currentColor"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={getScoreColor(overallScore)}
                  fill="none"
                  strokeWidth="3"
                  strokeDasharray={`${overallScore * 10}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {Math.round(overallScore * 10)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Factor Breakdown */}
      {showDetails && (
        <div className="p-6">
          <div className="space-y-6">
            {scoreBreakdown.map((factor) => {
              const currentValue = isEditing && factor.editable 
                ? editingValues.factors[factor.label.toLowerCase().replace(' ', '') as keyof ImportanceScore['factors']]
                : factor.value;

              return (
                <div key={factor.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {factor.label}
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {factor.description}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {currentValue.toFixed(1)}
                    </span>
                  </div>
                  
                  {isEditing && factor.editable ? (
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={currentValue}
                      onChange={(e) => handleFactorChange(
                        factor.label.toLowerCase().replace(' ', '') as keyof ImportanceScore['factors'],
                        parseFloat(e.target.value)
                      )}
                      className="w-full"
                    />
                  ) : (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${factor.color}`}
                        style={{ width: `${currentValue * 10}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Editing Controls */}
          {isEditing && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingValues.isLocked}
                    onChange={(e) => setEditingValues(prev => ({
                      ...prev,
                      isLocked: e.target.checked
                    }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Lock score to prevent automatic recalculation
                  </span>
                </label>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Score History */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-between">
                <span>Last calculated:</span>
                <span>{new Date(importance.lastCalculated).toLocaleString()}</span>
              </div>
              {importance.isManuallySet && (
                <div className="flex items-center justify-between mt-1">
                  <span>Manually adjusted:</span>
                  <span>Yes</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportanceScoring;