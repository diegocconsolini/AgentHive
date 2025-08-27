import { GraphQLClient as GQLClient, RequestDocument, Variables } from 'graphql-request';
import { ConfigManager } from './config.js';

export class GraphQLClient {
  private client: GQLClient;
  private config: ConfigManager;

  constructor() {
    this.config = new ConfigManager();
    // Client will be initialized on first request to use dynamic config
    this.client = null as any;
  }

  private async getClient(): Promise<GQLClient> {
    if (!this.client) {
      const apiConfig = await this.config.getApiConfig();
      this.client = new GQLClient(apiConfig.graphqlUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    return this.client;
  }

  async request<T = any>(
    document: RequestDocument,
    variables?: Variables
  ): Promise<{ data?: T; errors?: any[] }> {
    try {
      const client = await this.getClient();
      
      // Get fresh auth token before request
      const token = await this.config.get('auth.accessToken');
      if (token) {
        client.setHeader('authorization', `Bearer ${token}`);
      } else {
        // Clear auth header if no token
        client.setHeader('authorization', '');
      }

      const data = await client.request<T>(document, variables);
      return { data };
    } catch (error: any) {
      // Handle GraphQL errors
      if (error.response?.errors) {
        return { errors: error.response.errors };
      }

      // Handle network errors
      if (error.response?.status === 401) {
        // Token expired, try to refresh
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the request with fresh token
          const client = await this.getClient();
          const token = await this.config.get('auth.accessToken');
          if (token) {
            client.setHeader('authorization', `Bearer ${token}`);
          }
          const data = await client.request<T>(document, variables);
          return { data };
        } else {
          throw new Error('Authentication required. Please login again.');
        }
      }

      throw error;
    }
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
      const refreshClient = new GQLClient(apiConfig.graphqlUrl);
      const result = await refreshClient.request(mutation, { token: refreshToken }) as any;

      if (result.refreshToken) {
        const { accessToken, refreshToken: newRefreshToken } = result.refreshToken;
        
        // Update stored tokens
        await this.config.set('auth.accessToken', accessToken);
        await this.config.set('auth.refreshToken', newRefreshToken);
        
        // Update client headers if client exists
        if (this.client) {
          this.client.setHeader('authorization', `Bearer ${accessToken}`);
        }
        
        return true;
      }

      return false;
    } catch {
      // Refresh failed, clear auth
      await this.config.delete('auth.accessToken');
      await this.config.delete('auth.refreshToken');
      await this.config.delete('auth.user');
      return false;
    }
  }
}