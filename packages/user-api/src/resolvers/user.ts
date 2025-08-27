import { GraphQLError } from 'graphql';
import { db } from '../db/config.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { GraphQLContext } from '../context.js';

export const userResolvers = {
  Query: {
    async me(_: any, __: any, context: GraphQLContext) {
      if (!context.isAuthenticated || !context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const userResults = await db.select().from(users).where(eq(users.id, context.user.id));
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

  // Field resolvers for User type
  User: {
    // Add any custom field resolvers here if needed
  },
};