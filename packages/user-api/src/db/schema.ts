import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { UserRole } from '@memory-manager/shared';

// SQLite schema
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').$type<UserRole>().notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const memories = sqliteTable('memories', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tags: text('tags').notNull().default('[]'), // Store as JSON string
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshToken: text('refresh_token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  lastUsedAt: text('last_used_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const contexts = sqliteTable('contexts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type').notNull(), // 'markdown', 'text', 'pdf', 'image', etc.
  fileName: text('file_name'),
  filePath: text('file_path'),
  fileSize: text('file_size'),
  mimeType: text('mime_type'),
  metadata: text('metadata').notNull().default('{}'), // JSON string
  importance: text('importance').notNull().default('{}'), // JSON string with scoring
  tags: text('tags').notNull().default('[]'), // JSON array
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  version: text('version').notNull(),
  category: text('category').notNull(),
  model: text('model').notNull(), // 'haiku', 'sonnet', 'opus'
  tags: text('tags').notNull().default('[]'), // JSON array
  capabilities: text('capabilities').notNull().default('[]'), // JSON array
  dependencies: text('dependencies').notNull().default('[]'), // JSON array
  config: text('config').notNull().default('{}'), // JSON configuration
  status: text('status').notNull().default('inactive'), // 'active', 'inactive', 'running', 'error'
  popularity: text('popularity').notNull().default('0'),
  rating: text('rating').notNull().default('0'),
  systemPrompt: text('system_prompt').notNull(),
  isPublic: text('is_public').notNull().default('true'), // SQLite boolean as text
  authorId: text('author_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const analytics = sqliteTable('analytics', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(), // 'memory_created', 'context_uploaded', 'agent_used', etc.
  eventData: text('event_data').notNull().default('{}'), // JSON data
  sessionId: text('session_id'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Memory = typeof memories.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Context = typeof contexts.$inferSelect;
export type NewContext = typeof contexts.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Analytics = typeof analytics.$inferSelect;
export type NewAnalytics = typeof analytics.$inferInsert;