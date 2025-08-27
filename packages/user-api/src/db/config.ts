import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';

// Create a single database instance
const sqlite = new Database('./memory-manager.db');

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL');

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    refresh_token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_used_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS contexts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    file_name TEXT,
    file_path TEXT,
    file_size TEXT,
    mime_type TEXT,
    metadata TEXT NOT NULL DEFAULT '{}',
    importance TEXT NOT NULL DEFAULT '{}',
    tags TEXT NOT NULL DEFAULT '[]',
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    version TEXT NOT NULL,
    category TEXT NOT NULL,
    model TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    capabilities TEXT NOT NULL DEFAULT '[]',
    dependencies TEXT NOT NULL DEFAULT '[]',
    config TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'inactive',
    popularity TEXT NOT NULL DEFAULT '0',
    rating TEXT NOT NULL DEFAULT '0',
    system_prompt TEXT NOT NULL,
    is_public TEXT NOT NULL DEFAULT 'true',
    author_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE SET NULL
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT NOT NULL DEFAULT '{}',
    session_id TEXT,
    user_agent TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

// Create indexes for better performance
sqlite.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
  CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
  CREATE INDEX IF NOT EXISTS idx_contexts_user_id ON contexts(user_id);
  CREATE INDEX IF NOT EXISTS idx_contexts_type ON contexts(type);
  CREATE INDEX IF NOT EXISTS idx_contexts_created_at ON contexts(created_at);
  CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);
  CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category);
  CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
  CREATE INDEX IF NOT EXISTS idx_agents_is_public ON agents(is_public);
  CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
  CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
`);

// Create Drizzle ORM instance
const db = drizzle(sqlite, { schema });

export { db, sqlite };