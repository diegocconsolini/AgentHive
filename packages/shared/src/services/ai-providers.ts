/**
 * Universal AI Provider Service
 * Supports Ollama, OpenAI, Anthropic, and other providers
 */

export interface AIProvider {
  name: string;
  type: 'local' | 'api';
  endpoint: string;
  models: string[];
  costPerToken?: number;
  maxTokens: number;
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
    // Ollama Provider (Your RTX 5090)
    this.registerProvider({
      name: 'ollama',
      type: 'local',
      endpoint: 'http://172.28.96.1:11434',
      models: ['mistral:7b-instruct', 'qwen2.5:14b-instruct', 'qwen2.5:32b-instruct'],
      costPerToken: 0, // Free local inference
      maxTokens: 16384
    });

    // OpenAI Provider (for future)
    this.registerProvider({
      name: 'openai',
      type: 'api',
      endpoint: 'https://api.openai.com/v1',
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
      costPerToken: 0.0015, // Approximate cost per 1K tokens
      maxTokens: 128000
    });

    // Anthropic Provider (for future)
    this.registerProvider({
      name: 'anthropic',
      type: 'api',
      endpoint: 'https://api.anthropic.com/v1',
      models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
      costPerToken: 0.0008,
      maxTokens: 200000
    });
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
    
    switch (provider.name) {
      case 'ollama':
        response = await this.callOllama(provider, request);
        break;
      case 'openai':
        response = await this.callOpenAI(provider, request);
        break;
      case 'anthropic':
        response = await this.callAnthropic(provider, request);
        break;
      default:
        throw new Error(`Provider ${provider.name} not implemented`);
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

    const data = await response.json();
    
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

  private async callOpenAI(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
    // Implementation for OpenAI API
    throw new Error('OpenAI provider not yet implemented');
  }

  private async callAnthropic(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
    // Implementation for Anthropic API  
    throw new Error('Anthropic provider not yet implemented');
  }

  private selectOptimalProvider(request: AIRequest): string {
    // Smart routing logic
    const promptLength = request.prompt.length;
    
    // For now, default to Ollama (free local inference)
    if (promptLength < 1000) {
      return 'ollama'; // Use fast 7B model for simple tasks
    } else if (promptLength < 5000) {
      return 'ollama'; // Use 14B model for medium complexity
    } else {
      return 'ollama'; // Use 32B model for complex tasks
    }
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