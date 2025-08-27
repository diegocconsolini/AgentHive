export interface Context {
  id: string;
  title: string;
  content: string;
  type: ContextType;
  metadata: ContextMetadata;
  importance: ImportanceScore;
  tags: string[];
  relationships: ContextRelationship[];
  createdAt: Date;
  updatedAt: Date;
  accessedAt: Date;
  version: number;
  source: string;
  isStale: boolean;
  isArchived: boolean;
}

export interface ContextMetadata {
  size: number;
  wordCount: number;
  characterCount: number;
  lineCount: number;
  language?: string;
  encoding: string;
  checksum: string;
  originalPath?: string;
  mimeType?: string;
}

export interface ImportanceScore {
  overall: number;
  factors: {
    recency: number;
    frequency: number;
    relevance: number;
    userRating: number;
    accessPattern: number;
  };
  isManuallySet: boolean;
  isLocked: boolean;
  lastCalculated: Date;
}

export interface ContextRelationship {
  id: string;
  targetContextId: string;
  type: RelationshipType;
  strength: number;
  description?: string;
  isAutoDetected: boolean;
  createdAt: Date;
}

export interface ContextVersion {
  version: number;
  content: string;
  metadata: ContextMetadata;
  changedAt: Date;
  changeType: 'created' | 'updated' | 'importance_changed' | 'tags_updated' | 'archived' | 'restored';
  changeDescription?: string;
  diff?: ContextDiff;
}

export interface ContextDiff {
  additions: DiffLine[];
  deletions: DiffLine[];
  changes: DiffLine[];
}

export interface DiffLine {
  lineNumber: number;
  content: string;
  type: 'added' | 'removed' | 'modified';
}

export interface ContextSearchFilters {
  query: string;
  dateRange: { start: Date; end: Date } | null;
  importanceRange: { min: number; max: number };
  tags: string[];
  contentType: ContextType[];
  source: string[];
  hasRelationships: boolean;
  isStale: boolean;
  isArchived: boolean;
  lastAccessedRange: { start: Date; end: Date } | null;
}

export interface ContextSearchResult extends Context {
  relevance: number;
  matchHighlights: MatchHighlight[];
}

export interface MatchHighlight {
  field: string;
  fragment: string;
  startIndex: number;
  endIndex: number;
}

export interface BulkOperation {
  type: BulkOperationType;
  contextIds: string[];
  parameters: Record<string, any>;
}

export interface MemoryAnalytics {
  totalContexts: number;
  totalSize: number;
  sizeLimit: number;
  averageImportance: number;
  categoryDistribution: CategoryDistribution[];
  accessPatterns: AccessPattern[];
  growthTrend: GrowthTrendPoint[];
  qualityMetrics: QualityMetrics;
  cleanupSuggestions: CleanupSuggestion[];
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
  averageImportance: number;
  totalSize: number;
}

export interface AccessPattern {
  hour: number;
  day: string;
  count: number;
  contexts: string[];
}

export interface GrowthTrendPoint {
  date: Date;
  count: number;
  size: number;
}

export interface QualityMetrics {
  duplicates: number;
  staleContexts: number;
  orphanedContexts: number;
  averageAge: number;
  accessFrequency: number;
  overallScore: number;
}

export interface CleanupSuggestion {
  id: string;
  type: CleanupType;
  contextIds: string[];
  description: string;
  impact: 'low' | 'medium' | 'high';
  estimatedSpaceSaved: number;
  confidence: number;
}

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeRelationships: boolean;
  includeVersionHistory: boolean;
  dateRange?: { start: Date; end: Date };
  importanceThreshold?: number;
  selectedContexts?: string[];
  compression: boolean;
}

export interface ImportOptions {
  format: ExportFormat;
  overwriteExisting: boolean;
  preserveIds: boolean;
  importRelationships: boolean;
  importVersionHistory: boolean;
  tagPrefix?: string;
  sourceLabel?: string;
}

export interface TagSuggestion {
  tag: string;
  confidence: number;
  reason: string;
  contexts: string[];
}

// Enums and Union Types
export type ContextType = 'text' | 'json' | 'code' | 'markdown' | 'yaml' | 'xml' | 'csv' | 'binary' | 'image' | 'document';

export type RelationshipType = 'references' | 'depends_on' | 'similar_to' | 'follows' | 'parent_of' | 'child_of' | 'related_to';

export type BulkOperationType = 'delete' | 'archive' | 'restore' | 'tag_add' | 'tag_remove' | 'importance_update' | 'export' | 'link' | 'unlink';

export type ExportFormat = 'json' | 'csv' | 'markdown' | 'txt' | 'zip';

export type CleanupType = 'duplicate' | 'stale' | 'orphaned' | 'low_importance' | 'unused' | 'corrupted';

export type ViewMode = 'list' | 'card' | 'tree' | 'timeline' | 'category';

export type SortOption = 'importance' | 'created' | 'updated' | 'accessed' | 'size' | 'title' | 'relevance';

export type SortDirection = 'asc' | 'desc';

// Component Props Types
export interface ContextBrowserProps {
  contexts: Context[];
  loading: boolean;
  error?: string;
  onContextSelect: (context: Context) => void;
  onContextsSelect: (contexts: Context[]) => void;
  onSearch: (filters: ContextSearchFilters) => void;
  onSort: (option: SortOption, direction: SortDirection) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedContexts: string[];
  totalCount: number;
}

export interface ContextViewerProps {
  context: Context | null;
  versions: ContextVersion[];
  loading: boolean;
  error?: string;
  onEdit: (context: Context) => void;
  onVersionSelect: (version: ContextVersion) => void;
  onImportanceUpdate: (contextId: string, importance: Partial<ImportanceScore>) => void;
  onTagUpdate: (contextId: string, tags: string[]) => void;
  readOnly: boolean;
}

export interface BulkOperationsProps {
  selectedContexts: string[];
  onOperation: (operation: BulkOperation) => void;
  onClearSelection: () => void;
  loading: boolean;
  availableTags: string[];
}

export interface MemoryAnalyticsProps {
  analytics: MemoryAnalytics;
  loading: boolean;
  error?: string;
  onRefresh: () => void;
  onCleanupAction: (suggestion: CleanupSuggestion) => void;
}

export interface RelationshipGraphProps {
  contexts: Context[];
  relationships: ContextRelationship[];
  selectedContextId?: string;
  onContextSelect: (contextId: string) => void;
  onRelationshipAdd: (fromId: string, toId: string, type: RelationshipType) => void;
  onRelationshipRemove: (relationshipId: string) => void;
  layout: 'force' | 'hierarchical' | 'circular' | 'tree';
}

export interface ImportExportProps {
  onExport: (options: ExportOptions) => void;
  onImport: (file: File, options: ImportOptions) => void;
  exporting: boolean;
  importing: boolean;
  exportProgress?: number;
  importProgress?: number;
  availableContexts: Context[];
  selectedContexts: string[];
}