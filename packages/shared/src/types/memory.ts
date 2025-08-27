import { z } from 'zod';

// Zod schemas for validation
export const MemorySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  userId: z.string().uuid(),
});

// TypeScript types
export type Memory = z.infer<typeof MemorySchema>;

export type CreateMemoryInput = {
  title: string;
  content: string;
  tags?: string[];
};

export type UpdateMemoryInput = {
  title?: string;
  content?: string;
  tags?: string[];
};

export type MemoryFilter = {
  search?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  limit?: number;
  offset?: number;
};