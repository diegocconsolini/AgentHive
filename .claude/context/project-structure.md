---
created: 2025-08-31T17:18:31Z
last_updated: 2025-08-31T17:18:31Z
version: 1.0
author: Claude Code PM System
---

# Project Structure

## Root Directory
```
AgentHive/
├── .claude/                 # Claude Code PM system and context
├── .env*                    # Environment configuration files
├── .github/                 # GitHub workflows and templates
├── apps/                    # Application layer
├── packages/                # Workspace packages
├── infrastructure/          # Deployment and infrastructure
├── tools/                   # Build tools and scripts
├── dist/                    # Build outputs
├── scripts/                 # Utility scripts
└── node_modules/           # Dependencies
```

## Key Directories

### `/packages/` - Core Workspace Packages
- **`shared/`** - Common utilities and types
- **`web/`** - React dashboard (port 3000)
- **`cli/`** - Command line interface
- **`user-api/`** - Agent management API (port 4000)
- **`system-api/`** - Orchestration engine (port 4001)
- **`agents/`** - 88 agent definitions

### `/apps/` - Applications
- **`docs/`** - Documentation site

### `/infrastructure/` - Deployment
- **`docker/`** - Docker configurations
- **`k8s/`** - Kubernetes manifests
- **`terraform/`** - Infrastructure as code

### `/.claude/` - PM System
- **`context/`** - Project context files
- **`scripts/`** - PM automation scripts

## File Organization Patterns

### Naming Conventions
- **Packages**: kebab-case (`user-api`, `system-api`)
- **Files**: kebab-case for configs, camelCase for TypeScript
- **Components**: PascalCase
- **APIs**: RESTful naming with plural resources

### Module Structure
Each package follows a consistent structure:
```
package/
├── src/
├── tests/
├── dist/ (build output)
├── package.json
├── tsconfig.json
└── README.md
```

### Build Outputs
- **`dist/`** - Production builds
- **`packages/*/dist/`** - Individual package builds
- **`.next/`** - Next.js build cache (if using Next.js)

## Architecture Components

### Frontend Layer
- **Web Dashboard**: React-based admin interface
- **CLI**: Node.js command-line tool

### API Layer
- **User API**: Agent management and user operations
- **System API**: Core orchestration and routing engine

### Data Layer
- **Agent Registry**: 88+ specialized agent definitions
- **User Management**: Authentication and authorization
- **Memory System**: Context persistence