import { z } from 'zod';
import { UserRole } from './user.js';

// JWT Token payload
export const JWTPayloadSchema = z.object({
  sub: z.string().uuid(), // user id
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  iat: z.number(),
  exp: z.number(),
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

// Auth responses
export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const AuthPayloadSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    role: z.nativeEnum(UserRole),
  }),
  tokens: AuthTokensSchema,
});

export type AuthPayload = z.infer<typeof AuthPayloadSchema>;

// Auth inputs
export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RegisterInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password: z.string().min(6),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;

// Auth context
export interface AuthContext {
  user: AuthPayload['user'] | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}