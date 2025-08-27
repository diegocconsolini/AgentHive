import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';

export class ConfigManager {
  private conf: Conf<any>;
  private defaultConfig: any;

  constructor() {
    this.defaultConfig = {
      api: {
        url: 'http://localhost:4000',
        graphqlUrl: 'http://localhost:4000/graphql',
      },
      preferences: {
        editor: process.env.EDITOR || 'vi',
        pager: process.env.PAGER || 'less',
        outputFormat: 'table',
      },
    };

    this.conf = new Conf({
      projectName: 'memory-manager-cli',
      configName: 'config',
      cwd: join(homedir(), '.memory-manager'),
      defaults: this.defaultConfig,
    });
  }

  async get<T = any>(key: string): Promise<T | undefined> {
    return this.conf.get(key) as T;
  }

  async set(key: string, value: any): Promise<void> {
    this.conf.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.conf.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.conf.has(key);
  }

  async getAll(): Promise<Record<string, any>> {
    return this.conf.store;
  }

  async clear(): Promise<void> {
    this.conf.clear();
  }

  getPath(): string {
    return this.conf.path;
  }

  // Convenience methods for common operations
  async getAuthToken(): Promise<string | undefined> {
    return this.get('auth.accessToken');
  }

  async getUser(): Promise<any> {
    return this.get('auth.user');
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    const user = await this.getUser();
    return !!(token && user);
  }

  async getApiConfig(): Promise<{ url: string; graphqlUrl: string }> {
    const api = await this.get('api');
    return api || this.defaultConfig.api;
  }

  async getPreferences(): Promise<any> {
    const preferences = await this.get('preferences');
    return { ...this.defaultConfig.preferences, ...preferences };
  }
}