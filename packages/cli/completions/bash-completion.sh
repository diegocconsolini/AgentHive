#!/bin/bash

# Memory Manager CLI Bash Completion
# To enable completion:
#   1. Source this file: source /path/to/bash-completion.sh
#   2. Or add to ~/.bashrc: source /path/to/bash-completion.sh
#   3. Or copy to /etc/bash_completion.d/ (system-wide)

_memory_completion() {
    local cur prev opts base
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    # Get the base command (memory)
    base="${COMP_WORDS[0]}"
    
    # Top-level commands
    local commands="auth agent context memory config system dev perf monitor env completion"
    
    # Global options
    local global_opts="--help --version --verbose --api-url --json --no-colors"
    
    # If we're completing the first argument after 'memory'
    if [[ ${COMP_CWORD} == 1 ]]; then
        COMPREPLY=($(compgen -W "${commands}" -- ${cur}))
        return 0
    fi
    
    # Get the main command
    local command="${COMP_WORDS[1]}"
    
    case "${command}" in
        auth)
            _memory_auth_completion
            ;;
        agent)
            _memory_agent_completion
            ;;
        context)
            _memory_context_completion
            ;;
        memory)
            _memory_memory_completion
            ;;
        config)
            _memory_config_completion
            ;;
        system)
            _memory_system_completion
            ;;
        dev)
            _memory_dev_completion
            ;;
        perf)
            _memory_perf_completion
            ;;
        monitor)
            _memory_monitor_completion
            ;;
        env)
            _memory_env_completion
            ;;
        completion)
            _memory_completion_completion
            ;;
        *)
            COMPREPLY=($(compgen -W "${global_opts}" -- ${cur}))
            ;;
    esac
}

_memory_auth_completion() {
    local cur prev
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    local subcommands="login logout whoami"
    local opts="--help --email --password --token --interactive --json"
    
    if [[ ${COMP_CWORD} == 2 ]]; then
        COMPREPLY=($(compgen -W "${subcommands}" -- ${cur}))
    else
        case "${prev}" in
            --email)
                # No completion for email
                return 0
                ;;
            --password)
                # No completion for password
                return 0
                ;;
            --token)
                # No completion for token
                return 0
                ;;
            *)
                COMPREPLY=($(compgen -W "${opts}" -- ${cur}))
                ;;
        esac
    fi
}

_memory_agent_completion() {
    local cur prev
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    local subcommands="create list show update delete clone export import run test validate benchmark"
    local opts="--help --format --description --model --system-prompt --tools --template --from-file --interactive --detailed --force --iterations --scenario --output"
    local formats="json table tree yaml csv"
    local models="haiku sonnet opus"
    
    if [[ ${COMP_CWORD} == 2 ]]; then
        COMPREPLY=($(compgen -W "${subcommands}" -- ${cur}))
    else
        case "${prev}" in
            --format)
                COMPREPLY=($(compgen -W "${formats}" -- ${cur}))
                ;;
            --model)
                COMPREPLY=($(compgen -W "${models}" -- ${cur}))
                ;;
            --from-file|--scenario)
                COMPREPLY=($(compgen -f -- ${cur}))
                ;;
            --output)
                COMPREPLY=($(compgen -f -- ${cur}))
                ;;
            *)
                COMPREPLY=($(compgen -W "${opts}" -- ${cur}))
                ;;
        esac
    fi
}

_memory_context_completion() {
    local cur prev
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    local subcommands="create list show update delete archive restore analyze merge diff export stats"
    local opts="--help --format --description --agent --from-template --interactive --include-memories --cascade --force --depth --strategy --conflict-resolution --dry-run --output"
    local formats="json table tree yaml markdown"
    local strategies="union priority custom"
    local depths="shallow deep"
    
    if [[ ${COMP_CWORD} == 2 ]]; then
        COMPREPLY=($(compgen -W "${subcommands}" -- ${cur}))
    else
        case "${prev}" in
            --format)
                COMPREPLY=($(compgen -W "${formats}" -- ${cur}))
                ;;
            --strategy)
                COMPREPLY=($(compgen -W "${strategies}" -- ${cur}))
                ;;
            --depth)
                COMPREPLY=($(compgen -W "${depths}" -- ${cur}))
                ;;
            --output)
                COMPREPLY=($(compgen -f -- ${cur}))
                ;;
            *)
                COMPREPLY=($(compgen -W "${opts}" -- ${cur}))
                ;;
        esac
    fi
}

_memory_memory_completion() {
    local cur prev
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    local subcommands="search create update delete tag untag analyze cluster summarize graph related duplicate bulk-delete export list"
    local opts="--help --format --agent --context --tags --limit --similarity --title --content --from-file --interactive --force --add --remove --replace --time-range --method --clusters --threshold --output --layout --file"
    local formats="json table csv markdown"
    local methods="semantic temporal hybrid"
    local layouts="force circular hierarchical"
    local outputs="svg png dot json"
    
    if [[ ${COMP_CWORD} == 2 ]]; then
        COMPREPLY=($(compgen -W "${subcommands}" -- ${cur}))
    else
        case "${prev}" in
            --format)
                COMPREPLY=($(compgen -W "${formats}" -- ${cur}))
                ;;
            --method)
                COMPREPLY=($(compgen -W "${methods}" -- ${cur}))
                ;;
            --layout)
                COMPREPLY=($(compgen -W "${layouts}" -- ${cur}))
                ;;
            --output)
                COMPREPLY=($(compgen -W "${outputs}" -- ${cur}))
                ;;
            --from-file|--file)
                COMPREPLY=($(compgen -f -- ${cur}))
                ;;
            *)
                COMPREPLY=($(compgen -W "${opts}" -- ${cur}))
                ;;
        esac
    fi
}

_memory_config_completion() {
    local cur prev
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    local subcommands="get set list delete validate export import reset edit path"
    local opts="--help --format --environment --decrypt --encrypt --type --include-secrets --filter --strict --output --merge --overwrite --force --editor"
    local formats="json table yaml env"
    local types="string number boolean json"
    
    if [[ ${COMP_CWORD} == 2 ]]; then
        COMPREPLY=($(compgen -W "${subcommands}" -- ${cur}))
    else
        case "${prev}" in
            --format)
                COMPREPLY=($(compgen -W "${formats}" -- ${cur}))
                ;;
            --type)
                COMPREPLY=($(compgen -W "${types}" -- ${cur}))
                ;;
            --output|import)
                COMPREPLY=($(compgen -f -- ${cur}))
                ;;
            get|set|delete)
                # Complete config keys
                _memory_config_keys_completion
                ;;
            *)
                COMPREPLY=($(compgen -W "${opts}" -- ${cur}))
                ;;
        esac
    fi
}

_memory_config_keys_completion() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    local common_keys="api.url api.graphqlUrl api.timeout auth.accessToken preferences.editor preferences.outputFormat"
    COMPREPLY=($(compgen -W "${common_keys}" -- ${cur}))
}

_memory_dev_completion() {
    local cur prev
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    local subcommands="scaffold migrate seed backup restore test validate-config lint docs clean init"
    local opts="--help --format --template --output --overwrite --up --down --version --steps --dry-run --environment --dataset --clean --destination --compress --include-config --include-secrets --force --exclude-config --type --pattern --coverage --watch --strict --fix --rules --destination --include-api --serve --port --cache --logs --temp --all"
    local types="agent context memory command"
    local test_types="unit integration e2e all"
    local environments="dev staging production test"
    local output_formats="html markdown pdf"
    
    if [[ ${COMP_CWORD} == 2 ]]; then
        COMPREPLY=($(compgen -W "${subcommands}" -- ${cur}))
    else
        case "${prev}" in
            scaffold)
                if [[ ${COMP_CWORD} == 3 ]]; then
                    COMPREPLY=($(compgen -W "${types}" -- ${cur}))
                fi
                ;;
            --type)
                case "${COMP_WORDS[2]}" in
                    test)
                        COMPREPLY=($(compgen -W "${test_types}" -- ${cur}))
                        ;;
                    scaffold)
                        COMPREPLY=($(compgen -W "${types}" -- ${cur}))
                        ;;
                esac
                ;;
            --environment)
                COMPREPLY=($(compgen -W "${environments}" -- ${cur}))
                ;;
            --output)
                case "${COMP_WORDS[2]}" in
                    docs)
                        COMPREPLY=($(compgen -W "${output_formats}" -- ${cur}))
                        ;;
                    *)
                        COMPREPLY=($(compgen -f -- ${cur}))
                        ;;
                esac
                ;;
            --destination|--template|restore)
                COMPREPLY=($(compgen -f -- ${cur}))
                ;;
            *)
                COMPREPLY=($(compgen -W "${opts}" -- ${cur}))
                ;;
        esac
    fi
}

_memory_perf_completion() {
    local cur prev
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    local subcommands="analyze benchmark profile optimize"
    local opts="--help --format --agent --duration --include-breakdown --suite --iterations --concurrency --warmup --output --file --dry-run --component --aggressive"
    local suites="basic full custom"
    local components="db cache api all"
    local outputs="flamegraph callgrind json"
    
    if [[ ${COMP_CWORD} == 2 ]]; then
        COMPREPLY=($(compgen -W "${subcommands}" -- ${cur}))
    else
        case "${prev}" in
            --suite)
                COMPREPLY=($(compgen -W "${suites}" -- ${cur}))
                ;;
            --component)
                COMPREPLY=($(compgen -W "${components}" -- ${cur}))
                ;;
            --output)
                COMPREPLY=($(compgen -W "${outputs}" -- ${cur}))
                ;;
            --file)
                COMPREPLY=($(compgen -f -- ${cur}))
                ;;
            *)
                COMPREPLY=($(compgen -W "${opts}" -- ${cur}))
                ;;
        esac
    fi
}

_memory_monitor_completion() {
    local cur prev
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    local subcommands="status metrics health-check logs usage errors"
    local opts="--help --format --detailed --component --category --time-range --timeout --level --lines --tail --since --granularity --severity"
    local components="all api db cache"
    local categories="performance usage errors"
    local levels="error warn info debug"
    local granularities="hour day week month"
    local severities="low medium high critical"
    
    if [[ ${COMP_CWORD} == 2 ]]; then
        COMPREPLY=($(compgen -W "${subcommands}" -- ${cur}))
    else
        case "${prev}" in
            --component)
                COMPREPLY=($(compgen -W "${components}" -- ${cur}))
                ;;
            --category)
                COMPREPLY=($(compgen -W "${categories}" -- ${cur}))
                ;;
            --level)
                COMPREPLY=($(compgen -W "${levels}" -- ${cur}))
                ;;
            --granularity)
                COMPREPLY=($(compgen -W "${granularities}" -- ${cur}))
                ;;
            --severity)
                COMPREPLY=($(compgen -W "${severities}" -- ${cur}))
                ;;
            *)
                COMPREPLY=($(compgen -W "${opts}" -- ${cur}))
                ;;
        esac
    fi
}

_memory_env_completion() {
    local cur prev
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    local subcommands="create list switch show delete"
    local opts="--help --format --from-template --copy-from --status --force"
    local templates="development staging production"
    local statuses="active inactive"
    
    if [[ ${COMP_CWORD} == 2 ]]; then
        COMPREPLY=($(compgen -W "${subcommands}" -- ${cur}))
    else
        case "${prev}" in
            --from-template)
                COMPREPLY=($(compgen -W "${templates}" -- ${cur}))
                ;;
            --status)
                COMPREPLY=($(compgen -W "${statuses}" -- ${cur}))
                ;;
            *)
                COMPREPLY=($(compgen -W "${opts}" -- ${cur}))
                ;;
        esac
    fi
}

_memory_system_completion() {
    local cur prev
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    local subcommands="status version doctor"
    local opts="--help --format --detailed --json"
    
    if [[ ${COMP_CWORD} == 2 ]]; then
        COMPREPLY=($(compgen -W "${subcommands}" -- ${cur}))
    else
        COMPREPLY=($(compgen -W "${opts}" -- ${cur}))
    fi
}

_memory_completion_completion() {
    local cur prev
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    local subcommands="install bash zsh fish"
    local opts="--help --format"
    
    if [[ ${COMP_CWORD} == 2 ]]; then
        COMPREPLY=($(compgen -W "${subcommands}" -- ${cur}))
    else
        COMPREPLY=($(compgen -W "${opts}" -- ${cur}))
    fi
}

# Register the completion function
complete -F _memory_completion memory

# Also handle case where the command might be called via node or npm
complete -F _memory_completion memory-manager
complete -F _memory_completion npx memory-manager