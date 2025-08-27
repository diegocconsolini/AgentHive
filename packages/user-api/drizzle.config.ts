import { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './memory-manager.db',
  },
  verbose: true,
  strict: true,
} satisfies Config;