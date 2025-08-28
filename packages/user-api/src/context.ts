import jwt from 'jsonwebtoken';
import { EnvUtils } from '@memory-manager/shared';
import type { YogaInitialContext } from 'graphql-yoga';
import { db } from './db/config.js';
import { users, sessions } from './db/schema.js';
import { eq, and, gt } from 'drizzle-orm';

const config = EnvUtils.getConfig();
const JWT_SECRET = config.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface GraphQLContext {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  isAuthenticated: boolean;
}

function extractTokenFromHeader(authHeader: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

export async function createContext(initialContext: YogaInitialContext): Promise<GraphQLContext> {
  const authHeader = initialContext.request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader || '');

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      
      // Only accept access tokens, not refresh tokens
      if (payload && !payload.type && payload.sub) {
        // Verify user exists in database and get latest user data
        const userResults = await db.select().from(users).where(eq(users.id, payload.sub));
        const user = userResults[0];
        
        if (user) {
          // Check if user has any valid (non-expired) sessions
          const validSessions = await db.select().from(sessions).where(
            and(
              eq(sessions.userId, user.id),
              gt(sessions.expiresAt, new Date().toISOString())
            )
          );
          
          if (validSessions.length > 0) {
            return {
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              },
              isAuthenticated: true,
            };
          }
        }
      }
    } catch (error) {
      // Invalid token, continue to unauthenticated
      console.log('Token validation failed:', error);
    }
  }

  return {
    isAuthenticated: false,
  };
}