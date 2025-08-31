---
created: 2025-08-31T17:18:31Z
last_updated: 2025-08-31T17:18:31Z
version: 1.0
author: Claude Code PM System
---

# Project Style Guide

## Code Conventions

### Naming Conventions

**Files & Directories**
- **Config files**: kebab-case (`package.json`, `tsconfig.json`, `.env.development`)
- **Source directories**: kebab-case (`user-api`, `system-api`, `shared`)
- **TypeScript files**: camelCase (`authService.ts`, `agentRegistry.ts`)
- **Component files**: PascalCase (`AgentCard.tsx`, `DashboardLayout.tsx`)

**Code Elements**
- **Variables & Functions**: camelCase (`getUserAgent`, `agentCount`, `isActive`)
- **Classes & Interfaces**: PascalCase (`AgentRegistry`, `UserManager`, `IAgentConfig`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_AGENTS`, `DEFAULT_TIMEOUT`)
- **Enums**: PascalCase with UPPER values (`AgentStatus.ACTIVE`, `UserRole.ADMIN`)

### TypeScript Standards

**Type Definitions**
```typescript
// Interfaces for data structures
interface AgentConfig {
  id: string;
  name: string;
  capabilities: string[];
  status: AgentStatus;
}

// Types for unions and utilities
type AgentResponse = SuccessResponse | ErrorResponse;
type AgentId = string;
```

**Function Signatures**
```typescript
// Clear return types and parameter types
async function routeToAgent(
  request: UserRequest,
  context: AgentContext
): Promise<AgentResponse> {
  // Implementation
}
```

### File Organization Patterns

**Package Structure**
```
package/
├── src/
│   ├── types/          # Type definitions
│   ├── utils/          # Utility functions
│   ├── services/       # Business logic
│   ├── routes/         # API endpoints (APIs only)
│   ├── components/     # React components (web only)
│   └── index.ts        # Package entry point
├── tests/              # Test files
├── dist/               # Build output
└── package.json
```

**Import Organization**
```typescript
// 1. External libraries
import React from 'react';
import express from 'express';

// 2. Internal types
import { AgentConfig, UserRequest } from '../types';

// 3. Internal utilities  
import { validateRequest, logError } from '../utils';

// 4. Relative imports last
import './component.styles.css';
```

## API Design Conventions

### REST API Patterns
- **Resource Naming**: Plural nouns (`/agents`, `/users`, `/workflows`)
- **HTTP Methods**: Standard RESTful verbs (GET, POST, PUT, DELETE)
- **Status Codes**: Consistent HTTP status code usage
- **Error Format**: Standardized error response structure

### GraphQL Patterns
```graphql
# Query naming: descriptive, action-based
type Query {
  getAgentById(id: ID!): Agent
  listAvailableAgents(filter: AgentFilter): [Agent!]!
  searchAgentsByCapability(capability: String!): [Agent!]!
}

# Mutation naming: verb + resource
type Mutation {
  createAgent(input: CreateAgentInput!): Agent!
  updateAgentStatus(id: ID!, status: AgentStatus!): Agent!
  deleteAgent(id: ID!): Boolean!
}
```

## React Component Patterns

### Component Structure
```typescript
// Functional components with TypeScript
interface AgentCardProps {
  agent: Agent;
  onSelect?: (agent: Agent) => void;
  className?: string;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onSelect,
  className = ''
}) => {
  // Hooks first
  const [isSelected, setIsSelected] = useState(false);
  
  // Event handlers
  const handleClick = useCallback(() => {
    setIsSelected(!isSelected);
    onSelect?.(agent);
  }, [agent, isSelected, onSelect]);
  
  // Render
  return (
    <div className={`agent-card ${className}`} onClick={handleClick}>
      {/* Component content */}
    </div>
  );
};
```

### Styling Conventions
- **CSS Modules**: Component-scoped styling
- **BEM Methodology**: Block-Element-Modifier naming
- **Responsive Design**: Mobile-first approach
- **Theme Variables**: Consistent color and spacing tokens

## Documentation Standards

### Code Comments
```typescript
/**
 * Routes user request to the most appropriate agent based on
 * request analysis and agent capabilities.
 * 
 * @param request - The user's request with context
 * @param availableAgents - List of currently active agents
 * @returns Promise resolving to selected agent and confidence score
 */
async function selectAgent(
  request: UserRequest,
  availableAgents: Agent[]
): Promise<AgentSelection> {
  // Implementation details...
}
```

### README Structure
```markdown
# Package Name

Brief description of package purpose.

## Installation
## Usage
## API Reference
## Contributing
```

## Testing Conventions

### Test Organization
```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests  
├── e2e/              # End-to-end tests
└── fixtures/         # Test data
```

### Test Naming
```typescript
describe('AgentRegistry', () => {
  describe('selectAgent', () => {
    it('should select python-pro for Python code analysis', () => {
      // Test implementation
    });
    
    it('should fallback to general-purpose for unknown requests', () => {
      // Test implementation  
    });
  });
});
```

## Build & Deployment

### Environment Configuration
- **Development**: `.env.development` with debug settings
- **Production**: Environment variables, no defaults in code
- **Testing**: Isolated test configuration

### Build Pipeline
1. **Linting**: ESLint with project-specific rules
2. **Type Checking**: TypeScript strict mode
3. **Testing**: Unit → Integration → E2E
4. **Building**: Production-optimized builds
5. **Security**: Vulnerability scanning

### Git Conventions
- **Branch Naming**: `feature/agent-routing`, `fix/auth-bug`, `chore/update-deps`
- **Commit Messages**: Conventional commits format
- **PR Templates**: Structured review process
- **Code Review**: Required for all changes

## Performance Guidelines

### Code Performance
- **Async/Await**: Prefer over promises for readability
- **Memory Management**: Clean up event listeners and timers
- **Bundle Optimization**: Tree shaking and code splitting
- **API Efficiency**: Batch requests where possible

### Runtime Optimization
- **Caching**: Strategic caching of agent responses
- **Connection Pooling**: Efficient database connections
- **Error Handling**: Graceful degradation patterns
- **Monitoring**: Performance metrics collection