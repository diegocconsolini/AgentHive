---
created: 2025-08-31T17:18:31Z
last_updated: 2025-08-31T17:18:31Z
version: 1.0
author: Claude Code PM System
---

# Technology Context

## Core Technologies

### Runtime & Language
- **Node.js**: >=18.0.0 (specified in package.json engines)
- **npm**: >=9.0.0 (package manager)
- **TypeScript**: ^5.0.0 (primary language)

### Framework Stack
- **React**: Frontend dashboard framework
- **GraphQL**: API query language (port 4000/graphql)
- **Express.js**: Likely backend framework (inferred from API structure)

### Development Tools
- **ESLint**: ^8.0.0 (code linting)
- **Prettier**: ^3.0.0 (code formatting)
- **Husky**: ^8.0.0 (git hooks)
- **lint-staged**: ^13.0.0 (pre-commit linting)
- **tsx**: ^3.12.7 (TypeScript execution)
- **concurrently**: ^8.0.0 (parallel script execution)

## Architecture Pattern

### Monorepo Structure
- **Workspace Manager**: npm workspaces
- **Package Organization**: Modular packages with shared dependencies
- **Build System**: Coordinated builds across packages

### API Architecture
- **Port 3000**: Web dashboard (React)
- **Port 4000**: User API (Agent management)
- **Port 4001**: System API (Orchestration)
- **GraphQL Endpoint**: `/graphql` on port 4000

## Build & Development

### Available Scripts
```json
{
  "dev": "Multi-service development mode",
  "build": "Production build pipeline",
  "test": "Test suite execution",
  "lint": "Code quality checks",
  "type-check": "TypeScript validation",
  "docker:up": "Container orchestration"
}
```

### Build Pipeline
1. **Shared**: Build common utilities first
2. **APIs**: Build backend services (user-api, system-api)
3. **Frontend**: Build UI components (web, cli)
4. **Docs**: Build documentation site

## Dependencies

### Production Dependencies
- **chartjs-adapter-date-fns**: ^3.0.0 (charting library)

### Development Dependencies
- **@types/node**: ^20.0.0 (Node.js type definitions)
- Various linting, formatting, and build tools

## Deployment & Infrastructure

### Containerization
- **Docker Compose**: Multi-service orchestration
- **Container Registry**: Build and deployment pipeline

### Environment Management
- **Development**: `.env.development`
- **Production**: Deployment scripts in `/tools/scripts/`
- **Example**: `.env.example` for onboarding

### Deployment Targets
- **Staging**: `deploy:staging` script
- **Production**: `deploy:production` script
- **Local Development**: `docker:up` for containerized development

## AI Integration Context

### Model Support (Planned)
- **Claude**: Anthropic's language models
- **GPT**: OpenAI integration
- **Gemini**: Google AI integration
- **Local Models**: Ollama support (evidence from ollama-force-gpu.ps1)

### Agent Framework
- **88+ Specialized Agents**: Domain-specific AI agents
- **Intelligent Routing**: Automatic agent selection
- **Context Persistence**: Memory across sessions