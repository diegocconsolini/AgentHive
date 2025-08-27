import { createYoga } from 'graphql-yoga';
import { createServer } from 'http';
import { schema } from './schema/index.js';
import { createContext } from './context.js';
import { EnvUtils } from '@memory-manager/shared';

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