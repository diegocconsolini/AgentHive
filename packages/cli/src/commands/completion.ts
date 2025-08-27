import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export class CompletionCommand {
  getCommand(): Command {
    const completionCmd = new Command('completion')
      .description('Install shell auto-completion');

    completionCmd
      .command('install [shell]')
      .description('Install auto-completion for specified shell (bash or zsh)')
      .action(async (shell) => {
        await this.install(shell);
      });

    completionCmd
      .command('uninstall [shell]')
      .description('Uninstall auto-completion for specified shell')
      .action(async (shell) => {
        await this.uninstall(shell);
      });

    return completionCmd;
  }

  private async install(shell?: string): Promise<void> {
    try {
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const installScript = join(__dirname, '../../completion/install.sh');
      
      console.log(chalk.blue('🔧 Installing shell completion...'));
      
      const args = shell ? [shell] : [];
      const command = `bash "${installScript}" ${args.join(' ')}`;
      
      const output = execSync(command, { encoding: 'utf8' });
      console.log(output);
    } catch (error: any) {
      console.error(chalk.red('Failed to install completion:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  }

  private async uninstall(shell?: string): Promise<void> {
    const detectedShell = shell || this.detectShell();
    
    console.log(chalk.yellow(`🗑 Uninstalling ${detectedShell} completion...`));
    
    try {
      switch (detectedShell) {
        case 'bash':
          await this.uninstallBash();
          break;
        case 'zsh':
          await this.uninstallZsh();
          break;
        default:
          console.log(chalk.yellow(`Unsupported shell: ${detectedShell}`));
          console.log('Please manually remove completion files from your shell configuration.');
          break;
      }
    } catch (error: any) {
      console.error(chalk.red('Failed to uninstall completion:'));
      console.error(chalk.red(error.message));
    }
  }

  private async uninstallBash(): Promise<void> {
    const possiblePaths = [
      `${process.env.HOME}/.bash_completion.d/memory`,
      '/usr/local/etc/bash_completion.d/memory',
      '/etc/bash_completion.d/memory'
    ];

    let removed = false;
    for (const path of possiblePaths) {
      try {
        execSync(`rm -f "${path}"`, { stdio: 'ignore' });
        console.log(chalk.green(`✓ Removed ${path}`));
        removed = true;
      } catch {
        // File doesn't exist or no permission
      }
    }

    if (!removed) {
      console.log(chalk.yellow('No bash completion files found to remove.'));
      console.log('You may need to manually remove completion lines from your .bashrc');
    } else {
      console.log(chalk.green('Bash completion uninstalled successfully!'));
    }
  }

  private async uninstallZsh(): Promise<void> {
    const possiblePaths = [
      `${process.env.HOME}/.zsh/completions/_memory`,
      '/usr/local/share/zsh/site-functions/_memory',
      '/usr/share/zsh/site-functions/_memory'
    ];

    let removed = false;
    for (const path of possiblePaths) {
      try {
        execSync(`rm -f "${path}"`, { stdio: 'ignore' });
        console.log(chalk.green(`✓ Removed ${path}`));
        removed = true;
      } catch {
        // File doesn't exist or no permission
      }
    }

    if (!removed) {
      console.log(chalk.yellow('No zsh completion files found to remove.'));
    } else {
      console.log(chalk.green('Zsh completion uninstalled successfully!'));
      console.log(chalk.gray('Run "compinit" to reload completions'));
    }
  }

  private detectShell(): string {
    // Check environment variables first
    if (process.env.ZSH_VERSION) return 'zsh';
    if (process.env.BASH_VERSION) return 'bash';
    
    // Fallback to checking SHELL
    const shell = process.env.SHELL || '';
    if (shell.endsWith('/zsh')) return 'zsh';
    if (shell.endsWith('/bash')) return 'bash';
    
    return 'unknown';
  }
}