import React, { useMemo } from 'react';
import { Context, ContextType } from '../../../types/context';

interface ContentPreviewProps {
  context: Context;
  maxLines?: number;
  maxLength?: number;
  showLineNumbers?: boolean;
  highlights?: Array<{ start: number; end: number; className?: string }>;
  className?: string;
}

const getLanguageFromType = (type: ContextType): string => {
  switch (type) {
    case 'json': return 'json';
    case 'code': return 'javascript'; // Default, could be enhanced with language detection
    case 'markdown': return 'markdown';
    case 'yaml': return 'yaml';
    case 'xml': return 'xml';
    case 'csv': return 'csv';
    default: return 'text';
  }
};

const truncateContent = (content: string, maxLines: number, maxLength: number): { content: string; isTruncated: boolean } => {
  let truncated = content;
  let isTruncated = false;

  // Truncate by length first
  if (content.length > maxLength) {
    truncated = content.substring(0, maxLength);
    isTruncated = true;
  }

  // Then truncate by lines
  const lines = truncated.split('\n');
  if (lines.length > maxLines) {
    truncated = lines.slice(0, maxLines).join('\n');
    isTruncated = true;
  }

  return { content: truncated, isTruncated };
};

const highlightText = (text: string, highlights: Array<{ start: number; end: number; className?: string }>): React.ReactNode => {
  if (!highlights || highlights.length === 0) {
    return text;
  }

  const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);
  const elements: React.ReactNode[] = [];
  let currentIndex = 0;

  sortedHighlights.forEach((highlight, index) => {
    // Add text before highlight
    if (highlight.start > currentIndex) {
      elements.push(text.substring(currentIndex, highlight.start));
    }

    // Add highlighted text
    elements.push(
      <span 
        key={index} 
        className={highlight.className || 'bg-yellow-200 dark:bg-yellow-800 rounded px-1'}
      >
        {text.substring(highlight.start, highlight.end)}
      </span>
    );

    currentIndex = highlight.end;
  });

  // Add remaining text
  if (currentIndex < text.length) {
    elements.push(text.substring(currentIndex));
  }

  return <>{elements}</>;
};

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  context,
  maxLines = 10,
  maxLength = 1000,
  showLineNumbers = false,
  highlights,
  className = ''
}) => {
  const { content, isTruncated } = useMemo(
    () => truncateContent(context.content, maxLines, maxLength),
    [context.content, maxLines, maxLength]
  );

  const language = getLanguageFromType(context.type);
  const lines = content.split('\n');

  const renderContent = () => {
    if (context.type === 'json') {
      try {
        const parsed = JSON.parse(content);
        const formatted = JSON.stringify(parsed, null, 2);
        return highlightText(formatted, highlights);
      } catch {
        // If JSON parsing fails, show as text
        return highlightText(content, highlights);
      }
    }

    return highlightText(content, highlights);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border overflow-hidden">
        {/* Header with context info */}
        <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 text-xs text-gray-600 dark:text-gray-400 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{context.type.toUpperCase()}</span>
            <span>•</span>
            <span>{context.metadata.wordCount} words</span>
            <span>•</span>
            <span>{context.metadata.lineCount} lines</span>
            {context.metadata.language && (
              <>
                <span>•</span>
                <span>{context.metadata.language}</span>
              </>
            )}
          </div>
          {isTruncated && (
            <span className="text-orange-600 dark:text-orange-400">
              Truncated
            </span>
          )}
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-96">
          {showLineNumbers ? (
            <div className="flex">
              <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 select-none">
                {lines.map((_, index) => (
                  <div key={index} className="leading-6">
                    {index + 1}
                  </div>
                ))}
              </div>
              <pre className="flex-1 p-3 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                <code className={`language-${language}`}>
                  {renderContent()}
                </code>
              </pre>
            </div>
          ) : (
            <pre className="p-3 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
              <code className={`language-${language}`}>
                {renderContent()}
              </code>
            </pre>
          )}
        </div>
      </div>

      {/* Truncation indicator */}
      {isTruncated && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-50 dark:from-gray-800 to-transparent h-8 flex items-end justify-center pb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 rounded">
            Content truncated...
          </span>
        </div>
      )}
    </div>
  );
};

export default ContentPreview;