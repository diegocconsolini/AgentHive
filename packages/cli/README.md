# AgentHive CLI 🐝

Command your AI agent swarm from the terminal. AgentHive CLI provides direct access to specialized AI agents with intelligent routing and orchestration capabilities.

## 🚀 Installation

Install globally via npm:

```bash
npm install -g agenthive-cli
```

## 📖 Quick Start

After installation, use the `hive` command to interact with your AI agent swarm:

```bash
# Get help with any task
hive ask "Help me optimize a Python function for large datasets"

# Check system status
hive status

# View examples and tips
hive examples
```

## 🎯 Commands

### `hive ask <prompt>`

Send requests to the AI agent swarm for intelligent processing and routing.

**Basic Usage:**
```bash
hive ask "Review this React component for security issues"
hive ask "Design a REST API for user management"
hive ask "Debug this performance bottleneck in my database queries"
```

**Advanced Options:**
```bash
# Use performance-optimized routing
hive ask "Complex algorithm optimization" --strategy performance

# Set request priority
hive ask "Urgent: Fix production error" --priority high

# Custom user and session identifiers
hive ask "Help with deployment" --user-id dev-team --session-id sprint-42
```

### `hive status`

Check the health and availability of AgentHive services.

```bash
hive status
```

Shows:
- System operational status
- API endpoints status
- Service availability
- Provider information

### `hive examples`

Display usage examples and helpful tips.

```bash
hive examples
```

## ⚙️ Configuration

### Routing Strategies

Control how your requests are routed to agents:

- **`balanced`** (default) - Optimal balance of speed and capability
- **`performance`** - Maximum capability for complex tasks
- **`speed`** - Fastest response for simple tasks

```bash
hive ask "Your request" --strategy performance
```

### Priority Levels

Set request priority for better resource allocation:

- **`normal`** (default) - Standard processing
- **`high`** - Prioritized processing
- **`low`** - Background processing

```bash
hive ask "Your request" --priority high
```

## 🛠️ Advanced Usage

### Session Management

Use session IDs to maintain context across multiple requests:

```bash
hive ask "Create a user authentication system" --session-id auth-project
hive ask "Add password reset functionality" --session-id auth-project
hive ask "Implement 2FA support" --session-id auth-project
```

### User Identification

Specify user identifiers for multi-user environments:

```bash
hive ask "Team-specific request" --user-id team-frontend
```

## 🔧 System Requirements

- **Node.js**: Version 16 or higher
- **npm**: Version 7 or higher
- **AgentHive Services**: Running on ports 3000, 4000, 4001

## 🏗️ Architecture

The AgentHive CLI connects to:

- **Web Interface** (port 3000) - User dashboard and management
- **User API** (port 4000) - GraphQL endpoint for user operations  
- **System API** (port 4001) - Orchestration and agent routing

## 📊 Available Agent Types

AgentHive includes 88+ specialized agents across multiple domains:

The AgentHive CLI connects to your local AgentHive services to provide AI-powered assistance across various domains including development, DevOps, security, and content creation.

## 🐛 Troubleshooting

### Connection Issues

If you encounter connection errors:

1. **Check service status:**
   ```bash
   hive status
   ```

2. **Verify services are running:**
   - Web interface: http://localhost:3000
   - User API: http://localhost:4000/graphql
   - System API: http://localhost:4001

3. **Check network connectivity:**
   ```bash
   curl http://localhost:4001/api/status
   ```

### Command Not Found

If `hive` command is not recognized:

1. **Reinstall globally:**
   ```bash
   npm uninstall -g agenthive-cli
   npm install -g agenthive-cli
   ```

2. **Check npm global path:**
   ```bash
   npm config get prefix
   ```

3. **Add to PATH if necessary:**
   ```bash
   export PATH=$PATH:$(npm config get prefix)/bin
   ```

## 📄 License

This project is licensed under the MIT License.

## 🎉 Acknowledgments

Built with modern technologies:
- **Commander.js** - Command line interfaces
- **Chalk** - Terminal string styling
- **Node-fetch** - HTTP client
- **TypeScript** - Type-safe development

---

**Transform your development workflow with AI-powered assistance. Command your agent swarm today!** 🐝✨