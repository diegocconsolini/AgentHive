// GraphQL operation types
export type GraphQLOperation = 'query' | 'mutation' | 'subscription';

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: Array<string | number>;
    extensions?: Record<string, any>;
  }>;
  extensions?: Record<string, any>;
}

// GraphQL client configuration
export interface GraphQLClientConfig {
  uri: string;
  headers?: Record<string, string>;
  fetchOptions?: RequestInit;
  wsUri?: string;
  reconnect?: boolean;
}