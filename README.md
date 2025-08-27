# Epic Memory Manager - Unified Development

A comprehensive AI-assisted productivity platform combining memory management, agent orchestration, and intelligent context handling in a unified monorepo architecture.

## Architecture Overview

This monorepo contains multiple interconnected services:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Web     │    │  User API        │    │  System API     │
│   Port 3000     │◄──►│  (Memory Mgmt)   │◄──►│  (Agent Mgmt)   │
│                 │    │  Port 4000       │    │  Port 4001      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                       │
        │                        │                       │
        ▼                        ▼                       ▼
   User Interface        Personal Data APIs      AI Orchestration
```

## Services

### 🌐 Web Application (`packages/web`)
- **Port**: 3000
- **Tech**: React + TypeScript + Vite
- **Purpose**: User-facing dashboard for memory and agent management

### 💻 CLI Tool (`packages/cli`)
- **Tech**: Node.js + Commander.js
- **Purpose**: Command-line interface for power users

### 🔐 User API (`packages/user-api`)
- **Port**: 4000
- **Tech**: GraphQL Yoga + SQLite + Drizzle ORM
- **Purpose**: User authentication, personal memory management

### 🤖 System API (`packages/system-api`)
- **Port**: 4001
- **Tech**: Express + Apollo Server + Hybrid Storage
- **Purpose**: AI agent orchestration, context management

### 🔗 Shared (`packages/shared`)
- **Purpose**: Common types, utilities, and GraphQL schemas

### 📚 Agents (`packages/agents`)
- **Purpose**: 88+ specialized AI agent definitions

### 📖 Documentation (`apps/docs`)
- **Port**: 8080
- **Purpose**: Interactive documentation and agent browser

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Docker & Docker Compose (optional)

### Development Setup

```bash
# Clone and install
git clone <repository-url>
cd epic-memory-manager-unified
npm install

# Setup environment
cp .env.development .env

# Build shared dependencies
npm run build:shared

# Start all services
npm run dev
```

This will start:
- Web UI: http://localhost:3000
- User API: http://localhost:4000/graphql
- System API: http://localhost:4001/graphql

### Docker Development

```bash
# Start all services with Docker
docker-compose up -d

# Or start specific services
docker-compose up web user-api
```

## Available Scripts

### Development
```bash
npm run dev              # Start all services
npm run dev:web          # Start web UI only
npm run dev:user-api     # Start user API only  
npm run dev:system-api   # Start system API only
npm run dev:cli          # Start CLI in dev mode
```

### Building
```bash
npm run build            # Build all packages
npm run build:shared     # Build shared package
npm run build:apis       # Build both APIs
npm run build:frontend   # Build web + CLI
```

### Testing
```bash
npm run test             # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:e2e         # End-to-end tests
```

### Quality
```bash
npm run lint            # Lint all packages
npm run type-check      # TypeScript checking
npm run clean           # Clean all builds
```

## Project Structure

```
epic-memory-manager-unified/
├── packages/
│   ├── web/                # React frontend
│   ├── cli/                # Command line tool
│   ├── user-api/           # Memory management API
│   ├── system-api/         # Agent orchestration API
│   ├── shared/             # Common code
│   └── agents/             # AI agent definitions
├── apps/
│   └── docs/               # Documentation site
├── tools/
│   ├── scripts/            # Build scripts
│   └── config/             # Shared configs
├── infrastructure/
│   ├── docker/             # Docker configurations
│   ├── k8s/                # Kubernetes manifests
│   └── terraform/          # Infrastructure as code
├── package.json            # Root workspace
├── docker-compose.yml      # Local dev environment
└── .env.development        # Environment variables
```

## API Integration

### User API (Port 4000)
- User authentication (login/register)
- Personal memory CRUD operations
- User profile management
- Analytics and reporting

### System API (Port 4001) 
- AI agent capability matching
- Context management and storage
- Performance optimization
- System-level orchestration

### GraphQL Endpoints
- User API: `http://localhost:4000/graphql`
- System API: `http://localhost:4001/graphql`

## Development Workflow

1. **Start Development Environment**
   ```bash
   npm run dev
   ```

2. **Make Changes**
   - Edit code in any package
   - Hot reload is enabled for all services

3. **Test Changes**
   ```bash
   npm run test
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Environment Variables

Copy `.env.development` to `.env` and customize:

- `VITE_USER_API_URL` - Frontend to User API
- `VITE_SYSTEM_API_URL` - Frontend to System API
- `USER_API_PORT` - User API port (default: 4000)
- `SYSTEM_API_PORT` - System API port (default: 4001)
- `USER_API_DATABASE_URL` - User database location
- `SYSTEM_API_DATABASE_URL` - System database location

## Contributing

1. Make changes in appropriate package
2. Run tests: `npm run test`
3. Run linting: `npm run lint`
4. Build: `npm run build`
5. Submit pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- GitHub Issues: Report bugs and feature requests
- Documentation: Check individual package READMEs
- CLI Help: `npm run dev:cli -- --help`