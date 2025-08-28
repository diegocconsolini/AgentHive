import bcrypt from 'bcryptjs';
import { db } from './config.js';
import { users, memories, contexts, agents } from './schema.js';
import { UserRole } from '@memory-manager/shared';

export async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await db.delete(agents);
  await db.delete(contexts);
  await db.delete(memories);
  await db.delete(users);

  // Only seed data in development environment
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Skipping user seeding in production environment');
    console.log('✅ Database seeded successfully!');
    return;
  }

  // Development-only: Create demo users with environment-controlled password
  const defaultPassword = process.env.SEED_PASSWORD || 'development-only-password';
  const demoPasswordHash = bcrypt.hashSync(defaultPassword, 10);

  // Insert development users only
  const seedUsers = [
    {
      id: 'user_dev_1',
      email: process.env.SEED_USER_EMAIL || 'dev@localhost',
      name: 'Development User',
      role: UserRole.USER,
      passwordHash: demoPasswordHash,
      createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
      updatedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
    },
    {
      id: 'user_dev_2',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@localhost',
      name: 'Development Admin',
      role: UserRole.ADMIN,
      passwordHash: demoPasswordHash,
      createdAt: new Date('2024-01-10T09:00:00Z').toISOString(),
      updatedAt: new Date('2024-01-10T09:00:00Z').toISOString(),
    },
  ];

  await db.insert(users).values(seedUsers);
  console.log('👤 Development users created');

  // Insert memories
  const seedMemories = [
    {
      id: 'memory_1',
      title: 'GraphQL Best Practices',
      content: `GraphQL is a powerful query language that allows clients to request exactly the data they need. Here are some best practices:

1. Use descriptive field names
2. Implement proper error handling
3. Consider query complexity and depth limiting
4. Use DataLoader for efficient data fetching
5. Implement proper authentication and authorization

Remember to always validate input data and sanitize outputs to prevent security vulnerabilities.`,
      tags: JSON.stringify(['graphql', 'api', 'best-practices', 'web-development']),
      userId: 'user_dev_1',
      createdAt: new Date('2024-08-20T10:30:00Z').toISOString(),
      updatedAt: new Date('2024-08-20T10:30:00Z').toISOString(),
    },
    {
      id: 'memory_2',
      title: 'TypeScript Tips for Better Code',
      content: `TypeScript provides static typing for JavaScript, which helps catch errors at compile time. Here are some tips:

• Use strict mode for better type checking
• Leverage union types for flexible APIs
• Create custom type guards for runtime type checking
• Use mapped types for advanced type transformations
• Take advantage of conditional types when needed

Type safety is crucial for maintaining large codebases and reducing runtime errors.`,
      tags: JSON.stringify(['typescript', 'javascript', 'programming', 'type-safety']),
      userId: 'user_dev_1',
    },
    {
      id: 'memory_3',
      title: 'React Performance Optimization',
      content: `Performance optimization in React applications:

1. Use React.memo for preventing unnecessary re-renders
2. Implement useMemo and useCallback for expensive calculations
3. Code splitting with lazy loading and Suspense
4. Optimize bundle size with tree shaking
5. Use profiler to identify performance bottlenecks

Remember that premature optimization is the root of all evil - measure first, optimize second.`,
      tags: JSON.stringify(['react', 'performance', 'optimization', 'javascript']),
      userId: 'user_dev_1',
    },
    {
      id: 'memory_4',
      title: 'CLI Design Principles',
      content: `Good command-line interfaces should follow these principles:

- Follow POSIX conventions
- Provide helpful error messages
- Support both short and long options
- Include comprehensive help text
- Implement graceful error handling
- Support configuration files
- Provide progress indicators for long operations

Tools like Commander.js, Inquirer.js, and Chalk can help build better CLIs.`,
      tags: JSON.stringify(['cli', 'ux', 'design', 'commandline']),
      userId: 'user_dev_1',
    },
    {
      id: 'memory_5',
      title: 'Database Schema Design Notes',
      content: `Key considerations for database schema design:

Normalization:
- First Normal Form: Atomic values
- Second Normal Form: No partial dependencies
- Third Normal Form: No transitive dependencies

Indexing Strategy:
- Primary keys are automatically indexed
- Add indexes on frequently queried columns
- Composite indexes for multi-column queries
- Avoid over-indexing as it slows down writes

Always consider the query patterns when designing schemas.`,
      tags: JSON.stringify(['database', 'schema', 'sql', 'design']),
      userId: 'user_dev_1',
    },
    {
      id: 'memory_6',
      title: 'Meeting Notes: Project Kickoff',
      content: `Project Kickoff Meeting - August 25, 2024

Attendees:
- Demo User (Project Lead)
- Development Team
- Stakeholders

Key Decisions:
- Use GraphQL for API layer
- Implement both web and CLI interfaces
- Start with MVP focused on core memory management
- Deploy to cloud infrastructure

Next Steps:
- Set up development environment
- Create project structure
- Begin API implementation
- Design UI/UX mockups

Timeline: 2-3 weeks for MVP`,
      tags: JSON.stringify(['meeting', 'project', 'kickoff', 'planning']),
      userId: 'user_dev_1',
    },
    {
      id: 'memory_7',
      title: 'System Administration Checklist',
      content: `Monthly system maintenance checklist:

□ Update all system packages
□ Review security logs
□ Check disk space usage
□ Backup verification
□ Performance monitoring review
□ SSL certificate expiry check
□ Database optimization
□ Clean up old log files

Automation is key - script as much as possible!`,
      tags: JSON.stringify(['sysadmin', 'maintenance', 'checklist', 'operations']),
      userId: 'user_dev_2',
    },
    {
      id: 'memory_8',
      title: 'Recipe: Perfect Pasta',
      content: `My favorite pasta recipe:

Ingredients:
- 400g pasta (spaghetti or penne)
- 2 tbsp olive oil
- 3 cloves garlic, minced
- 1 can crushed tomatoes
- Fresh basil leaves
- Parmesan cheese
- Salt and pepper

Instructions:
1. Boil salted water and cook pasta al dente
2. Heat olive oil, sauté garlic until fragrant
3. Add tomatoes, simmer 10 minutes
4. Toss with pasta, add basil and cheese
5. Season to taste

Simple but delicious!`,
      tags: JSON.stringify(['recipe', 'cooking', 'pasta', 'italian']),
      userId: 'user_dev_1',
    },
  ];

  await db.insert(memories).values(seedMemories);
  console.log('💭 Memories created');

  // Insert contexts
  const seedContexts = [
    {
      id: 'context_1',
      title: 'API Design Guidelines',
      content: '# API Design Guidelines\n\n## REST Principles\n- Use HTTP methods correctly\n- Resource-based URLs\n- Consistent naming conventions\n- Proper status codes\n\n## GraphQL Best Practices\n- Use descriptive field names\n- Implement proper error handling\n- Consider query complexity\n- Use DataLoader for efficient data fetching',
      type: 'markdown',
      fileName: 'api-guidelines.md',
      filePath: '/docs/api-guidelines.md',
      fileSize: '512',
      mimeType: 'text/markdown',
      metadata: JSON.stringify({
        size: 512,
        wordCount: 45,
        characterCount: 280,
        lineCount: 12,
        language: 'markdown',
        encoding: 'utf-8',
        checksum: 'abc12345'
      }),
      importance: JSON.stringify({
        overall: 8.5,
        factors: {
          recency: 9.0,
          frequency: 8.0,
          relevance: 9.0,
          userRating: 8.0,
          accessPattern: 8.5
        },
        isManuallySet: false,
        isLocked: false
      }),
      tags: JSON.stringify(['api', 'guidelines', 'rest', 'graphql', 'documentation']),
      userId: 'user_dev_1',
    },
    {
      id: 'context_2',
      title: 'Meeting Notes Template',
      content: '# Meeting Notes Template\n\n**Date:** [Date]\n**Attendees:** [Names]\n**Duration:** [Duration]\n\n## Agenda\n1. Item 1\n2. Item 2\n3. Item 3\n\n## Discussion Points\n- Point 1\n- Point 2\n\n## Action Items\n- [ ] Task 1 - Assigned to [Name]\n- [ ] Task 2 - Assigned to [Name]\n\n## Next Meeting\n**Date:** [Date]\n**Time:** [Time]',
      type: 'markdown',
      fileName: 'meeting-template.md',
      filePath: '/templates/meeting-template.md',
      fileSize: '345',
      mimeType: 'text/markdown',
      metadata: JSON.stringify({
        size: 345,
        wordCount: 58,
        characterCount: 345,
        lineCount: 20,
        language: 'markdown',
        encoding: 'utf-8',
        checksum: 'def67890'
      }),
      importance: JSON.stringify({
        overall: 7.5,
        factors: {
          recency: 8.0,
          frequency: 9.0,
          relevance: 7.0,
          userRating: 8.0,
          accessPattern: 7.0
        },
        isManuallySet: false,
        isLocked: false
      }),
      tags: JSON.stringify(['meeting', 'template', 'productivity', 'organization']),
      userId: 'user_dev_1',
    },
  ];

  await db.insert(contexts).values(seedContexts);
  console.log('📁 Contexts created');

  // Load real agents data
  let seedAgents = [];
  try {
    const fs = await import('fs');
    const path = await import('path');
    const agentsDataPath = path.resolve(process.cwd(), '../../agents-data.json');
    const agentsData = JSON.parse(fs.readFileSync(agentsDataPath, 'utf-8'));
    
    // Convert to database format
    seedAgents = agentsData.map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      version: agent.version,
      category: agent.category,
      model: agent.model,
      tags: JSON.stringify(agent.tags),
      capabilities: JSON.stringify(agent.capabilities),
      dependencies: JSON.stringify(agent.dependencies),
      config: JSON.stringify(agent.config),
      status: agent.status,
      popularity: agent.popularity.toString(),
      rating: agent.rating,
      systemPrompt: agent.systemPrompt,
      isPublic: agent.isPublic ? 'true' : 'false',
      authorId: agent.authorId === 'admin' ? 'user_dev_2' : 'user_dev_1',
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    }));
    
    console.log(`📦 Loaded ${seedAgents.length} agents from AgentsReview`);
  } catch (error) {
    console.warn('⚠️  Could not load agents data, using fallback agents');
    
    // Fallback agents if file not found
    seedAgents = [
      {
        id: 'agent_1',
        name: 'Python Pro',
        description: 'Expert Python developer with deep knowledge of frameworks, best practices, and performance optimization.',
        version: '2.1.0',
        category: 'development',
        model: 'claude-3-sonnet',
        tags: JSON.stringify(['python', 'django', 'flask', 'async', 'testing']),
        capabilities: JSON.stringify(['Code generation', 'Debugging', 'Performance optimization', 'Testing']),
        dependencies: JSON.stringify(['code-formatter', 'test-runner']),
        config: JSON.stringify({
          temperature: 0.7,
          maxTokens: 4000,
          timeout: 30000,
          retries: 3,
          customSettings: ''
        }),
        status: 'active',
        popularity: '15420',
        rating: '4.8',
        systemPrompt: 'You are a Python expert with deep knowledge of Python frameworks, best practices, and performance optimization. Help users write clean, efficient, and maintainable Python code.',
        isPublic: 'true',
        authorId: 'user_dev_2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  await db.insert(agents).values(seedAgents);
  console.log('🤖 Agents created');
  console.log('✅ Database seeded successfully!');
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().catch(console.error);
}