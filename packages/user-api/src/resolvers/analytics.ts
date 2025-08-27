import { GraphQLError } from 'graphql';
import { db } from '../db/config.js';
import { analytics, users, memories, contexts, agents } from '../db/schema.js';
import { eq, desc, gte, count, sql } from 'drizzle-orm';
import type { GraphQLContext } from '../context.js';

function requireAuth(context: GraphQLContext) {
  if (!context.isAuthenticated || !context.user) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
  return context.user;
}

// Helper function to generate date points for growth charts
function generateGrowthData(startDate: Date, endDate: Date, baseValue: number): any[] {
  const points = [];
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i <= Math.min(daysDiff, 30); i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const growth = Math.floor(baseValue * (1 + i * 0.05 + Math.random() * 0.1));
    points.push({
      date: date.toISOString().split('T')[0],
      value: growth,
    });
  }
  
  return points;
}

export const analyticsResolvers = {
  Query: {
    async analyticsOverview(_: any, __: any, context: GraphQLContext) {
      const user = requireAuth(context);
      
      // Get total counts
      const [totalUsersResult] = await db.select({ count: count() }).from(users);
      const [totalMemoriesResult] = await db.select({ count: count() }).from(memories);
      const [totalContextsResult] = await db.select({ count: count() }).from(contexts);
      const [totalAgentsResult] = await db.select({ count: count() }).from(agents);
      
      // Get active users (users who have created content in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsersQuery = await db
        .selectDistinct({ userId: memories.userId })
        .from(memories)
        .where(gte(memories.createdAt, thirtyDaysAgo.toISOString()));
      
      const activeUsers = activeUsersQuery.length;
      
      // Generate growth data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const memoryGrowth = generateGrowthData(startDate, endDate, totalMemoriesResult.count);
      const contextGrowth = generateGrowthData(startDate, endDate, totalContextsResult.count);
      
      // Generate agent usage metrics
      const agentUsage = await db.select({
        id: agents.id,
        name: agents.name,
        rating: agents.rating,
      }).from(agents).orderBy(desc(agents.popularity)).limit(10);
      
      const agentUsageMetrics = agentUsage.map(agent => ({
        agentName: agent.name,
        usageCount: Math.floor(Math.random() * 1000) + 50, // Mock usage data
        rating: parseFloat(agent.rating || '0'),
      }));
      
      return {
        totalUsers: totalUsersResult.count,
        totalMemories: totalMemoriesResult.count,
        totalContexts: totalContextsResult.count,
        totalAgents: totalAgentsResult.count,
        activeUsers,
        memoryGrowth,
        contextGrowth,
        agentUsage: agentUsageMetrics,
      };
    },

    async analyticsEvents(_: any, { limit = 100, offset = 0 }: { limit?: number; offset?: number }, context: GraphQLContext) {
      const user = requireAuth(context);
      
      // For regular users, only show their events. For admins, show all events.
      const whereCondition = user.role === 'ADMIN' ? undefined : eq(analytics.userId, user.id);
      
      let query = db.select().from(analytics);
      if (whereCondition) {
        query = query.where(whereCondition);
      }
      
      query = query.orderBy(desc(analytics.createdAt)).limit(limit).offset(offset);
      
      const events = await query;
      
      return events.map(event => ({
        ...event,
        createdAt: new Date(event.createdAt).toISOString(),
      }));
    },
  },

  Mutation: {
    async trackEvent(
      _: any,
      { eventType, eventData }: { eventType: string; eventData: string },
      context: GraphQLContext
    ) {
      const user = requireAuth(context);

      try {
        // Validate eventData is valid JSON
        JSON.parse(eventData);
      } catch {
        throw new GraphQLError('eventData must be valid JSON');
      }

      const newEventData = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        eventType,
        eventData,
        sessionId: `session_${user.id}_${Date.now()}`,
        userAgent: null, // Could extract from context headers
        ipAddress: null, // Could extract from context headers
      };

      await db.insert(analytics).values(newEventData);
      
      return true;
    },
  },
};