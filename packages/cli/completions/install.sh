#!/bin/bash

# Memory Manager CLI Shell Completion Installer
# This script installs shell completion for the Memory Manager CLI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_NAME="memory"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect the current shell
detect_shell() {
    if [ -n "$ZSH_VERSION" ]; then
        echo "zsh"
    elif [ -n "$BASH_VERSION" ]; then
        echo "bash"
    else
        # Try to detect from SHELL environment variable
        case "$SHELL" in
            */zsh) echo "zsh" ;;
            */bash) echo "bash" ;;
            */fish) echo "fish" ;;
            *) echo "unknown" ;;
        esac
    fi
}

# Install bash completion
install_bash_completion() {
    log_info "Installing bash completion..."
    
    local completion_file="$SCRIPT_DIR/bash-completion.sh"
    local install_dir=""
    local source_line="source \"$completion_file\""
    
    # Try system-wide installation first
    if [ -d "/etc/bash_completion.d" ] && [ -w "/etc/bash_completion.d" ]; then
        install_dir="/etc/bash_completion.d"
        log_info "Installing system-wide to $install_dir"
        sudo cp "$completion_file" "$install_dir/${CLI_NAME}"
        log_success "Bash completion installed system-wide"
        return
    fi
    
    # Try user-local installation
    if [ -d "$HOME/.local/share/bash-completion/completions" ]; then
        install_dir="$HOME/.local/share/bash-completion/completions"
        mkdir -p "$install_dir"
        cp "$completion_file" "$install_dir/${CLI_NAME}"
        log_success "Bash completion installed to $install_dir"
        return
    fi
    
    # Fallback: add to .bashrc
    local bashrc="$HOME/.bashrc"
    if [ -f "$bashrc" ]; then
        if ! grep -q "$source_line" "$bashrc"; then
            echo "" >> "$bashrc"
            echo "# Memory Manager CLI completion" >> "$bashrc"
            echo "$source_line" >> "$bashrc"
            log_success "Bash completion added to $bashrc"
            log_warning "Please restart your shell or run: source $bashrc"
        else
            log_warning "Bash completion already configured in $bashrc"
        fi
    else
        log_error "Could not find .bashrc file"
        return 1
    fi
}

# Install zsh completion
install_zsh_completion() {
    log_info "Installing zsh completion..."
    
    local completion_file="$SCRIPT_DIR/zsh-completion.sh"
    local install_dir=""
    
    # Try system-wide installation
    if [ -d "/usr/local/share/zsh/site-functions" ] && [ -w "/usr/local/share/zsh/site-functions" ]; then
        install_dir="/usr/local/share/zsh/site-functions"
        sudo cp "$completion_file" "$install_dir/_${CLI_NAME}"
        log_success "Zsh completion installed system-wide to $install_dir"
        return
    fi
    
    # Try user-local installation
    local zsh_fpath=""
    for dir in "${fpath[@]}"; do
        if [[ "$dir" == "$HOME/.zsh"* ]] && [ -d "$dir" ]; then
            zsh_fpath="$dir"
            break
        fi
    done
    
    if [ -z "$zsh_fpath" ]; then
        zsh_fpath="$HOME/.zsh/completions"
        mkdir -p "$zsh_fpath"
        
        # Add to .zshrc if not already in fpath
        local zshrc="$HOME/.zshrc"
        if [ -f "$zshrc" ]; then
            if ! grep -q "fpath.*$zsh_fpath" "$zshrc"; then
                echo "" >> "$zshrc"
                echo "# Memory Manager CLI completion" >> "$zshrc"
                echo "fpath=(\"$zsh_fpath\" \$fpath)" >> "$zshrc"
                echo "autoload -U compinit && compinit" >> "$zshrc"
                log_warning "Added $zsh_fpath to fpath in $zshrc"
            fi
        fi
    fi
    
    cp "$completion_file" "$zsh_fpath/_${CLI_NAME}"
    log_success "Zsh completion installed to $zsh_fpath"
    log_warning "Please restart your shell or run: autoload -U compinit && compinit"
}

# Install fish completion
install_fish_completion() {
    log_info "Installing fish completion..."
    
    local completion_file="$SCRIPT_DIR/fish-completion.fish"
    local install_dir="$HOME/.config/fish/completions"
    
    # Create fish completions directory if it doesn't exist
    mkdir -p "$install_dir"
    
    # Copy completion file
    cp "$completion_file" "$install_dir/${CLI_NAME}.fish"
    
    log_success "Fish completion installed to $install_dir"
    log_info "Fish completion should be available immediately in new fish sessions"
}

# Uninstall completions
uninstall_completions() {
    log_info "Uninstalling completions..."
    
    # Remove system-wide bash completion
    if [ -f "/etc/bash_completion.d/${CLI_NAME}" ]; then
        sudo rm "/etc/bash_completion.d/${CLI_NAME}"
        log_info "Removed system-wide bash completion"
    fi
    
    # Remove user bash completion
    if [ -f "$HOME/.local/share/bash-completion/completions/${CLI_NAME}" ]; then
        rm "$HOME/.local/share/bash-completion/completions/${CLI_NAME}"
        log_info "Removed user bash completion"
    fi
    
    # Remove zsh completion
    for dir in /usr/local/share/zsh/site-functions "$HOME/.zsh/completions"; do
        if [ -f "$dir/_${CLI_NAME}" ]; then
            if [[ "$dir" == /usr/local* ]]; then
                sudo rm "$dir/_${CLI_NAME}"
            else
                rm "$dir/_${CLI_NAME}"
            fi
            log_info "Removed zsh completion from $dir"
        fi
    done
    
    # Remove fish completion
    if [ -f "$HOME/.config/fish/completions/${CLI_NAME}.fish" ]; then
        rm "$HOME/.config/fish/completions/${CLI_NAME}.fish"
        log_info "Removed fish completion"
    fi
    
    log_success "Uninstallation complete"
    log_warning "You may need to remove completion setup from your shell config files manually"
}

# Test completion installation
test_completion() {
    local shell="${1:-$(detect_shell)}"
    
    log_info "Testing $shell completion..."
    
    case "$shell" in
        bash)
            if command_exists bash; then
                bash -c "source $SCRIPT_DIR/bash-completion.sh && complete -p | grep -q $CLI_NAME"
                if [ $? -eq 0 ]; then
                    log_success "Bash completion test passed"
                else
                    log_error "Bash completion test failed"
                    return 1
                fi
            else
                log_warning "Bash not available for testing"
            fi
            ;;
        zsh)
            if command_exists zsh; then
                # Basic syntax check
                zsh -n "$SCRIPT_DIR/zsh-completion.sh"
                if [ $? -eq 0 ]; then
                    log_success "Zsh completion syntax test passed"
                else
                    log_error "Zsh completion syntax test failed"
                    return 1
                fi
            else
                log_warning "Zsh not available for testing"
            fi
            ;;
        fish)
            if command_exists fish; then
                # Basic syntax check
                fish -n "$SCRIPT_DIR/fish-completion.fish"
                if [ $? -eq 0 ]; then
                    log_success "Fish completion syntax test passed"
                else
                    log_error "Fish completion syntax test failed"
                    return 1
                fi
            else
                log_warning "Fish not available for testing"
            fi
            ;;
        *)
            log_error "Unknown shell: $shell"
            return 1
            ;;
    esac
}

# Show usage information
show_usage() {
    cat << EOF
Memory Manager CLI Completion Installer

Usage: $0 [OPTIONS] [COMMAND]

Commands:
  install [SHELL]    Install completion for specified shell (or auto-detect)
  uninstall         Uninstall all completions
  test [SHELL]      Test completion for specified shell (or auto-detect)
  help             Show this help message

Supported shells:
  bash             Bash shell
  zsh              Zsh shell  
  fish             Fish shell

Options:
  -h, --help       Show this help message
  -v, --verbose    Enable verbose output

Examples:
  $0 install          # Auto-detect shell and install
  $0 install bash     # Install bash completion
  $0 uninstall        # Remove all completions
  $0 test zsh         # Test zsh completion

EOF
}

# Main function
main() {
    local command=""
    local shell=""
    local verbose=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            install|uninstall|test|help)
                command="$1"
                shift
                ;;
            bash|zsh|fish)
                shell="$1"
                shift
                ;;
            *)
                log_error "Unknown argument: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Default command
    if [ -z "$command" ]; then
        command="install"
    fi
    
    # Auto-detect shell if not specified
    if [ -z "$shell" ] && [ "$command" != "uninstall" ]; then
        shell=$(detect_shell)
        if [ "$shell" = "unknown" ]; then
            log_error "Could not detect shell. Please specify: bash, zsh, or fish"
            exit 1
        fi
        log_info "Detected shell: $shell"
    fi
    
    # Execute command
    case "$command" in
        install)
            case "$shell" in
                bash)
                    install_bash_completion
                    ;;
                zsh)
                    install_zsh_completion
                    ;;
                fish)
                    install_fish_completion
                    ;;
                *)
                    log_error "Unsupported shell: $shell"
                    exit 1
                    ;;
            esac
            ;;
        uninstall)
            uninstall_completions
            ;;
        test)
            test_completion "$shell"
            ;;
        help)
            show_usage
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Check if script is being sourced or executed
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi