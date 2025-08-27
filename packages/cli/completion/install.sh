#!/usr/bin/env bash

# Installation script for Memory Manager CLI auto-completion

set -e

COMPLETION_DIR="$(dirname "$0")"
CLI_NAME="memory"

# Detect shell
detect_shell() {
    if [[ -n "$ZSH_VERSION" ]]; then
        echo "zsh"
    elif [[ -n "$BASH_VERSION" ]]; then
        echo "bash"
    else
        # Fallback to checking $SHELL
        case "$SHELL" in
            */zsh) echo "zsh" ;;
            */bash) echo "bash" ;;
            *) echo "unknown" ;;
        esac
    fi
}

install_bash_completion() {
    local completion_file="$COMPLETION_DIR/bash_completion"
    local target_dirs=(
        "$HOME/.bash_completion.d"
        "/usr/local/etc/bash_completion.d"
        "/etc/bash_completion.d"
    )

    # Try to find a suitable directory
    for dir in "${target_dirs[@]}"; do
        if [[ -d "$dir" ]] && [[ -w "$dir" ]]; then
            echo "Installing bash completion to $dir/${CLI_NAME}"
            cp "$completion_file" "$dir/${CLI_NAME}"
            echo "Bash completion installed successfully!"
            echo "Restart your terminal or run: source $dir/${CLI_NAME}"
            return 0
        fi
    done

    # Fallback: add to .bashrc
    local bashrc="$HOME/.bashrc"
    if [[ -f "$bashrc" ]]; then
        echo "Adding completion source to $bashrc"
        echo "# Memory Manager CLI completion" >> "$bashrc"
        echo "source '$completion_file'" >> "$bashrc"
        echo "Bash completion added to $bashrc"
        echo "Restart your terminal or run: source $bashrc"
    else
        echo "Could not install bash completion automatically."
        echo "Please add the following line to your .bashrc:"
        echo "source '$completion_file'"
    fi
}

install_zsh_completion() {
    local completion_file="$COMPLETION_DIR/zsh_completion"
    local target_dirs=(
        "$HOME/.zsh/completions"
        "/usr/local/share/zsh/site-functions"
        "/usr/share/zsh/site-functions"
    )

    # Try to find a suitable directory
    for dir in "${target_dirs[@]}"; do
        if [[ -d "$dir" ]] && [[ -w "$dir" ]]; then
            echo "Installing zsh completion to $dir/_${CLI_NAME}"
            cp "$completion_file" "$dir/_${CLI_NAME}"
            echo "Zsh completion installed successfully!"
            echo "Run: compinit to reload completions"
            return 0
        fi
    done

    # Create local completion directory if it doesn't exist
    local local_completion_dir="$HOME/.zsh/completions"
    if [[ ! -d "$local_completion_dir" ]]; then
        mkdir -p "$local_completion_dir"
    fi

    if [[ -w "$local_completion_dir" ]]; then
        echo "Installing zsh completion to $local_completion_dir/_${CLI_NAME}"
        cp "$completion_file" "$local_completion_dir/_${CLI_NAME}"
        
        # Add to fpath in .zshrc if needed
        local zshrc="$HOME/.zshrc"
        if [[ -f "$zshrc" ]] && ! grep -q "$local_completion_dir" "$zshrc"; then
            echo "Adding completion directory to .zshrc"
            echo "# Memory Manager CLI completion" >> "$zshrc"
            echo "fpath=('$local_completion_dir' \$fpath)" >> "$zshrc"
            echo "autoload -U compinit && compinit" >> "$zshrc"
        fi
        
        echo "Zsh completion installed successfully!"
        echo "Restart your terminal or run: source $zshrc && compinit"
    else
        echo "Could not install zsh completion automatically."
        echo "Please copy '$completion_file' to a directory in your fpath as '_${CLI_NAME}'"
    fi
}

main() {
    local shell_type="${1:-$(detect_shell)}"
    
    echo "Installing completion for $shell_type shell..."
    
    case "$shell_type" in
        bash)
            install_bash_completion
            ;;
        zsh)
            install_zsh_completion
            ;;
        *)
            echo "Unsupported shell: $shell_type"
            echo "Supported shells: bash, zsh"
            echo ""
            echo "Manual installation:"
            echo "  Bash: source '$COMPLETION_DIR/bash_completion'"
            echo "  Zsh:  copy '$COMPLETION_DIR/zsh_completion' to your fpath as '_${CLI_NAME}'"
            exit 1
            ;;
    esac
}

# Show help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Usage: $0 [shell]"
    echo ""
    echo "Install auto-completion for Memory Manager CLI"
    echo ""
    echo "Arguments:"
    echo "  shell    Shell type (bash or zsh). Auto-detected if not provided."
    echo ""
    echo "Examples:"
    echo "  $0           # Auto-detect shell and install"
    echo "  $0 bash      # Install bash completion"
    echo "  $0 zsh       # Install zsh completion"
    exit 0
fi

main "$@"