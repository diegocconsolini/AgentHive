// API Response wrapper
export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// GraphQL Error
export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: Array<string | number>;
  extensions?: {
    code?: string;
    [key: string]: any;
  };
}

// Pagination
export interface PaginationInput {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface Connection<T> {
  edges: Array<{
    node: T;
    cursor: string;
  }>;
  pageInfo: PageInfo;
  totalCount: number;
}

// Environment configuration
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'staging' | 'production' | 'test';
  API_URL: string;
  GRAPHQL_URL: string;
  WS_URL?: string;
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;
  REFRESH_TOKEN_EXPIRES_IN?: string;
}