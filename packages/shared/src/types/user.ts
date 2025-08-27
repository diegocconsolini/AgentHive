import { z } from 'zod';

// User role enum
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

// Zod schemas for validation
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role: z.nativeEnum(UserRole),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// TypeScript types
export type User = z.infer<typeof UserSchema>;

export type CreateUserInput = {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
};

export type UpdateUserInput = {
  email?: string;
  name?: string;
  role?: UserRole;
};