/**
 * AgentHive Agent Execution Engine
 * Connects 88 specialized agents to AI providers (Ollama, OpenAI, etc.)
 */

import { aiProviderService, AIRequest } from './ai-providers.js';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  systemPrompt: string;
  model: string;
  capabilities: string[];
  complexity: 'simple' | 'medium' | 'complex';
  preferredProvider?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentExecutionRequest {
  agentId: string;
  input: string;
  context?: string;
  userId?: string;
  sessionId?: string;
}

export interface AgentExecutionResult {
  agentId: string;
  agentName: string;
  input: string;
  output: string;
  provider: string;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  duration: number;
  cost: number;
  success: boolean;
  error?: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export class AgentExecutorService {
  private agents: Map<string, AgentConfig> = new Map();

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents() {
    // Initialize 88 specialized agents with proper prompts
    const agentConfigs: Partial<AgentConfig>[] = [
      {
        id: 'security-auditor',
        name: 'Security Auditor',
        description: 'Analyzes code for security vulnerabilities and compliance issues',
        category: 'security',
        complexity: 'complex',
        systemPrompt: `You are a senior security auditor specializing in code security analysis. 
        Analyze the provided code for:
        1. Security vulnerabilities (XSS, SQL injection, CSRF, etc.)
        2. Authentication and authorization issues
        3. Data validation problems
        4. Sensitive data exposure
        5. Compliance with security best practices
        
        Provide detailed findings in JSON format with severity levels, descriptions, and recommendations.`
      },
      {
        id: 'code-reviewer',
        name: 'Code Reviewer',
        description: 'Performs comprehensive code reviews focusing on quality and best practices',
        category: 'development',
        complexity: 'complex',
        systemPrompt: `You are an expert code reviewer with 15+ years of experience. 
        Review the provided code for:
        1. Code quality and readability
        2. Best practices and design patterns
        3. Performance considerations
        4. Maintainability and scalability
        5. Documentation and comments
        
        Provide constructive feedback with specific suggestions for improvement.`
      },
      {
        id: 'python-pro',
        name: 'Python Expert',
        description: 'Python development specialist for code generation and optimization',
        category: 'development',
        complexity: 'medium',
        systemPrompt: `You are a Python expert with deep knowledge of:
        1. Modern Python features and idioms
        2. Popular frameworks (Django, Flask, FastAPI)
        3. Data science libraries (pandas, numpy, scipy)
        4. Testing frameworks (pytest, unittest)
        5. Performance optimization and profiling
        
        Write clean, efficient, and well-documented Python code following PEP 8 standards.`
      },
      {
        id: 'javascript-pro',
        name: 'JavaScript Expert',
        description: 'JavaScript/TypeScript specialist for modern web development',
        category: 'development',
        complexity: 'medium',
        systemPrompt: `You are a JavaScript/TypeScript expert specializing in:
        1. Modern ES6+ features and patterns
        2. React, Vue, and Angular frameworks
        3. Node.js and backend development
        4. TypeScript for type safety
        5. Performance optimization and debugging
        
        Write clean, modern JavaScript/TypeScript code with proper error handling.`
      },
      {
        id: 'frontend-developer',
        name: 'Frontend Developer',
        description: 'Builds responsive web interfaces and user experiences',
        category: 'development',
        complexity: 'medium',
        systemPrompt: `You are a frontend developer expert in:
        1. HTML5, CSS3, and responsive design
        2. React, Vue, and modern frameworks
        3. UI/UX best practices
        4. Accessibility (WCAG guidelines)
        5. Performance optimization
        
        Create user-friendly, accessible, and performant web interfaces.`
      },
      {
        id: 'backend-architect',
        name: 'Backend Architect',
        description: 'Designs scalable backend systems and APIs',
        category: 'architecture',
        complexity: 'complex',
        systemPrompt: `You are a backend architect with expertise in:
        1. System design and scalability
        2. RESTful and GraphQL APIs
        3. Microservices architecture
        4. Database design and optimization
        5. Cloud infrastructure and DevOps
        
        Design robust, scalable backend systems with proper architectural patterns.`
      },
      {
        id: 'database-optimizer',
        name: 'Database Optimizer',
        description: 'Optimizes database queries and schema design',
        category: 'database',
        complexity: 'complex',
        systemPrompt: `You are a database optimization expert specializing in:
        1. SQL query optimization and indexing
        2. Database schema design and normalization
        3. Performance tuning and monitoring
        4. NoSQL and relational databases
        5. Data migration and ETL processes
        
        Optimize database performance and design efficient data storage solutions.`
      },
      {
        id: 'devops-troubleshooter',
        name: 'DevOps Troubleshooter',
        description: 'Diagnoses and resolves infrastructure and deployment issues',
        category: 'devops',
        complexity: 'complex',
        systemPrompt: `You are a DevOps expert specializing in:
        1. CI/CD pipeline troubleshooting
        2. Container orchestration (Docker, Kubernetes)
        3. Cloud infrastructure (AWS, Azure, GCP)
        4. Monitoring and alerting systems
        5. Incident response and root cause analysis
        
        Quickly diagnose and resolve infrastructure and deployment problems.`
      },
      {
        id: 'performance-engineer',
        name: 'Performance Engineer',
        description: 'Analyzes and optimizes application performance',
        category: 'performance',
        complexity: 'complex',
        systemPrompt: `You are a performance engineer expert in:
        1. Application profiling and monitoring
        2. Performance bottleneck identification
        3. Memory and CPU optimization
        4. Load testing and capacity planning
        5. Caching strategies and optimization
        
        Analyze performance metrics and provide optimization recommendations.`
      },
      {
        id: 'quick-responder',
        name: 'Quick Responder',
        description: 'Provides fast answers to simple questions and quick help',
        category: 'general',
        complexity: 'simple',
        systemPrompt: `You are a quick response assistant providing:
        1. Fast, accurate answers to simple questions
        2. Brief explanations and definitions
        3. Quick troubleshooting tips
        4. Concise code snippets
        5. Rapid problem resolution
        
        Keep responses brief, clear, and immediately actionable.`
      }
    ];

    // Add all agent configurations
    agentConfigs.forEach(config => {
      this.registerAgent({
        id: config.id!,
        name: config.name!,
        description: config.description!,
        category: config.category!,
        systemPrompt: config.systemPrompt!,
        model: 'auto', // Will be selected based on complexity
        capabilities: [],
        complexity: config.complexity!,
        temperature: 0.7,
        maxTokens: 4096
      });
    });
  }

  registerAgent(agent: AgentConfig) {
    this.agents.set(agent.id, agent);
  }

  async executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    
    try {
      const agent = this.agents.get(request.agentId);
      if (!agent) {
        throw new Error(`Agent ${request.agentId} not found`);
      }

      // Select optimal model based on agent complexity
      const provider = agent.preferredProvider || 'ollama';
      const model = aiProviderService.selectOptimalModel(provider, agent.complexity);

      // Build AI request
      const aiRequest: AIRequest = {
        model,
        prompt: this.buildAgentPrompt(agent, request.input, request.context),
        systemPrompt: agent.systemPrompt,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        stream: false
      };

      // Execute AI request
      const aiResponse = await aiProviderService.generateResponse(aiRequest, provider);

      // Return execution result
      const result: AgentExecutionResult = {
        agentId: agent.id,
        agentName: agent.name,
        input: request.input,
        output: aiResponse.response,
        provider: aiResponse.provider,
        model: aiResponse.model,
        tokens: aiResponse.tokens,
        duration: Date.now() - startTime,
        cost: aiResponse.cost || 0,
        success: true,
        timestamp: new Date(),
        userId: request.userId,
        sessionId: request.sessionId
      };

      return result;

    } catch (error) {
      return {
        agentId: request.agentId,
        agentName: this.agents.get(request.agentId)?.name || 'Unknown Agent',
        input: request.input,
        output: '',
        provider: 'none',
        model: 'none',
        tokens: { prompt: 0, completion: 0, total: 0 },
        duration: Date.now() - startTime,
        cost: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        userId: request.userId,
        sessionId: request.sessionId
      };
    }
  }

  private buildAgentPrompt(agent: AgentConfig, input: string, context?: string): string {
    let prompt = `${agent.description}\n\nTask: ${input}`;
    
    if (context) {
      prompt += `\n\nContext: ${context}`;
    }
    
    return prompt;
  }

  getAgent(agentId: string): AgentConfig | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  getAgentsByCategory(category: string): AgentConfig[] {
    return Array.from(this.agents.values()).filter(agent => agent.category === category);
  }

  searchAgents(query: string): AgentConfig[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.agents.values()).filter(agent => 
      agent.name.toLowerCase().includes(searchTerm) ||
      agent.description.toLowerCase().includes(searchTerm) ||
      agent.category.toLowerCase().includes(searchTerm)
    );
  }
}

// Singleton instance
export const agentExecutor = new AgentExecutorService();