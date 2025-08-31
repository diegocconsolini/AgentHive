import { GraphQLError } from 'graphql';
import { db } from '../db/config.js';
import { agents, users, analytics } from '../db/schema.js';
import { eq, and, like, desc, or } from 'drizzle-orm';
import type { GraphQLContext } from '../context.js';
// import { agentExecutor, AgentExecutionRequest } from '@memory-manager/shared/services/agent-executor.js';
import { v4 as uuidv4 } from 'uuid';
const fetch = (...args: any[]) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

function requireAuth(context: GraphQLContext) {
  if (!context.isAuthenticated || !context.user) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
  return context.user;
}

export const agentResolvers = {
  Query: {
    async agents(_: any, { filter }: { filter?: any }, context: GraphQLContext) {
      const user = requireAuth(context);
      
      // Build where clause - include public agents and user's own agents
      const whereConditions = [
        or(
          eq(agents.isPublic, 'true'),
          eq(agents.authorId, user.id)
        )!
      ];
      
      if (filter?.search) {
        const searchTerm = `%${filter.search}%`;
        whereConditions.push(
          or(
            like(agents.name, searchTerm),
            like(agents.description, searchTerm)
          )!
        );
      }

      if (filter?.category) {
        whereConditions.push(eq(agents.category, filter.category));
      }

      if (filter?.model) {
        whereConditions.push(eq(agents.model, filter.model));
      }

      if (filter?.status) {
        whereConditions.push(eq(agents.status, filter.status));
      }

      if (filter?.isPublic !== undefined) {
        whereConditions.push(eq(agents.isPublic, filter.isPublic ? 'true' : 'false'));
      }

      // Query database
      let query = db.select().from(agents).where(and(...whereConditions));
      
      // Sort by popularity (highest first)
      query = query.orderBy(desc(agents.popularity));
      
      // Apply pagination
      const offset = filter?.offset || 0;
      const limit = filter?.limit || 20;
      query = query.limit(limit).offset(offset);
      
      const agentList = await query;
      
      // Parse JSON fields and fix date formats
      let filteredAgents = agentList.map(a => ({
        ...a,
        tags: JSON.parse(a.tags || '[]'),
        capabilities: JSON.parse(a.capabilities || '[]'),
        dependencies: JSON.parse(a.dependencies || '[]'),
        config: JSON.parse(a.config || '{}'),
        popularity: parseInt(a.popularity || '0'),
        rating: parseFloat(a.rating || '0'),
        isPublic: a.isPublic === 'true',
        createdAt: new Date(a.createdAt).toISOString(),
        updatedAt: new Date(a.updatedAt).toISOString(),
      }));
      
      // Apply tag filter in memory
      if (filter?.tags && filter.tags.length > 0) {
        filteredAgents = filteredAgents.filter(a =>
          filter.tags.some((tag: string) => a.tags.includes(tag))
        );
      }
      
      return filteredAgents;
    },

    async agent(_: any, { id }: { id: string }, context: GraphQLContext) {
      const user = requireAuth(context);
      
      // Allow access to public agents or user's own agents
      const agentResults = await db.select().from(agents).where(
        and(
          eq(agents.id, id),
          or(
            eq(agents.isPublic, 'true'),
            eq(agents.authorId, user.id)
          )!
        )
      );
      
      const agent = agentResults[0];
      if (!agent) {
        throw new GraphQLError('Agent not found');
      }

      return {
        ...agent,
        tags: JSON.parse(agent.tags || '[]'),
        capabilities: JSON.parse(agent.capabilities || '[]'),
        dependencies: JSON.parse(agent.dependencies || '[]'),
        config: JSON.parse(agent.config || '{}'),
        popularity: parseInt(agent.popularity || '0'),
        rating: parseFloat(agent.rating || '0'),
        isPublic: agent.isPublic === 'true',
        createdAt: new Date(agent.createdAt).toISOString(),
        updatedAt: new Date(agent.updatedAt).toISOString(),
      };
    },
  },

  Mutation: {
    async createAgent(
      _: any,
      { input }: { 
        input: { 
          name: string; 
          description: string; 
          version: string;
          category: string;
          model: string;
          tags?: string[];
          capabilities?: string[];
          dependencies?: string[];
          systemPrompt: string;
          isPublic?: boolean;
        } 
      },
      context: GraphQLContext
    ) {
      const user = requireAuth(context);

      // Check if agent name already exists
      const existingAgents = await db.select().from(agents).where(eq(agents.name, input.name));
      if (existingAgents.length > 0) {
        throw new GraphQLError('Agent with this name already exists');
      }

      const newAgentData = {
        id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: input.name,
        description: input.description,
        version: input.version,
        category: input.category,
        model: input.model,
        tags: JSON.stringify(input.tags || []),
        capabilities: JSON.stringify(input.capabilities || []),
        dependencies: JSON.stringify(input.dependencies || []),
        config: JSON.stringify({
          temperature: 0.7,
          maxTokens: 4000,
          timeout: 30000,
          retries: 3,
        }),
        status: 'inactive',
        popularity: '0',
        rating: '0',
        systemPrompt: input.systemPrompt,
        isPublic: input.isPublic !== false ? 'true' : 'false',
        authorId: user.id,
      };

      // Save to database
      await db.insert(agents).values(newAgentData);
      const createdAgents = await db.select().from(agents).where(eq(agents.id, newAgentData.id));
      const newAgent = createdAgents[0];

      return {
        ...newAgent,
        tags: JSON.parse(newAgent.tags || '[]'),
        capabilities: JSON.parse(newAgent.capabilities || '[]'),
        dependencies: JSON.parse(newAgent.dependencies || '[]'),
        config: JSON.parse(newAgent.config || '{}'),
        popularity: parseInt(newAgent.popularity || '0'),
        rating: parseFloat(newAgent.rating || '0'),
        isPublic: newAgent.isPublic === 'true',
        createdAt: new Date(newAgent.createdAt).toISOString(),
        updatedAt: new Date(newAgent.updatedAt).toISOString(),
      };
    },

    async updateAgent(
      _: any,
      { id, input }: { 
        id: string; 
        input: { 
          description?: string;
          version?: string;
          category?: string;
          model?: string;
          tags?: string[];
          capabilities?: string[];
          dependencies?: string[];
          systemPrompt?: string;
          isPublic?: boolean;
          status?: string;
        } 
      },
      context: GraphQLContext
    ) {
      const user = requireAuth(context);

      // Check if agent exists and user is the author
      const existingAgents = await db.select().from(agents).where(
        and(eq(agents.id, id), eq(agents.authorId, user.id))
      );
      
      if (existingAgents.length === 0) {
        throw new GraphQLError('Agent not found or you are not the author');
      }

      // Build update data
      const updateData: any = {};
      if (input.description !== undefined) updateData.description = input.description;
      if (input.version !== undefined) updateData.version = input.version;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.model !== undefined) updateData.model = input.model;
      if (input.tags !== undefined) updateData.tags = JSON.stringify(input.tags);
      if (input.capabilities !== undefined) updateData.capabilities = JSON.stringify(input.capabilities);
      if (input.dependencies !== undefined) updateData.dependencies = JSON.stringify(input.dependencies);
      if (input.systemPrompt !== undefined) updateData.systemPrompt = input.systemPrompt;
      if (input.isPublic !== undefined) updateData.isPublic = input.isPublic ? 'true' : 'false';
      if (input.status !== undefined) updateData.status = input.status;
      
      // Update in database
      await db.update(agents)
        .set(updateData)
        .where(and(eq(agents.id, id), eq(agents.authorId, user.id)));
      
      // Fetch updated agent
      const updatedAgents = await db.select().from(agents).where(eq(agents.id, id));
      const updatedAgent = updatedAgents[0];

      return {
        ...updatedAgent,
        tags: JSON.parse(updatedAgent.tags || '[]'),
        capabilities: JSON.parse(updatedAgent.capabilities || '[]'),
        dependencies: JSON.parse(updatedAgent.dependencies || '[]'),
        config: JSON.parse(updatedAgent.config || '{}'),
        popularity: parseInt(updatedAgent.popularity || '0'),
        rating: parseFloat(updatedAgent.rating || '0'),
        isPublic: updatedAgent.isPublic === 'true',
        createdAt: new Date(updatedAgent.createdAt).toISOString(),
        updatedAt: new Date(updatedAgent.updatedAt).toISOString(),
      };
    },

    async deleteAgent(_: any, { id }: { id: string }, context: GraphQLContext) {
      const user = requireAuth(context);

      // Check if agent exists and user is the author
      const existingAgents = await db.select().from(agents).where(
        and(eq(agents.id, id), eq(agents.authorId, user.id))
      );
      
      if (existingAgents.length === 0) {
        throw new GraphQLError('Agent not found or you are not the author');
      }

      // Delete from database
      await db.delete(agents).where(
        and(eq(agents.id, id), eq(agents.authorId, user.id))
      );
      
      return true;
    },

    // Intelligent orchestration mutation
    async orchestrateRequest(_: any, { input }: { input: any }, context: GraphQLContext) {
      const user = requireAuth(context);
      
      try {
        // Call the system-api orchestration endpoint
        const systemApiUrl = process.env.SYSTEM_API_URL || 'http://localhost:4001';
        const response = await fetch(`${systemApiUrl}/api/orchestrate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: input.prompt,
            options: {
              routingStrategy: input.routingStrategy || 'balanced',
              priority: input.priority || 'normal'
            },
            userId: user.id,
            sessionId: input.sessionId || 'default'
          })
        });

        if (!response.ok) {
          throw new Error(`System API error: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Orchestration failed');
        }

        // Transform system-api response to GraphQL format
        return {
          success: true,
          output: result.result.output,
          selectedAgent: result.result.selectedAgent,
          agentName: result.result.agentName,
          routingReason: result.result.routingReason,
          contextUsed: result.result.contextUsed,
          provider: result.result.provider,
          model: result.result.model,
          tokens: {
            prompt: result.result.tokens?.prompt || 0,
            completion: result.result.tokens?.completion || 0,
            total: result.result.tokens?.total || 0
          },
          duration: result.result.duration,
          orchestrationTime: result.result.orchestrationTime,
          cost: result.result.cost || 0,
          error: null
        };

      } catch (error) {
        console.error('Orchestration error:', error);
        return {
          success: false,
          output: '',
          selectedAgent: '',
          agentName: '',
          routingReason: '',
          contextUsed: '',
          provider: '',
          model: '',
          tokens: { prompt: 0, completion: 0, total: 0 },
          duration: 0,
          orchestrationTime: 0,
          cost: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },

  // Field resolvers for Agent type
  Agent: {
    async author(agent: any) {
      if (!agent.authorId) return null;
      
      const userResults = await db.select().from(users).where(eq(users.id, agent.authorId));
      const user = userResults[0];
      
      if (!user) return null;
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }
  },
};