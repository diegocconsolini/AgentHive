import React from 'react';
import { AgentConfigValidation, ValidationError, ValidationWarning } from '../../../types';

interface ValidationPanelProps {
  validation: AgentConfigValidation;
  className?: string;
}

interface ValidationItemProps {
  type: 'error' | 'warning';
  field: string;
  message: string;
  suggestion?: string;
}

const ValidationItem: React.FC<ValidationItemProps> = ({
  type,
  field,
  message,
  suggestion,
}) => {
  const isError = type === 'error';
  
  return (
    <div className={`
      p-3 rounded-lg border-l-4 
      ${isError 
        ? 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600' 
        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600'
      }
    `}>
      <div className="flex items-start gap-2">
        <div className={`
          flex-shrink-0 w-5 h-5 mt-0.5
          ${isError ? 'text-red-500' : 'text-yellow-500'}
        `}>
          {isError ? (
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`
              text-xs font-medium px-2 py-0.5 rounded-full
              ${isError 
                ? 'bg-red-100 text-red-700 dark:bg-red-800/50 dark:text-red-300'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800/50 dark:text-yellow-300'
              }
            `}>
              {field}
            </span>
            <span className={`
              text-xs font-medium uppercase tracking-wide
              ${isError 
                ? 'text-red-600 dark:text-red-400'
                : 'text-yellow-600 dark:text-yellow-400'
              }
            `}>
              {type}
            </span>
          </div>
          
          <p className={`
            text-sm
            ${isError 
              ? 'text-red-700 dark:text-red-300'
              : 'text-yellow-700 dark:text-yellow-300'
            }
          `}>
            {message}
          </p>
          
          {suggestion && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span className="font-medium">Suggestion:</span> {suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  validation,
  className = '',
}) => {
  const { isValid, errors, warnings } = validation;
  const hasIssues = errors.length > 0 || warnings.length > 0;

  if (!hasIssues && isValid) {
    return (
      <div className={`${className} p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800`}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 text-green-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              Configuration Valid
            </h3>
            <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
              All validation checks passed successfully.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-4`}>
      {/* Summary */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Validation Results
        </h3>
        <div className="flex items-center gap-4 text-sm">
          {errors.length > 0 && (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.length} error{errors.length !== 1 ? 's' : ''}
            </span>
          )}
          {warnings.length > 0 && (
            <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
            </span>
          )}
          <span className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${isValid 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }
          `}>
            {isValid ? 'Valid' : 'Invalid'}
          </span>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Errors ({errors.length})
          </h4>
          <div className="space-y-2">
            {errors.map((error, index) => (
              <ValidationItem
                key={index}
                type="error"
                field={error.field}
                message={error.message}
              />
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Warnings ({warnings.length})
          </h4>
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <ValidationItem
                key={index}
                type="warning"
                field={warning.field}
                message={warning.message}
                suggestion={warning.suggestion}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick fixes */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Quick Actions
          </h4>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-md transition-colors">
              Auto-fix common issues
            </button>
            <button className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-md transition-colors">
              Reset to defaults
            </button>
            <button className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-md transition-colors">
              Load template
            </button>
          </div>
        </div>
      )}

      {/* Validation rules info */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Validation Rules
        </h5>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div>• System prompt must be between 10-5000 characters</div>
          <div>• Model must be one of: haiku, sonnet, opus</div>
          <div>• Tools must be valid tool names</div>
          <div>• Parameters must have valid types</div>
          <div>• Environment variables must use valid names</div>
          <div>• Resource limits must be positive numbers</div>
        </div>
      </div>
    </div>
  );
};

ValidationPanel.displayName = 'ValidationPanel';