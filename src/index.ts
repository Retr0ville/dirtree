#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import inquirer from 'inquirer';

interface DirectoryItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface IgnoreFileAnswers {
  createIgnoreFile: boolean;
}

interface CustomPatternsAnswers {
  customPatterns: string;
}

class DirTreeGenerator {
  private readonly ignoreFile: string = '.dirtree.ignore';
  private readonly outputFile: string = 'directory-tree.txt';
  private ignorePatterns: RegExp[] = [];
  static readonly defaultIgnores: readonly string[] = [
    'node_modules',
    '.git',
    '.svn',
    '.hg',
    'dist',
    'build',
    'out',
    'target',
    '.next',
    '.nuxt',
    '__pycache__',
    '.pytest_cache',
    'venv',
    'env',
    '.venv',
    '.env',
    'vendor',
    '.idea',
    '.vscode',
    '*.log',
    '.DS_Store',
    'Thumbs.db',
    'coverage',
    '.nyc_output',
    'tmp',
    'temp',
    '.cache',
    '.parcel-cache'
  ] as const;

  async init(): Promise<void> {
    try {
      await this.checkAndCreateIgnoreFile();
      await this.loadIgnorePatterns();
      const tree = await this.generateTree('.');
      await this.writeTreeToFile(tree);
      console.log(`Directory tree generated successfully in ${this.outputFile}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error generating directory tree:', errorMessage);
      process.exit(1);
    }
  }

  private async checkAndCreateIgnoreFile(): Promise<void> {
    try {
      await fs.access(this.ignoreFile);
      console.log(`Using existing ${this.ignoreFile}`);
    } catch {
      // File doesn't exist, prompt user
      const answers = await inquirer.prompt<IgnoreFileAnswers>([
        {
          type: 'confirm',
          name: 'createIgnoreFile',
          message: `${this.ignoreFile} not found. Create with default ignore patterns?`,
          default: true
        }
      ]);

      if (answers.createIgnoreFile) {
        await this.createDefaultIgnoreFile();
        console.log(`Created ${this.ignoreFile} with default patterns`);
      } else {
        const customAnswers = await inquirer.prompt<CustomPatternsAnswers>([
          {
            type: 'input',
            name: 'customPatterns',
            message: 'Enter custom ignore patterns (comma-separated, or leave empty):\n  Alternatively close this process and create a .dirtree.ignore file manually.',
            default: ''
          }
        ]);

        const patterns = customAnswers.customPatterns
          ? customAnswers.customPatterns.split(',').map(p => p.trim()).filter(p => p)
          : [];

        await this.createIgnoreFile(patterns);
        console.log(`Created ${this.ignoreFile} with custom patterns`);
      }
    }
  }

  private async createDefaultIgnoreFile(): Promise<void> {
    const content = DirTreeGenerator.defaultIgnores.join('\n') + '\n';
    await fs.writeFile(this.ignoreFile, content, 'utf8');
  }

  private async createIgnoreFile(patterns: string[]): Promise<void> {
    const content = patterns.length > 0 ? patterns.join('\n') + '\n' : '';
    await fs.writeFile(this.ignoreFile, content, 'utf8');
  }

  private async loadIgnorePatterns(): Promise<void> {
    try {
      const content = await fs.readFile(this.ignoreFile, 'utf8');
      this.ignorePatterns = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(pattern => this.createRegexFromPattern(pattern));
    } catch {
      this.ignorePatterns = [];
    }
  }

  private createRegexFromPattern(pattern: string): RegExp {
    // Convert glob-like patterns to regex
    const escaped = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    return new RegExp(`^${escaped}$`);
  }

  private shouldIgnore(itemName: string, itemPath: string): boolean {
    // Check if item matches any ignore pattern
    return this.ignorePatterns.some(regex => {
      return regex.test(itemName) || regex.test(path.basename(itemPath));
    });
  }

  private async generateTree(
    dirPath: string, 
    prefix: string = '', 
    isLast: boolean = true, 
    depth: number = 0
  ): Promise<string> {
    // Prevent infinite recursion and very deep trees
    if (depth > 50) {
      return prefix + '└── [MAX DEPTH REACHED]\n';
    }

    let result = '';
    
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      // Filter and sort items
      const filteredItems: DirectoryItem[] = [];
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        if (this.shouldIgnore(item.name, itemPath)) {
          continue;
        }

        filteredItems.push({
          name: item.name,
          path: itemPath,
          isDirectory: item.isDirectory()
        });
      }

      // Sort: directories first, then files, alphabetically
      filteredItems.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      for (let i = 0; i < filteredItems.length; i++) {
        const item = filteredItems[i];
        if (!item) continue; // Handle noUncheckedIndexedAccess

        const isLastItem = i === filteredItems.length - 1;
        const connector = isLastItem ? '└── ' : '├── ';
        const icon = item.isDirectory ? '📁 ' : '📄 ';
        
        result += prefix + connector + icon + item.name + '\n';

        if (item.isDirectory) {
          const nextPrefix = prefix + (isLastItem ? '    ' : '│   ');
          result += await this.generateTree(item.path, nextPrefix, isLastItem, depth + 1);
        }
      }
    } catch {
      result += prefix + '└── [ERROR: Cannot read directory]\n';
    }

    return result;
  }

  private async writeTreeToFile(tree: string): Promise<void> {
    const header = `Directory Tree - Generated with dirtree on ${new Date().toISOString()}\n` +
                  `Root: ${path.resolve('.')}\n` +
                  `Ignore file: ${this.ignoreFile}\n` +
                  '─'.repeat(80) + '\n\n';
    
    const content = header + '📁 .\n' + tree;
    await fs.writeFile(this.outputFile, content, 'utf8');
  }
}

// Main execution (ESM-compatible, Node 18)

function isMainModule(): boolean {
  // Remove 'file://' prefix and normalize both paths to fix windows backslash quirkiness
  const metaPath = path.normalize(import.meta.url.replace('file:///', ''));
  const argvPath = process.argv[1] ? path.normalize(process.argv[1]) : '';
  return metaPath === argvPath;
}

if (isMainModule()) {
  const generator = new DirTreeGenerator();
  generator.init().catch(error => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fatal error:', errorMessage);
    process.exit(1);
  });
}

export default DirTreeGenerator;