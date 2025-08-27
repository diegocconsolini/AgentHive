// API client exports
export * from './client.js';
export * from './agents.js';
export * from './contexts.js';
export * from './memory.js';
export * from './analytics.js';

import { ApiClient, ApiClientOptions } from './client.js';
import { AgentsService } from './agents.js';
import { ContextsService } from './contexts.js';
import { MemoryService } from './memory.js';
import { AnalyticsService } from './analytics.js';

export class MemoryManagerAPI {
  public client: ApiClient;
  public agents: AgentsService;
  public contexts: ContextsService;
  public memory: MemoryService;
  public analytics: AnalyticsService;

  constructor(options: ApiClientOptions = {}) {
    this.client = new ApiClient(options);
    this.agents = new AgentsService(this.client);
    this.contexts = new ContextsService(this.client);
    this.memory = new MemoryService(this.client);
    this.analytics = new AnalyticsService(this.client);
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  // Convenience methods for common operations
  async testConnection(): Promise<boolean> {
    return this.client.testConnection();
  }

  async getApiInfo(): Promise<any> {
    return this.client.getApiInfo();
  }

  async healthCheck(): Promise<any> {
    return this.analytics.healthCheck();
  }
}