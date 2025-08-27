# Memory Manager CLI Fish Shell Completion
# To enable completion:
#   1. Copy this file to ~/.config/fish/completions/memory.fish
#   2. Or source it in your config.fish: source /path/to/fish-completion.fish

# Main command completion
complete -c memory -f

# Global options
complete -c memory -l help -d "Show help information"
complete -c memory -l version -d "Show version information"
complete -c memory -l verbose -d "Enable verbose output"
complete -c memory -l api-url -d "Override API URL" -x
complete -c memory -l json -d "Output in JSON format"
complete -c memory -l no-colors -d "Disable colored output"

# Top-level commands
complete -c memory -n "__fish_use_subcommand" -a "auth" -d "Authentication commands"
complete -c memory -n "__fish_use_subcommand" -a "agent" -d "Agent management commands"
complete -c memory -n "__fish_use_subcommand" -a "context" -d "Context management commands"
complete -c memory -n "__fish_use_subcommand" -a "memory" -d "Memory management commands"
complete -c memory -n "__fish_use_subcommand" -a "config" -d "Configuration management"
complete -c memory -n "__fish_use_subcommand" -a "system" -d "System information and diagnostics"
complete -c memory -n "__fish_use_subcommand" -a "dev" -d "Development utilities"
complete -c memory -n "__fish_use_subcommand" -a "perf" -d "Performance analysis commands"
complete -c memory -n "__fish_use_subcommand" -a "monitor" -d "System monitoring commands"
complete -c memory -n "__fish_use_subcommand" -a "env" -d "Environment management"
complete -c memory -n "__fish_use_subcommand" -a "completion" -d "Shell completion management"

# Auth subcommands
complete -c memory -n "__fish_seen_subcommand_from auth" -a "login" -d "Login to Memory Manager"
complete -c memory -n "__fish_seen_subcommand_from auth" -a "logout" -d "Logout from Memory Manager"
complete -c memory -n "__fish_seen_subcommand_from auth" -a "whoami" -d "Show current authenticated user"

# Auth options
complete -c memory -n "__fish_seen_subcommand_from auth" -l email -d "Email address" -x
complete -c memory -n "__fish_seen_subcommand_from auth" -l password -d "Password" -x
complete -c memory -n "__fish_seen_subcommand_from auth" -l token -d "JWT token" -x
complete -c memory -n "__fish_seen_subcommand_from auth" -l interactive -d "Interactive login prompts"
complete -c memory -n "__fish_seen_subcommand_from auth" -l json -d "Output in JSON format"

# Agent subcommands
complete -c memory -n "__fish_seen_subcommand_from agent" -a "create" -d "Create a new agent"
complete -c memory -n "__fish_seen_subcommand_from agent" -a "list" -d "List all agents"
complete -c memory -n "__fish_seen_subcommand_from agent" -a "show" -d "Show agent details"
complete -c memory -n "__fish_seen_subcommand_from agent" -a "update" -d "Update an agent"
complete -c memory -n "__fish_seen_subcommand_from agent" -a "delete" -d "Delete an agent"
complete -c memory -n "__fish_seen_subcommand_from agent" -a "clone" -d "Clone an agent"
complete -c memory -n "__fish_seen_subcommand_from agent" -a "export" -d "Export agent configuration"
complete -c memory -n "__fish_seen_subcommand_from agent" -a "import" -d "Import agent configuration"
complete -c memory -n "__fish_seen_subcommand_from agent" -a "run" -d "Run an agent"
complete -c memory -n "__fish_seen_subcommand_from agent" -a "test" -d "Test an agent"
complete -c memory -n "__fish_seen_subcommand_from agent" -a "validate" -d "Validate agent configuration"
complete -c memory -n "__fish_seen_subcommand_from agent" -a "benchmark" -d "Benchmark agent performance"

# Agent options
complete -c memory -n "__fish_seen_subcommand_from agent" -l format -d "Output format" -xa "json table tree yaml csv"
complete -c memory -n "__fish_seen_subcommand_from agent" -l description -d "Agent description" -x
complete -c memory -n "__fish_seen_subcommand_from agent" -l model -d "Model type" -xa "haiku sonnet opus"
complete -c memory -n "__fish_seen_subcommand_from agent" -l system-prompt -d "System prompt" -x
complete -c memory -n "__fish_seen_subcommand_from agent" -l tools -d "Tools (comma-separated)" -x
complete -c memory -n "__fish_seen_subcommand_from agent" -l template -d "Template name" -x
complete -c memory -n "__fish_seen_subcommand_from agent" -l from-file -d "Read from file" -F
complete -c memory -n "__fish_seen_subcommand_from agent" -l interactive -d "Interactive mode"
complete -c memory -n "__fish_seen_subcommand_from agent" -l detailed -d "Include detailed information"
complete -c memory -n "__fish_seen_subcommand_from agent" -l force -d "Force operation"
complete -c memory -n "__fish_seen_subcommand_from agent" -l iterations -d "Number of iterations" -x
complete -c memory -n "__fish_seen_subcommand_from agent" -l scenario -d "Test scenario file" -F
complete -c memory -n "__fish_seen_subcommand_from agent" -l output -d "Output file" -F
complete -c memory -n "__fish_seen_subcommand_from agent" -l timeout -d "Timeout in seconds" -x
complete -c memory -n "__fish_seen_subcommand_from agent" -l input-file -d "Input file" -F
complete -c memory -n "__fish_seen_subcommand_from agent" -l warmup -d "Warmup iterations" -x

# Context subcommands
complete -c memory -n "__fish_seen_subcommand_from context" -a "create" -d "Create a new context"
complete -c memory -n "__fish_seen_subcommand_from context" -a "list" -d "List all contexts"
complete -c memory -n "__fish_seen_subcommand_from context" -a "show" -d "Show context details"
complete -c memory -n "__fish_seen_subcommand_from context" -a "update" -d "Update a context"
complete -c memory -n "__fish_seen_subcommand_from context" -a "delete" -d "Delete a context"
complete -c memory -n "__fish_seen_subcommand_from context" -a "archive" -d "Archive a context"
complete -c memory -n "__fish_seen_subcommand_from context" -a "restore" -d "Restore an archived context"
complete -c memory -n "__fish_seen_subcommand_from context" -a "analyze" -d "Analyze context content"
complete -c memory -n "__fish_seen_subcommand_from context" -a "merge" -d "Merge two contexts"
complete -c memory -n "__fish_seen_subcommand_from context" -a "diff" -d "Compare two contexts"
complete -c memory -n "__fish_seen_subcommand_from context" -a "export" -d "Export context data"
complete -c memory -n "__fish_seen_subcommand_from context" -a "stats" -d "Show context statistics"

# Context options
complete -c memory -n "__fish_seen_subcommand_from context" -l format -d "Output format" -xa "json table tree yaml markdown"
complete -c memory -n "__fish_seen_subcommand_from context" -l description -d "Context description" -x
complete -c memory -n "__fish_seen_subcommand_from context" -l agent -d "Agent ID or name" -x
complete -c memory -n "__fish_seen_subcommand_from context" -l from-template -d "Template name" -x
complete -c memory -n "__fish_seen_subcommand_from context" -l interactive -d "Interactive mode"
complete -c memory -n "__fish_seen_subcommand_from context" -l include-memories -d "Include memories in output"
complete -c memory -n "__fish_seen_subcommand_from context" -l cascade -d "Delete associated memories"
complete -c memory -n "__fish_seen_subcommand_from context" -l force -d "Force operation"
complete -c memory -n "__fish_seen_subcommand_from context" -l depth -d "Analysis depth" -xa "shallow deep"
complete -c memory -n "__fish_seen_subcommand_from context" -l strategy -d "Merge strategy" -xa "union priority custom"
complete -c memory -n "__fish_seen_subcommand_from context" -l conflict-resolution -d "Conflict resolution" -xa "source target merge"
complete -c memory -n "__fish_seen_subcommand_from context" -l dry-run -d "Preview without applying"
complete -c memory -n "__fish_seen_subcommand_from context" -l output -d "Output file" -F

# Memory subcommands
complete -c memory -n "__fish_seen_subcommand_from memory" -a "search" -d "Search memories"
complete -c memory -n "__fish_seen_subcommand_from memory" -a "create" -d "Create a new memory"
complete -c memory -n "__fish_seen_subcommand_from memory" -a "update" -d "Update a memory"
complete -c memory -n "__fish_seen_subcommand_from memory" -a "delete" -d "Delete a memory"
complete -c memory -n "__fish_seen_subcommand_from memory" -a "tag" -d "Manage memory tags"
complete -c memory -n "__fish_seen_subcommand_from memory" -a "untag" -d "Remove tags from memory"
complete -c memory -n "__fish_seen_subcommand_from memory" -a "analyze" -d "Analyze memory patterns"
complete -c memory -n "__fish_seen_subcommand_from memory" -a "cluster" -d "Cluster memories by similarity"
complete -c memory -n "__fish_seen_subcommand_from memory" -a "summarize" -d "Generate summary of memories"
complete -c memory -n "__fish_seen_subcommand_from memory" -a "graph" -d "Generate memory relationship graph"
complete -c memory -n "__fish_seen_subcommand_from memory" -a "related" -d "Find related memories"
complete -c memory -n "__fish_seen_subcommand_from memory" -a "duplicate" -d "Duplicate a memory"
complete -c memory -n "__fish_seen_subcommand_from memory" -a "bulk-delete" -d "Delete multiple memories"
complete -c memory -n "__fish_seen_subcommand_from memory" -a "export" -d "Export memories"
complete -c memory -n "__fish_seen_subcommand_from memory" -a "list" -d "List memories"

# Memory options
complete -c memory -n "__fish_seen_subcommand_from memory" -l format -d "Output format" -xa "json table csv markdown"
complete -c memory -n "__fish_seen_subcommand_from memory" -l agent -d "Agent name" -x
complete -c memory -n "__fish_seen_subcommand_from memory" -l context -d "Context ID" -x
complete -c memory -n "__fish_seen_subcommand_from memory" -l tags -d "Tags (comma-separated)" -x
complete -c memory -n "__fish_seen_subcommand_from memory" -l limit -d "Limit results" -x
complete -c memory -n "__fish_seen_subcommand_from memory" -l similarity -d "Similarity threshold" -x
complete -c memory -n "__fish_seen_subcommand_from memory" -l title -d "Memory title" -x
complete -c memory -n "__fish_seen_subcommand_from memory" -l content -d "Memory content" -x
complete -c memory -n "__fish_seen_subcommand_from memory" -l from-file -d "Read content from file" -F
complete -c memory -n "__fish_seen_subcommand_from memory" -l interactive -d "Interactive mode"
complete -c memory -n "__fish_seen_subcommand_from memory" -l force -d "Force operation"
complete -c memory -n "__fish_seen_subcommand_from memory" -l add -d "Add tags" -x
complete -c memory -n "__fish_seen_subcommand_from memory" -l remove -d "Remove tags" -x
complete -c memory -n "__fish_seen_subcommand_from memory" -l replace -d "Replace all tags" -x
complete -c memory -n "__fish_seen_subcommand_from memory" -l time-range -d "Time range" -x
complete -c memory -n "__fish_seen_subcommand_from memory" -l method -d "Clustering method" -xa "semantic temporal hybrid"
complete -c memory -n "__fish_seen_subcommand_from memory" -l clusters -d "Number of clusters" -x
complete -c memory -n "__fish_seen_subcommand_from memory" -l threshold -d "Similarity threshold" -x
complete -c memory -n "__fish_seen_subcommand_from memory" -l output -d "Output format" -xa "svg png dot json"
complete -c memory -n "__fish_seen_subcommand_from memory" -l layout -d "Graph layout" -xa "force circular hierarchical"
complete -c memory -n "__fish_seen_subcommand_from memory" -l file -d "Output file" -F
complete -c memory -n "__fish_seen_subcommand_from memory" -l offset -d "Skip results" -x
complete -c memory -n "__fish_seen_subcommand_from memory" -l sort-by -d "Sort by field" -xa "created updated title"

# Config subcommands
complete -c memory -n "__fish_seen_subcommand_from config" -a "get" -d "Get configuration value"
complete -c memory -n "__fish_seen_subcommand_from config" -a "set" -d "Set configuration value"
complete -c memory -n "__fish_seen_subcommand_from config" -a "list" -d "List all configuration"
complete -c memory -n "__fish_seen_subcommand_from config" -a "delete" -d "Delete configuration value"
complete -c memory -n "__fish_seen_subcommand_from config" -a "validate" -d "Validate configuration"
complete -c memory -n "__fish_seen_subcommand_from config" -a "export" -d "Export configuration"
complete -c memory -n "__fish_seen_subcommand_from config" -a "import" -d "Import configuration"
complete -c memory -n "__fish_seen_subcommand_from config" -a "reset" -d "Reset to defaults"
complete -c memory -n "__fish_seen_subcommand_from config" -a "edit" -d "Edit configuration interactively"
complete -c memory -n "__fish_seen_subcommand_from config" -a "path" -d "Show configuration file path"

# Config options
complete -c memory -n "__fish_seen_subcommand_from config" -l format -d "Output format" -xa "json table yaml env"
complete -c memory -n "__fish_seen_subcommand_from config" -l environment -d "Environment context" -x
complete -c memory -n "__fish_seen_subcommand_from config" -l decrypt -d "Decrypt encrypted values"
complete -c memory -n "__fish_seen_subcommand_from config" -l encrypt -d "Encrypt sensitive values"
complete -c memory -n "__fish_seen_subcommand_from config" -l type -d "Value type" -xa "string number boolean json"
complete -c memory -n "__fish_seen_subcommand_from config" -l include-secrets -d "Include encrypted values"
complete -c memory -n "__fish_seen_subcommand_from config" -l filter -d "Filter keys by pattern" -x
complete -c memory -n "__fish_seen_subcommand_from config" -l strict -d "Strict validation mode"
complete -c memory -n "__fish_seen_subcommand_from config" -l output -d "Output file" -F
complete -c memory -n "__fish_seen_subcommand_from config" -l merge -d "Merge with existing"
complete -c memory -n "__fish_seen_subcommand_from config" -l overwrite -d "Overwrite existing"
complete -c memory -n "__fish_seen_subcommand_from config" -l force -d "Force operation"
complete -c memory -n "__fish_seen_subcommand_from config" -l editor -d "Editor to use" -x

# Config key completions
complete -c memory -n "__fish_seen_subcommand_from config; and __fish_seen_subcommand_from get delete" -a "api.url api.graphqlUrl api.timeout auth.accessToken preferences.editor preferences.outputFormat" -d "Configuration key"

# System subcommands
complete -c memory -n "__fish_seen_subcommand_from system" -a "status" -d "Check system connectivity"
complete -c memory -n "__fish_seen_subcommand_from system" -a "version" -d "Show version information"
complete -c memory -n "__fish_seen_subcommand_from system" -a "doctor" -d "Run system diagnostics"

# System options
complete -c memory -n "__fish_seen_subcommand_from system" -l format -d "Output format" -xa "json"
complete -c memory -n "__fish_seen_subcommand_from system" -l detailed -d "Include detailed information"
complete -c memory -n "__fish_seen_subcommand_from system" -l json -d "Output in JSON format"

# Dev subcommands
complete -c memory -n "__fish_seen_subcommand_from dev" -a "scaffold" -d "Generate code templates"
complete -c memory -n "__fish_seen_subcommand_from dev" -a "migrate" -d "Run database migrations"
complete -c memory -n "__fish_seen_subcommand_from dev" -a "seed" -d "Seed database with sample data"
complete -c memory -n "__fish_seen_subcommand_from dev" -a "backup" -d "Create system backup"
complete -c memory -n "__fish_seen_subcommand_from dev" -a "restore" -d "Restore from backup"
complete -c memory -n "__fish_seen_subcommand_from dev" -a "test" -d "Run test suites"
complete -c memory -n "__fish_seen_subcommand_from dev" -a "validate-config" -d "Validate configuration"
complete -c memory -n "__fish_seen_subcommand_from dev" -a "lint" -d "Lint code and configuration"
complete -c memory -n "__fish_seen_subcommand_from dev" -a "docs" -d "Generate and manage documentation"
complete -c memory -n "__fish_seen_subcommand_from dev" -a "clean" -d "Clean development artifacts"
complete -c memory -n "__fish_seen_subcommand_from dev" -a "init" -d "Initialize development environment"

# Dev scaffold types
complete -c memory -n "__fish_seen_subcommand_from dev; and __fish_seen_subcommand_from scaffold" -a "agent context memory command" -d "Scaffold type"

# Dev options
complete -c memory -n "__fish_seen_subcommand_from dev" -l format -d "Output format" -xa "json text"
complete -c memory -n "__fish_seen_subcommand_from dev" -l template -d "Template name" -x
complete -c memory -n "__fish_seen_subcommand_from dev" -l output -d "Output directory" -xa "(__fish_complete_directories)"
complete -c memory -n "__fish_seen_subcommand_from dev" -l overwrite -d "Overwrite existing files"
complete -c memory -n "__fish_seen_subcommand_from dev" -l up -d "Run pending migrations"
complete -c memory -n "__fish_seen_subcommand_from dev" -l down -d "Rollback migrations"
complete -c memory -n "__fish_seen_subcommand_from dev" -l version -d "Migrate to version" -x
complete -c memory -n "__fish_seen_subcommand_from dev" -l steps -d "Number of steps" -x
complete -c memory -n "__fish_seen_subcommand_from dev" -l dry-run -d "Preview without applying"
complete -c memory -n "__fish_seen_subcommand_from dev" -l environment -d "Target environment" -xa "dev staging production test"
complete -c memory -n "__fish_seen_subcommand_from dev" -l dataset -d "Specific dataset" -x
complete -c memory -n "__fish_seen_subcommand_from dev" -l clean -d "Clean existing data"
complete -c memory -n "__fish_seen_subcommand_from dev" -l destination -d "Destination directory" -xa "(__fish_complete_directories)"
complete -c memory -n "__fish_seen_subcommand_from dev" -l compress -d "Compress files"
complete -c memory -n "__fish_seen_subcommand_from dev" -l include-config -d "Include configuration"
complete -c memory -n "__fish_seen_subcommand_from dev" -l include-secrets -d "Include secrets"
complete -c memory -n "__fish_seen_subcommand_from dev" -l force -d "Force operation"
complete -c memory -n "__fish_seen_subcommand_from dev" -l exclude-config -d "Exclude configuration"
complete -c memory -n "__fish_seen_subcommand_from dev" -l type -d "Type" -xa "unit integration e2e all"
complete -c memory -n "__fish_seen_subcommand_from dev" -l pattern -d "Pattern" -x
complete -c memory -n "__fish_seen_subcommand_from dev" -l coverage -d "Generate coverage report"
complete -c memory -n "__fish_seen_subcommand_from dev" -l watch -d "Watch mode"
complete -c memory -n "__fish_seen_subcommand_from dev" -l strict -d "Strict mode"
complete -c memory -n "__fish_seen_subcommand_from dev" -l fix -d "Auto-fix issues"
complete -c memory -n "__fish_seen_subcommand_from dev" -l rules -d "Specific rules" -x
complete -c memory -n "__fish_seen_subcommand_from dev" -l include-api -d "Include API documentation"
complete -c memory -n "__fish_seen_subcommand_from dev" -l serve -d "Serve documentation"
complete -c memory -n "__fish_seen_subcommand_from dev" -l port -d "Server port" -x
complete -c memory -n "__fish_seen_subcommand_from dev" -l cache -d "Clean cache"
complete -c memory -n "__fish_seen_subcommand_from dev" -l logs -d "Clean logs"
complete -c memory -n "__fish_seen_subcommand_from dev" -l temp -d "Clean temp files"
complete -c memory -n "__fish_seen_subcommand_from dev" -l all -d "Clean all artifacts"

# Perf subcommands
complete -c memory -n "__fish_seen_subcommand_from perf" -a "analyze" -d "Analyze system performance"
complete -c memory -n "__fish_seen_subcommand_from perf" -a "benchmark" -d "Run performance benchmarks"
complete -c memory -n "__fish_seen_subcommand_from perf" -a "profile" -d "Profile a specific operation"
complete -c memory -n "__fish_seen_subcommand_from perf" -a "optimize" -d "Optimize system performance"

# Perf options
complete -c memory -n "__fish_seen_subcommand_from perf" -l format -d "Output format" -xa "json"
complete -c memory -n "__fish_seen_subcommand_from perf" -l agent -d "Agent name" -x
complete -c memory -n "__fish_seen_subcommand_from perf" -l duration -d "Duration" -x
complete -c memory -n "__fish_seen_subcommand_from perf" -l include-breakdown -d "Include detailed breakdown"
complete -c memory -n "__fish_seen_subcommand_from perf" -l suite -d "Benchmark suite" -xa "basic full custom"
complete -c memory -n "__fish_seen_subcommand_from perf" -l iterations -d "Number of iterations" -x
complete -c memory -n "__fish_seen_subcommand_from perf" -l concurrency -d "Concurrency level" -x
complete -c memory -n "__fish_seen_subcommand_from perf" -l warmup -d "Warmup iterations" -x
complete -c memory -n "__fish_seen_subcommand_from perf" -l output -d "Output format" -xa "flamegraph callgrind json"
complete -c memory -n "__fish_seen_subcommand_from perf" -l file -d "Output file" -F
complete -c memory -n "__fish_seen_subcommand_from perf" -l dry-run -d "Preview without applying"
complete -c memory -n "__fish_seen_subcommand_from perf" -l component -d "Component" -xa "db cache api all"
complete -c memory -n "__fish_seen_subcommand_from perf" -l aggressive -d "Apply aggressive optimizations"

# Monitor subcommands
complete -c memory -n "__fish_seen_subcommand_from monitor" -a "status" -d "Check system status"
complete -c memory -n "__fish_seen_subcommand_from monitor" -a "metrics" -d "Get system metrics"
complete -c memory -n "__fish_seen_subcommand_from monitor" -a "health-check" -d "Perform health check"
complete -c memory -n "__fish_seen_subcommand_from monitor" -a "logs" -d "View system logs"
complete -c memory -n "__fish_seen_subcommand_from monitor" -a "usage" -d "Get usage statistics"
complete -c memory -n "__fish_seen_subcommand_from monitor" -a "errors" -d "Analyze system errors"

# Monitor options
complete -c memory -n "__fish_seen_subcommand_from monitor" -l format -d "Output format" -xa "json"
complete -c memory -n "__fish_seen_subcommand_from monitor" -l detailed -d "Include detailed information"
complete -c memory -n "__fish_seen_subcommand_from monitor" -l component -d "Component" -xa "all api db cache"
complete -c memory -n "__fish_seen_subcommand_from monitor" -l category -d "Metric category" -xa "performance usage errors"
complete -c memory -n "__fish_seen_subcommand_from monitor" -l time-range -d "Time range" -x
complete -c memory -n "__fish_seen_subcommand_from monitor" -l timeout -d "Timeout" -x
complete -c memory -n "__fish_seen_subcommand_from monitor" -l level -d "Log level" -xa "error warn info debug"
complete -c memory -n "__fish_seen_subcommand_from monitor" -l lines -d "Number of lines" -x
complete -c memory -n "__fish_seen_subcommand_from monitor" -l tail -d "Follow log output"
complete -c memory -n "__fish_seen_subcommand_from monitor" -l since -d "Show logs since" -x
complete -c memory -n "__fish_seen_subcommand_from monitor" -l granularity -d "Data granularity" -xa "hour day week month"
complete -c memory -n "__fish_seen_subcommand_from monitor" -l severity -d "Error severity" -xa "low medium high critical"

# Env subcommands
complete -c memory -n "__fish_seen_subcommand_from env" -a "create" -d "Create a new environment"
complete -c memory -n "__fish_seen_subcommand_from env" -a "list" -d "List all environments"
complete -c memory -n "__fish_seen_subcommand_from env" -a "switch" -d "Switch to an environment"
complete -c memory -n "__fish_seen_subcommand_from env" -a "show" -d "Show environment details"
complete -c memory -n "__fish_seen_subcommand_from env" -a "delete" -d "Delete an environment"

# Env options
complete -c memory -n "__fish_seen_subcommand_from env" -l format -d "Output format" -xa "json table"
complete -c memory -n "__fish_seen_subcommand_from env" -l from-template -d "Template" -xa "development staging production"
complete -c memory -n "__fish_seen_subcommand_from env" -l copy-from -d "Copy from environment" -x
complete -c memory -n "__fish_seen_subcommand_from env" -l status -d "Filter by status" -xa "active inactive"
complete -c memory -n "__fish_seen_subcommand_from env" -l force -d "Force operation"

# Completion subcommands
complete -c memory -n "__fish_seen_subcommand_from completion" -a "install" -d "Install shell completion"
complete -c memory -n "__fish_seen_subcommand_from completion" -a "bash" -d "Generate bash completion"
complete -c memory -n "__fish_seen_subcommand_from completion" -a "zsh" -d "Generate zsh completion"
complete -c memory -n "__fish_seen_subcommand_from completion" -a "fish" -d "Generate fish completion"

# Completion options
complete -c memory -n "__fish_seen_subcommand_from completion" -l format -d "Output format" -xa "json"