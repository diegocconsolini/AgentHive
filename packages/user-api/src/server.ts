import dotenv from 'dotenv';
import { createYoga } from 'graphql-yoga';
import { createServer } from 'http';
import { schema } from './schema/index.js';
import { createContext } from './context.js';
import { EnvUtils } from '@memory-manager/shared';

// Load environment variables from project root
import { resolve } from 'path';
import { fileURLToPath } from 'url';
const __dirname = resolve(fileURLToPath(import.meta.url), '..');

// Try multiple possible paths for .env file
const possibleEnvPaths = [
  resolve(__dirname, '../../../.env'),
  resolve(__dirname, '../../.env'),
  resolve(__dirname, '../.env'),
  resolve(process.cwd(), '.env'),
  '/home/diegocc/epic-memory-manager-unified/.env'
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log(`✅ Loaded .env from: ${envPath}`);
      envLoaded = true;
      break;
    }
  } catch (error) {
    // Continue to next path
  }
}

if (!envLoaded) {
  console.error('❌ Failed to load .env file from any location');
  console.log('Tried paths:', possibleEnvPaths);
}

const port = EnvUtils.getNumber('SERVER_PORT', 4000);

// Create GraphQL Yoga server
const yoga = createYoga({
  schema,
  context: createContext,
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
  landingPage: false,
  healthCheckEndpoint: '/health',
});

// Create HTTP server
const server = createServer(yoga);

server.listen(port, () => {
  console.log(`🚀 GraphQL server running at http://localhost:${port}/graphql`);
  console.log(`📊 GraphiQL available at http://localhost:${port}/graphql`);
  console.log(`❤️ Health check at http://localhost:${port}/health`);
  console.log(`💾 Database: SQLite (real data storage)`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});