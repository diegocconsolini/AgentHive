import { GraphQLError } from 'graphql';
import { db } from '../db/config.js';
import { contexts, users } from '../db/schema.js';
import { eq, and, like, desc, or } from 'drizzle-orm';
import type { GraphQLContext } from '../context.js';

function requireAuth(context: GraphQLContext) {
  if (!context.isAuthenticated || !context.user) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
  return context.user;
}

// Helper function to calculate importance score
function calculateImportanceScore(): any {
  return {
    overall: 8.0 + (Math.random() - 0.5) * 2, // Random score between 7-9
    factors: {
      recency: 8.0 + (Math.random() - 0.5) * 2,
      frequency: 7.0 + (Math.random() - 0.5) * 2,
      relevance: 8.5 + (Math.random() - 0.5) * 2,
      userRating: 8.0 + (Math.random() - 0.5) * 2,
      accessPattern: 7.5 + (Math.random() - 0.5) * 2,
    },
    isManuallySet: false,
    isLocked: false,
  };
}

// Helper function to analyze content and generate metadata
function analyzeContent(content: string, type: string): any {
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const lines = content.split('\n');
  
  return {
    size: Buffer.byteLength(content, 'utf8'),
    wordCount: words.length,
    characterCount: content.length,
    lineCount: lines.length,
    language: type === 'markdown' ? 'markdown' : 'text',
    encoding: 'utf-8',
    checksum: Buffer.from(content).toString('base64').slice(0, 8),
  };
}

export const contextResolvers = {
  Query: {
    async contexts(_: any, { filter }: { filter?: any }, context: GraphQLContext) {
      const user = requireAuth(context);
      
      // Build where clause - admins see all contexts, users see only their own
      const whereConditions = [];
      if (user.role !== 'ADMIN') {
        whereConditions.push(eq(contexts.userId, user.id));
      }
      
      if (filter?.search) {
        const searchTerm = `%${filter.search}%`;
        whereConditions.push(
          or(
            like(contexts.title, searchTerm),
            like(contexts.content, searchTerm)
          )!
        );
      }

      if (filter?.type) {
        whereConditions.push(eq(contexts.type, filter.type));
      }

      // Query database
      let query = db.select().from(contexts);
      if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
      }
      
      // Sort by creation date (newest first)
      query = query.orderBy(desc(contexts.createdAt));
      
      // Apply pagination
      const offset = filter?.offset || 0;
      const limit = filter?.limit || 10;
      query = query.limit(limit).offset(offset);
      
      const userContexts = await query;
      
      // Parse JSON fields and fix date formats
      let filteredContexts = userContexts.map(c => ({
        ...c,
        tags: JSON.parse(c.tags || '[]'),
        metadata: JSON.parse(c.metadata || '{}'),
        importance: JSON.parse(c.importance || '{}'),
        createdAt: new Date(c.createdAt).toISOString(),
        updatedAt: new Date(c.updatedAt).toISOString(),
      }));
      
      // Apply tag filter in memory (could be optimized with JSON queries)
      if (filter?.tags && filter.tags.length > 0) {
        filteredContexts = filteredContexts.filter(c =>
          filter.tags.some((tag: string) => c.tags.includes(tag))
        );
      }

      if (filter?.dateRange) {
        const start = new Date(filter.dateRange.start);
        const end = new Date(filter.dateRange.end);
        filteredContexts = filteredContexts.filter(c => {
          const contextDate = new Date(c.createdAt);
          return contextDate >= start && contextDate <= end;
        });
      }
      
      return filteredContexts;
    },

    async context(_: any, { id }: { id: string }, context: GraphQLContext) {
      const user = requireAuth(context);
      
      // Build where clause - admins can access any context, users only their own
      const whereConditions = [eq(contexts.id, id)];
      if (user.role !== 'ADMIN') {
        whereConditions.push(eq(contexts.userId, user.id));
      }
      
      const contextResults = await db.select().from(contexts).where(and(...whereConditions));
      
      const contextItem = contextResults[0];
      if (!contextItem) {
        throw new GraphQLError('Context not found');
      }

      return {
        ...contextItem,
        tags: JSON.parse(contextItem.tags || '[]'),
        metadata: JSON.parse(contextItem.metadata || '{}'),
        importance: JSON.parse(contextItem.importance || '{}'),
        createdAt: new Date(contextItem.createdAt).toISOString(),
        updatedAt: new Date(contextItem.updatedAt).toISOString(),
      };
    },
  },

  Mutation: {
    async createContext(
      _: any,
      { input }: { 
        input: { 
          title: string; 
          content: string; 
          type: string;
          fileName?: string;
          filePath?: string;
          fileSize?: string;
          mimeType?: string;
          tags?: string[];
        } 
      },
      context: GraphQLContext
    ) {
      const user = requireAuth(context);

      const metadata = analyzeContent(input.content, input.type);
      const importance = calculateImportanceScore();

      const newContextData = {
        id: `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: input.title,
        content: input.content,
        type: input.type,
        fileName: input.fileName || null,
        filePath: input.filePath || null,
        fileSize: input.fileSize || null,
        mimeType: input.mimeType || null,
        metadata: JSON.stringify(metadata),
        importance: JSON.stringify(importance),
        tags: JSON.stringify(input.tags || []),
        userId: user.id,
      };

      // Save to database
      await db.insert(contexts).values(newContextData);
      const createdContexts = await db.select().from(contexts).where(eq(contexts.id, newContextData.id));
      const newContext = createdContexts[0];

      return {
        ...newContext,
        tags: JSON.parse(newContext.tags || '[]'),
        metadata: JSON.parse(newContext.metadata || '{}'),
        importance: JSON.parse(newContext.importance || '{}'),
        createdAt: new Date(newContext.createdAt).toISOString(),
        updatedAt: new Date(newContext.updatedAt).toISOString(),
      };
    },

    async updateContext(
      _: any,
      { id, input }: { id: string; input: { title?: string; content?: string; tags?: string[] } },
      context: GraphQLContext
    ) {
      const user = requireAuth(context);

      // Check if context exists and belongs to user
      const existingContexts = await db.select().from(contexts).where(
        and(eq(contexts.id, id), eq(contexts.userId, user.id))
      );
      
      if (existingContexts.length === 0) {
        throw new GraphQLError('Context not found');
      }

      // Build update data
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) {
        updateData.content = input.content;
        // Recalculate metadata if content changes
        updateData.metadata = JSON.stringify(analyzeContent(input.content, existingContexts[0].type));
      }
      if (input.tags !== undefined) updateData.tags = JSON.stringify(input.tags);
      
      // Update in database
      await db.update(contexts)
        .set(updateData)
        .where(and(eq(contexts.id, id), eq(contexts.userId, user.id)));
      
      // Fetch updated context
      const updatedContexts = await db.select().from(contexts).where(eq(contexts.id, id));
      const updatedContext = updatedContexts[0];

      return {
        ...updatedContext,
        tags: JSON.parse(updatedContext.tags || '[]'),
        metadata: JSON.parse(updatedContext.metadata || '{}'),
        importance: JSON.parse(updatedContext.importance || '{}'),
        createdAt: new Date(updatedContext.createdAt).toISOString(),
        updatedAt: new Date(updatedContext.updatedAt).toISOString(),
      };
    },

    async deleteContext(_: any, { id }: { id: string }, context: GraphQLContext) {
      const user = requireAuth(context);

      // Check if context exists and belongs to user
      const existingContexts = await db.select().from(contexts).where(
        and(eq(contexts.id, id), eq(contexts.userId, user.id))
      );
      
      if (existingContexts.length === 0) {
        throw new GraphQLError('Context not found');
      }

      // Delete from database
      await db.delete(contexts).where(
        and(eq(contexts.id, id), eq(contexts.userId, user.id))
      );
      
      return true;
    },
  },

  // Field resolvers for Context type
  Context: {
    async user(contextItem: any) {
      const userResults = await db.select().from(users).where(eq(users.id, contextItem.userId));
      const user = userResults[0];
      
      if (!user) {
        throw new GraphQLError('User not found');
      }
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    },
  },
};