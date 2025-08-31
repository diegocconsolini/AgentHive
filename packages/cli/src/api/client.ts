import { GraphQLClient as GQLClient, RequestDocument, Variables } from 'graphql-request';
import { ConfigManager } from '../lib/config.js';
import { CLIError, ErrorCode, ErrorHandler } from '../utils/errors.js';
import { WebSocket } from 'ws';
import chalk from 'chalk';

export interface ApiClientOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  debug?: boolean;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
}

export class ApiClient {
  private client: GQLClient | null = null;
  private config: ConfigManager;
  private options: ApiClientOptions;
  private wsConnection: WebSocket | null = null;

  constructor(options: ApiClientOptions = {}) {
    this.config = new ConfigManager();
    this.options = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      debug: false,
      ...options
    };
  }

  private async getClient(): Promise<GQLClient> {
    if (!this.client) {
      const apiConfig = await this.config.getApiConfig();
      this.client = new GQLClient(apiConfig.graphqlUrl, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'memory-manager-cli/1.0.0'
        }
      });
    }
    return this.client;
  }

  private async setAuthHeaders(client: GQLClient, skipAuth = false): Promise<void> {
    if (skipAuth) return;

    const token = await this.config.getAuthToken();
    if (token) {
      client.setHeader('authorization', `Bearer ${token}`);
    } else {
      client.setHeader('authorization', '');
    }
  }

  async request<T = any>(
    document: RequestDocument,
    variables?: Variables,
    options: RequestOptions = {}
  ): Promise<{ data?: T; errors?: any[] }> {
    const { timeout, retries = this.options.retries, skipAuth } = options;

    return ErrorHandler.withRetry(async () => {
      const client = await this.getClient();
      await this.setAuthHeaders(client, skipAuth);

      // Override timeout if specified
      if (timeout) {
        client.setHeader('timeout', timeout.toString());
      }

      if (this.options.debug) {
        console.log(chalk.gray('[DEBUG] GraphQL Request:'), {
          query: document.toString().split('\n')[0] + '...',
          variables: variables ? Object.keys(variables) : []
        });
      }

      try {
        const data = await client.request<T>(document, variables);
        
        if (this.options.debug) {
          console.log(chalk.gray('[DEBUG] GraphQL Response: Success'));
        }

        return { data };
      } catch (error: any) {
        if (this.options.debug) {
          console.log(chalk.gray('[DEBUG] GraphQL Error:'), error.message);
        }

        return this.handleGraphQLError(error, document, variables);
      }
    }, retries, this.options.retryDelay, this.options.backoffMultiplier);
  }

  private async handleGraphQLError(error: any, document: RequestDocument, variables?: Variables): Promise<{ data?: any; errors?: any[] }> {
    // Handle GraphQL errors
    if (error.response?.errors) {
      return { errors: error.response.errors };
    }

    // Handle HTTP status errors
    if (error.response?.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry with fresh token
        const client = await this.getClient();
        await this.setAuthHeaders(client);
        const data = await client.request(document, variables);
        return { data };
      } else {
        throw new CLIError(
          'Authentication required. Please login again.',
          ErrorCode.AUTHENTICATION_REQUIRED,
          { status: 401 },
          ['Run "memory auth login" to authenticate']
        );
      }
    }

    // Convert other errors to CLIError
    throw CLIError.fromApiError(error);
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await this.config.get('auth.refreshToken');
      if (!refreshToken) return false;

      const mutation = `
        mutation RefreshToken($token: String!) {
          refreshToken(token: $token) {
            accessToken
            refreshToken
            expiresIn
          }
        }
      `;

      // Create a new client without auth for refresh request
      const apiConfig = await this.config.getApiConfig();
      const refreshClient = new GQLClient(apiConfig.graphqlUrl, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await refreshClient.request(mutation, { token: refreshToken }) as any;

      if (result.refreshToken) {
        const { accessToken, refreshToken: newRefreshToken } = result.refreshToken;
        
        await this.config.set('auth.accessToken', accessToken);
        await this.config.set('auth.refreshToken', newRefreshToken);
        
        if (this.client) {
          this.client.setHeader('authorization', `Bearer ${accessToken}`);
        }
        
        return true;
      }

      return false;
    } catch (error) {
      // Refresh failed, clear auth
      await this.config.delete('auth.accessToken');
      await this.config.delete('auth.refreshToken');
      await this.config.delete('auth.user');
      return false;
    }
  }

  // WebSocket connection for real-time updates
  async connectWebSocket(onMessage?: (message: any) => void): Promise<WebSocket> {
    const apiConfig = await this.config.getApiConfig();
    const wsUrl = apiConfig.graphqlUrl.replace('http', 'ws').replace('/graphql', '/ws');
    const token = await this.config.getAuthToken();

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl, {
        headers: token ? { authorization: `Bearer ${token}` } : {}
      });

      ws.on('open', () => {
        this.wsConnection = ws;
        if (this.options.debug) {
          console.log(chalk.gray('[DEBUG] WebSocket connected'));
        }
        resolve(ws);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (this.options.debug) {
            console.log(chalk.gray('[DEBUG] WebSocket message:'), message);
          }
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      ws.on('error', (error) => {
        if (this.options.debug) {
          console.log(chalk.gray('[DEBUG] WebSocket error:'), error.message);
        }
        reject(new CLIError(
          `WebSocket connection failed: ${error.message}`,
          ErrorCode.NETWORK_ERROR,
          { error: error.message }
        ));
      });

      ws.on('close', () => {
        this.wsConnection = null;
        if (this.options.debug) {
          console.log(chalk.gray('[DEBUG] WebSocket disconnected'));
        }
      });
    });
  }

  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  // Health check endpoint
  async healthCheck(): Promise<{ status: string; timestamp: string; services: any[] }> {
    try {
      const response = await this.request(`
        query HealthCheck {
          health {
            status
            timestamp
            services {
              name
              status
              responseTime
              lastCheck
              details
            }
          }
        }
      `, {}, { skipAuth: true, timeout: 5000 });

      if (response.errors) {
        throw new CLIError(
          'Health check failed',
          ErrorCode.API_ERROR,
          { errors: response.errors }
        );
      }

      return response.data?.health || {
        status: 'unknown',
        timestamp: new Date().toISOString(),
        services: []
      };
    } catch (error) {
      throw CLIError.fromApiError(error);
    }
  }

  // Test connectivity
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  // Batch requests for efficiency
  async batchRequest(requests: Array<{ query: RequestDocument; variables?: Variables }>): Promise<any[]> {
    const results = [];
    
    for (const request of requests) {
      try {
        const result = await this.request(request.query, request.variables);
        results.push({ success: true, data: result.data, errors: result.errors });
      } catch (error) {
        results.push({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return results;
  }

  // Upload file (if supported by API)
  async uploadFile(file: Buffer | string, filename: string, metadata?: Record<string, any>): Promise<any> {
    const apiConfig = await this.config.getApiConfig();
    const uploadUrl = apiConfig.url + '/upload';
    const token = await this.config.getAuthToken();

    // Use node-fetch compatible FormData or multipart approach
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    
    if (typeof file === 'string') {
      // File path - read from filesystem
      const fs = await import('fs');
      formData.append('file', fs.createReadStream(file), filename);
    } else {
      // Buffer data
      formData.append('file', file, filename);
    }

    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...formData.getHeaders()
      },
      body: formData as any
    });

    if (!response.ok) {
      throw new CLIError(
        `File upload failed: ${response.statusText}`,
        ErrorCode.API_ERROR,
        { status: response.status, statusText: response.statusText }
      );
    }

    return response.json();
  }

  // Stream large responses
  async streamRequest<T>(
    document: RequestDocument,
    variables?: Variables,
    onChunk?: (chunk: T) => void
  ): Promise<T[]> {
    // This would typically use Server-Sent Events or streaming JSON
    // For now, we'll implement a basic version
    const result = await this.request<T[]>(document, variables);
    
    if (result.data && Array.isArray(result.data) && onChunk) {
      result.data.forEach(chunk => onChunk(chunk));
    }

    return result.data || [];
  }

  // Get API version and compatibility info
  async getApiInfo(): Promise<{ version: string; features: string[]; compatibility: any }> {
    const response = await this.request(`
      query ApiInfo {
        apiInfo {
          version
          features
          compatibility {
            minClientVersion
            deprecatedFeatures
          }
        }
      }
    `, {}, { skipAuth: true });

    return response.data?.apiInfo || {
      version: 'unknown',
      features: [],
      compatibility: {}
    };
  }

  // Performance monitoring
  private performanceMetrics: Map<string, number[]> = new Map();

  private recordMetric(operation: string, duration: number): void {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    
    const metrics = this.performanceMetrics.get(operation)!;
    metrics.push(duration);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  getPerformanceMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: any = {};
    
    for (const [operation, times] of this.performanceMetrics.entries()) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      result[operation] = { avg, min, max, count: times.length };
    }
    
    return result;
  }

  // Close all connections
  async close(): Promise<void> {
    this.disconnectWebSocket();
    this.client = null;
  }
}