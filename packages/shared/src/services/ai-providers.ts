/**
 * Universal AI Provider Service
 * Supports OpenAI-compatible APIs, Ollama, Anthropic, and other providers
 */

export interface AIProvider {
  name: string;
  type: 'local' | 'api' | 'openai-compatible';
  endpoint: string;
  apiKey?: string;
  models: string[];
  costPerToken?: number;
  maxTokens: number;
  headers?: Record<string, string>;
  timeout?: number;
  enabled: boolean;
  priority: number; // Higher = preferred
}

export interface AIRequest {
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIResponse {
  response: string;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  duration: number;
  provider: string;
  cost?: number;
}

// Provider-specific response types for type safety
interface OllamaResponse {
  response: string;
  prompt_eval_count?: number;
  eval_count?: number;
  total_duration?: number;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

interface AnthropicResponse {
  content: Array<{
    text: string;
  }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  model: string;
}

export interface AIMetrics {
  providerId: string;
  model: string;
  requestCount: number;
  totalTokens: number;
  averageResponseTime: number;
  totalCost: number;
  successRate: number;
  lastUsed: Date;
}

export class AIProviderService {
  private providers: Map<string, AIProvider> = new Map();
  private metrics: Map<string, AIMetrics> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Load providers from environment configuration
    this.loadProvidersFromConfig();
  }

  private loadProvidersFromConfig() {
    const providers = this.getProviderConfigurations();
    
    providers.forEach(provider => {
      if (provider.enabled) {
        this.registerProvider(provider);
      }
    });
  }

  private getProviderConfigurations(): AIProvider[] {
    return [
      // Primary Provider - OpenAI Compatible API
      {
        name: 'primary',
        type: 'openai-compatible',
        endpoint: process.env.AI_PROVIDER_ENDPOINT || 'https://api.openai.com/v1',
        apiKey: process.env.AI_PROVIDER_API_KEY,
        models: (process.env.AI_PROVIDER_MODELS || 'gpt-3.5-turbo,gpt-4').split(','),
        costPerToken: parseFloat(process.env.AI_PROVIDER_COST_PER_TOKEN || '0.002'),
        maxTokens: parseInt(process.env.AI_PROVIDER_MAX_TOKENS || '128000'),
        timeout: parseInt(process.env.AI_PROVIDER_TIMEOUT || '30000'),
        enabled: process.env.AI_PROVIDER_ENABLED !== 'false',
        priority: parseInt(process.env.AI_PROVIDER_PRIORITY || '100'),
        headers: process.env.AI_PROVIDER_HEADERS ? JSON.parse(process.env.AI_PROVIDER_HEADERS) : {}
      },
      
      // Fallback Provider - OpenAI
      {
        name: 'openai',
        type: 'api',
        endpoint: process.env.OPENAI_ENDPOINT || 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY,
        models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
        costPerToken: 0.0015,
        maxTokens: 128000,
        timeout: 30000,
        enabled: !!process.env.OPENAI_API_KEY && process.env.OPENAI_ENABLED !== 'false',
        priority: 80
      },

      // Anthropic Provider
      {
        name: 'anthropic',
        type: 'api',
        endpoint: process.env.ANTHROPIC_ENDPOINT || 'https://api.anthropic.com/v1',
        apiKey: process.env.ANTHROPIC_API_KEY,
        models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
        costPerToken: 0.0008,
        maxTokens: 200000,
        timeout: 30000,
        enabled: !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_ENABLED !== 'false',
        priority: 90
      },

      // Local Ollama Provider (legacy fallback)
      {
        name: 'ollama',
        type: 'local',
        endpoint: process.env.OLLAMA_ENDPOINT || 'http://172.28.96.1:11434',
        models: (process.env.OLLAMA_MODELS || 'mistral:7b-instruct,qwen2.5:14b-instruct,qwen2.5:32b-instruct').split(','),
        costPerToken: 0,
        maxTokens: 16384,
        timeout: 60000,
        enabled: process.env.OLLAMA_ENABLED !== 'false',
        priority: 60
      }
    ];
  }

  registerProvider(provider: AIProvider) {
    this.providers.set(provider.name, provider);
    
    // Initialize metrics
    this.metrics.set(provider.name, {
      providerId: provider.name,
      model: '',
      requestCount: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      totalCost: 0,
      successRate: 1.0,
      lastUsed: new Date()
    });
  }

  async generateResponse(request: AIRequest, providerId?: string): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Auto-select provider if not specified
    if (!providerId) {
      providerId = this.selectOptimalProvider(request);
    }

    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    let response: AIResponse;
    
    switch (provider.type) {
      case 'local':
        if (provider.name === 'ollama') {
          response = await this.callOllama(provider, request);
        } else {
          throw new Error(`Local provider ${provider.name} not implemented`);
        }
        break;
      case 'openai-compatible':
        response = await this.callOpenAICompatible(provider, request);
        break;
      case 'api':
        if (provider.name === 'openai') {
          response = await this.callOpenAI(provider, request);
        } else if (provider.name === 'anthropic') {
          response = await this.callAnthropic(provider, request);
        } else {
          throw new Error(`API provider ${provider.name} not implemented`);
        }
        break;
      default:
        throw new Error(`Provider type ${provider.type} not implemented`);
    }

    // Update metrics
    this.updateMetrics(providerId, response, Date.now() - startTime);
    
    return response;
  }

  private async callOllama(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
    const payload = {
      model: request.model,
      prompt: request.systemPrompt ? 
        `System: ${request.systemPrompt}\n\nUser: ${request.prompt}` : 
        request.prompt,
      stream: false,
      options: {
        temperature: request.temperature || 0.7,
        num_predict: request.maxTokens || 4096
      }
    };

    const response = await fetch(`${provider.endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json() as OllamaResponse;
    
    return {
      response: data.response,
      model: request.model,
      tokens: {
        prompt: data.prompt_eval_count || 0,
        completion: data.eval_count || 0,
        total: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      },
      duration: Math.round((data.total_duration || 0) / 1000000), // Convert to ms
      provider: 'ollama',
      cost: 0 // Free local inference
    };
  }

  private async callOpenAICompatible(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
    const messages = [];
    
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt
      });
    }
    
    messages.push({
      role: 'user', 
      content: request.prompt
    });

    const payload = {
      model: request.model,
      messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 4096,
      stream: request.stream || false
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...provider.headers
    };

    if (provider.apiKey) {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    const startTime = Date.now();
    const response = await fetch(`${provider.endpoint}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(provider.timeout || 30000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${provider.name} API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as OpenAIResponse;
    const duration = Date.now() - startTime;
    
    const totalTokens = data.usage?.total_tokens || 0;
    const promptTokens = data.usage?.prompt_tokens || 0;
    const completionTokens = data.usage?.completion_tokens || 0;
    
    return {
      response: data.choices[0]?.message?.content || '',
      model: request.model,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: totalTokens
      },
      duration,
      provider: provider.name,
      cost: totalTokens * (provider.costPerToken || 0)
    };
  }

  private async callOpenAI(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
    // Use the OpenAI-compatible implementation
    return this.callOpenAICompatible(provider, request);
  }

  private async callAnthropic(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
    const payload = {
      model: request.model,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
      messages: [
        {
          role: 'user',
          content: request.systemPrompt ? 
            `${request.systemPrompt}\n\n${request.prompt}` : 
            request.prompt
        }
      ]
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': provider.apiKey || '',
      'anthropic-version': '2023-06-01',
      ...provider.headers
    };

    const startTime = Date.now();
    const response = await fetch(`${provider.endpoint}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(provider.timeout || 30000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as AnthropicResponse;
    const duration = Date.now() - startTime;
    
    const totalTokens = data.usage?.input_tokens + data.usage?.output_tokens || 0;
    const promptTokens = data.usage?.input_tokens || 0;
    const completionTokens = data.usage?.output_tokens || 0;
    
    return {
      response: data.content[0]?.text || '',
      model: request.model,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: totalTokens
      },
      duration,
      provider: provider.name,
      cost: totalTokens * (provider.costPerToken || 0)
    };
  }

  private selectOptimalProvider(_request: AIRequest): string {
    // Get enabled providers sorted by priority (highest first)
    const enabledProviders = Array.from(this.providers.values())
      .filter(p => p.enabled)
      .sort((a, b) => b.priority - a.priority);
    
    if (enabledProviders.length === 0) {
      throw new Error('No AI providers are enabled. Please configure at least one provider.');
    }
    
    // Return the highest priority enabled provider
    return enabledProviders[0].name;
  }

  async checkProviderHealth(providerId: string): Promise<{ healthy: boolean; error?: string; latency?: number }> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return { healthy: false, error: 'Provider not found' };
    }

    try {
      const startTime = Date.now();
      
      if (provider.type === 'local' && provider.name === 'ollama') {
        const response = await fetch(`${provider.endpoint}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        return { 
          healthy: response.ok, 
          latency: Date.now() - startTime,
          error: response.ok ? undefined : `HTTP ${response.status}`
        };
      } else if (provider.type === 'openai-compatible' || provider.type === 'api') {
        // Test with a minimal request
        const testRequest: AIRequest = {
          model: provider.models[0],
          prompt: 'Hello',
          maxTokens: 1,
          temperature: 0.1
        };
        
        try {
          await this.generateResponse(testRequest, providerId);
          return { healthy: true, latency: Date.now() - startTime };
        } catch (error) {
          return { 
            healthy: false, 
            latency: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
      
      return { healthy: false, error: 'Unknown provider type' };
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  async testAllProviders(): Promise<Record<string, { healthy: boolean; error?: string; latency?: number }>> {
    const results: Record<string, { healthy: boolean; error?: string; latency?: number }> = {};
    
    for (const [providerId] of this.providers.entries()) {
      results[providerId] = await this.checkProviderHealth(providerId);
    }
    
    return results;
  }

  updateProviderConfig(providerId: string, updates: Partial<AIProvider>): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    const updatedProvider = { ...provider, ...updates };
    this.providers.set(providerId, updatedProvider);
    
    // Reset metrics for this provider
    this.metrics.set(providerId, {
      providerId: providerId,
      model: '',
      requestCount: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      totalCost: 0,
      successRate: 1.0,
      lastUsed: new Date()
    });
    
    return true;
  }

  selectOptimalModel(providerId: string, complexity: 'simple' | 'medium' | 'complex'): string {
    const provider = this.providers.get(providerId);
    if (!provider) return 'mistral:7b-instruct';

    if (providerId === 'ollama') {
      switch (complexity) {
        case 'simple':
          return 'mistral:7b-instruct';
        case 'medium':
          return 'qwen2.5:14b-instruct';
        case 'complex':
          return 'qwen2.5:32b-instruct';
        default:
          return 'mistral:7b-instruct';
      }
    }

    return provider.models[0];
  }

  private updateMetrics(providerId: string, response: AIResponse, duration: number) {
    const metrics = this.metrics.get(providerId);
    if (!metrics) return;

    metrics.requestCount++;
    metrics.totalTokens += response.tokens.total;
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (metrics.requestCount - 1) + duration) / metrics.requestCount;
    metrics.totalCost += response.cost || 0;
    metrics.lastUsed = new Date();
    
    this.metrics.set(providerId, metrics);
  }

  getMetrics(providerId?: string): AIMetrics[] {
    if (providerId) {
      const metric = this.metrics.get(providerId);
      return metric ? [metric] : [];
    }
    return Array.from(this.metrics.values());
  }

  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }
}

// Singleton instance
export const aiProviderService = new AIProviderService();