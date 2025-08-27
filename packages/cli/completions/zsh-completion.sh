#compdef memory memory-manager

# Memory Manager CLI Zsh Completion
# To enable completion:
#   1. Add to ~/.zshrc: source /path/to/zsh-completion.sh
#   2. Or copy to a directory in $fpath (e.g., ~/.zsh/completions/)
#   3. Or add to system completion dir

_memory() {
    local -a commands
    local -a global_opts
    local context state state_descr line
    typeset -A opt_args

    global_opts=(
        '--help[Show help information]'
        '--version[Show version information]'
        '--verbose[Enable verbose output]'
        '--api-url[Override API URL]:url:'
        '--json[Output in JSON format]'
        '--no-colors[Disable colored output]'
    )

    commands=(
        'auth:Authentication commands'
        'agent:Agent management commands'
        'context:Context management commands'
        'memory:Memory management commands'
        'config:Configuration management'
        'system:System information and diagnostics'
        'dev:Development utilities'
        'perf:Performance analysis commands'
        'monitor:System monitoring commands'
        'env:Environment management'
        'completion:Shell completion management'
    )

    _arguments -C \
        $global_opts \
        '1: :->commands' \
        '*:: :->subcommands'

    case $state in
        commands)
            _describe 'commands' commands
            ;;
        subcommands)
            case $line[1] in
                auth)
                    _memory_auth
                    ;;
                agent)
                    _memory_agent
                    ;;
                context)
                    _memory_context
                    ;;
                memory)
                    _memory_memory
                    ;;
                config)
                    _memory_config
                    ;;
                system)
                    _memory_system
                    ;;
                dev)
                    _memory_dev
                    ;;
                perf)
                    _memory_perf
                    ;;
                monitor)
                    _memory_monitor
                    ;;
                env)
                    _memory_env
                    ;;
                completion)
                    _memory_completion
                    ;;
            esac
            ;;
    esac
}

_memory_auth() {
    local -a subcommands
    subcommands=(
        'login:Login to Memory Manager'
        'logout:Logout from Memory Manager'
        'whoami:Show current authenticated user'
    )

    local -a opts
    opts=(
        '--help[Show help]'
        '--email[Email address]:email:'
        '--password[Password]:password:'
        '--token[JWT token]:token:'
        '--interactive[Interactive login prompts]'
        '--json[Output in JSON format]'
    )

    _arguments \
        $opts \
        '1: :->subcmds' \
        '*:: :->args'

    case $state in
        subcmds)
            _describe 'auth subcommands' subcommands
            ;;
    esac
}

_memory_agent() {
    local -a subcommands
    subcommands=(
        'create:Create a new agent'
        'list:List all agents'
        'show:Show agent details'
        'update:Update an agent'
        'delete:Delete an agent'
        'clone:Clone an agent'
        'export:Export agent configuration'
        'import:Import agent configuration'
        'run:Run an agent'
        'test:Test an agent'
        'validate:Validate agent configuration'
        'benchmark:Benchmark agent performance'
    )

    local -a opts
    opts=(
        '--help[Show help]'
        '--format[Output format]:format:(json table tree yaml csv)'
        '--description[Agent description]:description:'
        '--model[Model type]:model:(haiku sonnet opus)'
        '--system-prompt[System prompt]:prompt:'
        '--tools[Tools (comma-separated)]:tools:'
        '--template[Template name]:template:'
        '--from-file[Read from file]:file:_files'
        '--interactive[Interactive mode]'
        '--detailed[Include detailed information]'
        '--force[Force operation]'
        '--iterations[Number of iterations]:iterations:'
        '--scenario[Test scenario file]:file:_files'
        '--output[Output file]:file:_files'
        '--timeout[Timeout in seconds]:timeout:'
        '--input-file[Input file]:file:_files'
        '--warmup[Warmup iterations]:warmup:'
    )

    _arguments \
        $opts \
        '1: :->subcmds' \
        '*:: :->args'

    case $state in
        subcmds)
            _describe 'agent subcommands' subcommands
            ;;
        args)
            case $line[1] in
                create|update)
                    _arguments \
                        '--name[Agent name]:name:' \
                        $opts
                    ;;
                show|delete|clone|export|run|test|validate|benchmark)
                    _arguments \
                        '1:agent-id:' \
                        $opts
                    ;;
            esac
            ;;
    esac
}

_memory_context() {
    local -a subcommands
    subcommands=(
        'create:Create a new context'
        'list:List all contexts'
        'show:Show context details'
        'update:Update a context'
        'delete:Delete a context'
        'archive:Archive a context'
        'restore:Restore an archived context'
        'analyze:Analyze context content'
        'merge:Merge two contexts'
        'diff:Compare two contexts'
        'export:Export context data'
        'stats:Show context statistics'
    )

    local -a opts
    opts=(
        '--help[Show help]'
        '--format[Output format]:format:(json table tree yaml markdown)'
        '--description[Context description]:description:'
        '--agent[Agent ID or name]:agent:'
        '--from-template[Template name]:template:'
        '--interactive[Interactive mode]'
        '--include-memories[Include memories in output]'
        '--cascade[Delete associated memories]'
        '--force[Force operation]'
        '--depth[Analysis depth]:depth:(shallow deep)'
        '--strategy[Merge strategy]:strategy:(union priority custom)'
        '--conflict-resolution[Conflict resolution]:resolution:(source target merge)'
        '--dry-run[Preview without applying]'
        '--output[Output file]:file:_files'
    )

    _arguments \
        $opts \
        '1: :->subcmds' \
        '*:: :->args'

    case $state in
        subcmds)
            _describe 'context subcommands' subcommands
            ;;
        args)
            case $line[1] in
                create|update)
                    _arguments \
                        '1:context-name:' \
                        $opts
                    ;;
                show|delete|archive|restore|analyze|export)
                    _arguments \
                        '1:context-id:' \
                        $opts
                    ;;
                merge|diff)
                    _arguments \
                        '1:source-context-id:' \
                        '2:target-context-id:' \
                        $opts
                    ;;
            esac
            ;;
    esac
}

_memory_memory() {
    local -a subcommands
    subcommands=(
        'search:Search memories'
        'create:Create a new memory'
        'update:Update a memory'
        'delete:Delete a memory'
        'tag:Manage memory tags'
        'untag:Remove tags from memory'
        'analyze:Analyze memory patterns'
        'cluster:Cluster memories by similarity'
        'summarize:Generate summary of memories'
        'graph:Generate memory relationship graph'
        'related:Find related memories'
        'duplicate:Duplicate a memory'
        'bulk-delete:Delete multiple memories'
        'export:Export memories'
        'list:List memories'
    )

    local -a opts
    opts=(
        '--help[Show help]'
        '--format[Output format]:format:(json table csv markdown)'
        '--agent[Agent name]:agent:'
        '--context[Context ID]:context:'
        '--tags[Tags (comma-separated)]:tags:'
        '--limit[Limit results]:limit:'
        '--similarity[Similarity threshold]:similarity:'
        '--title[Memory title]:title:'
        '--content[Memory content]:content:'
        '--from-file[Read content from file]:file:_files'
        '--interactive[Interactive mode]'
        '--force[Force operation]'
        '--add[Add tags]:tags:'
        '--remove[Remove tags]:tags:'
        '--replace[Replace all tags]:tags:'
        '--time-range[Time range]:range:'
        '--method[Clustering method]:method:(semantic temporal hybrid)'
        '--clusters[Number of clusters]:clusters:'
        '--threshold[Similarity threshold]:threshold:'
        '--output[Output format]:output:(svg png dot json)'
        '--layout[Graph layout]:layout:(force circular hierarchical)'
        '--file[Output file]:file:_files'
        '--offset[Skip results]:offset:'
        '--sort-by[Sort by field]:field:(created updated title)'
    )

    _arguments \
        $opts \
        '1: :->subcmds' \
        '*:: :->args'

    case $state in
        subcmds)
            _describe 'memory subcommands' subcommands
            ;;
        args)
            case $line[1] in
                search)
                    _arguments \
                        '1:query:' \
                        $opts
                    ;;
                update|delete|tag|untag|related|duplicate)
                    _arguments \
                        '1:memory-id:' \
                        $opts
                    ;;
                summarize|bulk-delete|export)
                    _arguments \
                        '*:memory-ids:' \
                        $opts
                    ;;
            esac
            ;;
    esac
}

_memory_config() {
    local -a subcommands
    subcommands=(
        'get:Get configuration value'
        'set:Set configuration value'
        'list:List all configuration'
        'delete:Delete configuration value'
        'validate:Validate configuration'
        'export:Export configuration'
        'import:Import configuration'
        'reset:Reset to defaults'
        'edit:Edit configuration interactively'
        'path:Show configuration file path'
    )

    local -a opts
    opts=(
        '--help[Show help]'
        '--format[Output format]:format:(json table yaml env)'
        '--environment[Environment context]:environment:'
        '--decrypt[Decrypt encrypted values]'
        '--encrypt[Encrypt sensitive values]'
        '--type[Value type]:type:(string number boolean json)'
        '--include-secrets[Include encrypted values]'
        '--filter[Filter keys by pattern]:pattern:'
        '--strict[Strict validation mode]'
        '--output[Output file]:file:_files'
        '--merge[Merge with existing]'
        '--overwrite[Overwrite existing]'
        '--force[Force operation]'
        '--editor[Editor to use]:editor:'
    )

    _arguments \
        $opts \
        '1: :->subcmds' \
        '*:: :->args'

    case $state in
        subcmds)
            _describe 'config subcommands' subcommands
            ;;
        args)
            case $line[1] in
                get|delete)
                    _arguments \
                        '1:config-key:_memory_config_keys' \
                        $opts
                    ;;
                set)
                    _arguments \
                        '1:config-key:_memory_config_keys' \
                        '2:config-value:' \
                        $opts
                    ;;
                import)
                    _arguments \
                        '1:config-file:_files' \
                        $opts
                    ;;
                edit)
                    _arguments \
                        '1:config-key:_memory_config_keys' \
                        $opts
                    ;;
            esac
            ;;
    esac
}

_memory_config_keys() {
    local -a keys
    keys=(
        'api.url:API base URL'
        'api.graphqlUrl:GraphQL API URL'
        'api.timeout:API timeout'
        'auth.accessToken:Access token'
        'preferences.editor:Preferred editor'
        'preferences.outputFormat:Default output format'
    )
    _describe 'config keys' keys
}

_memory_dev() {
    local -a subcommands
    subcommands=(
        'scaffold:Generate code templates'
        'migrate:Run database migrations'
        'seed:Seed database with sample data'
        'backup:Create system backup'
        'restore:Restore from backup'
        'test:Run test suites'
        'validate-config:Validate configuration'
        'lint:Lint code and configuration'
        'docs:Generate and manage documentation'
        'clean:Clean development artifacts'
        'init:Initialize development environment'
    )

    local -a opts
    opts=(
        '--help[Show help]'
        '--format[Output format]:format:(json text)'
        '--template[Template name]:template:'
        '--output[Output directory]:directory:_directories'
        '--overwrite[Overwrite existing files]'
        '--up[Run pending migrations]'
        '--down[Rollback migrations]'
        '--version[Migrate to version]:version:'
        '--steps[Number of steps]:steps:'
        '--dry-run[Preview without applying]'
        '--environment[Target environment]:environment:(dev staging production test)'
        '--dataset[Specific dataset]:dataset:'
        '--clean[Clean existing data]'
        '--destination[Destination directory]:directory:_directories'
        '--compress[Compress files]'
        '--include-config[Include configuration]'
        '--include-secrets[Include secrets]'
        '--force[Force operation]'
        '--exclude-config[Exclude configuration]'
        '--type[Type]:type:(agent context memory command unit integration e2e all)'
        '--pattern[Pattern]:pattern:'
        '--coverage[Generate coverage report]'
        '--watch[Watch mode]'
        '--strict[Strict mode]'
        '--fix[Auto-fix issues]'
        '--rules[Specific rules]:rules:'
        '--include-api[Include API documentation]'
        '--serve[Serve documentation]'
        '--port[Server port]:port:'
        '--cache[Clean cache]'
        '--logs[Clean logs]'
        '--temp[Clean temp files]'
        '--all[Clean all artifacts]'
    )

    _arguments \
        $opts \
        '1: :->subcmds' \
        '*:: :->args'

    case $state in
        subcmds)
            _describe 'dev subcommands' subcommands
            ;;
        args)
            case $line[1] in
                scaffold)
                    _arguments \
                        '1:type:(agent context memory command)' \
                        '2:name:' \
                        $opts
                    ;;
                restore)
                    _arguments \
                        '1:backup-file:_files' \
                        $opts
                    ;;
                docs)
                    _arguments \
                        '1:action:(generate serve build)' \
                        $opts
                    ;;
            esac
            ;;
    esac
}

_memory_perf() {
    local -a subcommands
    subcommands=(
        'analyze:Analyze system performance'
        'benchmark:Run performance benchmarks'
        'profile:Profile a specific operation'
        'optimize:Optimize system performance'
    )

    local -a opts
    opts=(
        '--help[Show help]'
        '--format[Output format]:format:(json)'
        '--agent[Agent name]:agent:'
        '--duration[Duration]:duration:'
        '--include-breakdown[Include detailed breakdown]'
        '--suite[Benchmark suite]:suite:(basic full custom)'
        '--iterations[Number of iterations]:iterations:'
        '--concurrency[Concurrency level]:concurrency:'
        '--warmup[Warmup iterations]:warmup:'
        '--output[Output format]:output:(flamegraph callgrind json)'
        '--file[Output file]:file:_files'
        '--dry-run[Preview without applying]'
        '--component[Component]:component:(db cache api all)'
        '--aggressive[Apply aggressive optimizations]'
    )

    _arguments \
        $opts \
        '1: :->subcmds' \
        '*:: :->args'

    case $state in
        subcmds)
            _describe 'perf subcommands' subcommands
            ;;
        args)
            case $line[1] in
                profile)
                    _arguments \
                        '1:operation:' \
                        $opts
                    ;;
            esac
            ;;
    esac
}

_memory_monitor() {
    local -a subcommands
    subcommands=(
        'status:Check system status'
        'metrics:Get system metrics'
        'health-check:Perform health check'
        'logs:View system logs'
        'usage:Get usage statistics'
        'errors:Analyze system errors'
    )

    local -a opts
    opts=(
        '--help[Show help]'
        '--format[Output format]:format:(json)'
        '--detailed[Include detailed information]'
        '--component[Component]:component:(all api db cache)'
        '--category[Metric category]:category:(performance usage errors)'
        '--time-range[Time range]:range:'
        '--timeout[Timeout]:timeout:'
        '--level[Log level]:level:(error warn info debug)'
        '--lines[Number of lines]:lines:'
        '--tail[Follow log output]'
        '--since[Show logs since]:time:'
        '--granularity[Data granularity]:granularity:(hour day week month)'
        '--severity[Error severity]:severity:(low medium high critical)'
    )

    _arguments \
        $opts \
        '1: :->subcmds' \
        '*:: :->args'

    case $state in
        subcmds)
            _describe 'monitor subcommands' subcommands
            ;;
    esac
}

_memory_env() {
    local -a subcommands
    subcommands=(
        'create:Create a new environment'
        'list:List all environments'
        'switch:Switch to an environment'
        'show:Show environment details'
        'delete:Delete an environment'
    )

    local -a opts
    opts=(
        '--help[Show help]'
        '--format[Output format]:format:(json table)'
        '--from-template[Template]:template:(development staging production)'
        '--copy-from[Copy from environment]:environment:'
        '--status[Filter by status]:status:(active inactive)'
        '--force[Force operation]'
    )

    _arguments \
        $opts \
        '1: :->subcmds' \
        '*:: :->args'

    case $state in
        subcmds)
            _describe 'env subcommands' subcommands
            ;;
        args)
            case $line[1] in
                create|switch|show|delete)
                    _arguments \
                        '1:environment-name:' \
                        $opts
                    ;;
            esac
            ;;
    esac
}

_memory_system() {
    local -a subcommands
    subcommands=(
        'status:Check system connectivity'
        'version:Show version information'
        'doctor:Run system diagnostics'
    )

    local -a opts
    opts=(
        '--help[Show help]'
        '--format[Output format]:format:(json)'
        '--detailed[Include detailed information]'
        '--json[Output in JSON format]'
    )

    _arguments \
        $opts \
        '1: :->subcmds' \
        '*:: :->args'

    case $state in
        subcmds)
            _describe 'system subcommands' subcommands
            ;;
    esac
}

_memory_completion() {
    local -a subcommands
    subcommands=(
        'install:Install shell completion'
        'bash:Generate bash completion'
        'zsh:Generate zsh completion'
        'fish:Generate fish completion'
    )

    local -a opts
    opts=(
        '--help[Show help]'
        '--format[Output format]:format:(json)'
    )

    _arguments \
        $opts \
        '1: :->subcmds' \
        '*:: :->args'

    case $state in
        subcmds)
            _describe 'completion subcommands' subcommands
            ;;
    esac
}

# Main completion function
_memory "$@"