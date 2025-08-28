import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import { EnvUtils, UserRole } from '@memory-manager/shared';
import { db } from '../db/config.js';
import { users, sessions } from '../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';

const config = EnvUtils.getConfig();
const JWT_SECRET = config.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export const authResolvers = {
  Mutation: {
    async login(_: any, { input }: { input: { email: string; password: string } }) {
      console.log('Login attempt:', { input });
      const { email, password } = input;

      // Find user in database
      const userResults = await db.select().from(users).where(eq(users.email, email));
      const user = userResults[0];
      
      console.log('Found user:', user ? 'Yes' : 'No', email);
      if (!user) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'AUTHENTICATION_ERROR' }
        });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'AUTHENTICATION_ERROR' }
        });
      }

      // Clean up expired sessions for this user
      await db.delete(sessions).where(
        and(
          eq(sessions.userId, user.id),
          gt(new Date().toISOString(), sessions.expiresAt)
        )
      );

      // Generate tokens
      const accessToken = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN || '1h' } as jwt.SignOptions
      );

      const refreshToken = jwt.sign(
        {
          sub: user.id,
          type: 'refresh',
          jti: `${Date.now()}_${Math.random().toString(36).substr(2, 16)}`, // Add unique identifier
        },
        JWT_SECRET,
        { expiresIn: config.REFRESH_TOKEN_EXPIRES_IN || '7d' } as jwt.SignOptions
      );

      // Store refresh token in database
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.insert(sessions).values({
        id: sessionId,
        userId: user.id,
        refreshToken,
        expiresAt,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600, // 1 hour in seconds
        },
      };
    },

    async register(_: any, { input }: { input: { email: string; name: string; password: string } }) {
      const { email, name, password } = input;

      // Check if user already exists
      const existingUsers = await db.select().from(users).where(eq(users.email, email));
      if (existingUsers.length > 0) {
        throw new GraphQLError('User already exists', {
          extensions: { code: 'USER_EXISTS' }
        });
      }

      // Create new user
      const passwordHash = await bcrypt.hash(password, 10);
      const newUserData = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        name,
        role: UserRole.USER,
        passwordHash,
      };

      // Save to database
      await db.insert(users).values(newUserData);
      const createdUsers = await db.select().from(users).where(eq(users.email, email));
      const newUser = createdUsers[0];

      // Generate tokens
      const accessToken = jwt.sign(
        {
          sub: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
        JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN || '1h' } as jwt.SignOptions
      );

      const refreshToken = jwt.sign(
        {
          sub: newUser.id,
          type: 'refresh',
          jti: `${Date.now()}_${Math.random().toString(36).substr(2, 16)}`, // Add unique identifier
        },
        JWT_SECRET,
        { expiresIn: config.REFRESH_TOKEN_EXPIRES_IN || '7d' } as jwt.SignOptions
      );

      // Store refresh token in database
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.insert(sessions).values({
        id: sessionId,
        userId: newUser.id,
        refreshToken,
        expiresAt,
      });

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600,
        },
      };
    },

    async refreshToken(_: any, { token }: { token: string }) {
      try {
        // Verify JWT structure
        const payload = jwt.verify(token, JWT_SECRET) as any;
        
        if (payload.type !== 'refresh') {
          throw new GraphQLError('Invalid refresh token');
        }

        // Check if session exists and is valid
        const sessionResults = await db.select()
          .from(sessions)
          .innerJoin(users, eq(sessions.userId, users.id))
          .where(
            and(
              eq(sessions.refreshToken, token),
              gt(sessions.expiresAt, new Date().toISOString())
            )
          );

        if (sessionResults.length === 0) {
          throw new GraphQLError('Invalid or expired refresh token');
        }

        const { sessions: session, users: user } = sessionResults[0];

        // Update last used timestamp
        await db.update(sessions)
          .set({ lastUsedAt: new Date().toISOString() })
          .where(eq(sessions.id, session.id));

        // Generate new access token (keep same refresh token)
        const accessToken = jwt.sign(
          {
            sub: user.id,
            email: user.email,
            role: user.role,
          },
          JWT_SECRET,
          { expiresIn: config.JWT_EXPIRES_IN || '1h' } as jwt.SignOptions
        );

        return {
          accessToken,
          refreshToken: token, // Return the same refresh token
          expiresIn: 3600,
        };
      } catch (error) {
        throw new GraphQLError('Invalid refresh token', {
          extensions: { code: 'AUTHENTICATION_ERROR' }
        });
      }
    },

    async logout(_: any, { refreshToken }: { refreshToken: string }) {
      try {
        // Remove session from database
        await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken));
        return true;
      } catch (error) {
        // Even if logout fails, return true for security
        return true;
      }
    },
  },
};