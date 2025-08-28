import { GraphQLError } from 'graphql';
import { db } from '../db/config.js';
import { memories, users } from '../db/schema.js';
import { eq, and, like, desc, asc, or } from 'drizzle-orm';
import type { GraphQLContext } from '../context.js';

function requireAuth(context: GraphQLContext) {
  if (!context.isAuthenticated || !context.user) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
  return context.user;
}

export const memoryResolvers = {
  Query: {
    async memories(_: any, { filter }: { filter?: any }, context: GraphQLContext) {
      const user = requireAuth(context);
      
      // Build where clause - admins see all memories, users see only their own
      const whereConditions = [];
      if (user.role !== 'ADMIN') {
        whereConditions.push(eq(memories.userId, user.id));
      }
      
      if (filter?.search) {
        const searchTerm = `%${filter.search}%`;
        whereConditions.push(
          or(
            like(memories.title, searchTerm),
            like(memories.content, searchTerm)
          )!
        );
      }

      // Query database
      let query = db.select().from(memories);
      if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
      }
      
      // Sort by creation date (newest first)
      query = query.orderBy(desc(memories.createdAt));
      
      // Apply pagination
      const offset = filter?.offset || 0;
      const limit = filter?.limit || 10;
      query = query.limit(limit).offset(offset);
      
      const userMemories = await query;
      
      // Parse tags from JSON strings and fix date formats
      let filteredMemories = userMemories.map(m => ({
        ...m,
        tags: JSON.parse(m.tags || '[]'),
        createdAt: new Date(m.createdAt).toISOString(),
        updatedAt: new Date(m.updatedAt).toISOString(),
      }));
      
      if (filter?.tags && filter.tags.length > 0) {
        filteredMemories = filteredMemories.filter(m =>
          filter.tags.some((tag: string) => m.tags.includes(tag))
        );
      }

      if (filter?.dateRange) {
        const start = new Date(filter.dateRange.start);
        const end = new Date(filter.dateRange.end);
        filteredMemories = filteredMemories.filter(m => {
          const memoryDate = new Date(m.createdAt);
          return memoryDate >= start && memoryDate <= end;
        });
      }
      
      return filteredMemories;
    },

    async memory(_: any, { id }: { id: string }, context: GraphQLContext) {
      const user = requireAuth(context);
      
      const memoryResults = await db.select().from(memories).where(
        and(eq(memories.id, id), eq(memories.userId, user.id))
      );
      
      const memory = memoryResults[0];
      if (!memory) {
        throw new GraphQLError('Memory not found');
      }

      return {
        ...memory,
        tags: JSON.parse(memory.tags || '[]'),
        createdAt: new Date(memory.createdAt).toISOString(),
        updatedAt: new Date(memory.updatedAt).toISOString(),
      };
    },
  },

  Mutation: {
    async createMemory(
      _: any,
      { input }: { input: { title: string; content: string; tags?: string[] } },
      context: GraphQLContext
    ) {
      const user = requireAuth(context);

      const newMemoryData = {
        id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: input.title,
        content: input.content,
        tags: JSON.stringify(input.tags || []),
        userId: user.id,
      };

      // Save to database
      await db.insert(memories).values(newMemoryData);
      const createdMemories = await db.select().from(memories).where(eq(memories.id, newMemoryData.id));
      const newMemory = createdMemories[0];

      return {
        ...newMemory,
        tags: JSON.parse(newMemory.tags || '[]'),
        createdAt: new Date(newMemory.createdAt).toISOString(),
        updatedAt: new Date(newMemory.updatedAt).toISOString(),
      };
    },

    async updateMemory(
      _: any,
      { id, input }: { id: string; input: { title?: string; content?: string; tags?: string[] } },
      context: GraphQLContext
    ) {
      const user = requireAuth(context);

      // Check if memory exists and belongs to user
      const existingMemories = await db.select().from(memories).where(
        and(eq(memories.id, id), eq(memories.userId, user.id))
      );
      
      if (existingMemories.length === 0) {
        throw new GraphQLError('Memory not found');
      }

      // Build update data
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.tags !== undefined) updateData.tags = JSON.stringify(input.tags);
      
      // Update in database
      await db.update(memories)
        .set(updateData)
        .where(and(eq(memories.id, id), eq(memories.userId, user.id)));
      
      // Fetch updated memory
      const updatedMemories = await db.select().from(memories).where(eq(memories.id, id));
      const updatedMemory = updatedMemories[0];

      return {
        ...updatedMemory,
        tags: JSON.parse(updatedMemory.tags || '[]'),
        createdAt: new Date(updatedMemory.createdAt).toISOString(),
        updatedAt: new Date(updatedMemory.updatedAt).toISOString(),
      };
    },

    async deleteMemory(_: any, { id }: { id: string }, context: GraphQLContext) {
      const user = requireAuth(context);

      // Check if memory exists and belongs to user
      const existingMemories = await db.select().from(memories).where(
        and(eq(memories.id, id), eq(memories.userId, user.id))
      );
      
      if (existingMemories.length === 0) {
        throw new GraphQLError('Memory not found');
      }

      // Delete from database
      await db.delete(memories).where(
        and(eq(memories.id, id), eq(memories.userId, user.id))
      );
      
      return true;
    },
  },

  // Field resolvers for Memory type
  Memory: {
    async user(memory: any) {
      const userResults = await db.select().from(users).where(eq(users.id, memory.userId));
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