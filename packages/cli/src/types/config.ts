// Configuration interfaces for the CLI

export interface ApiConfig {
  url: string;
  graphqlUrl: string;
  timeout?: number;
}

export interface AuthConfig {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface PreferencesConfig {
  editor: string;
  pager: string;
  outputFormat: 'table' | 'json' | 'yaml' | 'csv';
  colors: boolean;
  verbose: boolean;
}

export interface CLIConfig {
  api: ApiConfig;
  auth: AuthConfig;
  preferences: PreferencesConfig;
}

export interface ConfigDefaults {
  api: {
    url: string;
    graphqlUrl: string;
  };
  preferences: {
    editor: string;
    pager: string;
    outputFormat: string;
  };
}

// Configuration validation
export interface ConfigValidationRule {
  path: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  validate?: (value: any) => boolean | string;
}

export interface ConfigValidator {
  rules: ConfigValidationRule[];
  validate(config: any): { valid: boolean; errors: string[] };
}

// Configuration manager interface
export interface ConfigManagerInterface {
  get<T = any>(key: string): Promise<T | undefined>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  getAll(): Promise<Record<string, any>>;
  clear(): Promise<void>;
  getPath(): string;
  
  // Convenience methods
  getAuthToken(): Promise<string | undefined>;
  getUser(): Promise<any>;
  isAuthenticated(): Promise<boolean>;
  getApiConfig(): Promise<ApiConfig>;
  getPreferences(): Promise<PreferencesConfig>;
}

// Environment configuration
export interface EnvironmentConfig {
  NODE_ENV: string;
  API_URL?: string;
  GRAPHQL_URL?: string;
  CONFIG_PATH?: string;
  DEBUG?: boolean;
}