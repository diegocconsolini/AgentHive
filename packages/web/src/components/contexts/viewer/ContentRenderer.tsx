import React, { useState, useEffect, useMemo } from 'react';
import { Context, ContextType } from '../../../types/context';

interface ContentRendererProps {
  context: Context;
  searchQuery?: string;
  showLineNumbers?: boolean;
  editable?: boolean;
  onChange?: (content: string) => void;
  className?: string;
}

interface HighlightMatch {
  start: number;
  end: number;
  text: string;
}

const getLanguageFromType = (type: ContextType): string => {
  const languageMap: Record<ContextType, string> = {
    json: 'json',
    code: 'javascript',
    markdown: 'markdown',
    yaml: 'yaml',
    xml: 'xml',
    csv: 'csv',
    text: 'plaintext',
    binary: 'plaintext',
    image: 'plaintext',
    document: 'plaintext'
  };
  return languageMap[type] || 'plaintext';
};

const findMatches = (content: string, query: string): HighlightMatch[] => {
  if (!query.trim()) return [];
  
  const matches: HighlightMatch[] = [];
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0]
    });
  }
  
  return matches;
};

const highlightContent = (content: string, matches: HighlightMatch[]): React.ReactNode => {
  if (matches.length === 0) return content;

  const sortedMatches = matches.sort((a, b) => a.start - b.start);
  const elements: React.ReactNode[] = [];
  let currentIndex = 0;

  sortedMatches.forEach((match, index) => {
    // Add text before highlight
    if (match.start > currentIndex) {
      elements.push(
        <span key={`text-${index}`}>
          {content.substring(currentIndex, match.start)}
        </span>
      );
    }

    // Add highlighted text
    elements.push(
      <mark 
        key={`highlight-${index}`}
        className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5"
      >
        {match.text}
      </mark>
    );

    currentIndex = match.end;
  });

  // Add remaining text
  if (currentIndex < content.length) {
    elements.push(
      <span key="text-final">
        {content.substring(currentIndex)}
      </span>
    );
  }

  return <>{elements}</>;
};

export const ContentRenderer: React.FC<ContentRendererProps> = ({
  context,
  searchQuery = '',
  showLineNumbers = false,
  editable = false,
  onChange,
  className = ''
}) => {
  const [editContent, setEditContent] = useState(context.content);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditContent(context.content);
  }, [context.content]);

  const language = getLanguageFromType(context.type);
  const matches = useMemo(() => findMatches(context.content, searchQuery), [context.content, searchQuery]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onChange) {
      onChange(editContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(context.content);
    setIsEditing(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(context.content);
      // You might want to show a toast notification here
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const formatContent = (content: string) => {
    if (context.type === 'json') {
      try {
        const parsed = JSON.parse(content);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return content;
      }
    }
    return content;
  };

  const renderContent = () => {
    const formattedContent = formatContent(context.content);
    const highlightedContent = highlightContent(formattedContent, matches);

    if (showLineNumbers) {
      const lines = formattedContent.split('\n');
      return (
        <div className="flex">
          <div className="bg-gray-100 dark:bg-gray-700 px-3 py-4 text-sm text-gray-500 dark:text-gray-400 select-none border-r border-gray-200 dark:border-gray-600">
            {lines.map((_, index) => (
              <div key={index} className="leading-6 min-h-6">
                {index + 1}
              </div>
            ))}
          </div>
          <pre className="flex-1 p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
            <code className={`language-${language}`}>
              {highlightedContent}
            </code>
          </pre>
        </div>
      );
    }

    return (
      <pre className="p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
        <code className={`language-${language}`}>
          {highlightedContent}
        </code>
      </pre>
    );
  };

  const renderEditor = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full h-full p-4 text-sm font-mono resize-none border-none focus:outline-none focus:ring-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            style={{ minHeight: '400px' }}
            placeholder="Enter content..."
          />
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
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
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {context.type.toUpperCase()}
            </span>
            {context.metadata.language && (
              <span className="ml-2">({context.metadata.language})</span>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {context.metadata.wordCount} words • {context.metadata.lineCount} lines • {Math.round(context.metadata.size / 1024)} KB
          </div>
          {matches.length > 0 && (
            <div className="text-sm text-yellow-600 dark:text-yellow-400">
              {matches.length} match{matches.length !== 1 ? 'es' : ''}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
            title="Copy content"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          
          {editable && !isEditing && (
            <button
              onClick={handleEdit}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
              title="Edit content"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}

          <button
            onClick={() => showLineNumbers = !showLineNumbers}
            className={`p-2 rounded-md transition-colors ${
              showLineNumbers 
                ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
            title="Toggle line numbers"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-auto">
        {isEditing ? renderEditor() : renderContent()}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Encoding: {context.metadata.encoding}</span>
            {context.metadata.checksum && (
              <span>Checksum: {context.metadata.checksum.substring(0, 8)}...</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>Version {context.version}</span>
            <span>Last updated: {new Date(context.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentRenderer;