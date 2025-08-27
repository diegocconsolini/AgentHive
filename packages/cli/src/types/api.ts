// API related types for GraphQL communication

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: GraphQLError[];
}

export interface GraphQLError {
  message: string;
  locations?: {
    line: number;
    column: number;
  }[];
  path?: (string | number)[];
  extensions?: {
    code?: string;
    exception?: any;
  };
}

// Authentication mutations and queries
export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginMutation {
  login: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
}

export interface RefreshTokenMutation {
  refreshToken: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface MeQuery {
  me: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// Memory mutations and queries
export interface CreateMemoryInput {
  title: string;
  content: string;
  tags?: string[];
}

export interface UpdateMemoryInput {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface MemoryFilter {
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  createdAfter?: string;
  createdBefore?: string;
}

export interface MemoryQuery {
  memory: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  };
}

export interface MemoriesQuery {
  memories: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  }[];
}

export interface CreateMemoryMutation {
  createMemory: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
  };
}

export interface UpdateMemoryMutation {
  updateMemory: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    updatedAt: string;
  };
}

export interface DeleteMemoryMutation {
  deleteMemory: boolean;
}

// Health and system queries
export interface HealthQuery {
  __schema: {
    queryType: {
      name: string;
    };
  };
}

// GraphQL client interface
export interface GraphQLClientInterface {
  request<T = any>(document: string, variables?: Record<string, any>): Promise<GraphQLResponse<T>>;
  setHeader(key: string, value: string): void;
}

// API client configuration
export interface ApiClientConfig {
  url: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

// Request options
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  variables?: Record<string, any>;
}